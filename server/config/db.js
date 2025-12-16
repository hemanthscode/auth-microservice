const mongoose = require("mongoose");
const { logger } = require("../services/loggerService");

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== "production",
    };

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not defined in environment");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) =>
      logger.error(`DB error: ${err.message}`),
    );
    mongoose.connection.on("disconnected", () =>
      logger.warn("DB disconnected"),
    );

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("DB closed - app termination");
      process.exit(0);
    });
  } catch (error) {
    logger.error(`❌ DB Connection Error: ${error.message}`);
    setTimeout(connectDB, 5000);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info("DB connection closed");
  } catch (error) {
    logger.error(`Error closing DB: ${error.message}`);
    throw error;
  }
};

const getConnectionStatus = () => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] || "unknown";
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
module.exports.getConnectionStatus = getConnectionStatus;
