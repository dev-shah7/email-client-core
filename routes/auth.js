const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcrypt');

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
  console.log(req.logIn);
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ message: info.message });

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res
        .status(200)
        .json({ message: 'Logged in successfully', data: user });
    });
  })(req, res, next);
});

router.get('/outlook', passport.authenticate('outlook'));

router.get(
  '/outlook/callback',
  passport.authenticate('outlook', { failureRedirect: '/' }),
  async (req, res) => {
    try {
      if (req.user) {
        const existingUser = await User.findById(req.user.id);
        existingUser.outlookId = req.user.outlookId;
        existingUser.accessToken = req.user.accessToken;
        existingUser.refreshToken = req.user.refreshToken;
        await existingUser.save();
      } else {
        const existingUser = await User.findOne({
          outlookId: req.user.outlookId,
        });
        if (existingUser) {
          existingUser.accessToken = req.user.accessToken;
          existingUser.refreshToken = req.user.refreshToken;
          await existingUser.save();
        } else {
          const newUser = new User({
            name: req.user.displayName,
            email: req.user.emails[0].value,
            outlookId: req.user.outlookId,
            accessToken: req.user.accessToken,
            refreshToken: req.user.refreshToken,
          });
          await newUser.save();
        }
      }
      res.redirect('/');
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

module.exports = router;
