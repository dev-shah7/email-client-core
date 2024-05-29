const {
  outlookCallback,
  signout,
  outlook,
  signup,
  login,
} = require('../controllers/authController');

const router = require('express-promise-router').default();

router.get('/', (req, res) => {
  res.json({ message: 'HI' });
});

router.post('/signup', signup);

router.post('/login', login);

router.get('/outlook', outlook);

router.get('/redirect', outlookCallback);

router.get('/signout', signout);

module.exports = router;
