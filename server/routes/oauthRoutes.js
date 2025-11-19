/**
 * OAuth Routes
 * 
 * This module defines routes for OAuth authentication endpoints.
 * Handles OAuth provider login and management.
 * 
 * @module routes/oauthRoutes
 */

const express = require('express');
const router = express.Router();

// Controllers
const oauthController = require('../controllers/oauthController');

// Middleware
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

// Validators
const {
  oauthProviderValidation,
  unlinkOAuthValidation,
} = require('../validators/oauthValidator');

/**
 * @route   GET /api/v1/oauth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get('/google', oauthController.googleAuth);

/**
 * @route   GET /api/v1/oauth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', ...oauthController.googleCallback);

/**
 * @route   GET /api/v1/oauth/facebook
 * @desc    Initiate Facebook OAuth
 * @access  Public
 */
router.get('/facebook', oauthController.facebookAuth);

/**
 * @route   GET /api/v1/oauth/facebook/callback
 * @desc    Facebook OAuth callback
 * @access  Public
 */
router.get('/facebook/callback', ...oauthController.facebookCallback);

/**
 * @route   GET /api/v1/oauth/github
 * @desc    Initiate GitHub OAuth
 * @access  Public
 */
router.get('/github', oauthController.githubAuth);

/**
 * @route   GET /api/v1/oauth/github/callback
 * @desc    GitHub OAuth callback
 * @access  Public
 */
router.get('/github/callback', ...oauthController.githubCallback);

/**
 * @route   GET /api/v1/oauth/providers
 * @desc    Get user's linked OAuth providers
 * @access  Private
 */
router.get('/providers', authenticate, oauthController.getUserProviders);

/**
 * @route   DELETE /api/v1/oauth/:provider
 * @desc    Unlink OAuth provider
 * @access  Private
 */
router.delete(
  '/:provider',
  authenticate,
  unlinkOAuthValidation,
  validate,
  oauthController.unlinkProvider
);

module.exports = router;
