// // controllers/authController.js

// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const passport = require('passport');
// const User = require('../models/User');

// exports.register = async (req, res) => {
//   const { name, email, password } = req.body;
//   try {
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     const newUser = new User({ name, email, password: hashedPassword });
//     await newUser.save();
//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error registering user', error });
//   }
// };

// exports.login = (req, res, next) => {
//   passport.authenticate('local', (err, user, info) => {
//     if (err) return next(err);
//     if (!user) return res.status(400).json({ message: info.message });

//     req.logIn(user, (err) => {
//       if (err) return next(err);
//       const accessToken = jwt.sign(
//         {
//           id: user._id,
//         },
//         'secret',
//         { expiresIn: '1d' }
//       );

//       return res.status(200).json({
//         message: 'Logged in successfully',
//         data: {
//           user,
//           accessToken,
//         },
//       });
//     });
//   })(req, res, next);
// };

exports.signin = async function (req, res) {
  const scopes =
    process.env.OAUTH_SCOPES || 'https://graph.microsoft.com/.default';
  const urlParameters = {
    scopes: scopes.split(','),
    redirectUri: process.env.OAUTH_REDIRECT_URI,
  };

  try {
    const authUrl = await req.app.locals.msalClient.getAuthCodeUrl(
      urlParameters
    );
    res.redirect(authUrl);
  } catch (error) {
    console.log(`Error: ${error}`);
    req.flash('error_msg', {
      message: 'Error getting auth URL',
      debug: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    res.redirect('/');
  }
};

exports.outlookCallback = async function (req, res) {
  const scopes =
    process.env.OAUTH_SCOPES || 'https://graph.microsoft.com/.default';
  const tokenRequest = {
    code: req.query.code,
    scopes: scopes.split(','),
    redirectUri: process.env.OAUTH_REDIRECT_URI,
  };

  try {
    const response = await req.app.locals.msalClient.acquireTokenByCode(
      tokenRequest
    );

    req.session.userId = response.account.homeAccountId;

    const user = await graph.getUserDetails(
      req.app.locals.msalClient,
      req.session.userId
    );

    req.app.locals.users[req.session.userId] = {
      displayName: user.displayName,
      email: user.mail || user.userPrincipalName,
      timeZone: user.mailboxSettings.timeZone,
    };

    req.session.userId = response.account.homeAccountId;

    req.app.locals.users[req.session.userId] = {
      displayName: user.displayName,
      email: user.mail || user.userPrincipalName,
      timeZone: user.mailboxSettings.timeZone,
    };
  } catch (error) {
    req.flash('error_msg', {
      message: 'Error completing authentication',
      debug: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
  }

  res.redirect('/');
};

exports.signout = async function (req, res) {
  if (req.session.userId) {
    const accounts = await req.app.locals.msalClient
      .getTokenCache()
      .getAllAccounts();

    const userAccount = accounts.find(
      (a) => a.homeAccountId === req.session.userId
    );

    if (userAccount) {
      req.app.locals.msalClient.getTokenCache().removeAccount(userAccount);
    }
  }

  req.session.destroy(function () {
    res.redirect('/');
  });
};
