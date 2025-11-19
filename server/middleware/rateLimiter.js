/**
 * Rate Limiter Middleware
 * 
 * This module provides rate limiting middleware to prevent abuse.
 * Implements different rate limits for various endpoints and user types.
 * 
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');
const { AppError } = require('../utils/errors');
const { logger } = require('../services/loggerService');

/**
 * Default Rate Limiter
 * 
 * General rate limiter for all API routes.
 * Limits based on IP address.
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
    });
  },
  skip: (req) => {
    // Skip rate limiting for superadmin
    return req.user && req.user.role && req.user.role.name === 'superadmin';
  },
});

/**
 * Authentication Rate Limiter
 * 
 * Stricter rate limiter for authentication endpoints.
 * Prevents brute force attacks on login/register.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again later.',
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again in 15 minutes.',
    });
  },
});

/**
 * Password Reset Rate Limiter
 * 
 * Rate limiter for password reset requests.
 * Prevents abuse of password reset functionality.
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset requests, please try again later.',
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many password reset requests. Please try again in 1 hour.',
    });
  },
});

/**
 * Email Verification Rate Limiter
 * 
 * Rate limiter for email verification resend requests.
 * Prevents spam and abuse.
 */
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many verification email requests, please try again later.',
  handler: (req, res) => {
    logger.warn(`Email verification rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many verification requests. Please try again in 1 hour.',
    });
  },
});

/**
 * Create Account Rate Limiter
 * 
 * Rate limiter for account creation.
 * Prevents automated account creation abuse.
 */
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 accounts per hour per IP
  message: 'Too many accounts created from this IP, please try again later.',
  handler: (req, res) => {
    logger.warn(`Account creation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many account creation attempts. Please try again in 1 hour.',
    });
  },
});

/**
 * Flexible Rate Limiter
 * 
 * Creates a customizable rate limiter with specified options.
 * 
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Error message
 * @returns {Function} Rate limiter middleware
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.',
  } = options;
  
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Route: ${req.originalUrl}`);
      res.status(429).json({
        success: false,
        error: message,
      });
    },
  });
};

/**
 * Dynamic Rate Limiter by Role
 * 
 * Applies different rate limits based on user role.
 * Higher role levels get more generous limits.
 * 
 * @param {Object} limits - Role-based limits
 * @returns {Function} Express middleware function
 */
const dynamicRateLimiterByRole = (limits = {}) => {
  const defaultLimits = {
    superadmin: Infinity,
    admin: 1000,
    moderator: 500,
    user: 100,
    guest: 50,
    ...limits,
  };
  
  const requestCounts = new Map();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  return (req, res, next) => {
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const roleName = req.user?.role?.name || 'guest';
    const maxRequests = defaultLimits[roleName] || defaultLimits.guest;
    
    if (maxRequests === Infinity) {
      return next();
    }
    
    const now = Date.now();
    
    if (!requestCounts.has(identifier)) {
      requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userLimit = requestCounts.get(identifier);
    
    if (now > userLimit.resetTime) {
      requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      logger.warn(`Rate limit exceeded for ${roleName}: ${identifier}`);
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
    }
    
    userLimit.count++;
    next();
  };
};

module.exports = apiLimiter;
module.exports.authLimiter = authLimiter;
module.exports.passwordResetLimiter = passwordResetLimiter;
module.exports.emailVerificationLimiter = emailVerificationLimiter;
module.exports.createAccountLimiter = createAccountLimiter;
module.exports.createRateLimiter = createRateLimiter;
module.exports.dynamicRateLimiterByRole = dynamicRateLimiterByRole;
