const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { validateRegister, validateLogin } = require('../utils/validators');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validateRegister, validate, register);
router.post('/login', authLimiter, validateLogin, validate, login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.get('/logout', protect, logout);

module.exports = router;
