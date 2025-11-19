/**
 * Token Service
 * 
 * This module provides business logic for token management.
 * Handles token generation, validation, and cleanup operations.
 * 
 * @module services/tokenService
 */

const Token = require('../models/Token');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { AppError } = require('../utils/errors');
const { logger } = require('./loggerService');

/**
 * Generate Token Pair
 * 
 * Generates both access and refresh tokens for a user.
 * 
 * @param {Object} user - User object
 * @param {Object} metadata - Token metadata (IP, user agent, etc.)
 * @returns {Promise<Object>} Access and refresh tokens
 */
const generateTokenPair = async (user, metadata = {}) => {
  try {
    // Generate access token
    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role?.name || 'user',
    });
    
    // Generate refresh token
    const refreshToken = generateRefreshToken({ userId: user._id });
    
    // Save refresh token to database
    await Token.create({
      user: user._id,
      token: refreshToken,
      tokenType: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      deviceInfo: metadata.deviceInfo,
    });
    
    logger.info(`Token pair generated for user: ${user._id}`);
    
    return { accessToken, refreshToken };
    
  } catch (error) {
    logger.error(`Generate token pair error: ${error.message}`);
    throw error;
  }
};

/**
 * Validate Refresh Token
 * 
 * Validates a refresh token and returns associated user.
 * 
 * @param {string} refreshToken - Refresh token to validate
 * @returns {Promise<Object>} Token document with user data
 */
const validateRefreshToken = async (refreshToken) => {
  try {
    const tokenDoc = await Token.findActiveToken(refreshToken);
    
    if (!tokenDoc) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
    
    // Check if token is valid
    if (!tokenDoc.isValid()) {
      throw new AppError('Token is no longer valid', 401);
    }
    
    return tokenDoc;
    
  } catch (error) {
    logger.error(`Validate refresh token error: ${error.message}`);
    throw error;
  }
};

/**
 * Revoke Token
 * 
 * Revokes a specific token.
 * 
 * @param {string} tokenId - Token ID
 * @param {string} reason - Revocation reason
 * @returns {Promise<Object>} Success message
 */
const revokeToken = async (tokenId, reason = 'Manual revocation') => {
  try {
    const token = await Token.findById(tokenId);
    
    if (!token) {
      throw new AppError('Token not found', 404);
    }
    
    await token.revokeToken(reason);
    
    logger.info(`Token revoked: ${tokenId}`);
    
    return { message: 'Token revoked successfully' };
    
  } catch (error) {
    logger.error(`Revoke token error: ${error.message}`);
    throw error;
  }
};

/**
 * Revoke All User Tokens
 * 
 * Revokes all tokens for a specific user.
 * 
 * @param {string} userId - User ID
 * @param {string} reason - Revocation reason
 * @returns {Promise<Object>} Success message with count
 */
const revokeAllUserTokens = async (userId, reason = 'Revoke all sessions') => {
  try {
    const result = await Token.revokeUserTokens(userId, reason);
    
    logger.info(`All tokens revoked for user: ${userId}`);
    
    return {
      message: 'All tokens revoked successfully',
      count: result.modifiedCount,
    };
    
  } catch (error) {
    logger.error(`Revoke all tokens error: ${error.message}`);
    throw error;
  }
};

/**
 * Get User Active Tokens
 * 
 * Retrieves all active tokens for a user.
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of active tokens
 */
const getUserActiveTokens = async (userId) => {
  try {
    const tokens = await Token.findUserTokens(userId, true);
    
    return tokens.map(token => ({
      id: token._id,
      tokenType: token.tokenType,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt,
      expiresAt: token.expiresAt,
      ipAddress: token.ipAddress,
      userAgent: token.userAgent,
      deviceInfo: token.deviceInfo,
    }));
    
  } catch (error) {
    logger.error(`Get user tokens error: ${error.message}`);
    throw error;
  }
};

/**
 * Clean Expired Tokens
 * 
 * Removes all expired tokens from the database.
 * Should be run periodically as a cleanup job.
 * 
 * @returns {Promise<Object>} Cleanup results
 */
const cleanExpiredTokens = async () => {
  try {
    const result = await Token.cleanExpiredTokens();
    
    logger.info(`Expired tokens cleaned: ${result.deletedCount} tokens removed`);
    
    return {
      message: 'Expired tokens cleaned successfully',
      count: result.deletedCount,
    };
    
  } catch (error) {
    logger.error(`Clean expired tokens error: ${error.message}`);
    throw error;
  }
};

/**
 * Clean Revoked Tokens
 * 
 * Removes old revoked tokens from the database.
 * 
 * @returns {Promise<Object>} Cleanup results
 */
const cleanRevokedTokens = async () => {
  try {
    const result = await Token.cleanRevokedTokens();
    
    logger.info(`Revoked tokens cleaned: ${result.deletedCount} tokens removed`);
    
    return {
      message: 'Revoked tokens cleaned successfully',
      count: result.deletedCount,
    };
    
  } catch (error) {
    logger.error(`Clean revoked tokens error: ${error.message}`);
    throw error;
  }
};

/**
 * Get Token Statistics
 * 
 * Retrieves statistics about tokens in the system.
 * 
 * @returns {Promise<Object>} Token statistics
 */
const getTokenStatistics = async () => {
  try {
    const stats = await Token.getTokenStatistics();
    
    return {
      total: stats.total,
      active: stats.active,
      expired: stats.expired,
      revoked: stats.revoked,
    };
    
  } catch (error) {
    logger.error(`Get token statistics error: ${error.message}`);
    throw error;
  }
};

/**
 * Update Token Last Used
 * 
 * Updates the last used timestamp for a token.
 * 
 * @param {string} tokenId - Token ID
 * @returns {Promise<void>}
 */
const updateTokenLastUsed = async (tokenId) => {
  try {
    const token = await Token.findById(tokenId);
    
    if (token) {
      await token.updateLastUsed();
    }
    
  } catch (error) {
    logger.error(`Update token last used error: ${error.message}`);
    // Don't throw error for this non-critical operation
  }
};

module.exports = {
  generateTokenPair,
  validateRefreshToken,
  revokeToken,
  revokeAllUserTokens,
  getUserActiveTokens,
  cleanExpiredTokens,
  cleanRevokedTokens,
  getTokenStatistics,
  updateTokenLastUsed,
};
