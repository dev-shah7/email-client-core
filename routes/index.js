const express = require('express');
const isAuthenticated = require('../middleware/isAuthenticated');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Home Page');
});

router.get('/protected', isAuthenticated, (req, res) => {
  res.status(200).json({ message: 'You have accessed the protected route' });
});
module.exports = router;
