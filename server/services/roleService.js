/**
 * Role Service
 * 
 * This module provides business logic for role and permission management.
 * Handles RBAC operations including role CRUD and permission assignments.
 * 
 * @module services/roleService
 */

const Role = require('../models/Role');
const User = require('../models/User');
const { AppError } = require('../utils/errors');
const { logger } = require('./loggerService');

/**
 * Create Role
 * 
 * Creates a new role with specified permissions.
 * 
 * @param {Object} roleData - Role data
 * @param {string} roleData.name - Role name
 * @param {string} roleData.displayName - Display name
 * @param {string} roleData.description - Role description
 * @param {Array} roleData.permissions - Array of permissions
 * @param {number} roleData.level - Role level
 * @returns {Promise<Object>} Created role
 */
const createRole = async (roleData) => {
  try {
    const { name, displayName, description, permissions, level } = roleData;
    
    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      throw new AppError('Role with this name already exists', 400);
    }
    
    // Create role
    const role = await Role.create({
      name: name.toLowerCase(),
      displayName,
      description,
      permissions,
      level,
      isSystem: false,
    });
    
    logger.info(`Role created: ${role.name}`);
    
    return role;
    
  } catch (error) {
    logger.error(`Create role error: ${error.message}`);
    throw error;
  }
};

/**
 * Get Role By ID
 * 
 * Retrieves a role by its ID.
 * 
 * @param {string} roleId - Role ID
 * @returns {Promise<Object>} Role data
 */
const getRoleById = async (roleId) => {
  try {
    const role = await Role.findById(roleId);
    
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    return role;
    
  } catch (error) {
    logger.error(`Get role error: ${error.message}`);
    throw error;
  }
};

/**
 * Get Role By Name
 * 
 * Retrieves a role by its name.
 * 
 * @param {string} name - Role name
 * @returns {Promise<Object>} Role data
 */
const getRoleByName = async (name) => {
  try {
    const role = await Role.findByName(name);
    
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    return role;
    
  } catch (error) {
    logger.error(`Get role by name error: ${error.message}`);
    throw error;
  }
};

/**
 * List All Roles
 * 
 * Retrieves all roles with optional filtering.
 * 
 * @param {Object} filters - Filter options
 * @param {boolean} filters.activeOnly - Return only active roles
 * @returns {Promise<Array>} List of roles
 */
const listAllRoles = async (filters = {}) => {
  try {
    const { activeOnly = false } = filters;
    
    const query = activeOnly ? { isActive: true } : {};
    
    const roles = await Role.find(query).sort({ level: -1 });
    
    return roles;
    
  } catch (error) {
    logger.error(`List roles error: ${error.message}`);
    throw error;
  }
};

/**
 * Update Role
 * 
 * Updates an existing role's information.
 * 
 * @param {string} roleId - Role ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated role
 */
const updateRole = async (roleId, updateData) => {
  try {
    const role = await Role.findById(roleId);
    
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    // Prevent updating system roles
    if (role.isSystem) {
      throw new AppError('Cannot modify system roles', 403);
    }
    
    // Fields that can be updated
    const allowedUpdates = ['displayName', 'description', 'permissions', 'level', 'isActive'];
    
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        role[key] = updateData[key];
      }
    }
    
    await role.save();
    
    logger.info(`Role updated: ${role.name}`);
    
    return role;
    
  } catch (error) {
    logger.error(`Update role error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete Role
 * 
 * Deletes a role (if not a system role and no users are assigned).
 * 
 * @param {string} roleId - Role ID
 * @returns {Promise<Object>} Success message
 */
const deleteRole = async (roleId) => {
  try {
    const role = await Role.findById(roleId);
    
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    // Prevent deleting system roles
    if (role.isSystem) {
      throw new AppError('Cannot delete system roles', 403);
    }
    
    // Check if any users have this role
    const usersWithRole = await User.countDocuments({ role: roleId });
    if (usersWithRole > 0) {
      throw new AppError(
        `Cannot delete role. ${usersWithRole} user(s) are assigned this role.`,
        400
      );
    }
    
    await role.deleteOne();
    
    logger.info(`Role deleted: ${role.name}`);
    
    return { message: 'Role deleted successfully' };
    
  } catch (error) {
    logger.error(`Delete role error: ${error.message}`);
    throw error;
  }
};

/**
 * Add Permission To Role
 * 
 * Adds a new permission to an existing role.
 * 
 * @param {string} roleId - Role ID
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {Promise<Object>} Updated role
 */
const addPermissionToRole = async (roleId, resource, action) => {
  try {
    const role = await Role.findById(roleId);
    
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    if (role.isSystem) {
      throw new AppError('Cannot modify system role permissions', 403);
    }
    
    await role.addPermission(resource, action);
    
    logger.info(`Permission added to role ${role.name}: ${resource}:${action}`);
    
    return role;
    
  } catch (error) {
    logger.error(`Add permission error: ${error.message}`);
    throw error;
  }
};

/**
 * Remove Permission From Role
 * 
 * Removes a permission from a role.
 * 
 * @param {string} roleId - Role ID
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {Promise<Object>} Updated role
 */
const removePermissionFromRole = async (roleId, resource, action) => {
  try {
    const role = await Role.findById(roleId);
    
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    if (role.isSystem) {
      throw new AppError('Cannot modify system role permissions', 403);
    }
    
    await role.removePermission(resource, action);
    
    logger.info(`Permission removed from role ${role.name}: ${resource}:${action}`);
    
    return role;
    
  } catch (error) {
    logger.error(`Remove permission error: ${error.message}`);
    throw error;
  }
};

/**
 * Get Role Permissions
 * 
 * Retrieves all permissions for a specific role.
 * 
 * @param {string} roleId - Role ID
 * @returns {Promise<Array>} List of permissions
 */
const getRolePermissions = async (roleId) => {
  try {
    const role = await Role.findById(roleId);
    
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    return role.getAllPermissions();
    
  } catch (error) {
    logger.error(`Get role permissions error: ${error.message}`);
    throw error;
  }
};

/**
 * Check User Permission
 * 
 * Checks if a user has a specific permission.
 * 
 * @param {string} userId - User ID
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {Promise<boolean>} True if user has permission
 */
const checkUserPermission = async (userId, resource, action) => {
  try {
    const user = await User.findById(userId).populate('role');
    
    if (!user || !user.role) {
      return false;
    }
    
    return user.role.hasPermission(resource, action);
    
  } catch (error) {
    logger.error(`Check permission error: ${error.message}`);
    return false;
  }
};

/**
 * Get Users By Role
 * 
 * Retrieves all users with a specific role.
 * 
 * @param {string} roleId - Role ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Users and pagination info
 */
const getUsersByRole = async (roleId, options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find({ role: roleId })
        .select('-password')
        .populate('role')
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: roleId }),
    ]);
    
    return {
      users: users.map(user => user.toSafeObject()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
    
  } catch (error) {
    logger.error(`Get users by role error: ${error.message}`);
    throw error;
  }
};

/**
 * Get Role Statistics
 * 
 * Retrieves statistics about roles and user distribution.
 * 
 * @returns {Promise<Object>} Role statistics
 */
const getRoleStatistics = async () => {
  try {
    const roles = await Role.find();
    
    const statistics = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({ role: role._id });
        
        return {
          roleId: role._id,
          name: role.name,
          displayName: role.displayName,
          level: role.level,
          userCount,
          isActive: role.isActive,
          isSystem: role.isSystem,
        };
      })
    );
    
    return statistics;
    
  } catch (error) {
    logger.error(`Get role statistics error: ${error.message}`);
    throw error;
  }
};

/**
 * Initialize Default Roles
 * 
 * Creates default system roles if they don't exist.
 * 
 * @returns {Promise<Object>} Success message
 */
const initializeDefaultRoles = async () => {
  try {
    await Role.initializeDefaultRoles();
    
    logger.info('Default roles initialized successfully');
    
    return { message: 'Default roles initialized successfully' };
    
  } catch (error) {
    logger.error(`Initialize roles error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createRole,
  getRoleById,
  getRoleByName,
  listAllRoles,
  updateRole,
  deleteRole,
  addPermissionToRole,
  removePermissionFromRole,
  getRolePermissions,
  checkUserPermission,
  getUsersByRole,
  getRoleStatistics,
  initializeDefaultRoles,
};
