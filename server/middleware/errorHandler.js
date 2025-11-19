/**
 * Error Handler Middleware
 * 
 * This module provides centralized error handling for the application.
 * Catches and formats errors for consistent API responses.
 * 
 * @module middleware/errorHandler
 */

const { logger } = require('../services/loggerService');
const { AppError } = require('../utils/errors');

/**
 * Error Handler
 * 
 * Central error handling middleware that catches all errors
 * and sends appropriate responses to clients.
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  
  // Log error details
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?._id,
  });
  
  // Mongoose Bad ObjectId Error
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }
  
  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new AppError(message, 400);
  }
  
  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    const message = errors.join(', ');
    error = new AppError(message, 400);
  }
  
  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please authenticate again.';
    error = new AppError(message, 401);
  }
  
  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired. Please login again.';
    error = new AppError(message, 401);
  }
  
  // Multer File Upload Errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size is too large';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }
    
    error = new AppError(message, 400);
  }
  
  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error,
    }),
  });
};

/**
 * Not Found Handler
 * 
 * Middleware to handle 404 errors for undefined routes.
 * Should be placed before the error handler middleware.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Async Handler
 * 
 * Wrapper function to catch async errors in route handlers.
 * Eliminates the need for try-catch blocks in every async route.
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
