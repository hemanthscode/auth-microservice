const jwt = require("jsonwebtoken");
const { logger } = require("../services/loggerService");

const JWT_CONFIG = {
  ACCESS_TOKEN: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || "15m",
  },
  REFRESH_TOKEN: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  },
  COOKIE: {
    maxAge: parseInt(process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  },
};

const generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_CONFIG.ACCESS_TOKEN.secret, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN.expiresIn,
    });
  } catch (error) {
    logger.error(`Access token error: ${error.message}`);
    throw new Error("Failed to generate access token");
  }
};

const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_CONFIG.REFRESH_TOKEN.secret, {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN.expiresIn,
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    throw new Error("Failed to generate refresh token");
  }
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN.secret);
  } catch (error) {
    const msg =
      error.name === "TokenExpiredError"
        ? "Access token expired"
        : error.name === "JsonWebTokenError"
          ? "Invalid access token"
          : "Token verification failed";
    throw new Error(msg);
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN.secret);
  } catch (error) {
    const msg =
      error.name === "TokenExpiredError"
        ? "Refresh token expired"
        : error.name === "JsonWebTokenError"
          ? "Invalid refresh token"
          : "Token verification failed";
    throw new Error(msg);
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error(`Decode error: ${error.message}`);
    return null;
  }
};

const getCookieOptions = () => ({ ...JWT_CONFIG.COOKIE });

module.exports = {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getCookieOptions,
};
