/**
 * Password Validators
 * 
 * This module provides validation rules for password-related endpoints.
 * Uses express-validator to validate and sanitize request data.
 * 
 * @module validators/passwordValidator
 */

const { body, param } = require('express-validator');
const { PASSWORD_REQUIREMENTS } = require('../utils/constants');

/**
 * Forgot Password Validation Rules
 * 
 * Validates forgot password request.
 */
const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
];

/**
 * Reset Password Validation Rules
 * 
 * Validates password reset request.
 */
const resetPasswordValidation = [
  param('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isString()
    .withMessage('Token must be a string')
    .isLength({ min: 32 })
    .withMessage('Invalid token format'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: PASSWORD_REQUIREMENTS.MIN_LENGTH })
    .withMessage(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

/**
 * Verify Token Validation Rules
 * 
 * Validates token verification (email or password reset).
 */
const verifyTokenValidation = [
  param('token')
    .notEmpty()
    .withMessage('Token is required')
    .isString()
    .withMessage('Token must be a string')
    .isLength({ min: 32 })
    .withMessage('Invalid token format'),
];

module.exports = {
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyTokenValidation,
};
