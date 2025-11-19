/**
 * OAuth Configuration
 * 
 * This module configures Passport.js strategies for OAuth providers
 * (Google, Facebook, GitHub). Each strategy handles authentication
 * and user profile retrieval from external providers.
 * 
 * @module config/oauth
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const { logger } = require('../services/loggerService');

/**
 * Serialize User
 * 
 * Determines which data of the user object should be stored in the session.
 * Only the user ID is stored to keep the session lightweight.
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize User
 * 
 * Retrieves the full user object from the database using the ID stored in session.
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ============================================
// GOOGLE OAUTH STRATEGY
// ============================================

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information from Google profile
          const email = profile.emails[0].value;
          const firstName = profile.name.givenName;
          const lastName = profile.name.familyName;
          const avatar = profile.photos[0]?.value;

          // Check if user already exists
          let user = await User.findOne({ email });

          if (user) {
            // Update OAuth provider information if user exists
            if (!user.oauthProviders.includes('google')) {
              user.oauthProviders.push('google');
              await user.save();
            }
            
            logger.info(`Google OAuth: Existing user logged in - ${email}`);
            return done(null, user);
          }

          // Create new user if doesn't exist
          user = await User.create({
            email,
            firstName,
            lastName,
            avatar,
            isEmailVerified: true, // Email is verified by Google
            oauthProviders: ['google'],
            provider: 'google',
          });

          logger.info(`Google OAuth: New user created - ${email}`);
          done(null, user);

        } catch (error) {
          logger.error(`Google OAuth Error: ${error.message}`);
          done(error, null);
        }
      }
    )
  );
} else {
  logger.warn('Google OAuth credentials not configured');
}

// ============================================
// FACEBOOK OAUTH STRATEGY
// ============================================

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'emails', 'name', 'photos'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information from Facebook profile
          const email = profile.emails?.[0]?.value;
          
          if (!email) {
            return done(new Error('No email provided by Facebook'), null);
          }

          const firstName = profile.name.givenName;
          const lastName = profile.name.familyName;
          const avatar = profile.photos?.[0]?.value;

          // Check if user already exists
          let user = await User.findOne({ email });

          if (user) {
            // Update OAuth provider information if user exists
            if (!user.oauthProviders.includes('facebook')) {
              user.oauthProviders.push('facebook');
              await user.save();
            }
            
            logger.info(`Facebook OAuth: Existing user logged in - ${email}`);
            return done(null, user);
          }

          // Create new user if doesn't exist
          user = await User.create({
            email,
            firstName,
            lastName,
            avatar,
            isEmailVerified: true, // Email is verified by Facebook
            oauthProviders: ['facebook'],
            provider: 'facebook',
          });

          logger.info(`Facebook OAuth: New user created - ${email}`);
          done(null, user);

        } catch (error) {
          logger.error(`Facebook OAuth Error: ${error.message}`);
          done(error, null);
        }
      }
    )
  );
} else {
  logger.warn('Facebook OAuth credentials not configured');
}

// ============================================
// GITHUB OAUTH STRATEGY
// ============================================

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information from GitHub profile
          const email = profile.emails?.[0]?.value;
          
          if (!email) {
            return done(new Error('No email provided by GitHub'), null);
          }

          const [firstName, ...lastNameParts] = (profile.displayName || profile.username).split(' ');
          const lastName = lastNameParts.join(' ') || '';
          const avatar = profile.photos?.[0]?.value;

          // Check if user already exists
          let user = await User.findOne({ email });

          if (user) {
            // Update OAuth provider information if user exists
            if (!user.oauthProviders.includes('github')) {
              user.oauthProviders.push('github');
              await user.save();
            }
            
            logger.info(`GitHub OAuth: Existing user logged in - ${email}`);
            return done(null, user);
          }

          // Create new user if doesn't exist
          user = await User.create({
            email,
            firstName,
            lastName,
            avatar,
            isEmailVerified: true, // Email is verified by GitHub
            oauthProviders: ['github'],
            provider: 'github',
          });

          logger.info(`GitHub OAuth: New user created - ${email}`);
          done(null, user);

        } catch (error) {
          logger.error(`GitHub OAuth Error: ${error.message}`);
          done(error, null);
        }
      }
    )
  );
} else {
  logger.warn('GitHub OAuth credentials not configured');
}

module.exports = passport;
