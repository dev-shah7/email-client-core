const express = require('express');
const router = express.Router();

const { getEmails } = require('../controllers/emailController');

router.get('/', getEmails);

module.exports = router;
