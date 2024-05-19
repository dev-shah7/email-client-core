const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Home Page');
});

router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    console.log('Req user: ', req.user);
    res.json({
      message: 'Successfully accessed profile route',
      user: req.user,
    });
  }
);
module.exports = router;
