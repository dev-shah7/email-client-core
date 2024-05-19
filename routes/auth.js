const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { pca, cca } = require('../services/authService');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ message: info.message });

    req.logIn(user, (err) => {
      if (err) return next(err);
      const accessToken = jwt.sign(
        {
          id: user._id,
        },
        'secret',
        { expiresIn: '1d' }
      );

      return res.status(200).json({
        message: 'Logged in successfully',
        data: {
          user,
          accessToken,
        },
      });
    });
  })(req, res, next);
});

// router.get('/outlook', (req, res) => {
//   const authCodeUrlParameters = {
//     scopes: config.scopes,
//     redirectUri: config.outlookCallbackUrl,
//   };

//   pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
//     res.redirect(response);
//   });
// });
router.get('/outlook', passport.authenticate('windowslive'));

router.get(
  '/outlook/callback',
  passport.authenticate('windowslive', { failureRedirect: '/' }),
  async (req, res) => {
    res.status(200).json({ message: 'Account Linked Successfully' });

    // const tokenRequest = {
    //   code: req.query.code,
    //   scopes: config.scopes,
    //   redirectUri: config.outlookCallbackUrl,
    // };

    // try {
    //   const tokenResponse = await cca.acquireTokenByCode(tokenRequest);
    //   req.session.accessToken = tokenResponse.accessToken;
    //   res.redirect('/api/auth/get-access-token');
    // } catch (error) {
    //   console.error('Error acquiring token:', error);
    //   res.status(500).send(error);
    // }
  }
);

// router.get('/get-access-token', async (req, res) => {
//   try {
//     const tokenRequest = {
//       scopes: config.scopes,
//       clientSecret: config.outlookClientSecret,
//     };

//     const response = await cca.acquireTokenByClientCredential(tokenRequest);
//     const accessToken = response.accessToken;

//     req.session.clientAccessToken = accessToken;
//     console.log('Access Token: ', accessToken);
//     res.status(200).json({
//       message: 'Access token acquired successfully!',
//       accessToken: accessToken,
//     });
//   } catch (error) {
//     res.status(500).send(error);
//     console.log('Error acquiring access token:', error.message);
//   }
// });

module.exports = router;
