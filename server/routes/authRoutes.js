/**
 * Authentication Routes
 * 
 * This module defines routes for authentication endpoints.
 * Handles user registration, login, logout, and token management.
 * 
 * @module routes/authRoutes
 */

const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/authController');

// Middleware
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  authLimiter,
  createAccountLimiter,
  emailVerificationLimiter,
} = require('../middleware/rateLimiter');

// Validators
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  changePasswordValidation,
  logoutValidation,
} = require('../validators/authValidator');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  createAccountLimiter,
  registerValidation,
  validate,
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  loginValidation,
  validate,
  authController.login
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  logoutValidation,
  validate,
  authController.logout
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  refreshTokenValidation,
  validate,
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  '/verify-email/:token',
  verifyEmailValidation,
  validate,
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post(
  '/resend-verification',
  emailVerificationLimiter,
  resendVerificationValidation,
  validate,
  authController.resendVerification
);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get active sessions
 * @access  Private
 */
router.get('/sessions', authenticate, authController.getActiveSessions);

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Revoke a session
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

module.exports = router;
