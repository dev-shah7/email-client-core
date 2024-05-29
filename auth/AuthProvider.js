const msal = require('@azure/msal-node');
const axios = require('axios');
const { msalConfig, GRAPH_ME_ENDPOINT } = require('../authConfig');
const fetch = require('../fetch');

const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

const createAuthProvider = (config) => {
  const cryptoProvider = new msal.CryptoProvider();

  const getMsalInstance = (msalConfig) => {
    return new msal.ConfidentialClientApplication(msalConfig);
  };

  const getCloudDiscoveryMetadata = async (authority) => {
    const endpoint =
      'https://login.microsoftonline.com/common/discovery/instance';
    try {
      const response = await axios.get(endpoint, {
        params: {
          'api-version': '1.1',
          authorization_endpoint: `${authority}/oauth2/v2.0/authorize`,
        },
      });
      return await response.data;
    } catch (error) {
      throw error;
    }
  };

  const getAuthorityMetadata = async (authority) => {
    const endpoint = `${authority}/v2.0/.well-known/openid-configuration`;
    try {
      const response = await axios.get(endpoint);
      return await response.data;
    } catch (error) {
      console.log(error);
    }
  };

  const redirectToAuthCodeUrl = (
    authCodeUrlRequestParams,
    authCodeRequestParams,
    msalInstance
  ) => {
    return async (req, res, next) => {
      const { verifier, challenge } = await cryptoProvider.generatePkceCodes();
      req.session.pkceCodes = {
        challengeMethod: 'S256',
        verifier: verifier,
        challenge: challenge,
      };

      req.session.authCodeUrlRequest = {
        ...authCodeUrlRequestParams,
        responseMode: msal.ResponseMode.FORM_POST,
        codeChallenge: req.session.pkceCodes.challenge,
        codeChallengeMethod: req.session.pkceCodes.challengeMethod,
      };

      req.session.authCodeRequest = {
        ...authCodeRequestParams,
        code: '',
      };

      try {
        const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(
          req.session.authCodeUrlRequest
        );
        res.redirect(authCodeUrlResponse);
      } catch (error) {
        next(error);
      }
    };
  };

  const login = (options = {}) => {
    return async (req, res, next) => {
      const state = cryptoProvider.base64Encode(
        JSON.stringify({
          successRedirect: options.successRedirect || '/',
        })
      );

      const authCodeUrlRequestParams = {
        state: state,
        scopes: options.scopes || [],
        redirectUri: options.redirectUri,
      };

      const authCodeRequestParams = {
        state: state,
        scopes: options.scopes || [],
        redirectUri: options.redirectUri,
      };

      if (
        !config.auth.cloudDiscoveryMetadata ||
        !config.auth.authorityMetadata
      ) {
        const [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
          getCloudDiscoveryMetadata(config.auth.authority),
          getAuthorityMetadata(config.auth.authority),
        ]);

        config.auth.cloudDiscoveryMetadata = JSON.stringify(
          cloudDiscoveryMetadata
        );
        config.auth.authorityMetadata = JSON.stringify(authorityMetadata);
      }

      const msalInstance = getMsalInstance(config);
      return redirectToAuthCodeUrl(
        authCodeUrlRequestParams,
        authCodeRequestParams,
        msalInstance
      )(req, res, next);
    };
  };

  const acquireToken = (options = {}) => {
    return async (req, res, next) => {
      try {
        const msalInstance = getMsalInstance(config);
        if (req.session.tokenCache) {
          msalInstance.getTokenCache().deserialize(req.session.tokenCache);
        }

        const tokenResponse = await msalInstance.acquireTokenSilent({
          account: req.session.account,
          scopes: options.scopes || ['Mail.Read'],
        });

        const graphResponse = await fetch(
          GRAPH_ME_ENDPOINT,
          tokenResponse.accessToken
        );

        req.session.tokenCache = msalInstance.getTokenCache().serialize();
        req.session.accessToken = tokenResponse.accessToken;
        req.session.idToken = tokenResponse.idToken;
        req.session.account = tokenResponse.account;
        req.session.profile = graphResponse;
        req.session.userId = tokenResponse.account.homeAccountId;

        res.redirect(options.successRedirect);
      } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
          return login({
            scopes: options.scopes || [],
            redirectUri: options.redirectUri,
            successRedirect: options.successRedirect || '/',
          })(req, res, next);
        }
        next(error);
      }
    };
  };

  const handleRedirect = (options = {}) => {
    return async (req, res, next) => {
      if (!req.body || !req.body.state) {
        return next(new Error('Error: response not found'));
      }

      const authCodeRequest = {
        ...req.session.authCodeRequest,
        code: req.body.code,
        codeVerifier: req.session.pkceCodes.verifier,
      };

      try {
        const msalInstance = getMsalInstance(config);
        if (req.session.tokenCache) {
          msalInstance.getTokenCache().deserialize(req.session.tokenCache);
        }

        const tokenResponse = await msalInstance.acquireTokenByCode(
          authCodeRequest,
          req.body
        );

        const graphResponse = await fetch(
          GRAPH_ME_ENDPOINT,
          tokenResponse.accessToken
        );

        req.session.tokenCache = msalInstance.getTokenCache().serialize();
        req.session.idToken = tokenResponse.idToken;
        req.session.account = tokenResponse.account;
        req.session.userId = tokenResponse.account.homeAccountId;
        req.session.isAuthenticated = true;
        req.session.profile = graphResponse;

        const state = JSON.parse(cryptoProvider.base64Decode(req.body.state));
        res.redirect(state.successRedirect);
      } catch (error) {
        next(error);
      }
    };
  };

  const logout = (options = {}) => {
    return (req, res, next) => {
      let logoutUri = `${config.auth.authority}/oauth2/v2.0/`;
      if (options.postLogoutRedirectUri) {
        logoutUri += `logout?post_logout_redirect_uri=${options.postLogoutRedirectUri}`;
      }
      req.session.destroy(() => {
        res.redirect(logoutUri);
      });
    };
  };

  async function readEmails(accessToken) {
    console.log('HI');
    const client = getAuthenticatedClient(accessToken);
    console.log('Client:::: ', JSON.stringify(client));
    try {
      const messages = await client
        .api('/me/mailFolders/inbox/messages')
        .select('subject, from')
        .top(10)
        .get();
      return messages;
    } catch (error) {
      console.log(JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
  }

  function getAuthenticatedClient(accessToken) {
    try {
      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });
      return client;
    } catch (error) {
      console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  }

  return {
    login,
    acquireToken,
    handleRedirect,
    logout,
    readEmails,
  };
};

const authProvider = createAuthProvider(msalConfig);

module.exports = authProvider;
