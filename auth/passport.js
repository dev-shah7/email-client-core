const passport = require('passport');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const LocalStrategy = require('passport-local').Strategy;
const OutlookStrategy = require('passport-outlook').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const config = require('../config');

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
};

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email });
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.id);
      if (user) return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new OutlookStrategy(
    {
      clientID: config.outlookClientId,
      clientSecret: config.outlookClientSecret,
      callbackURL: config.outlookCallbackUrl,
      passReqToCallback: true,
      scope: [
        'openid',
        'profile',
        'offline_access',
        'https://outlook.office.com/mail.read',
      ],
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('Access token: ', accessToken);
        console.log('Profile: ', JSON.stringify(profile));

        const parts = accessToken.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid access token format');
        }

        const decodedToken = jwt.decode(accessToken, { complete: true });
        console.log('Decoded JWT: ', decodedToken);

        let user = await User.findById('6649165f87cecefb183792c1');
        if (!user) {
          throw new Error('User not found');
        }

        user.outlookId = profile.id;
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();

        return done(null, user);
      } catch (error) {
        console.error('Error in strategy callback:', error);
        return done(error, null);
      }
    }
  )
);
