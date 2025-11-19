/**
 * OAuth Controller
 * 
 * This module handles HTTP requests for OAuth authentication endpoints.
 * Processes OAuth login callbacks and provider management.
 * 
 * @module controllers/oauthController
 */

const passport = require('passport');
const oauthService = require('../services/oauthService');
const { getCookieOptions } = require('../config/jwt');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Google OAuth Login
 * 
 * @route   GET /api/v1/oauth/google
 * @access  Public
 */
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

/**
 * Google OAuth Callback
 * 
 * @route   GET /api/v1/oauth/google/callback
 * @access  Public
 */
const googleCallback = [
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  asyncHandler(async (req, res) => {
    const result = await oauthService.handleOAuthCallback(
      req.user._json,
      'google',
      {
        accessToken: req.user.accessToken,
        refreshToken: req.user.refreshToken,
      }
    );
    
    // Set refresh token in cookie
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());
    
    // Redirect to frontend with token
    const redirectUrl = `${process.env.CLIENT_URL}${process.env.CLIENT_SUCCESS_REDIRECT}?token=${result.accessToken}`;
    res.redirect(redirectUrl);
  }),
];

/**
 * Facebook OAuth Login
 * 
 * @route   GET /api/v1/oauth/facebook
 * @access  Public
 */
const facebookAuth = passport.authenticate('facebook', {
  scope: ['email'],
  session: false,
});

/**
 * Facebook OAuth Callback
 * 
 * @route   GET /api/v1/oauth/facebook/callback
 * @access  Public
 */
const facebookCallback = [
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  asyncHandler(async (req, res) => {
    const result = await oauthService.handleOAuthCallback(
      req.user._json,
      'facebook',
      {
        accessToken: req.user.accessToken,
        refreshToken: req.user.refreshToken,
      }
    );
    
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());
    
    const redirectUrl = `${process.env.CLIENT_URL}${process.env.CLIENT_SUCCESS_REDIRECT}?token=${result.accessToken}`;
    res.redirect(redirectUrl);
  }),
];

/**
 * GitHub OAuth Login
 * 
 * @route   GET /api/v1/oauth/github
 * @access  Public
 */
const githubAuth = passport.authenticate('github', {
  scope: ['user:email'],
  session: false,
});

/**
 * GitHub OAuth Callback
 * 
 * @route   GET /api/v1/oauth/github/callback
 * @access  Public
 */
const githubCallback = [
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  asyncHandler(async (req, res) => {
    const result = await oauthService.handleOAuthCallback(
      req.user._json,
      'github',
      {
        accessToken: req.user.accessToken,
        refreshToken: req.user.refreshToken,
      }
    );
    
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());
    
    const redirectUrl = `${process.env.CLIENT_URL}${process.env.CLIENT_SUCCESS_REDIRECT}?token=${result.accessToken}`;
    res.redirect(redirectUrl);
  }),
];

/**
 * Get User OAuth Providers
 * 
 * @route   GET /api/v1/oauth/providers
 * @access  Private
 */
const getUserProviders = asyncHandler(async (req, res) => {
  const providers = await oauthService.getUserOAuthProviders(req.userId);
  
  res.status(200).json({
    success: true,
    data: { providers },
  });
});

/**
 * Unlink OAuth Provider
 * 
 * @route   DELETE /api/v1/oauth/:provider
 * @access  Private
 */
const unlinkProvider = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  
  await oauthService.unlinkOAuthProvider(req.userId, provider);
  
  res.status(200).json({
    success: true,
    message: `${provider} provider unlinked successfully`,
  });
});

module.exports = {
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
  githubAuth,
  githubCallback,
  getUserProviders,
  unlinkProvider,
};
