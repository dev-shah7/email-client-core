require('dotenv').config();

module.exports = {
  port: process.env.PORT,
  mongoDBURI: process.env.MONGO_DB_URL,
  outlookClientId: process.env.OUTLOOK_CLIENT_ID,
  outlookClientSecret: process.env.OUTLOOK_CLIENT_SECRET,
  outlookCallbackUrl: process.env.OUTLOOK_CALLBACK_URL,
};
