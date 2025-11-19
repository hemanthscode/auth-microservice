/**
 * Express Application Setup
 * 
 * This file configures the Express application with all necessary middleware,
 * security configurations, and route handlers.
 * 
 * @module app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const oauthRoutes = require('./routes/oauthRoutes');
const roleRoutes = require('./routes/roleRoutes');
const passwordRoutes = require('./routes/passwordRoutes');

// Import passport configuration
require('./config/oauth');

// Import logger
const { logger, morganStream } = require('./services/loggerService');

// Initialize Express app
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Set security HTTP headers
app.use(helmet());

// Enable CORS with credentials
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies
app.use(cookieParser());

// ============================================
// LOGGING MIDDLEWARE
// ============================================

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// ============================================
// PASSPORT MIDDLEWARE
// ============================================

// Initialize Passport
app.use(passport.initialize());

// ============================================
// RATE LIMITING
// ============================================

// Apply rate limiting to all routes
app.use('/api/', rateLimiter);

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';

// Mount routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/oauth`, oauthRoutes);
app.use(`/api/${API_VERSION}/roles`, roleRoutes);
app.use(`/api/${API_VERSION}/password`, passwordRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// EXPORT APP
// ============================================

module.exports = app;
