const mongoose = require('mongoose');
const config = require('.');

const url = config.mongoDBURI;

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectDB = async () => {
  try {
    await mongoose.connect(url, connectionParams);
    console.log('Connected to the database');
  } catch (err) {
    console.error(`Error connecting to the database: ${err}`);
    process.exit(1);
  }
};

module.exports = connectDB;
