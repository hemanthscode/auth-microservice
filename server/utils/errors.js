/**
 * Custom Error Classes
 * 
 * This module defines custom error classes for the application.
 * Provides structured error handling with consistent error responses.
 * 
 * @module utils/errors
 */

/**
 * Application Error
 * 
 * Base error class for all application errors.
 * Extends the native Error class with additional properties.
 */
class AppError extends Error {
  /**
   * Creates an AppError instance
   * 
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether error is operational (expected)
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error
 * 
 * Error for validation failures.
 */
class ValidationError extends AppError {
  /**
   * Creates a ValidationError instance
   * 
   * @param {string} message - Error message
   * @param {Array} errors - Array of validation error details
   */
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Authentication Error
 * 
 * Error for authentication failures.
 */
class AuthenticationError extends AppError {
  /**
   * Creates an AuthenticationError instance
   * 
   * @param {string} message - Error message
   */
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Authorization Error
 * 
 * Error for authorization/permission failures.
 */
class AuthorizationError extends AppError {
  /**
   * Creates an AuthorizationError instance
   * 
   * @param {string} message - Error message
   */
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Not Found Error
 * 
 * Error for resources not found.
 */
class NotFoundError extends AppError {
  /**
   * Creates a NotFoundError instance
   * 
   * @param {string} message - Error message
   */
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Conflict Error
 * 
 * Error for resource conflicts (e.g., duplicate entries).
 */
class ConflictError extends AppError {
  /**
   * Creates a ConflictError instance
   * 
   * @param {string} message - Error message
   */
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * Rate Limit Error
 * 
 * Error for rate limit exceeded.
 */
class RateLimitError extends AppError {
  /**
   * Creates a RateLimitError instance
   * 
   * @param {string} message - Error message
   * @param {number} retryAfter - Seconds until retry is allowed
   */
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

/**
 * Database Error
 * 
 * Error for database operations.
 */
class DatabaseError extends AppError {
  /**
   * Creates a DatabaseError instance
   * 
   * @param {string} message - Error message
   */
  constructor(message = 'Database operation failed') {
    super(message, 500, false);
  }
}

/**
 * External Service Error
 * 
 * Error for external service failures (e.g., email, OAuth).
 */
class ExternalServiceError extends AppError {
  /**
   * Creates an ExternalServiceError instance
   * 
   * @param {string} service - Name of the external service
   * @param {string} message - Error message
   */
  constructor(service, message = 'External service error') {
    super(`${service}: ${message}`, 503, false);
    this.service = service;
  }
}

/**
 * Token Error
 * 
 * Error for token-related failures.
 */
class TokenError extends AppError {
  /**
   * Creates a TokenError instance
   * 
   * @param {string} message - Error message
   */
  constructor(message = 'Invalid or expired token') {
    super(message, 401);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  TokenError,
};
