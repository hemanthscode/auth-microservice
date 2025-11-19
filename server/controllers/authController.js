/**
 * Authentication Controller
 * 
 * This module handles HTTP requests for authentication endpoints.
 * Processes registration, login, logout, and token management.
 * 
 * @module controllers/authController
 */

const authService = require('../services/authService');
const { getCookieOptions } = require('../config/jwt');
const { asyncHandler } = require('../middleware/errorHandler');
const { getIpAddress, parseUserAgent } = require('../utils/helpers');
const { logger } = require('../services/loggerService');

/**
 * Register User
 * 
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  
  const result = await authService.registerUser({
    firstName,
    lastName,
    email,
    password,
  });
  
  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, getCookieOptions());
  
  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

/**
 * Login User
 * 
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Get request metadata
  const metadata = {
    ipAddress: getIpAddress(req),
    userAgent: req.headers['user-agent'],
    deviceInfo: parseUserAgent(req.headers['user-agent']),
  };
  
  const result = await authService.loginUser({ email, password }, metadata);
  
  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, getCookieOptions());
  
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

/**
 * Logout User
 * 
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  await authService.logoutUser(req.userId, refreshToken);
  
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Refresh Access Token
 * 
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required',
    });
  }
  
  const result = await authService.refreshAccessToken(refreshToken);
  
  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: result.accessToken,
    },
  });
});

/**
 * Verify Email
 * 
 * @route   POST /api/v1/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  await authService.verifyEmail(token);
  
  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
  });
});

/**
 * Resend Verification Email
 * 
 * @route   POST /api/v1/auth/resend-verification
 * @access  Public
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  await authService.resendVerificationEmail(email);
  
  res.status(200).json({
    success: true,
    message: 'Verification email sent successfully',
  });
});

/**
 * Change Password
 * 
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  await authService.changePassword(req.userId, currentPassword, newPassword);
  
  // Clear refresh token cookie to force re-login
  res.clearCookie('refreshToken');
  
  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login again.',
  });
});

/**
 * Get Active Sessions
 * 
 * @route   GET /api/v1/auth/sessions
 * @access  Private
 */
const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getActiveSessions(req.userId);
  
  res.status(200).json({
    success: true,
    data: {
      sessions,
      total: sessions.length,
    },
  });
});

/**
 * Revoke Session
 * 
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @access  Private
 */
const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  await authService.revokeSession(req.userId, sessionId);
  
  res.status(200).json({
    success: true,
    message: 'Session revoked successfully',
  });
});

/**
 * Get Current User
 * 
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
    },
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
  changePassword,
  getActiveSessions,
  revokeSession,
  getCurrentUser,
};
