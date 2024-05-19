const isAuthenticated = (req, res, next) => {
  console.log('Red: ', req.user);
  if (req.user) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

module.exports = isAuthenticated;
