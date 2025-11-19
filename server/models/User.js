/**
 * User Model
 * 
 * This module defines the User schema for MongoDB with Mongoose.
 * Handles user authentication, profile management, and security features.
 * 
 * @module models/User
 */


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


/**
 * User Schema Definition
 * 
 * Defines the structure and validation rules for user documents.
 * Includes fields for authentication, profile, roles, and security.
 */
const userSchema = new mongoose.Schema(
  {
    // Basic Information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    
    // Authentication
    password: {
      type: String,
      required: function() {
        // Password is required only if not using OAuth
        return !this.provider || this.provider === 'local';
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default in queries
    },
    
    // Profile Information
    avatar: {
      type: String,
      default: null,
    },
    
    phoneNumber: {
      type: String,
      default: null,
      match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number'],
    },
    
    dateOfBirth: {
      type: Date,
      default: null,
    },
    
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    
    // Role and Permissions
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    
    // OAuth Information
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'github'],
      default: 'local',
    },
    
    oauthProviders: [{
      type: String,
      enum: ['google', 'facebook', 'github'],
    }],
    
    // Email Verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    
    emailVerificationToken: {
      type: String,
      select: false,
    },
    
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    
    // Password Reset
    passwordResetToken: {
      type: String,
      select: false,
    },
    
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    
    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    
    isLocked: {
      type: Boolean,
      default: false,
    },
    
    lockUntil: {
      type: Date,
      default: null,
    },
    
    // Security
    loginAttempts: {
      type: Number,
      default: 0,
    },
    
    lastLogin: {
      type: Date,
      default: null,
    },
    
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
    
    // Preferences
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


// ============================================
// INDEXES
// ============================================


// Unique index on email for faster lookups (removed from schema definition above)
// Note: email field already has unique: true, so no separate index needed

// Index on role for filtering users by role
userSchema.index({ role: 1 });


// Compound index for active users
userSchema.index({ isActive: 1, isLocked: 1 });


// ============================================
// VIRTUAL PROPERTIES
// ============================================


/**
 * Virtual: Full Name
 * Concatenates first name and last name
 */
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});


/**
 * Virtual: Is Account Locked
 * Checks if account is currently locked
 */
userSchema.virtual('isAccountLocked').get(function() {
  return this.isLocked && this.lockUntil && this.lockUntil > Date.now();
});


// ============================================
// MIDDLEWARE (HOOKS)
// ============================================


/**
 * Pre-save Middleware: Hash Password
 * 
 * Hashes the password before saving to database if it has been modified.
 * Uses bcrypt with configurable salt rounds.
 */
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified or is new
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt and hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update last password change timestamp
    this.lastPasswordChange = Date.now();
    
    next();
  } catch (error) {
    next(error);
  }
});


/**
 * Pre-save Middleware: Set Default Role
 * 
 * Assigns default 'user' role if no role is specified.
 */
userSchema.pre('save', async function(next) {
  if (!this.role) {
    try {
      const Role = mongoose.model('Role');
      const defaultRole = await Role.findOne({ name: 'user' });
      
      if (defaultRole) {
        this.role = defaultRole._id;
      }
    } catch (error) {
      // Role will be set by application logic if this fails
    }
  }
  next();
});


// ============================================
// INSTANCE METHODS
// ============================================


/**
 * Compare Password
 * 
 * Compares provided password with hashed password in database.
 * 
 * @param {string} candidatePassword - Password to verify
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};


/**
 * Generate Email Verification Token
 * 
 * Creates a secure random token for email verification.
 * 
 * @returns {string} Email verification token
 */
userSchema.methods.generateEmailVerificationToken = function() {
  // Generate random token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to schema field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Set expiration (24 hours)
  const expireTime = parseInt(process.env.EMAIL_VERIFICATION_EXPIRE) || 86400000;
  this.emailVerificationExpires = Date.now() + expireTime;
  
  return verificationToken;
};


/**
 * Generate Password Reset Token
 * 
 * Creates a secure random token for password reset.
 * 
 * @returns {string} Password reset token
 */
userSchema.methods.generatePasswordResetToken = function() {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to schema field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expiration (1 hour)
  const expireTime = parseInt(process.env.PASSWORD_RESET_EXPIRE) || 3600000;
  this.passwordResetExpires = Date.now() + expireTime;
  
  return resetToken;
};


/**
 * Increment Login Attempts
 * 
 * Tracks failed login attempts and locks account if threshold is exceeded.
 * 
 * @returns {Promise<void>}
 */
userSchema.methods.incrementLoginAttempts = async function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: {
        loginAttempts: 1,
        isLocked: false,
        lockUntil: null,
      },
    });
  }
  
  // Increment login attempts
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = {
      isLocked: true,
      lockUntil: Date.now() + lockTime,
    };
  }
  
  return await this.updateOne(updates);
};


/**
 * Reset Login Attempts
 * 
 * Resets login attempts and unlocks account after successful login.
 * 
 * @returns {Promise<void>}
 */
userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: {
      loginAttempts: 0,
      isLocked: false,
      lockUntil: null,
      lastLogin: Date.now(),
    },
  });
};


/**
 * Sanitize User Data
 * 
 * Returns user object without sensitive fields.
 * 
 * @returns {Object} Sanitized user object
 */
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.loginAttempts;
  delete userObject.__v;
  
  return userObject;
};


// ============================================
// STATIC METHODS
// ============================================


/**
 * Find By Credentials
 * 
 * Finds user by email and verifies password.
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object|null>} User object or null
 */
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    return null;
  }
  
  const isPasswordMatch = await user.comparePassword(password);
  
  if (!isPasswordMatch) {
    return null;
  }
  
  return user;
};


/**
 * Find By Email Verification Token
 * 
 * Finds user by email verification token.
 * 
 * @param {string} token - Verification token
 * @returns {Promise<Object|null>} User object or null
 */
userSchema.statics.findByEmailVerificationToken = async function(token) {
  // Hash the token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return await this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });
};


/**
 * Find By Password Reset Token
 * 
 * Finds user by password reset token.
 * 
 * @param {string} token - Reset token
 * @returns {Promise<Object|null>} User object or null
 */
userSchema.statics.findByPasswordResetToken = async function(token) {
  // Hash the token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return await this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
};


// ============================================
// MODEL EXPORT
// ============================================


const User = mongoose.model('User', userSchema);


module.exports = User;