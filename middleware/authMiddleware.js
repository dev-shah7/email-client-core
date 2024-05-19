// middleware/authMiddleware.js
const { cca } = require('../services/authService');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function refreshToken(user) {
  try {
    const tokenResponse = await cca.acquireTokenByRefreshToken({
      refreshToken: user.refreshToken,
      scopes: [
        'https://outlook.office.com/mail.read',
        'offline_access',
        'openid',
        'profile',
      ],
    });

    user.accessToken = tokenResponse.accessToken;
    if (tokenResponse.refreshToken) {
      user.refreshToken = tokenResponse.refreshToken;
    }
    await user.save();

    return tokenResponse.accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

async function ensureFreshToken(req, res, next) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const decodedToken = jwt.decode(user.accessToken);
    const isTokenExpired = decodedToken.exp * 1000 < Date.now();

    if (isTokenExpired) {
      const newAccessToken = await refreshToken(user);
      req.user.accessToken = newAccessToken;
    } else {
      req.user.accessToken = user.accessToken;
    }

    next();
  } catch (error) {
    console.error('Error in ensureFreshToken middleware:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
}

module.exports = ensureFreshToken;
