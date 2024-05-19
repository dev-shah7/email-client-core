const bodyParser = require('body-parser');
const passport = require('passport');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');

require('./auth/passport');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const homeRoutes = require('./routes/index');
const emailRoutes = require('./routes/email');

module.exports = (app) => {
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(morgan('dev'));
  app.use(
    session({ secret: 'secret', resave: false, saveUninitialized: true })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use('/api', homeRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/outlook', emailRoutes);
};
