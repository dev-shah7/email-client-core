require('dotenv').config();

module.exports = {
  port: process.env.PORT,
  mongoDBURI: process.env.MONGO_DB_URL,
};
