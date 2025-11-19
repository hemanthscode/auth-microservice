/**
 * User Service
 * 
 * This module provides business logic for user management operations.
 * Handles user profile management, updates, and related functionality.
 * 
 * @module services/userService
 */

const User = require('../models/User');
const Role = require('../models/Role');
const { AppError } = require('../utils/errors');
const { logger } = require('./loggerService');

/**
 * Get User Profile
 * 
 * Retrieves complete user profile information.
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile data
 */
const getUserProfile = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate('role')
      .select('-password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    return user.toSafeObject();
    
  } catch (error) {
    logger.error(`Get user profile error: ${error.message}`);
    throw error;
  }
};

/**
 * Update User Profile
 * 
 * Updates user profile information.
 * 
 * @param {string} userId - User ID
 * @param {Object} updateData - Profile data to update
 * @returns {Promise<Object>} Updated user profile
 */
const updateUserProfile = async (userId, updateData) => {
  try {
    // Fields that can be updated
    const allowedUpdates = [
      'firstName',
      'lastName',
      'phoneNumber',
      'dateOfBirth',
      'bio',
      'avatar',
      'preferences',
    ];
    
    // Filter update data to only allowed fields
    const filteredUpdates = {};
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        filteredUpdates[key] = updateData[key];
      }
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).populate('role');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    logger.info(`User profile updated: ${user.email}`);
    
    return user.toSafeObject();
    
  } catch (error) {
    logger.error(`Update user profile error: ${error.message}`);
    throw error;
  }
};

/**
 * Update User Preferences
 * 
 * Updates user preferences (language, timezone, notifications).
 * 
 * @param {string} userId - User ID
 * @param {Object} preferences - Preferences to update
 * @returns {Promise<Object>} Updated preferences
 */
const updateUserPreferences = async (userId, preferences) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Merge preferences
    user.preferences = {
      ...user.preferences,
      ...preferences,
    };
    
    await user.save();
    
    logger.info(`User preferences updated: ${user.email}`);
    
    return user.preferences;
    
  } catch (error) {
    logger.error(`Update preferences error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete User Account
 * 
 * Soft deletes a user account by deactivating it.
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success message
 */
const deleteUserAccount = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Soft delete by deactivating
    user.isActive = false;
    await user.save();
    
    // Revoke all tokens
    const Token = require('../models/Token');
    await Token.revokeUserTokens(userId, 'Account deleted');
    
    logger.info(`User account deleted: ${user.email}`);
    
    return { message: 'Account deleted successfully' };
    
  } catch (error) {
    logger.error(`Delete account error: ${error.message}`);
    throw error;
  }
};

/**
 * Get User By Email
 * 
 * Finds user by email address.
 * 
 * @param {string} email - Email address
 * @returns {Promise<Object>} User data
 */
const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('role')
      .select('-password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    return user.toSafeObject();
    
  } catch (error) {
    logger.error(`Get user by email error: ${error.message}`);
    throw error;
  }
};

/**
 * List Users
 * 
 * Retrieves a paginated list of users with filters.
 * 
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Results per page
 * @param {Object} options.filters - Filter criteria
 * @param {Object} options.sort - Sort criteria
 * @returns {Promise<Object>} Paginated user list
 */
const listUsers = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      filters = {},
      sort = { createdAt: -1 },
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { ...filters };
    
    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .populate('role')
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
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
    logger.error(`List users error: ${error.message}`);
    throw error;
  }
};

/**
 * Search Users
 * 
 * Searches users by name or email.
 * 
 * @param {string} searchTerm - Search term
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Matching users
 */
const searchUsers = async (searchTerm, options = {}) => {
  try {
    const { limit = 10 } = options;
    
    const users = await User.find({
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ],
      isActive: true,
    })
      .populate('role')
      .select('-password')
      .limit(limit);
    
    return users.map(user => user.toSafeObject());
    
  } catch (error) {
    logger.error(`Search users error: ${error.message}`);
    throw error;
  }
};

/**
 * Update User Role
 * 
 * Changes a user's role (admin only).
 * 
 * @param {string} userId - User ID
 * @param {string} roleId - New role ID
 * @returns {Promise<Object>} Updated user
 */
const updateUserRole = async (userId, roleId) => {
  try {
    // Verify role exists
    const role = await Role.findById(roleId);
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    
    // Update user role
    const user = await User.findByIdAndUpdate(
      userId,
      { role: roleId },
      { new: true }
    ).populate('role');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    logger.info(`User role updated: ${user.email} -> ${role.name}`);
    
    return user.toSafeObject();
    
  } catch (error) {
    logger.error(`Update user role error: ${error.message}`);
    throw error;
  }
};

/**
 * Activate User Account
 * 
 * Activates a deactivated user account.
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success message
 */
const activateUserAccount = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    user.isActive = true;
    await user.save();
    
    logger.info(`User account activated: ${user.email}`);
    
    return { message: 'Account activated successfully' };
    
  } catch (error) {
    logger.error(`Activate account error: ${error.message}`);
    throw error;
  }
};

/**
 * Deactivate User Account
 * 
 * Deactivates a user account (admin only).
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success message
 */
const deactivateUserAccount = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    user.isActive = false;
    await user.save();
    
    // Revoke all tokens
    const Token = require('../models/Token');
    await Token.revokeUserTokens(userId, 'Account deactivated by admin');
    
    logger.info(`User account deactivated: ${user.email}`);
    
    return { message: 'Account deactivated successfully' };
    
  } catch (error) {
    logger.error(`Deactivate account error: ${error.message}`);
    throw error;
  }
};

/**
 * Get User Statistics
 * 
 * Retrieves statistics about users (admin only).
 * 
 * @returns {Promise<Object>} User statistics
 */
const getUserStatistics = async () => {
  try {
    const [total, active, verified, byRole] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isEmailVerified: true }),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'roles',
            localField: '_id',
            foreignField: '_id',
            as: 'roleInfo',
          },
        },
      ]),
    ]);
    
    return {
      total,
      active,
      verified,
      byRole: byRole.map(item => ({
        role: item.roleInfo[0]?.name || 'Unknown',
        count: item.count,
      })),
    };
    
  } catch (error) {
    logger.error(`Get user statistics error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateUserPreferences,
  deleteUserAccount,
  getUserByEmail,
  listUsers,
  searchUsers,
  updateUserRole,
  activateUserAccount,
  deactivateUserAccount,
  getUserStatistics,
};
