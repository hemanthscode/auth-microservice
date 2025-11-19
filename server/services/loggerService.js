/**
 * Logger Service
 * 
 * This module provides centralized logging functionality using Winston.
 * Handles application logging with different levels and transports.
 * 
 * @module services/loggerService
 */

const winston = require('winston');
const path = require('path');

/**
 * Custom Log Format
 * 
 * Defines the format for log messages.
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console Log Format
 * 
 * Custom format for console output with colors.
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    
    return msg;
  })
);

/**
 * Logger Transports
 * 
 * Defines where logs should be output.
 */
const transports = [];

// Console transport for all environments
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info',
  })
);

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  // Combined logs
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

/**
 * Winston Logger Instance
 * 
 * Creates the main logger instance with configured transports.
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false,
});

/**
 * Morgan Stream
 * 
 * Stream for Morgan HTTP request logger to use Winston.
 */
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

/**
 * Log Levels
 * 
 * Winston log levels (highest to lowest priority):
 * - error: 0
 * - warn: 1
 * - info: 2
 * - http: 3
 * - verbose: 4
 * - debug: 5
 * - silly: 6
 */

module.exports = {
  logger,
  morganStream,
};
