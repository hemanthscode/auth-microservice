/**
 * Role Controller
 * 
 * This module handles HTTP requests for role management endpoints.
 * Processes RBAC operations including role and permission management.
 * 
 * @module controllers/roleController
 */

const roleService = require('../services/roleService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Create Role
 * 
 * @route   POST /api/v1/roles
 * @access  Private (Superadmin)
 */
const createRole = asyncHandler(async (req, res) => {
  const roleData = req.body;
  
  const role = await roleService.createRole(roleData);
  
  res.status(201).json({
    success: true,
    message: 'Role created successfully',
    data: { role },
  });
});

/**
 * Get All Roles
 * 
 * @route   GET /api/v1/roles
 * @access  Private (Admin)
 */
const getAllRoles = asyncHandler(async (req, res) => {
  const filters = {
    activeOnly: req.query.activeOnly === 'true',
  };
  
  const roles = await roleService.listAllRoles(filters);
  
  res.status(200).json({
    success: true,
    data: {
      roles,
      total: roles.length,
    },
  });
});

/**
 * Get Role By ID
 * 
 * @route   GET /api/v1/roles/:roleId
 * @access  Private (Admin)
 */
const getRoleById = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  
  const role = await roleService.getRoleById(roleId);
  
  res.status(200).json({
    success: true,
    data: { role },
  });
});

/**
 * Update Role
 * 
 * @route   PUT /api/v1/roles/:roleId
 * @access  Private (Superadmin)
 */
const updateRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const updateData = req.body;
  
  const role = await roleService.updateRole(roleId, updateData);
  
  res.status(200).json({
    success: true,
    message: 'Role updated successfully',
    data: { role },
  });
});

/**
 * Delete Role
 * 
 * @route   DELETE /api/v1/roles/:roleId
 * @access  Private (Superadmin)
 */
const deleteRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  
  await roleService.deleteRole(roleId);
  
  res.status(200).json({
    success: true,
    message: 'Role deleted successfully',
  });
});

/**
 * Add Permission to Role
 * 
 * @route   POST /api/v1/roles/:roleId/permissions
 * @access  Private (Superadmin)
 */
const addPermission = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const { resource, action } = req.body;
  
  const role = await roleService.addPermissionToRole(roleId, resource, action);
  
  res.status(200).json({
    success: true,
    message: 'Permission added successfully',
    data: { role },
  });
});

/**
 * Remove Permission from Role
 * 
 * @route   DELETE /api/v1/roles/:roleId/permissions
 * @access  Private (Superadmin)
 */
const removePermission = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const { resource, action } = req.body;
  
  const role = await roleService.removePermissionFromRole(roleId, resource, action);
  
  res.status(200).json({
    success: true,
    message: 'Permission removed successfully',
    data: { role },
  });
});

/**
 * Get Role Permissions
 * 
 * @route   GET /api/v1/roles/:roleId/permissions
 * @access  Private (Admin)
 */
const getRolePermissions = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  
  const permissions = await roleService.getRolePermissions(roleId);
  
  res.status(200).json({
    success: true,
    data: { permissions },
  });
});

/**
 * Get Users By Role
 * 
 * @route   GET /api/v1/roles/:roleId/users
 * @access  Private (Admin)
 */
const getUsersByRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };
  
  const result = await roleService.getUsersByRole(roleId, options);
  
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get Role Statistics
 * 
 * @route   GET /api/v1/roles/stats
 * @access  Private (Admin)
 */
const getRoleStatistics = asyncHandler(async (req, res) => {
  const stats = await roleService.getRoleStatistics();
  
  res.status(200).json({
    success: true,
    data: { stats },
  });
});

/**
 * Initialize Default Roles
 * 
 * @route   POST /api/v1/roles/initialize
 * @access  Private (Superadmin)
 */
const initializeRoles = asyncHandler(async (req, res) => {
  await roleService.initializeDefaultRoles();
  
  res.status(200).json({
    success: true,
    message: 'Default roles initialized successfully',
  });
});

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  addPermission,
  removePermission,
  getRolePermissions,
  getUsersByRole,
  getRoleStatistics,
  initializeRoles,
};
