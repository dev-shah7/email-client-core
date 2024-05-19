const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const isAuthenticated = require('../middleware/isAuthenticated');

const { getEmails } = require('../controllers/emailController');

router.get('/emails', getEmails);

module.exports = router;
