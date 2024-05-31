const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/auth.html'));
});

router.get('/me', (req, res) => {
  res.status(200).json({ session: req.session });
});

module.exports = router;
