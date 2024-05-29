const express = require('express');
const { GRAPH_ME_ENDPOINT } = require('../authConfig');
const fetch = require('../fetch');
const isAuthenticated = require('../middleware/isAuthenticated');
const { default: axios } = require('axios');
const router = express.Router();

router.get('/profile', isAuthenticated, async function (req, res, next) {
  try {
    console.log('Req Session: ', req.session);
    const graphResponse = await fetch(
      GRAPH_ME_ENDPOINT,
      req.session.accessToken
    );

    res.status(200).json({ profile: graphResponse });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
