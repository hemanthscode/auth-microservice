/**
 * JWT Configuration
 * 
 * This module provides JWT token generation, verification, and configuration.
 * Handles both access tokens and refresh tokens with appropriate expiry times.
 * 
 * @module config/jwt
 */

const jwt = require('jsonwebtoken');
const { logger } = require('../services/loggerService');

/**
 * JWT Configuration Constants
 */
const JWT_CONFIG = {
  ACCESS_TOKEN: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '15m',
  },
  REFRESH_TOKEN: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  COOKIE: {
    maxAge: parseInt(process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000, // Convert days to milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
};

/**
 * Generate Access Token
 * 
 * Creates a short-lived JWT access token for API authentication.
 * 
 * @param {Object} payload - Token payload (user ID, email, role)
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (payload) => {
  try {
    const token = jwt.sign(
      payload,
      JWT_CONFIG.ACCESS_TOKEN.secret,
      { expiresIn: JWT_CONFIG.ACCESS_TOKEN.expiresIn }
    );
    
    return token;
  } catch (error) {
    logger.error(`Error generating access token: ${error.message}`);
    throw new Error('Failed to generate access token');
  }
};

/**
 * Generate Refresh Token
 * 
 * Creates a long-lived JWT refresh token for obtaining new access tokens.
 * 
 * @param {Object} payload - Token payload (user ID)
 * @returns {string} Signed JWT refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    const token = jwt.sign(
      payload,
      JWT_CONFIG.REFRESH_TOKEN.secret,
      { expiresIn: JWT_CONFIG.REFRESH_TOKEN.expiresIn }
    );
    
    return token;
  } catch (error) {
    logger.error(`Error generating refresh token: ${error.message}`);
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Verify Access Token
 * 
 * Validates and decodes a JWT access token.
 * 
 * @param {string} token - JWT access token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN.secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Verify Refresh Token
 * 
 * Validates and decodes a JWT refresh token.
 * 
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN.secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Decode Token Without Verification
 * 
 * Decodes a JWT token without verifying its signature.
 * Useful for extracting payload information when signature verification isn't needed.
 * 
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error(`Error decoding token: ${error.message}`);
    return null;
  }
};

/**
 * Get Cookie Options
 * 
 * Returns standardized cookie configuration for JWT tokens.
 * 
 * @returns {Object} Cookie options object
 */
const getCookieOptions = () => {
  return { ...JWT_CONFIG.COOKIE };
};

module.exports = {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getCookieOptions,
};
