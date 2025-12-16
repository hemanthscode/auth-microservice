const { logger } = require("../services/loggerService");
const { AppError } = require("../utils/errors");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  logger.error("Error:", {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?._id,
  });

  if (err.name === "CastError") {
    error = new AppError("Resource not found", 404);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} already exists`, 400);
  }

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    error = new AppError(errors.join(", "), 400);
  }

  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Token expired", 401);
  }

  if (err.name === "MulterError") {
    let message = "File upload error";
    if (err.code === "LIMIT_FILE_SIZE") message = "File too large";
    else if (err.code === "LIMIT_FILE_COUNT") message = "Too many files";
    else if (err.code === "LIMIT_UNEXPECTED_FILE")
      message = "Unexpected file field";
    error = new AppError(message, 400);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
      details: error,
    }),
  });
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, notFoundHandler, asyncHandler };
