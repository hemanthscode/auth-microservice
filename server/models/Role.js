/**
 * Role Model
 * 
 * This module defines the Role schema for MongoDB with Mongoose.
 * Handles role-based access control (RBAC) with permissions and hierarchies.
 * 
 * @module models/Role
 */


const mongoose = require('mongoose');


/**
 * Role Schema Definition
 * 
 * Defines roles with associated permissions for access control.
 * Supports hierarchical role structures and granular permissions.
 */
const roleSchema = new mongoose.Schema(
  {
    // Role Information
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      lowercase: true,
      trim: true,
      enum: ['superadmin', 'admin', 'moderator', 'user', 'guest'],
    },
    
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    
    description: {
      type: String,
      required: [true, 'Role description is required'],
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    
    // Permissions Array
    permissions: [{
      resource: {
        type: String,
        required: true,
        enum: [
          'users',
          'roles',
          'posts',
          'comments',
          'settings',
          'analytics',
          'reports',
          'files',
          'notifications',
          'logs',
        ],
      },
      actions: [{
        type: String,
        required: true,
        enum: ['create', 'read', 'update', 'delete', 'manage'],
      }],
    }],
    
    // Role Hierarchy
    level: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Level must be at least 1'],
      max: [10, 'Level cannot exceed 10'],
    },
    
    // Role Status
    isActive: {
      type: Boolean,
      default: true,
    },
    
    isSystem: {
      type: Boolean,
      default: false, // System roles cannot be deleted
    },
    
    // Role Metadata
    userCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


// ============================================
// INDEXES
// ============================================


// Unique index on role name (removed from schema definition above)
// Note: name field already has unique: true, so no separate index needed

// Index on level for hierarchy queries
roleSchema.index({ level: -1 });


// Index on active roles
roleSchema.index({ isActive: 1 });


// ============================================
// INSTANCE METHODS
// ============================================


/**
 * Has Permission
 * 
 * Checks if role has a specific permission for a resource.
 * 
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {boolean} True if permission exists, false otherwise
 */
roleSchema.methods.hasPermission = function(resource, action) {
  const permission = this.permissions.find(p => p.resource === resource);
  
  if (!permission) {
    return false;
  }
  
  // 'manage' action includes all other actions
  return permission.actions.includes(action) || permission.actions.includes('manage');
};


/**
 * Add Permission
 * 
 * Adds a new permission to the role.
 * 
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {Promise<void>}
 */
roleSchema.methods.addPermission = async function(resource, action) {
  const permission = this.permissions.find(p => p.resource === resource);
  
  if (permission) {
    if (!permission.actions.includes(action)) {
      permission.actions.push(action);
    }
  } else {
    this.permissions.push({
      resource,
      actions: [action],
    });
  }
  
  return await this.save();
};


/**
 * Remove Permission
 * 
 * Removes a permission from the role.
 * 
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {Promise<void>}
 */
roleSchema.methods.removePermission = async function(resource, action) {
  const permission = this.permissions.find(p => p.resource === resource);
  
  if (permission) {
    permission.actions = permission.actions.filter(a => a !== action);
    
    // Remove permission if no actions left
    if (permission.actions.length === 0) {
      this.permissions = this.permissions.filter(p => p.resource !== resource);
    }
  }
  
  return await this.save();
};


/**
 * Get All Permissions
 * 
 * Returns a formatted list of all permissions.
 * 
 * @returns {Array<Object>} Array of permission objects
 */
roleSchema.methods.getAllPermissions = function() {
  return this.permissions.map(p => ({
    resource: p.resource,
    actions: p.actions,
  }));
};


// ============================================
// STATIC METHODS
// ============================================


/**
 * Find By Name
 * 
 * Finds role by name.
 * 
 * @param {string} name - Role name
 * @returns {Promise<Object|null>} Role object or null
 */
roleSchema.statics.findByName = async function(name) {
  return await this.findOne({ name: name.toLowerCase() });
};


/**
 * Get Default Role
 * 
 * Returns the default role for new users.
 * 
 * @returns {Promise<Object|null>} Default role object
 */
roleSchema.statics.getDefaultRole = async function() {
  return await this.findOne({ name: 'user' });
};


/**
 * Get Active Roles
 * 
 * Returns all active roles sorted by level.
 * 
 * @returns {Promise<Array>} Array of active roles
 */
roleSchema.statics.getActiveRoles = async function() {
  return await this.find({ isActive: true }).sort({ level: -1 });
};


/**
 * Get Role Hierarchy
 * 
 * Returns roles in hierarchical order.
 * 
 * @returns {Promise<Array>} Array of roles sorted by level
 */
roleSchema.statics.getRoleHierarchy = async function() {
  return await this.find().sort({ level: -1 });
};


/**
 * Initialize Default Roles
 * 
 * Creates default system roles if they don't exist.
 * 
 * @returns {Promise<void>}
 */
roleSchema.statics.initializeDefaultRoles = async function() {
  const defaultRoles = [
    {
      name: 'superadmin',
      displayName: 'Super Administrator',
      description: 'Full system access with all permissions',
      level: 10,
      isSystem: true,
      permissions: [
        { resource: 'users', actions: ['manage'] },
        { resource: 'roles', actions: ['manage'] },
        { resource: 'posts', actions: ['manage'] },
        { resource: 'comments', actions: ['manage'] },
        { resource: 'settings', actions: ['manage'] },
        { resource: 'analytics', actions: ['manage'] },
        { resource: 'reports', actions: ['manage'] },
        { resource: 'files', actions: ['manage'] },
        { resource: 'notifications', actions: ['manage'] },
        { resource: 'logs', actions: ['manage'] },
      ],
    },
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Administrative access with most permissions',
      level: 8,
      isSystem: true,
      permissions: [
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'posts', actions: ['manage'] },
        { resource: 'comments', actions: ['manage'] },
        { resource: 'settings', actions: ['read', 'update'] },
        { resource: 'analytics', actions: ['read'] },
        { resource: 'reports', actions: ['read'] },
        { resource: 'files', actions: ['manage'] },
      ],
    },
    {
      name: 'moderator',
      displayName: 'Moderator',
      description: 'Content moderation and user management',
      level: 5,
      isSystem: true,
      permissions: [
        { resource: 'users', actions: ['read', 'update'] },
        { resource: 'posts', actions: ['read', 'update', 'delete'] },
        { resource: 'comments', actions: ['read', 'update', 'delete'] },
        { resource: 'files', actions: ['read', 'update', 'delete'] },
      ],
    },
    {
      name: 'user',
      displayName: 'User',
      description: 'Standard user with basic permissions',
      level: 3,
      isSystem: true,
      permissions: [
        { resource: 'posts', actions: ['create', 'read', 'update'] },
        { resource: 'comments', actions: ['create', 'read', 'update'] },
        { resource: 'files', actions: ['create', 'read', 'update'] },
      ],
    },
    {
      name: 'guest',
      displayName: 'Guest',
      description: 'Limited read-only access',
      level: 1,
      isSystem: true,
      permissions: [
        { resource: 'posts', actions: ['read'] },
        { resource: 'comments', actions: ['read'] },
      ],
    },
  ];
  
  for (const roleData of defaultRoles) {
    const existingRole = await this.findOne({ name: roleData.name });
    
    if (!existingRole) {
      await this.create(roleData);
    }
  }
};


// ============================================
// MODEL EXPORT
// ============================================


const Role = mongoose.model('Role', roleSchema);


module.exports = Role;