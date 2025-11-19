/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * This module provides middleware for enforcing role-based permissions.
 * Restricts route access based on user roles and specific permissions.
 * 
 * @module middleware/rbacMiddleware
 */

const { AppError } = require('../utils/errors');
const { logger } = require('../services/loggerService');

/**
 * Require Role
 * 
 * Middleware to check if user has one of the required roles.
 * Must be used after authenticate middleware.
 * 
 * @param {...string} roles - Allowed role names (e.g., 'admin', 'moderator')
 * @returns {Function} Express middleware function
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(new AppError('Authentication required to access this resource.', 401));
    }
    
    // Check if user has a role assigned
    if (!req.user.role) {
      logger.error(`User ${req.user._id} has no role assigned`);
      return next(new AppError('Access denied. No role assigned.', 403));
    }
    
    // Get user's role name
    const userRole = req.user.role.name;
    
    // Check if user's role is in the allowed roles
    if (!roles.includes(userRole)) {
      logger.warn(`Access denied for user ${req.user.email} with role ${userRole}. Required: ${roles.join(', ')}`);
      return next(new AppError('You do not have permission to access this resource.', 403));
    }
    
    // Log successful authorization in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Access granted for user ${req.user.email} with role ${userRole}`);
    }
    
    next();
  };
};

/**
 * Require Permission
 * 
 * Middleware to check if user has specific permission for a resource and action.
 * Must be used after authenticate middleware.
 * 
 * @param {string} resource - Resource name (e.g., 'users', 'posts')
 * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete')
 * @returns {Function} Express middleware function
 */
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(new AppError('Authentication required to access this resource.', 401));
    }
    
    // Check if user has a role assigned
    if (!req.user.role) {
      logger.error(`User ${req.user._id} has no role assigned`);
      return next(new AppError('Access denied. No role assigned.', 403));
    }
    
    // Check if role has the required permission
    const hasPermission = req.user.role.hasPermission(resource, action);
    
    if (!hasPermission) {
      logger.warn(
        `Permission denied for user ${req.user.email}. ` +
        `Required: ${resource}:${action}, Role: ${req.user.role.name}`
      );
      return next(new AppError(`You do not have permission to ${action} ${resource}.`, 403));
    }
    
    // Log successful authorization in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Permission granted: ${req.user.email} can ${action} ${resource}`);
    }
    
    next();
  };
};

/**
 * Require Any Permission
 * 
 * Middleware to check if user has at least one of the specified permissions.
 * Useful for routes that accept multiple permission combinations.
 * 
 * @param {Array<Object>} permissions - Array of {resource, action} objects
 * @returns {Function} Express middleware function
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(new AppError('Authentication required to access this resource.', 401));
    }
    
    // Check if user has a role assigned
    if (!req.user.role) {
      return next(new AppError('Access denied. No role assigned.', 403));
    }
    
    // Check if user has any of the required permissions
    const hasAnyPermission = permissions.some(({ resource, action }) => {
      return req.user.role.hasPermission(resource, action);
    });
    
    if (!hasAnyPermission) {
      const permissionList = permissions
        .map(p => `${p.resource}:${p.action}`)
        .join(' OR ');
      
      logger.warn(
        `Permission denied for user ${req.user.email}. ` +
        `Required one of: ${permissionList}, Role: ${req.user.role.name}`
      );
      
      return next(new AppError('You do not have the required permissions.', 403));
    }
    
    next();
  };
};

/**
 * Require All Permissions
 * 
 * Middleware to check if user has all of the specified permissions.
 * Stricter than requireAnyPermission - all must be present.
 * 
 * @param {Array<Object>} permissions - Array of {resource, action} objects
 * @returns {Function} Express middleware function
 */
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(new AppError('Authentication required to access this resource.', 401));
    }
    
    // Check if user has a role assigned
    if (!req.user.role) {
      return next(new AppError('Access denied. No role assigned.', 403));
    }
    
    // Check if user has all required permissions
    const missingPermissions = permissions.filter(({ resource, action }) => {
      return !req.user.role.hasPermission(resource, action);
    });
    
    if (missingPermissions.length > 0) {
      const missingList = missingPermissions
        .map(p => `${p.resource}:${p.action}`)
        .join(', ');
      
      logger.warn(
        `Permission denied for user ${req.user.email}. ` +
        `Missing: ${missingList}, Role: ${req.user.role.name}`
      );
      
      return next(new AppError('You do not have all required permissions.', 403));
    }
    
    next();
  };
};

/**
 * Require Owner Or Admin
 * 
 * Middleware to check if user is the resource owner or has admin privileges.
 * Useful for routes where users can modify their own data or admins can modify any.
 * 
 * @param {string} userIdField - Field name containing the owner's user ID (default: 'userId')
 * @returns {Function} Express middleware function
 */
const requireOwnerOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(new AppError('Authentication required to access this resource.', 401));
    }
    
    // Get the owner's user ID from request params, body, or query
    const ownerId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
    
    if (!ownerId) {
      logger.error(`Owner ID field '${userIdField}' not found in request`);
      return next(new AppError('Resource owner identification failed.', 400));
    }
    
    // Check if user is the owner
    const isOwner = req.user._id.toString() === ownerId.toString();
    
    // Check if user is admin or superadmin
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role.name);
    
    if (!isOwner && !isAdmin) {
      logger.warn(
        `Access denied for user ${req.user.email}. ` +
        `Not owner and not admin. Resource owner: ${ownerId}`
      );
      return next(new AppError('You can only access your own resources.', 403));
    }
    
    // Attach ownership info to request
    req.isOwner = isOwner;
    req.isAdmin = isAdmin;
    
    next();
  };
};

/**
 * Require Minimum Role Level
 * 
 * Middleware to check if user's role level meets minimum requirement.
 * Higher level = more privileges (e.g., superadmin level 10, user level 3).
 * 
 * @param {number} minimumLevel - Minimum required role level
 * @returns {Function} Express middleware function
 */
const requireMinimumRoleLevel = (minimumLevel) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(new AppError('Authentication required to access this resource.', 401));
    }
    
    // Check if user has a role assigned
    if (!req.user.role) {
      return next(new AppError('Access denied. No role assigned.', 403));
    }
    
    // Check role level
    if (req.user.role.level < minimumLevel) {
      logger.warn(
        `Access denied for user ${req.user.email}. ` +
        `Role level ${req.user.role.level} < required ${minimumLevel}`
      );
      return next(new AppError('Insufficient role level to access this resource.', 403));
    }
    
    next();
  };
};

/**
 * Check Resource Ownership
 * 
 * Helper function to verify resource ownership.
 * Can be used within route handlers for custom ownership checks.
 * 
 * @param {Object} user - User object
 * @param {string} resourceOwnerId - Resource owner's user ID
 * @returns {boolean} True if user owns resource or is admin
 */
const checkResourceOwnership = (user, resourceOwnerId) => {
  if (!user || !resourceOwnerId) {
    return false;
  }
  
  const isOwner = user._id.toString() === resourceOwnerId.toString();
  const isAdmin = ['admin', 'superadmin'].includes(user.role?.name);
  
  return isOwner || isAdmin;
};

module.exports = {
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireOwnerOrAdmin,
  requireMinimumRoleLevel,
  checkResourceOwnership,
};
