require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { logger } = require("./services/loggerService");

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${NODE_ENV} on port ${PORT}`);
      logger.info(`📡 API: http://localhost:${PORT}/api/v1`);
    });

    process.on("unhandledRejection", (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
      server.close(() => process.exit(1));
    });

    process.on("uncaughtException", (err) => {
      logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
      server.close(() => process.exit(1));
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM: closing server");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT: closing server");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(`Failed to start: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
};

startServer();
