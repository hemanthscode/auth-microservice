/**
 * Authentication Middleware
 * 
 * This module provides middleware for JWT token authentication.
 * Protects routes by verifying access tokens and attaching user data to requests.
 * 
 * @module middleware/authMiddleware
 */

const { verifyAccessToken } = require('../config/jwt');
const User = require('../models/User');
const { AppError } = require('../utils/errors');
const { logger } = require('../services/loggerService');

/**
 * Authenticate User
 * 
 * Middleware to verify JWT access token and attach user to request.
 * Checks for token in Authorization header or cookies.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header or cookies
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from Bearer header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      // Extract token from cookies
      token = req.cookies.accessToken;
    }
    
    // Check if token exists
    if (!token) {
      return next(new AppError('Authentication required. Please provide a valid token.', 401));
    }
    
    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error.message.includes('expired')) {
        return next(new AppError('Token has expired. Please refresh your token.', 401));
      }
      return next(new AppError('Invalid token. Please authenticate again.', 401));
    }
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId)
      .populate('role')
      .select('-password');
    
    if (!user) {
      return next(new AppError('User associated with this token no longer exists.', 401));
    }
    
    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }
    
    // Check if account is locked
    if (user.isAccountLocked) {
      return next(new AppError('Your account is temporarily locked due to multiple failed login attempts.', 403));
    }
    
    // Check if password was changed after token was issued
    const tokenIssuedAt = new Date(decoded.iat * 1000);
    if (user.lastPasswordChange && user.lastPasswordChange > tokenIssuedAt) {
      return next(new AppError('Password was recently changed. Please login again.', 401));
    }
    
    // Attach user to request object
    req.user = user;
    req.userId = user._id;
    
    // Log successful authentication in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`User authenticated: ${user.email} (${user._id})`);
    }
    
    next();
    
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    next(new AppError('Authentication failed. Please try again.', 500));
  }
};

/**
 * Optional Authentication
 * 
 * Middleware that attempts to authenticate but doesn't fail if no token is provided.
 * Useful for routes that work differently for authenticated vs unauthenticated users.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    // Extract token
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    // If no token, proceed without authentication
    if (!token) {
      return next();
    }
    
    // Try to verify and attach user
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId)
        .populate('role')
        .select('-password');
      
      if (user && user.isActive && !user.isAccountLocked) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (error) {
      // Silently fail and proceed without authentication
      logger.debug(`Optional authentication failed: ${error.message}`);
    }
    
    next();
    
  } catch (error) {
    // If anything goes wrong, just proceed without authentication
    next();
  }
};

/**
 * Verify Email Required
 * 
 * Middleware to check if user's email is verified.
 * Should be used after authenticate middleware.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  
  if (!req.user.isEmailVerified) {
    return next(new AppError('Please verify your email address to access this resource.', 403));
  }
  
  next();
};

/**
 * Check Account Status
 * 
 * Middleware to perform additional account status checks.
 * Verifies account is not suspended, banned, or requires action.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkAccountStatus = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  
  // Check if account is active
  if (!req.user.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }
  
  // Check if account is locked
  if (req.user.isAccountLocked) {
    const lockMessage = req.user.lockUntil 
      ? `Your account is locked until ${new Date(req.user.lockUntil).toLocaleString()}`
      : 'Your account is currently locked';
    
    return next(new AppError(lockMessage, 403));
  }
  
  next();
};

/**
 * Attach User To Request
 * 
 * Helper middleware to attach user data when user ID is available.
 * Less strict than authenticate - doesn't fail on missing token.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const attachUser = async (req, res, next) => {
  try {
    if (req.userId || req.user) {
      if (!req.user) {
        const user = await User.findById(req.userId)
          .populate('role')
          .select('-password');
        
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch (error) {
    logger.error(`Error attaching user: ${error.message}`);
    next();
  }
};

/**
 * Rate Limit by User
 * 
 * Tracks and enforces rate limits per authenticated user.
 * More generous limits for authenticated users vs anonymous.
 * 
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware function
 */
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user._id.toString();
    const now = Date.now();
    
    if (!userRequests.has(userId)) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userLimit = userRequests.get(userId);
    
    if (now > userLimit.resetTime) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      return next(new AppError('Too many requests. Please try again later.', 429));
    }
    
    userLimit.count++;
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireEmailVerification,
  checkAccountStatus,
  attachUser,
  rateLimitByUser,
};
