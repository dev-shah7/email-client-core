const mongoose = require('mongoose');
const { MONGO_DB_URI } = require('../authConfig');

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_DB_URI, connectionParams);
    console.log('Connected to the database');
  } catch (err) {
    console.error(`Error connecting to the database: ${err}`);
    process.exit(1);
  }
};

module.exports = connectDB;
