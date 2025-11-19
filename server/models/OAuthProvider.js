/**
 * OAuth Provider Model
 * 
 * This module defines the OAuthProvider schema for MongoDB with Mongoose.
 * Stores OAuth provider tokens and user linkage for external authentication.
 * 
 * @module models/OAuthProvider
 */


const mongoose = require('mongoose');


/**
 * OAuth Provider Schema Definition
 * 
 * Links users with external OAuth providers and stores provider-specific data.
 * Supports multiple providers per user (Google, Facebook, GitHub, etc.).
 */
const oauthProviderSchema = new mongoose.Schema(
  {
    // Associated User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    
    // Provider Information
    provider: {
      type: String,
      required: [true, 'Provider name is required'],
      enum: ['google', 'facebook', 'github', 'linkedin', 'twitter'],
      lowercase: true,
    },
    
    providerId: {
      type: String,
      required: [true, 'Provider ID is required'],
    },
    
    // OAuth Tokens
    accessToken: {
      type: String,
      required: true,
      select: false, // Don't return by default
    },
    
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    
    tokenExpiry: {
      type: Date,
      default: null,
    },
    
    // Provider Profile Data
    profile: {
      email: String,
      displayName: String,
      firstName: String,
      lastName: String,
      avatar: String,
      profileUrl: String,
    },
    
    // Metadata
    scope: [{
      type: String,
    }],
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    lastSync: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);


// ============================================
// INDEXES
// ============================================


// Index on user for faster lookups
oauthProviderSchema.index({ user: 1 });


// Compound unique index to prevent duplicate provider linkage
oauthProviderSchema.index({ user: 1, provider: 1 }, { unique: true });


// Index on provider and providerId for OAuth lookups
oauthProviderSchema.index({ provider: 1, providerId: 1 });


// ============================================
// INSTANCE METHODS
// ============================================


/**
 * Is Token Expired
 * 
 * Checks if OAuth access token has expired.
 * 
 * @returns {boolean} True if expired, false otherwise
 */
oauthProviderSchema.methods.isTokenExpired = function() {
  if (!this.tokenExpiry) {
    return false;
  }
  
  return this.tokenExpiry < Date.now();
};


/**
 * Update Tokens
 * 
 * Updates OAuth tokens and expiry.
 * 
 * @param {string} accessToken - New access token
 * @param {string} refreshToken - New refresh token (optional)
 * @param {number} expiresIn - Expiry time in seconds (optional)
 * @returns {Promise<void>}
 */
oauthProviderSchema.methods.updateTokens = async function(accessToken, refreshToken = null, expiresIn = null) {
  this.accessToken = accessToken;
  
  if (refreshToken) {
    this.refreshToken = refreshToken;
  }
  
  if (expiresIn) {
    this.tokenExpiry = Date.now() + (expiresIn * 1000);
  }
  
  this.lastSync = Date.now();
  
  return await this.save();
};


/**
 * Update Profile
 * 
 * Updates provider profile information.
 * 
 * @param {Object} profileData - Profile data from provider
 * @returns {Promise<void>}
 */
oauthProviderSchema.methods.updateProfile = async function(profileData) {
  this.profile = {
    ...this.profile,
    ...profileData,
  };
  
  this.lastSync = Date.now();
  
  return await this.save();
};


/**
 * Deactivate Provider
 * 
 * Deactivates the OAuth provider linkage.
 * 
 * @returns {Promise<void>}
 */
oauthProviderSchema.methods.deactivate = async function() {
  this.isActive = false;
  return await this.save();
};


// ============================================
// STATIC METHODS
// ============================================


/**
 * Find By Provider
 * 
 * Finds OAuth provider linkage by provider and provider ID.
 * 
 * @param {string} provider - Provider name
 * @param {string} providerId - Provider user ID
 * @returns {Promise<Object|null>} OAuth provider object or null
 */
oauthProviderSchema.statics.findByProvider = async function(provider, providerId) {
  return await this.findOne({
    provider: provider.toLowerCase(),
    providerId,
    isActive: true,
  }).populate('user');
};


/**
 * Find User Providers
 * 
 * Finds all OAuth providers linked to a user.
 * 
 * @param {string} userId - User ID
 * @param {boolean} activeOnly - Return only active providers
 * @returns {Promise<Array>} Array of OAuth provider objects
 */
oauthProviderSchema.statics.findUserProviders = async function(userId, activeOnly = true) {
  const query = { user: userId };
  
  if (activeOnly) {
    query.isActive = true;
  }
  
  return await this.find(query).sort({ createdAt: -1 });
};


/**
 * Link Provider
 * 
 * Links an OAuth provider to a user.
 * 
 * @param {string} userId - User ID
 * @param {Object} providerData - Provider data
 * @returns {Promise<Object>} OAuth provider object
 */
oauthProviderSchema.statics.linkProvider = async function(userId, providerData) {
  const { provider, providerId, accessToken, refreshToken, expiresIn, profile, scope } = providerData;
  
  // Check if linkage already exists
  let oauthProvider = await this.findOne({ user: userId, provider });
  
  if (oauthProvider) {
    // Update existing linkage
    oauthProvider.providerId = providerId;
    oauthProvider.accessToken = accessToken;
    oauthProvider.refreshToken = refreshToken || oauthProvider.refreshToken;
    oauthProvider.tokenExpiry = expiresIn ? Date.now() + (expiresIn * 1000) : null;
    oauthProvider.profile = profile;
    oauthProvider.scope = scope || oauthProvider.scope;
    oauthProvider.isActive = true;
    oauthProvider.lastSync = Date.now();
    
    return await oauthProvider.save();
  }
  
  // Create new linkage
  oauthProvider = await this.create({
    user: userId,
    provider,
    providerId,
    accessToken,
    refreshToken,
    tokenExpiry: expiresIn ? Date.now() + (expiresIn * 1000) : null,
    profile,
    scope,
  });
  
  return oauthProvider;
};


/**
 * Unlink Provider
 * 
 * Removes OAuth provider linkage from a user.
 * 
 * @param {string} userId - User ID
 * @param {string} provider - Provider name
 * @returns {Promise<Object>} Delete result
 */
oauthProviderSchema.statics.unlinkProvider = async function(userId, provider) {
  return await this.deleteOne({
    user: userId,
    provider: provider.toLowerCase(),
  });
};


// ============================================
// MODEL EXPORT
// ============================================


const OAuthProvider = mongoose.model('OAuthProvider', oauthProviderSchema);


module.exports = OAuthProvider;