/**
 * Role Routes
 * 
 * This module defines routes for role management endpoints.
 * Handles RBAC operations and permission management.
 * 
 * @module routes/roleRoutes
 */

const express = require('express');
const router = express.Router();

// Controllers
const roleController = require('../controllers/roleController');

// Middleware
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole, requirePermission } = require('../middleware/rbacMiddleware');
const { validate, validatePagination } = require('../middleware/validationMiddleware');

// Validators
const {
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  addPermissionValidation,
  removePermissionValidation,
  getUsersByRoleValidation,
} = require('../validators/roleValidator');

/**
 * @route   POST /api/v1/roles/initialize
 * @desc    Initialize default roles
 * @access  Private (Superadmin)
 */
router.post(
  '/initialize',
  authenticate,
  requireRole('superadmin'),
  roleController.initializeRoles
);

/**
 * @route   GET /api/v1/roles/stats
 * @desc    Get role statistics
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('roles', 'read'),
  roleController.getRoleStatistics
);

/**
 * @route   POST /api/v1/roles
 * @desc    Create a new role
 * @access  Private (Superadmin)
 */
router.post(
  '/',
  authenticate,
  requireRole('superadmin'),
  createRoleValidation,
  validate,
  roleController.createRole
);

/**
 * @route   GET /api/v1/roles
 * @desc    Get all roles
 * @access  Private (Admin)
 */
router.get(
  '/',
  authenticate,
  requirePermission('roles', 'read'),
  roleController.getAllRoles
);

/**
 * @route   GET /api/v1/roles/:roleId
 * @desc    Get role by ID
 * @access  Private (Admin)
 */
router.get(
  '/:roleId',
  authenticate,
  requirePermission('roles', 'read'),
  roleIdValidation,
  validate,
  roleController.getRoleById
);

/**
 * @route   PUT /api/v1/roles/:roleId
 * @desc    Update role
 * @access  Private (Superadmin)
 */
router.put(
  '/:roleId',
  authenticate,
  requireRole('superadmin'),
  updateRoleValidation,
  validate,
  roleController.updateRole
);

/**
 * @route   DELETE /api/v1/roles/:roleId
 * @desc    Delete role
 * @access  Private (Superadmin)
 */
router.delete(
  '/:roleId',
  authenticate,
  requireRole('superadmin'),
  roleIdValidation,
  validate,
  roleController.deleteRole
);

/**
 * @route   GET /api/v1/roles/:roleId/permissions
 * @desc    Get role permissions
 * @access  Private (Admin)
 */
router.get(
  '/:roleId/permissions',
  authenticate,
  requirePermission('roles', 'read'),
  roleIdValidation,
  validate,
  roleController.getRolePermissions
);

/**
 * @route   POST /api/v1/roles/:roleId/permissions
 * @desc    Add permission to role
 * @access  Private (Superadmin)
 */
router.post(
  '/:roleId/permissions',
  authenticate,
  requireRole('superadmin'),
  addPermissionValidation,
  validate,
  roleController.addPermission
);

/**
 * @route   DELETE /api/v1/roles/:roleId/permissions
 * @desc    Remove permission from role
 * @access  Private (Superadmin)
 */
router.delete(
  '/:roleId/permissions',
  authenticate,
  requireRole('superadmin'),
  removePermissionValidation,
  validate,
  roleController.removePermission
);

/**
 * @route   GET /api/v1/roles/:roleId/users
 * @desc    Get users with specific role
 * @access  Private (Admin)
 */
router.get(
  '/:roleId/users',
  authenticate,
  requirePermission('roles', 'read'),
  getUsersByRoleValidation,
  validate,
  validatePagination(),
  roleController.getUsersByRole
);

module.exports = router;
