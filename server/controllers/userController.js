/**
 * User Controller
 * 
 * This module handles HTTP requests for user management endpoints.
 * Processes user profile operations and admin user management.
 * 
 * @module controllers/userController
 */

const userService = require('../services/userService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get User Profile
 * 
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.userId);
  
  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * Update User Profile
 * 
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const updateData = req.body;
  
  const user = await userService.updateUserProfile(req.userId, updateData);
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

/**
 * Update User Preferences
 * 
 * @route   PUT /api/v1/users/preferences
 * @access  Private
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = req.body;
  
  const updatedPreferences = await userService.updateUserPreferences(
    req.userId,
    preferences
  );
  
  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: { preferences: updatedPreferences },
  });
});

/**
 * Delete User Account
 * 
 * @route   DELETE /api/v1/users/profile
 * @access  Private
 */
const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deleteUserAccount(req.userId);
  
  // Clear cookies
  res.clearCookie('refreshToken');
  
  res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
  });
});

/**
 * List Users (Admin)
 * 
 * @route   GET /api/v1/users
 * @access  Private (Admin)
 */
const listUsers = asyncHandler(async (req, res) => {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    filters: {},
    sort: req.sort || { createdAt: -1 },
  };
  
  // Add filters from query
  if (req.query.role) options.filters.role = req.query.role;
  if (req.query.isActive !== undefined) options.filters.isActive = req.query.isActive;
  
  const result = await userService.listUsers(options);
  
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Search Users
 * 
 * @route   GET /api/v1/users/search
 * @access  Private
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  
  const users = await userService.searchUsers(q, { limit: parseInt(limit) || 10 });
  
  res.status(200).json({
    success: true,
    data: {
      users,
      total: users.length,
    },
  });
});

/**
 * Get User By ID (Admin)
 * 
 * @route   GET /api/v1/users/:userId
 * @access  Private (Admin)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await userService.getUserProfile(userId);
  
  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * Update User Role (Admin)
 * 
 * @route   PUT /api/v1/users/:userId/role
 * @access  Private (Admin)
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { roleId } = req.body;
  
  const user = await userService.updateUserRole(userId, roleId);
  
  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    data: { user },
  });
});

/**
 * Activate User Account (Admin)
 * 
 * @route   PUT /api/v1/users/:userId/activate
 * @access  Private (Admin)
 */
const activateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  await userService.activateUserAccount(userId);
  
  res.status(200).json({
    success: true,
    message: 'User account activated successfully',
  });
});

/**
 * Deactivate User Account (Admin)
 * 
 * @route   PUT /api/v1/users/:userId/deactivate
 * @access  Private (Admin)
 */
const deactivateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  await userService.deactivateUserAccount(userId);
  
  res.status(200).json({
    success: true,
    message: 'User account deactivated successfully',
  });
});

/**
 * Get User Statistics (Admin)
 * 
 * @route   GET /api/v1/users/stats
 * @access  Private (Admin)
 */
const getUserStatistics = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStatistics();
  
  res.status(200).json({
    success: true,
    data: { stats },
  });
});

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  deleteAccount,
  listUsers,
  searchUsers,
  getUserById,
  updateUserRole,
  activateUser,
  deactivateUser,
  getUserStatistics,
};
