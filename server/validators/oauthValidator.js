/**
 * OAuth Validators
 * 
 * This module provides validation rules for OAuth endpoints.
 * Uses express-validator to validate and sanitize request data.
 * 
 * @module validators/oauthValidator
 */

const { body, param, query } = require('express-validator');
const { OAUTH_PROVIDERS } = require('../utils/constants');

/**
 * OAuth Provider Validation Rules
 * 
 * Validates OAuth provider parameter.
 */
const oauthProviderValidation = [
  param('provider')
    .notEmpty()
    .withMessage('OAuth provider is required')
    .isIn(Object.values(OAUTH_PROVIDERS))
    .withMessage('Invalid OAuth provider'),
];

/**
 * Link OAuth Provider Validation Rules
 * 
 * Validates OAuth provider linking request.
 */
const linkOAuthValidation = [
  body('provider')
    .notEmpty()
    .withMessage('OAuth provider is required')
    .isIn(Object.values(OAUTH_PROVIDERS))
    .withMessage('Invalid OAuth provider'),
  
  body('providerId')
    .notEmpty()
    .withMessage('Provider ID is required')
    .isString()
    .withMessage('Provider ID must be a string'),
  
  body('accessToken')
    .notEmpty()
    .withMessage('Access token is required')
    .isString()
    .withMessage('Access token must be a string'),
  
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token must be a string'),
  
  body('expiresIn')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Expires in must be a positive integer')
    .toInt(),
  
  body('profile')
    .optional()
    .isObject()
    .withMessage('Profile must be an object'),
];

/**
 * Unlink OAuth Provider Validation Rules
 * 
 * Validates OAuth provider unlinking request.
 */
const unlinkOAuthValidation = [
  param('provider')
    .notEmpty()
    .withMessage('OAuth provider is required')
    .isIn(Object.values(OAUTH_PROVIDERS))
    .withMessage('Invalid OAuth provider'),
];

/**
 * OAuth Callback Validation Rules
 * 
 * Validates OAuth callback parameters.
 */
const oauthCallbackValidation = [
  query('code')
    .optional()
    .isString()
    .withMessage('Authorization code must be a string'),
  
  query('state')
    .optional()
    .isString()
    .withMessage('State must be a string'),
  
  query('error')
    .optional()
    .isString()
    .withMessage('Error must be a string'),
];

module.exports = {
  oauthProviderValidation,
  linkOAuthValidation,
  unlinkOAuthValidation,
  oauthCallbackValidation,
};
