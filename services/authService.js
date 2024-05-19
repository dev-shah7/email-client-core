// services/authService.js
const {
  PublicClientApplication,
  ConfidentialClientApplication,
} = require('@azure/msal-node');
const config = require('../config');

const msalConfig = {
  auth: {
    clientId: config.outlookClientId,
    authority: `https://login.microsoftonline.com/${config.outlookTenantID}`,
    redirectUri: config.outlookCallbackUrl,
  },
};

const ccaConfig = {
  auth: {
    clientId: config.outlookClientId,
    authority: `https://login.microsoftonline.com/${config.outlookTenantID}`,
    clientSecret: config.outlookClientSecret,
  },
};

const pca = new PublicClientApplication(msalConfig);
const cca = new ConfidentialClientApplication(ccaConfig);

module.exports = { pca, cca };
