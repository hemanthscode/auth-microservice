/**
 * User Routes
 * 
 * This module defines routes for user management endpoints.
 * Handles user profile operations and admin user management.
 * 
 * @module routes/userRoutes
 */

const express = require('express');
const router = express.Router();

// Controllers
const userController = require('../controllers/userController');

// Middleware
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole, requirePermission } = require('../middleware/rbacMiddleware');
const { validate, validatePagination, validateSort } = require('../middleware/validationMiddleware');

// Validators
const {
  updateProfileValidation,
  updatePreferencesValidation,
  userIdValidation,
  searchUsersValidation,
  listUsersValidation,
  updateUserRoleValidation,
  deleteUserValidation,
} = require('../validators/userValidator');

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  updateProfileValidation,
  validate,
  userController.updateProfile
);

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put(
  '/preferences',
  authenticate,
  updatePreferencesValidation,
  validate,
  userController.updatePreferences
);

/**
 * @route   DELETE /api/v1/users/profile
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/profile', authenticate, userController.deleteAccount);

/**
 * @route   GET /api/v1/users/search
 * @desc    Search users
 * @access  Private
 */
router.get(
  '/search',
  authenticate,
  searchUsersValidation,
  validate,
  userController.searchUsers
);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  authenticate,
  requireRole('admin', 'superadmin'),
  userController.getUserStatistics
);

/**
 * @route   GET /api/v1/users
 * @desc    List all users
 * @access  Private (Admin)
 */
router.get(
  '/',
  authenticate,
  requirePermission('users', 'read'),
  listUsersValidation,
  validate,
  validatePagination(),
  validateSort(['createdAt', 'firstName', 'lastName', 'email']),
  userController.listUsers
);

/**
 * @route   GET /api/v1/users/:userId
 * @desc    Get user by ID
 * @access  Private (Admin)
 */
router.get(
  '/:userId',
  authenticate,
  requirePermission('users', 'read'),
  userIdValidation,
  validate,
  userController.getUserById
);

/**
 * @route   PUT /api/v1/users/:userId/role
 * @desc    Update user role
 * @access  Private (Admin)
 */
router.put(
  '/:userId/role',
  authenticate,
  requirePermission('users', 'update'),
  updateUserRoleValidation,
  validate,
  userController.updateUserRole
);

/**
 * @route   PUT /api/v1/users/:userId/activate
 * @desc    Activate user account
 * @access  Private (Admin)
 */
router.put(
  '/:userId/activate',
  authenticate,
  requirePermission('users', 'update'),
  userIdValidation,
  validate,
  userController.activateUser
);

/**
 * @route   PUT /api/v1/users/:userId/deactivate
 * @desc    Deactivate user account
 * @access  Private (Admin)
 */
router.put(
  '/:userId/deactivate',
  authenticate,
  requirePermission('users', 'update'),
  userIdValidation,
  validate,
  userController.deactivateUser
);

module.exports = router;
