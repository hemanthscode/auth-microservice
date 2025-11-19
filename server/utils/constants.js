/**
 * Application Constants
 * 
 * This module defines constant values used throughout the application.
 * Centralizes configuration values and enums.
 * 
 * @module utils/constants
 */

/**
 * HTTP Status Codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * User Roles
 */
const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest',
};

/**
 * OAuth Providers
 */
const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  GITHUB: 'github',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
};

/**
 * Token Types
 */
const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
};

/**
 * Permission Resources
 */
const RESOURCES = {
  USERS: 'users',
  ROLES: 'roles',
  POSTS: 'posts',
  COMMENTS: 'comments',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  FILES: 'files',
  NOTIFICATIONS: 'notifications',
  LOGS: 'logs',
};

/**
 * Permission Actions
 */
const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
};

/**
 * Account Status
 */
const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  LOCKED: 'locked',
  PENDING: 'pending',
};

/**
 * Email Templates
 */
const EMAIL_TEMPLATES = {
  VERIFICATION: 'verification',
  PASSWORD_RESET: 'password_reset',
  WELCOME: 'welcome',
  PASSWORD_CHANGED: 'password_changed',
  ACCOUNT_LOCKED: 'account_locked',
};

/**
 * Time Constants (in milliseconds)
 */
const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
};

/**
 * Pagination Defaults
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

/**
 * Password Requirements
 */
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
};

/**
 * File Upload Limits
 */
const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
};

/**
 * Rate Limit Settings
 */
const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  PASSWORD_RESET: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 3,
  },
  EMAIL_VERIFICATION: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 3,
  },
};

/**
 * Login Attempt Settings
 */
const LOGIN_ATTEMPTS = {
  MAX_ATTEMPTS: 5,
  LOCK_TIME: 2 * 60 * 60 * 1000, // 2 hours
};

/**
 * Session Settings
 */
const SESSION = {
  ACCESS_TOKEN_EXPIRE: '15m',
  REFRESH_TOKEN_EXPIRE: '7d',
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Validation Regex Patterns
 */
const REGEX_PATTERNS = {
  EMAIL: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  PHONE: /^[0-9]{10,15}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  URL: /^https?:\/\/.+/,
};

/**
 * Error Messages
 */
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account is temporarily locked',
  ACCOUNT_INACTIVE: 'Account is not active',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
};

/**
 * Success Messages
 */
const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Registration successful',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_RESET: 'Password reset successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
};

/**
 * Log Levels
 */
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly',
};

/**
 * Database Collections
 */
const COLLECTIONS = {
  USERS: 'users',
  ROLES: 'roles',
  TOKENS: 'tokens',
  OAUTH_PROVIDERS: 'oauthproviders',
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  OAUTH_PROVIDERS,
  TOKEN_TYPES,
  RESOURCES,
  ACTIONS,
  ACCOUNT_STATUS,
  EMAIL_TEMPLATES,
  TIME,
  PAGINATION,
  PASSWORD_REQUIREMENTS,
  FILE_UPLOAD,
  RATE_LIMITS,
  LOGIN_ATTEMPTS,
  SESSION,
  REGEX_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOG_LEVELS,
  COLLECTIONS,
};
