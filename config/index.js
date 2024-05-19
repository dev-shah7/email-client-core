require('dotenv').config();

module.exports = {
  port: process.env.PORT,
  mongoDBURI: process.env.MONGO_DB_URL,
  outlookClientId: process.env.OUTLOOK_CLIENT_ID,
  outlookClientSecret: process.env.OUTLOOK_CLIENT_SECRET,
  outlookCallbackUrl: process.env.OUTLOOK_CALLBACK_URL,
  outlookTenantID: process.env.OUTLOOK_TENANT_ID,
  tenantID: process.env.tenant_id,
  jwtSecret: process.env.JWT_SECRET,
  scopes: ['https://graph.microsoft.com/.default'],
};
