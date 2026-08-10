const express = require('express');
const router = express.Router();
const { auth, authLimiter } = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
  forgotPassword,
} = require('../controllers/authController');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', forgotPassword);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/logout', auth, logout);

module.exports = router;