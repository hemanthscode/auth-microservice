/**
 * Configuration Index
 * 
 * This module aggregates and exports all configuration modules
 * for easy importing throughout the application.
 * 
 * @module config
 */

const connectDB = require('./db');
const jwtConfig = require('./jwt');
const passport = require('./oauth');

module.exports = {
  connectDB,
  jwtConfig,
  passport,
};
