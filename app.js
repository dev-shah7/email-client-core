const express = require('express');
const connectDB = require('./config/db');
const config = require('./config/index');
const applyMiddleware = require('./middleware');

const app = express();

applyMiddleware(app);

connectDB();

app.listen(config.port, () => {
  console.log('Server is running on port 3000');
});
