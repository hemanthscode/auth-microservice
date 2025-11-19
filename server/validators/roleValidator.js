/**
 * Role Validators
 * 
 * This module provides validation rules for role management endpoints.
 * Uses express-validator to validate and sanitize request data.
 * 
 * @module validators/roleValidator
 */

const { body, param, query } = require('express-validator');
const { RESOURCES, ACTIONS } = require('../utils/constants');

/**
 * Create Role Validation Rules
 * 
 * Validates role creation data.
 */
const createRoleValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Role name must be between 3 and 20 characters')
    .matches(/^[a-z]+$/)
    .withMessage('Role name must be lowercase letters only'),
  
  body('displayName')
    .trim()
    .notEmpty()
    .withMessage('Display name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Display name must be between 3 and 50 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Description must be between 10 and 200 characters'),
  
  body('level')
    .notEmpty()
    .withMessage('Level is required')
    .isInt({ min: 1, max: 10 })
    .withMessage('Level must be between 1 and 10')
    .toInt(),
  
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('Permissions must be a non-empty array'),
  
  body('permissions.*.resource')
    .notEmpty()
    .withMessage('Permission resource is required')
    .isIn(Object.values(RESOURCES))
    .withMessage('Invalid permission resource'),
  
  body('permissions.*.actions')
    .isArray({ min: 1 })
    .withMessage('Permission actions must be a non-empty array'),
  
  body('permissions.*.actions.*')
    .isIn(Object.values(ACTIONS))
    .withMessage('Invalid permission action'),
];

/**
 * Update Role Validation Rules
 * 
 * Validates role update data.
 */
const updateRoleValidation = [
  param('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid role ID format'),
  
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Display name must be between 3 and 50 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Description must be between 10 and 200 characters'),
  
  body('level')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Level must be between 1 and 10')
    .toInt(),
  
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  
  body('permissions.*.resource')
    .optional()
    .isIn(Object.values(RESOURCES))
    .withMessage('Invalid permission resource'),
  
  body('permissions.*.actions')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Permission actions must be a non-empty array'),
  
  body('permissions.*.actions.*')
    .optional()
    .isIn(Object.values(ACTIONS))
    .withMessage('Invalid permission action'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false')
    .toBoolean(),
];

/**
 * Role ID Validation Rules
 * 
 * Validates role ID parameter.
 */
const roleIdValidation = [
  param('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid role ID format'),
];

/**
 * Add Permission Validation Rules
 * 
 * Validates adding permission to role.
 */
const addPermissionValidation = [
  param('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid role ID format'),
  
  body('resource')
    .notEmpty()
    .withMessage('Resource is required')
    .isIn(Object.values(RESOURCES))
    .withMessage('Invalid resource'),
  
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(Object.values(ACTIONS))
    .withMessage('Invalid action'),
];

/**
 * Remove Permission Validation Rules
 * 
 * Validates removing permission from role.
 */
const removePermissionValidation = [
  param('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid role ID format'),
  
  body('resource')
    .notEmpty()
    .withMessage('Resource is required')
    .isIn(Object.values(RESOURCES))
    .withMessage('Invalid resource'),
  
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(Object.values(ACTIONS))
    .withMessage('Invalid action'),
];

/**
 * Get Users By Role Validation Rules
 * 
 * Validates getting users by role query.
 */
const getUsersByRoleValidation = [
  param('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid role ID format'),
  
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
];

module.exports = {
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  addPermissionValidation,
  removePermissionValidation,
  getUsersByRoleValidation,
};
