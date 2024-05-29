function isAuthenticated(req, res, next) {
  if (!req.session.isAuthenticated) {
    return res.redirect('/auth/signin');
  }

  next();
}

module.exports = isAuthenticated;
