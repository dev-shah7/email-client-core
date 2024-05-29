const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/', (req, res) => {
  res
    .status(200)
    .json({ message: 'Success', session: req.app.locals.msalClient });
});

router.get('/me', (req, res) => {
  res.status(200).json({ session: req.session });
});

module.exports = router;
