/**
 * Helper Utilities
 * 
 * This module provides common helper functions used throughout the application.
 * Includes string manipulation, data formatting, and validation helpers.
 * 
 * @module utils/helpers
 */

const crypto = require('crypto');

/**
 * Generate Random String
 * 
 * Generates a cryptographically secure random string.
 * 
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash String
 * 
 * Creates a SHA256 hash of a string.
 * 
 * @param {string} str - String to hash
 * @returns {string} Hashed string
 */
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

/**
 * Slugify
 * 
 * Converts a string to URL-friendly slug format.
 * 
 * @param {string} str - String to slugify
 * @returns {string} Slugified string
 */
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Capitalize First Letter
 * 
 * Capitalizes the first letter of a string.
 * 
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format Full Name
 * 
 * Formats first and last name into full name.
 * 
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Full name
 */
const formatFullName = (firstName, lastName) => {
  return `${firstName} ${lastName}`.trim();
};

/**
 * Truncate String
 * 
 * Truncates a string to specified length with ellipsis.
 * 
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
const truncateString = (str, maxLength = 100) => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

/**
 * Parse User Agent
 * 
 * Extracts device information from user agent string.
 * 
 * @param {string} userAgent - User agent string
 * @returns {Object} Device information
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown',
    };
  }
  
  // Simple user agent parsing (can be enhanced with a library)
  const result = {
    browser: 'Unknown',
    os: 'Unknown',
    device: 'Desktop',
  };
  
  // Detect browser
  if (userAgent.includes('Chrome')) result.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
  else if (userAgent.includes('Safari')) result.browser = 'Safari';
  else if (userAgent.includes('Edge')) result.browser = 'Edge';
  
  // Detect OS
  if (userAgent.includes('Windows')) result.os = 'Windows';
  else if (userAgent.includes('Mac')) result.os = 'macOS';
  else if (userAgent.includes('Linux')) result.os = 'Linux';
  else if (userAgent.includes('Android')) result.os = 'Android';
  else if (userAgent.includes('iOS')) result.os = 'iOS';
  
  // Detect device type
  if (userAgent.includes('Mobile')) result.device = 'Mobile';
  else if (userAgent.includes('Tablet')) result.device = 'Tablet';
  
  return result;
};

/**
 * Get IP Address
 * 
 * Extracts IP address from request object.
 * 
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
const getIpAddress = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'Unknown'
  );
};

/**
 * Format Date
 * 
 * Formats a date object to readable string.
 * 
 * @param {Date} date - Date object
 * @param {string} format - Format type ('short', 'long', 'iso')
 * @returns {string} Formatted date string
 */
const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'iso':
      return d.toISOString();
    default:
      return d.toLocaleDateString();
  }
};

/**
 * Calculate Time Difference
 * 
 * Calculates human-readable time difference.
 * 
 * @param {Date} date - Date to compare
 * @returns {string} Time difference string
 */
const getTimeDifference = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

/**
 * Mask Email
 * 
 * Masks part of an email address for privacy.
 * 
 * @param {string} email - Email address
 * @returns {string} Masked email
 */
const maskEmail = (email) => {
  if (!email) return '';
  
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

/**
 * Mask Phone Number
 * 
 * Masks part of a phone number for privacy.
 * 
 * @param {string} phone - Phone number
 * @returns {string} Masked phone number
 */
const maskPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const visible = 4;
  const masked = phone.slice(0, -visible).replace(/\d/g, '*') + phone.slice(-visible);
  return masked;
};

/**
 * Validate Email Format
 * 
 * Validates email address format.
 * 
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate Password Strength
 * 
 * Checks password strength and returns feedback.
 * 
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with strength score
 */
const validatePasswordStrength = (password) => {
  const result = {
    isValid: true,
    strength: 0,
    feedback: [],
  };
  
  // Check length
  if (password.length < 8) {
    result.isValid = false;
    result.feedback.push('Password must be at least 8 characters long');
  } else {
    result.strength += 1;
  }
  
  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    result.feedback.push('Add uppercase letters for stronger password');
  } else {
    result.strength += 1;
  }
  
  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    result.feedback.push('Add lowercase letters for stronger password');
  } else {
    result.strength += 1;
  }
  
  // Check for numbers
  if (!/[0-9]/.test(password)) {
    result.feedback.push('Add numbers for stronger password');
  } else {
    result.strength += 1;
  }
  
  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.feedback.push('Add special characters for stronger password');
  } else {
    result.strength += 1;
  }
  
  return result;
};

/**
 * Generate Pagination Info
 * 
 * Creates pagination metadata for API responses.
 * 
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
const generatePaginationInfo = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
  };
};

/**
 * Deep Clone Object
 * 
 * Creates a deep copy of an object.
 * 
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Remove Undefined Properties
 * 
 * Removes undefined properties from an object.
 * 
 * @param {Object} obj - Input object
 * @returns {Object} Cleaned object
 */
const removeUndefined = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
};

/**
 * Sleep
 * 
 * Delays execution for specified milliseconds.
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
  generateRandomString,
  hashString,
  slugify,
  capitalizeFirst,
  formatFullName,
  truncateString,
  parseUserAgent,
  getIpAddress,
  formatDate,
  getTimeDifference,
  maskEmail,
  maskPhoneNumber,
  isValidEmail,
  validatePasswordStrength,
  generatePaginationInfo,
  deepClone,
  removeUndefined,
  sleep,
};
