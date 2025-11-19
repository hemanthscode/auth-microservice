/**
 * Server Entry Point
 * 
 * This file initializes and starts the Express server.
 * It handles graceful shutdown and error handling at the application level.
 * 
 * @module server
 */

// Load environment variables as early as possible
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { logger } = require('./services/loggerService');

// Constants
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start Server
 * Connects to database and starts listening on specified port
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
      logger.info(`📡 API available at http://localhost:${PORT}/api/v1`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
      // Close server & exit process
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
      // Close server & exit process
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
};

// Initialize server
startServer();
