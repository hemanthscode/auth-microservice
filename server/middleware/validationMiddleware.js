/**
 * Validation Middleware
 * 
 * This module provides middleware for request validation using express-validator.
 * Validates and sanitizes incoming request data to ensure data integrity.
 * 
 * @module middleware/validationMiddleware
 */

const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');
const { logger } = require('../services/loggerService');

/**
 * Validate Request
 * 
 * Middleware to check validation results from express-validator.
 * Returns formatted validation errors if validation fails.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validate = (req, res, next) => {
  // Get validation results
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Extract and format errors
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));
    
    // Log validation errors in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Validation errors:', formattedErrors);
    }
    
    // Return validation error response
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  
  next();
};

/**
 * Sanitize Input
 * 
 * Middleware to sanitize request body, params, and query strings.
 * Removes potentially harmful characters and normalizes data.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    logger.error(`Input sanitization error: ${error.message}`);
    next(new AppError('Input sanitization failed', 500));
  }
};

/**
 * Sanitize Object
 * 
 * Recursively sanitizes an object by trimming strings and removing null bytes.
 * 
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Trim whitespace and remove null bytes
      sanitized[key] = value.trim().replace(/\0/g, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate Pagination
 * 
 * Middleware to validate and normalize pagination parameters.
 * Sets default values and ensures parameters are within acceptable ranges.
 * 
 * @param {Object} options - Pagination options
 * @param {number} options.defaultPage - Default page number (default: 1)
 * @param {number} options.defaultLimit - Default items per page (default: 10)
 * @param {number} options.maxLimit - Maximum items per page (default: 100)
 * @returns {Function} Express middleware function
 */
const validatePagination = (options = {}) => {
  const {
    defaultPage = 1,
    defaultLimit = 10,
    maxLimit = 100,
  } = options;
  
  return (req, res, next) => {
    // Parse page number
    let page = parseInt(req.query.page) || defaultPage;
    if (page < 1) page = defaultPage;
    
    // Parse limit
    let limit = parseInt(req.query.limit) || defaultLimit;
    if (limit < 1) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;
    
    // Calculate skip
    const skip = (page - 1) * limit;
    
    // Attach pagination to request
    req.pagination = {
      page,
      limit,
      skip,
    };
    
    next();
  };
};

/**
 * Validate Sort
 * 
 * Middleware to validate and normalize sorting parameters.
 * Ensures sort fields and directions are valid.
 * 
 * @param {Array<string>} allowedFields - Allowed fields for sorting
 * @param {string} defaultField - Default sort field
 * @param {string} defaultOrder - Default sort order ('asc' or 'desc')
 * @returns {Function} Express middleware function
 */
const validateSort = (allowedFields = [], defaultField = 'createdAt', defaultOrder = 'desc') => {
  return (req, res, next) => {
    let sortField = req.query.sortBy || defaultField;
    let sortOrder = req.query.order || defaultOrder;
    
    // Validate sort field
    if (allowedFields.length > 0 && !allowedFields.includes(sortField)) {
      sortField = defaultField;
    }
    
    // Validate sort order
    if (!['asc', 'desc', '1', '-1'].includes(sortOrder.toLowerCase())) {
      sortOrder = defaultOrder;
    }
    
    // Normalize sort order
    if (sortOrder === '1') sortOrder = 'asc';
    if (sortOrder === '-1') sortOrder = 'desc';
    
    // Create Mongoose sort object
    const sort = {};
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;
    
    // Attach sort to request
    req.sort = sort;
    req.sortField = sortField;
    req.sortOrder = sortOrder;
    
    next();
  };
};

/**
 * Validate ObjectId
 * 
 * Middleware to validate MongoDB ObjectId parameters.
 * Checks if provided IDs are valid ObjectId format.
 * 
 * @param {...string} paramNames - Parameter names to validate
 * @returns {Function} Express middleware function
 */
const validateObjectId = (...paramNames) => {
  return (req, res, next) => {
    const mongoose = require('mongoose');
    const invalidParams = [];
    
    for (const paramName of paramNames) {
      const id = req.params[paramName] || req.body[paramName] || req.query[paramName];
      
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        invalidParams.push(paramName);
      }
    }
    
    if (invalidParams.length > 0) {
      return next(
        new AppError(
          `Invalid ID format for: ${invalidParams.join(', ')}`,
          400
        )
      );
    }
    
    next();
  };
};

/**
 * Validate File Upload
 * 
 * Middleware to validate uploaded files.
 * Checks file size, type, and count.
 * 
 * @param {Object} options - Validation options
 * @param {Array<string>} options.allowedTypes - Allowed MIME types
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {number} options.maxFiles - Maximum number of files
 * @returns {Function} Express middleware function
 */
const validateFileUpload = (options = {}) => {
  const {
    allowedTypes = [],
    maxSize = 5 * 1024 * 1024, // 5MB default
    maxFiles = 1,
  } = options;
  
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }
    
    const files = Array.isArray(req.files) ? req.files : [req.files];
    
    // Check file count
    if (files.length > maxFiles) {
      return next(new AppError(`Maximum ${maxFiles} file(s) allowed`, 400));
    }
    
    // Validate each file
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        return next(
          new AppError(
            `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
            400
          )
        );
      }
      
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return next(
          new AppError(
            `File type ${file.mimetype} is not allowed`,
            400
          )
        );
      }
    }
    
    next();
  };
};

module.exports = {
  validate,
  sanitizeInput,
  validatePagination,
  validateSort,
  validateObjectId,
  validateFileUpload,
};
