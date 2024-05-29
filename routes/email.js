const express = require('express');
const router = express.Router();

const { getEmails, syncEmails } = require('../controllers/emailController');

router.get('/', getEmails);

router.get('/sync', syncEmails);

module.exports = router;
