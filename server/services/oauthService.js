/**
 * OAuth Service
 * 
 * This module provides business logic for OAuth authentication operations.
 * Handles OAuth provider integration and user account linking.
 * 
 * @module services/oauthService
 */

const User = require('../models/User');
const OAuthProvider = require('../models/OAuthProvider');
const Token = require('../models/Token');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { AppError } = require('../utils/errors');
const { logger } = require('./loggerService');

/**
 * Handle OAuth Callback
 * 
 * Processes OAuth provider callback and creates/links user account.
 * 
 * @param {Object} profile - OAuth profile data
 * @param {string} provider - Provider name (google, facebook, github)
 * @param {Object} tokens - OAuth tokens
 * @returns {Promise<Object>} User data and JWT tokens
 */
const handleOAuthCallback = async (profile, provider, tokens) => {
  try {
    const { id: providerId, emails, name, photos } = profile;
    const email = emails && emails[0] ? emails[0].value : null;
    
    if (!email) {
      throw new AppError('Email not provided by OAuth provider', 400);
    }
    
    // Check if user exists with this email
    let user = await User.findOne({ email: email.toLowerCase() }).populate('role');
    
    if (user) {
      // User exists - link OAuth provider if not already linked
      await OAuthProvider.linkProvider(user._id, {
        provider,
        providerId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        profile: {
          email,
          displayName: name?.givenName + ' ' + name?.familyName,
          firstName: name?.givenName,
          lastName: name?.familyName,
          avatar: photos && photos[0] ? photos[0].value : null,
        },
      });
      
      // Update OAuth providers array in user model
      if (!user.oauthProviders.includes(provider)) {
        user.oauthProviders.push(provider);
        await user.save();
      }
      
      logger.info(`OAuth login successful for existing user: ${email} via ${provider}`);
    } else {
      // Create new user with OAuth data
      const Role = require('../models/Role');
      const defaultRole = await Role.findOne({ name: 'user' });
      
      user = await User.create({
        firstName: name?.givenName || 'User',
        lastName: name?.familyName || '',
        email: email.toLowerCase(),
        avatar: photos && photos[0] ? photos[0].value : null,
        isEmailVerified: true, // Email verified by OAuth provider
        provider,
        oauthProviders: [provider],
        role: defaultRole._id,
      });
      
      // Link OAuth provider
      await OAuthProvider.linkProvider(user._id, {
        provider,
        providerId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        profile: {
          email,
          displayName: name?.givenName + ' ' + name?.familyName,
          firstName: name?.givenName,
          lastName: name?.familyName,
          avatar: photos && photos[0] ? photos[0].value : null,
        },
      });
      
      // Populate role for new user
      await user.populate('role');
      
      logger.info(`New user created via OAuth: ${email} via ${provider}`);
    }
    
    // Generate JWT tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role.name,
    });
    
    const refreshToken = generateRefreshToken({ userId: user._id });
    
    // Save refresh token
    await Token.create({
      user: user._id,
      token: refreshToken,
      tokenType: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    
    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    };
    
  } catch (error) {
    logger.error(`OAuth callback error: ${error.message}`);
    throw error;
  }
};

/**
 * Link OAuth Provider
 * 
 * Links an OAuth provider to an existing user account.
 * 
 * @param {string} userId - User ID
 * @param {Object} providerData - OAuth provider data
 * @returns {Promise<Object>} Success message
 */
const linkOAuthProvider = async (userId, providerData) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Check if provider is already linked
    const existingProvider = await OAuthProvider.findOne({
      user: userId,
      provider: providerData.provider,
    });
    
    if (existingProvider) {
      throw new AppError('This OAuth provider is already linked', 400);
    }
    
    // Link provider
    await OAuthProvider.linkProvider(userId, providerData);
    
    // Update user's OAuth providers array
    if (!user.oauthProviders.includes(providerData.provider)) {
      user.oauthProviders.push(providerData.provider);
      await user.save();
    }
    
    logger.info(`OAuth provider linked: ${providerData.provider} for user ${user.email}`);
    
    return { message: 'OAuth provider linked successfully' };
    
  } catch (error) {
    logger.error(`Link OAuth provider error: ${error.message}`);
    throw error;
  }
};

/**
 * Unlink OAuth Provider
 * 
 * Removes an OAuth provider link from user account.
 * 
 * @param {string} userId - User ID
 * @param {string} provider - Provider name
 * @returns {Promise<Object>} Success message
 */
const unlinkOAuthProvider = async (userId, provider) => {
  try {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Check if user has password set (prevent account lockout)
    if (!user.password && user.oauthProviders.length === 1) {
      throw new AppError(
        'Cannot unlink the only OAuth provider without setting a password first',
        400
      );
    }
    
    // Unlink provider
    await OAuthProvider.unlinkProvider(userId, provider);
    
    // Update user's OAuth providers array
    user.oauthProviders = user.oauthProviders.filter(p => p !== provider);
    await user.save();
    
    logger.info(`OAuth provider unlinked: ${provider} for user ${user.email}`);
    
    return { message: 'OAuth provider unlinked successfully' };
    
  } catch (error) {
    logger.error(`Unlink OAuth provider error: ${error.message}`);
    throw error;
  }
};

/**
 * Get User OAuth Providers
 * 
 * Retrieves all OAuth providers linked to a user.
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of linked OAuth providers
 */
const getUserOAuthProviders = async (userId) => {
  try {
    const providers = await OAuthProvider.findUserProviders(userId, true);
    
    return providers.map(provider => ({
      provider: provider.provider,
      linkedAt: provider.createdAt,
      lastSync: provider.lastSync,
      profile: {
        displayName: provider.profile.displayName,
        email: provider.profile.email,
        avatar: provider.profile.avatar,
      },
    }));
    
  } catch (error) {
    logger.error(`Get OAuth providers error: ${error.message}`);
    throw error;
  }
};

/**
 * Refresh OAuth Token
 * 
 * Refreshes OAuth provider access token using refresh token.
 * 
 * @param {string} userId - User ID
 * @param {string} provider - Provider name
 * @returns {Promise<Object>} Updated token information
 */
const refreshOAuthToken = async (userId, provider) => {
  try {
    const oauthProvider = await OAuthProvider.findOne({
      user: userId,
      provider,
      isActive: true,
    });
    
    if (!oauthProvider) {
      throw new AppError('OAuth provider not found or not linked', 404);
    }
    
    if (!oauthProvider.refreshToken) {
      throw new AppError('No refresh token available for this provider', 400);
    }
    
    // This would need provider-specific token refresh implementation
    // For now, return the existing token info
    logger.info(`OAuth token refresh requested for ${provider}`);
    
    return {
      message: 'Token refresh functionality varies by provider',
      provider,
      tokenExpiry: oauthProvider.tokenExpiry,
    };
    
  } catch (error) {
    logger.error(`Refresh OAuth token error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  handleOAuthCallback,
  linkOAuthProvider,
  unlinkOAuthProvider,
  getUserOAuthProviders,
  refreshOAuthToken,
};
