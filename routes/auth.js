const {
  signin,
  outlookCallback,
  signout,
} = require('../controllers/authController');
const graph = require('../graph');
const router = require('express-promise-router').default();

router.get('/', (req, res) => {
  res.json({ message: 'HI' });
});

router.get('/signin', signin);

router.get('/redirect', outlookCallback);

router.get('/signout', signout);

module.exports = router;
