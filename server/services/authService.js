/**
 * Authentication Service
 * 
 * This module provides business logic for authentication operations.
 * Handles user registration, login, logout, token refresh, and related functionality.
 * 
 * @module services/authService
 */

const User = require('../models/User');
const Token = require('../models/Token');
const Role = require('../models/Role');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { AppError } = require('../utils/errors');
const { logger } = require('./loggerService');
const emailService = require('./emailService');

/**
 * Register User
 * 
 * Creates a new user account with email verification.
 * 
 * @param {Object} userData - User registration data
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @returns {Promise<Object>} Created user and tokens
 */
const registerUser = async (userData) => {
  try {
    const { firstName, lastName, email, password } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email is already registered', 400);
    }
    
    // Get default user role
    const defaultRole = await Role.findOne({ name: 'user' });
    if (!defaultRole) {
      throw new AppError('Default role not found. Please initialize roles.', 500);
    }
    
    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: defaultRole._id,
    });
    
    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    
    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (error) {
      logger.error(`Failed to send verification email: ${error.message}`);
      // Don't fail registration if email fails
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      role: defaultRole.name,
    });
    
    const refreshToken = generateRefreshToken({ userId: user._id });
    
    // Save refresh token to database
    await Token.create({
      user: user._id,
      token: refreshToken,
      tokenType: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    
    logger.info(`User registered successfully: ${user.email}`);
    
    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    };
    
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    throw error;
  }
};

/**
 * Login User
 * 
 * Authenticates user with email and password.
 * 
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @param {Object} metadata - Request metadata (IP, user agent)
 * @returns {Promise<Object>} User data and tokens
 */
const loginUser = async (credentials, metadata = {}) => {
  try {
    const { email, password } = credentials;
    
    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('role');
    
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Check if account is locked
    if (user.isAccountLocked) {
      throw new AppError(
        `Account is locked until ${new Date(user.lockUntil).toLocaleString()}`,
        403
      );
    }
    
    // Check if account is active
    if (!user.isActive) {
      throw new AppError('Account has been deactivated', 403);
    }
    
    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      throw new AppError('Invalid email or password', 401);
    }
    
    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role.name,
    });
    
    const refreshToken = generateRefreshToken({ userId: user._id });
    
    // Save refresh token to database
    await Token.create({
      user: user._id,
      token: refreshToken,
      tokenType: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
    
    logger.info(`User logged in successfully: ${user.email}`);
    
    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    };
    
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    throw error;
  }
};

/**
 * Logout User
 * 
 * Invalidates user's refresh token and performs cleanup.
 * 
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token to invalidate
 * @returns {Promise<void>}
 */
const logoutUser = async (userId, refreshToken) => {
  try {
    if (refreshToken) {
      // Revoke specific refresh token
      const token = await Token.findOne({ user: userId, token: refreshToken });
      if (token) {
        await token.revokeToken('User logout');
      }
    } else {
      // Revoke all user tokens if no specific token provided
      await Token.revokeUserTokens(userId, 'User logout all sessions');
    }
    
    logger.info(`User logged out: ${userId}`);
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    throw error;
  }
};

/**
 * Refresh Access Token
 * 
 * Generates a new access token using a valid refresh token.
 * 
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New access token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    // Find and validate refresh token
    const tokenDoc = await Token.findActiveToken(refreshToken);
    
    if (!tokenDoc) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
    
    // Update last used timestamp
    await tokenDoc.updateLastUsed();
    
    // Get user with role
    const user = await User.findById(tokenDoc.user).populate('role');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    if (!user.isActive) {
      throw new AppError('Account has been deactivated', 403);
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role.name,
    });
    
    logger.info(`Access token refreshed for user: ${user.email}`);
    
    return { accessToken };
    
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    throw error;
  }
};

/**
 * Verify Email
 * 
 * Verifies user's email address using verification token.
 * 
 * @param {string} token - Email verification token
 * @returns {Promise<Object>} Success message
 */
const verifyEmail = async (token) => {
  try {
    // Find user by verification token
    const user = await User.findByEmailVerificationToken(token);
    
    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    logger.info(`Email verified for user: ${user.email}`);
    
    return { message: 'Email verified successfully' };
    
  } catch (error) {
    logger.error(`Email verification error: ${error.message}`);
    throw error;
  }
};

/**
 * Resend Verification Email
 * 
 * Sends a new email verification link to the user.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Success message
 */
const resendVerificationEmail = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }
    
    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    
    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);
    
    logger.info(`Verification email resent to: ${user.email}`);
    
    return { message: 'Verification email sent successfully' };
    
  } catch (error) {
    logger.error(`Resend verification error: ${error.message}`);
    throw error;
  }
};

/**
 * Change Password
 * 
 * Changes user's password (requires current password).
 * 
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success message
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new AppError('Current password is incorrect', 401);
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Revoke all existing tokens for security
    await Token.revokeUserTokens(userId, 'Password changed');
    
    logger.info(`Password changed for user: ${user.email}`);
    
    return { message: 'Password changed successfully. Please login again.' };
    
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    throw error;
  }
};

/**
 * Validate Session
 * 
 * Validates if a user session is still active and valid.
 * 
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if session is valid
 */
const validateSession = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return false;
    }
    
    if (!user.isActive || user.isAccountLocked) {
      return false;
    }
    
    return true;
    
  } catch (error) {
    logger.error(`Session validation error: ${error.message}`);
    return false;
  }
};

/**
 * Get Active Sessions
 * 
 * Retrieves all active sessions (tokens) for a user.
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of active sessions
 */
const getActiveSessions = async (userId) => {
  try {
    const tokens = await Token.findUserTokens(userId, true);
    
    return tokens.map(token => ({
      id: token._id,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt,
      expiresAt: token.expiresAt,
      ipAddress: token.ipAddress,
      userAgent: token.userAgent,
      deviceInfo: token.deviceInfo,
    }));
    
  } catch (error) {
    logger.error(`Get active sessions error: ${error.message}`);
    throw error;
  }
};

/**
 * Revoke Session
 * 
 * Revokes a specific user session by token ID.
 * 
 * @param {string} userId - User ID
 * @param {string} tokenId - Token ID to revoke
 * @returns {Promise<Object>} Success message
 */
const revokeSession = async (userId, tokenId) => {
  try {
    const token = await Token.findOne({ _id: tokenId, user: userId });
    
    if (!token) {
      throw new AppError('Session not found', 404);
    }
    
    await token.revokeToken('User manually revoked session');
    
    logger.info(`Session revoked for user: ${userId}`);
    
    return { message: 'Session revoked successfully' };
    
  } catch (error) {
    logger.error(`Revoke session error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
  validateSession,
  getActiveSessions,
  revokeSession,
};
