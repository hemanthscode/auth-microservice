/**
 * User Validators
 * 
 * This module provides validation rules for user management endpoints.
 * Uses express-validator to validate and sanitize request data.
 * 
 * @module validators/userValidator
 */

const { body, param, query } = require('express-validator');

/**
 * Update Profile Validation Rules
 * 
 * Validates user profile update data.
 */
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters'),
  
  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      
      if (age < 13) {
        throw new Error('You must be at least 13 years old');
      }
      if (age > 120) {
        throw new Error('Please provide a valid birth date');
      }
      return true;
    }),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
];

/**
 * Update Preferences Validation Rules
 * 
 * Validates user preferences update.
 */
const updatePreferencesValidation = [
  body('language')
    .optional()
    .isString()
    .withMessage('Language must be a string')
    .isLength({ min: 2, max: 5 })
    .withMessage('Invalid language code'),
  
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a string'),
  
  body('notifications')
    .optional()
    .isObject()
    .withMessage('Notifications must be an object'),
  
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be true or false'),
  
  body('notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be true or false'),
];

/**
 * User ID Validation Rules
 * 
 * Validates user ID parameter.
 */
const userIdValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
];

/**
 * Search Users Validation Rules
 * 
 * Validates user search query.
 */
const searchUsersValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];

/**
 * List Users Validation Rules
 * 
 * Validates user listing query parameters.
 */
const listUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'firstName', 'lastName', 'email'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  
  query('role')
    .optional()
    .isMongoId()
    .withMessage('Invalid role ID'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false')
    .toBoolean(),
];

/**
 * Update User Role Validation Rules
 * 
 * Validates role assignment.
 */
const updateUserRoleValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid role ID format'),
];

/**
 * Delete User Validation Rules
 * 
 * Validates user deletion.
 */
const deleteUserValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('confirmation')
    .optional()
    .isBoolean()
    .withMessage('Confirmation must be true or false'),
];

module.exports = {
  updateProfileValidation,
  updatePreferencesValidation,
  userIdValidation,
  searchUsersValidation,
  listUsersValidation,
  updateUserRoleValidation,
  deleteUserValidation,
};
