const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getCurrentUser,
  getProfile,
  updateProfile
} = require('../controllers/authController');
const {
  validateRegistration,
  validateLogin
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateRegistration, register);

/**
 * @route POST /auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', validateLogin, login);

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout', logout);

/**
 * @route GET /auth/me
 * @desc Get current authenticated user
 * @access Private
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * @route GET /auth/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route PUT /auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;