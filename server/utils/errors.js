class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed", errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = "Too many requests", retryAfter = null) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, 500, false);
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = "External service error") {
    super(`${service}: ${message}`, 503, false);
    this.service = service;
  }
}

class TokenError extends AppError {
  constructor(message = "Invalid or expired token") {
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
