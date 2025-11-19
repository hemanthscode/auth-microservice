/**
 * Authentication Validators
 * 
 * This module provides validation rules for authentication endpoints.
 * Uses express-validator to validate and sanitize request data.
 * 
 * @module validators/authValidator
 */

const { body } = require('express-validator');
const { PASSWORD_REQUIREMENTS } = require('../utils/constants');
const { param } = require('express-validator');

/**
 * Register Validation Rules
 * 
 * Validates user registration data.
 */
const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: PASSWORD_REQUIREMENTS.MIN_LENGTH })
    .withMessage(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

/**
 * Login Validation Rules
 * 
 * Validates user login credentials.
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Refresh Token Validation Rules
 * 
 * Validates refresh token request.
 */
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),
];

/**
 * Email Verification Validation Rules
 * 
 * Validates email verification token.
 */
const verifyEmailValidation = [
  param('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isString()
    .withMessage('Token must be a string')
    .isLength({ min: 32 })
    .withMessage('Invalid token format'),
];

/**
 * Resend Verification Email Validation Rules
 * 
 * Validates resend verification email request.
 */
const resendVerificationValidation = [
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
 * Change Password Validation Rules
 * 
 * Validates password change request.
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: PASSWORD_REQUIREMENTS.MIN_LENGTH })
    .withMessage(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  body('confirmNewPassword')
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
 * Logout Validation Rules
 * 
 * Validates logout request (optional refresh token).
 */
const logoutValidation = [
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token must be a string'),
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  changePasswordValidation,
  logoutValidation,
};
