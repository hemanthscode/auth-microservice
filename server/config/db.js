/**
 * Database Configuration
 * 
 * This module handles MongoDB connection setup with proper error handling,
 * retry logic, and connection event listeners.
 * 
 * @module config/db
 */

const mongoose = require('mongoose');
const { logger } = require('../services/loggerService');

/**
 * Connect to MongoDB
 * 
 * Establishes connection to MongoDB with retry logic and event handlers.
 * Uses connection pooling and optimized settings for production.
 * 
 * @returns {Promise<void>}
 * @throws {Error} If connection fails after all retries
 */
const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      // Removed deprecated options: useNewUrlParser, useUnifiedTopology
      // Maximum number of connections in the connection pool
      maxPoolSize: 10,

      // Minimum number of connections in the connection pool
      minPoolSize: 5,

      // How long to wait before timing out a connection attempt
      serverSelectionTimeoutMS: 5000,

      // How long to wait for a socket to connect
      socketTimeoutMS: 45000,

      // Automatically create indexes
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    // Get MongoDB URI from environment
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database Name: ${conn.connection.name}`);

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed due to application termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Retry connection after 5 seconds
    logger.info('Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

/**
 * Disconnect from MongoDB
 * 
 * Gracefully closes the MongoDB connection.
 * Used primarily for testing and graceful shutdowns.
 * 
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
};

/**
 * Get connection status
 * 
 * Returns the current MongoDB connection status.
 * 
 * @returns {string} Connection status
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
module.exports.getConnectionStatus = getConnectionStatus;
