const passport = require('passport');
const bcrypt = require('bcrypt');
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
        if (req.user) {
          let user = await User.findOne({ outlookId: profile.id });

          if (user && user.id !== req.user.id) {
            return done(
              new Error('Outlook account already linked to another user.')
            );
          }

          user = await User.findById(req.user.id);
          user.outlookId = profile.id;
          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          await user.save();
          return done(null, user);
        } else {
          let user = await User.findOne({ outlookId: profile.id });
          if (!user) {
            user = new User({
              outlookId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              accessToken: accessToken,
              refreshToken: refreshToken,
            });
            await user.save();
          } else {
            user.accessToken = accessToken;
            user.refreshToken = refreshToken;
            await user.save();
          }
          return done(null, user);
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
