/**
 * Token Model
 * 
 * This module defines the Token schema for MongoDB with Mongoose.
 * Manages refresh tokens for JWT authentication with proper expiration.
 * 
 * @module models/Token
 */


const mongoose = require('mongoose');


/**
 * Token Schema Definition
 * 
 * Stores refresh tokens with user association and expiration tracking.
 * Supports token revocation and automatic cleanup of expired tokens.
 */
const tokenSchema = new mongoose.Schema(
  {
    // Associated User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    
    // Token Information
    token: {
      type: String,
      required: [true, 'Token is required'],
    },
    
    tokenType: {
      type: String,
      enum: ['refresh', 'access'],
      default: 'refresh',
      required: true,
    },
    
    // Expiration
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    
    // Token Status
    isRevoked: {
      type: Boolean,
      default: false,
    },
    
    revokedAt: {
      type: Date,
      default: null,
    },
    
    revokedReason: {
      type: String,
      default: null,
    },
    
    // Token Metadata
    ipAddress: {
      type: String,
      default: null,
    },
    
    userAgent: {
      type: String,
      default: null,
    },
    
    deviceInfo: {
      browser: String,
      os: String,
      device: String,
    },
    
    lastUsedAt: {
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
tokenSchema.index({ user: 1 });


// Unique index on token for faster lookups and uniqueness
tokenSchema.index({ token: 1 }, { unique: true });


// Index on isRevoked for filtering active tokens
tokenSchema.index({ isRevoked: 1 });


// Compound index for finding active tokens by user
tokenSchema.index({ user: 1, isRevoked: 1, expiresAt: 1 });


// Index for automatic token cleanup
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


// ============================================
// INSTANCE METHODS
// ============================================


/**
 * Is Expired
 * 
 * Checks if token has expired.
 * 
 * @returns {boolean} True if expired, false otherwise
 */
tokenSchema.methods.isExpired = function() {
  return this.expiresAt < Date.now();
};


/**
 * Is Valid
 * 
 * Checks if token is valid (not expired and not revoked).
 * 
 * @returns {boolean} True if valid, false otherwise
 */
tokenSchema.methods.isValid = function() {
  return !this.isExpired() && !this.isRevoked;
};


/**
 * Revoke Token
 * 
 * Revokes the token with optional reason.
 * 
 * @param {string} reason - Reason for revocation
 * @returns {Promise<void>}
 */
tokenSchema.methods.revokeToken = async function(reason = 'Manual revocation') {
  this.isRevoked = true;
  this.revokedAt = Date.now();
  this.revokedReason = reason;
  
  return await this.save();
};


/**
 * Update Last Used
 * 
 * Updates the last used timestamp.
 * 
 * @returns {Promise<void>}
 */
tokenSchema.methods.updateLastUsed = async function() {
  this.lastUsedAt = Date.now();
  return await this.save();
};


// ============================================
// STATIC METHODS
// ============================================


/**
 * Find Active Token
 * 
 * Finds a valid (non-expired, non-revoked) token.
 * 
 * @param {string} token - Token string
 * @returns {Promise<Object|null>} Token object or null
 */
tokenSchema.statics.findActiveToken = async function(token) {
  return await this.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: Date.now() },
  }).populate('user');
};


/**
 * Find User Tokens
 * 
 * Finds all tokens for a specific user.
 * 
 * @param {string} userId - User ID
 * @param {boolean} activeOnly - Return only active tokens
 * @returns {Promise<Array>} Array of token objects
 */
tokenSchema.statics.findUserTokens = async function(userId, activeOnly = true) {
  const query = { user: userId };
  
  if (activeOnly) {
    query.isRevoked = false;
    query.expiresAt = { $gt: Date.now() };
  }
  
  return await this.find(query).sort({ createdAt: -1 });
};


/**
 * Revoke User Tokens
 * 
 * Revokes all tokens for a specific user.
 * 
 * @param {string} userId - User ID
 * @param {string} reason - Reason for revocation
 * @returns {Promise<Object>} Update result
 */
tokenSchema.statics.revokeUserTokens = async function(userId, reason = 'User logout') {
  return await this.updateMany(
    { user: userId, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: Date.now(),
        revokedReason: reason,
      },
    }
  );
};


/**
 * Clean Expired Tokens
 * 
 * Removes all expired tokens from database.
 * 
 * @returns {Promise<Object>} Delete result
 */
tokenSchema.statics.cleanExpiredTokens = async function() {
  return await this.deleteMany({
    expiresAt: { $lt: Date.now() },
  });
};


/**
 * Clean Revoked Tokens
 * 
 * Removes old revoked tokens (older than 30 days).
 * 
 * @returns {Promise<Object>} Delete result
 */
tokenSchema.statics.cleanRevokedTokens = async function() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  return await this.deleteMany({
    isRevoked: true,
    revokedAt: { $lt: thirtyDaysAgo },
  });
};


/**
 * Get Token Statistics
 * 
 * Returns statistics about tokens.
 * 
 * @returns {Promise<Object>} Token statistics
 */
tokenSchema.statics.getTokenStatistics = async function() {
  const [total, active, expired, revoked] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({
      isRevoked: false,
      expiresAt: { $gt: Date.now() },
    }),
    this.countDocuments({
      expiresAt: { $lt: Date.now() },
    }),
    this.countDocuments({ isRevoked: true }),
  ]);
  
  return {
    total,
    active,
    expired,
    revoked,
  };
};


// ============================================
// MODEL EXPORT
// ============================================


const Token = mongoose.model('Token', tokenSchema);


module.exports = Token;