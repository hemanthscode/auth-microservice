/**
 * Password Routes
 * 
 * This module defines routes for password management endpoints.
 * Handles password reset and recovery operations.
 * 
 * @module routes/passwordRoutes
 */

const express = require('express');
const router = express.Router();

// Controllers
const passwordController = require('../controllers/passwordController');

// Middleware
const { validate } = require('../middleware/validationMiddleware');
const { passwordResetLimiter } = require('../middleware/rateLimiter');

// Validators
const {
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyTokenValidation,
} = require('../validators/passwordValidator');

/**
 * @route   POST /api/v1/password/forgot
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot',
  passwordResetLimiter,
  forgotPasswordValidation,
  validate,
  passwordController.forgotPassword
);

/**
 * @route   POST /api/v1/password/reset/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset/:token',
  resetPasswordValidation,
  validate,
  passwordController.resetPassword
);

/**
 * @route   GET /api/v1/password/verify/:token
 * @desc    Verify reset token
 * @access  Public
 */
router.get(
  '/verify/:token',
  verifyTokenValidation,
  validate,
  passwordController.verifyResetToken
);

module.exports = router;
