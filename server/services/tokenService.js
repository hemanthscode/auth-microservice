const Token = require("../models/Token");
const { generateAccessToken, generateRefreshToken } = require("../config/jwt");
const { AppError } = require("../utils/errors");
const { logger } = require("./loggerService");

const createRefreshToken = async (userId, metadata = {}) => {
  const refreshToken = generateRefreshToken({ userId });

  await Token.create({
    user: userId,
    token: refreshToken,
    tokenType: "refresh",
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    deviceInfo: metadata.deviceInfo,
  });

  return refreshToken;
};

const validateRefreshToken = async (token) => {
  const tokenDoc = await Token.findActiveToken(token);
  if (!tokenDoc) throw new AppError("Invalid or expired token", 401);

  await tokenDoc.updateLastUsed();
  return tokenDoc;
};

const revokeToken = async (token, reason = "Manual revocation") => {
  const tokenDoc = await Token.findOne({ token });
  if (!tokenDoc) throw new AppError("Token not found", 404);

  await tokenDoc.revokeToken(reason);
  logger.info(`Token revoked: ${reason}`);
};

const revokeAllUserTokens = async (userId, reason = "Revoke all") => {
  await Token.revokeUserTokens(userId, reason);
  logger.info(`All tokens revoked: ${userId}`);
};

const cleanupExpiredTokens = async () => {
  const result = await Token.cleanExpiredTokens();
  logger.info(`Expired tokens cleaned: ${result.deletedCount}`);
  return result.deletedCount;
};

const cleanupRevokedTokens = async () => {
  const result = await Token.cleanRevokedTokens();
  logger.info(`Revoked tokens cleaned: ${result.deletedCount}`);
  return result.deletedCount;
};

const getTokenStatistics = async () => {
  return await Token.getTokenStatistics();
};

module.exports = {
  createRefreshToken,
  validateRefreshToken,
  revokeToken,
  revokeAllUserTokens,
  cleanupExpiredTokens,
  cleanupRevokedTokens,
  getTokenStatistics,
};
