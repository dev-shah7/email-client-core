const msal = require('@azure/msal-node');
require('dotenv').config({ path: '.env.dev' });

const msalConfig = {
  // auth: {
  //   clientId: process.env.CLIENT_ID,
  //   authority: process.env.CLOUD_INSTANCE + process.env.TENANT_ID,
  //   tenantId: process.env.TENANT_ID,
  //   clientSecret: process.env.CLIENT_SECRET,
  // },
  // system: {
  //   loggerOptions: {
  //     loggerCallback(loglevel, message, containsPii) {
  //       console.log(message);
  //     },
  //     piiLoggingEnabled: false,
  //     logLevel: 3,
  //   },
  // },
  auth: {
    clientId: process.env.OAUTH_CLIENT_ID,
    authority: `https://login.microsoftonline.com/common/`,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        if (!containsPii) console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    },
  },
};

const REDIRECT_URI = process.env.REDIRECT_URI;
const POST_LOGOUT_REDIRECT_URI = process.env.POST_LOGOUT_REDIRECT_URI;
const GRAPH_ME_ENDPOINT = process.env.GRAPH_API_ENDPOINT + 'v1.0/me';
const GRAPH_ENDPOINT = process.env.GRAPH_API_ENDPOINT + 'v1.0';
const MONGO_DB_URI = process.env.MONGO_DB_URL;
const PORT = process.env.PORT;

module.exports = {
  msalConfig,
  REDIRECT_URI,
  POST_LOGOUT_REDIRECT_URI,
  GRAPH_ME_ENDPOINT,
  GRAPH_ENDPOINT,
  MONGO_DB_URI,
  PORT,
};
