const { validationResult } = require("express-validator");
const { AppError } = require("../utils/errors");
const { logger } = require("../services/loggerService");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    if (process.env.NODE_ENV === "development") {
      logger.debug("Validation errors:", formattedErrors);
    }

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
  }

  next();
};

const sanitizeInput = (req, res, next) => {
  try {
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);
    next();
  } catch (error) {
    logger.error(`Sanitize error: ${error.message}`);
    next(new AppError("Input sanitization failed", 500));
  }
};

const sanitizeObject = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item));

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = value.trim().replace(/\0/g, "");
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const validatePagination = (options = {}) => {
  const { defaultPage = 1, defaultLimit = 10, maxLimit = 100 } = options;

  return (req, res, next) => {
    let page = parseInt(req.query.page) || defaultPage;
    if (page < 1) page = defaultPage;

    let limit = parseInt(req.query.limit) || defaultLimit;
    if (limit < 1) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;

    const skip = (page - 1) * limit;

    req.pagination = { page, limit, skip };
    next();
  };
};

const validateSort = (
  allowedFields = [],
  defaultField = "createdAt",
  defaultOrder = "desc",
) => {
  return (req, res, next) => {
    let sortField = req.query.sortBy || defaultField;
    let sortOrder = req.query.order || defaultOrder;

    if (allowedFields.length > 0 && !allowedFields.includes(sortField)) {
      sortField = defaultField;
    }

    if (!["asc", "desc", "1", "-1"].includes(sortOrder.toLowerCase())) {
      sortOrder = defaultOrder;
    }

    if (sortOrder === "1") sortOrder = "asc";
    if (sortOrder === "-1") sortOrder = "desc";

    const sort = {};
    sort[sortField] = sortOrder === "asc" ? 1 : -1;

    req.sort = sort;
    req.sortField = sortField;
    req.sortOrder = sortOrder;
    next();
  };
};

const validateObjectId = (...paramNames) => {
  return (req, res, next) => {
    const mongoose = require("mongoose");
    const invalid = [];

    for (const paramName of paramNames) {
      const id =
        req.params[paramName] || req.body[paramName] || req.query[paramName];
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        invalid.push(paramName);
      }
    }

    if (invalid.length > 0) {
      return next(new AppError(`Invalid ID: ${invalid.join(", ")}`, 400));
    }

    next();
  };
};

const validateFileUpload = (options = {}) => {
  const {
    allowedTypes = [],
    maxSize = 5 * 1024 * 1024,
    maxFiles = 1,
  } = options;

  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) return next();

    const files = Array.isArray(req.files) ? req.files : [req.files];

    if (files.length > maxFiles) {
      return next(new AppError(`Max ${maxFiles} file(s) allowed`, 400));
    }

    for (const file of files) {
      if (file.size > maxSize) {
        return next(
          new AppError(`File exceeds ${maxSize / (1024 * 1024)}MB`, 400),
        );
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return next(new AppError(`Type ${file.mimetype} not allowed`, 400));
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
