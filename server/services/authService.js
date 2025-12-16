const User = require("../models/User");
const Token = require("../models/Token");
const Role = require("../models/Role");
const emailService = require("./emailService");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../config/jwt");
const { AppError, AuthenticationError } = require("../utils/errors");
const { logger } = require("./loggerService");

const registerUser = async (userData) => {
  const { firstName, lastName, email, password } = userData;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new AppError("Email already registered", 409);

  const defaultRole = await Role.findOne({ name: "user" });
  if (!defaultRole) throw new AppError("Default role not found", 500);

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role: defaultRole._id,
    provider: "local",
  });

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendVerificationEmail(user.email, verificationToken);
  } catch (error) {
    logger.error(`Verification email failed: ${error.message}`);
  }

  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
  });
  const refreshToken = generateRefreshToken({ userId: user._id });

  await Token.create({
    user: user._id,
    token: refreshToken,
    tokenType: "refresh",
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  const populatedUser = await User.findById(user._id).populate("role");
  logger.info(`User registered: ${user.email}`);

  return { user: populatedUser.toSafeObject(), accessToken, refreshToken };
};

const loginUser = async (credentials, metadata = {}) => {
  const { email, password } = credentials;

  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+password")
    .populate("role");

  if (!user) throw new AuthenticationError("Invalid credentials");

  if (user.isAccountLocked) {
    const lockTime = new Date(user.lockUntil).toLocaleString();
    throw new AppError(`Account locked until ${lockTime}`, 423);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    throw new AuthenticationError("Invalid credentials");
  }

  if (!user.isActive) throw new AppError("Account deactivated", 403);

  await user.resetLoginAttempts();

  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
  });
  const refreshToken = generateRefreshToken({ userId: user._id });

  await Token.create({
    user: user._id,
    token: refreshToken,
    tokenType: "refresh",
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    deviceInfo: metadata.deviceInfo,
  });

  logger.info(`User login: ${user.email}`);
  return { user: user.toSafeObject(), accessToken, refreshToken };
};

const logoutUser = async (userId, refreshToken) => {
  if (refreshToken) {
    await Token.deleteOne({ token: refreshToken, user: userId });
  } else {
    await Token.revokeUserTokens(userId, "User logout");
  }

  logger.info(`User logout: ${userId}`);
};

const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AuthenticationError("Invalid refresh token");
  }

  const tokenDoc = await Token.findOne({
    token: refreshToken,
    isRevoked: false,
  });
  if (!tokenDoc) throw new AuthenticationError("Token not found or revoked");
  if (tokenDoc.isExpired()) throw new AuthenticationError("Token expired");

  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) throw new AuthenticationError("User not found");

  await tokenDoc.updateLastUsed();

  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
  });

  logger.debug(`Token refreshed: ${user.email}`);
  return { accessToken };
};

const verifyEmail = async (token) => {
  const user = await User.findByEmailVerificationToken(token);
  if (!user) throw new AppError("Invalid or expired token", 400);

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  try {
    await emailService.sendWelcomeEmail(user.email, user.firstName);
  } catch (error) {
    logger.error(`Welcome email failed: ${error.message}`);
  }

  logger.info(`Email verified: ${user.email}`);
};

const resendVerificationEmail = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return;
  if (user.isEmailVerified) throw new AppError("Email already verified", 400);

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  await emailService.sendVerificationEmail(user.email, verificationToken);
  logger.info(`Verification resent: ${user.email}`);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("User not found", 404);

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) throw new AppError("Current password incorrect", 400);

  user.password = newPassword;
  await user.save();

  await Token.revokeUserTokens(userId, "Password changed");

  try {
    await emailService.sendPasswordChangedEmail(user.email);
  } catch (error) {
    logger.error(`Password changed email failed: ${error.message}`);
  }

  logger.info(`Password changed: ${user.email}`);
};

const getActiveSessions = async (userId) => {
  return await Token.findUserTokens(userId, true);
};

const revokeSession = async (userId, sessionId) => {
  const token = await Token.findById(sessionId);
  if (!token || token.user.toString() !== userId.toString()) {
    throw new AppError("Session not found", 404);
  }

  await token.revokeToken("User revocation");
  logger.info(`Session revoked: ${userId}`);
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
  getActiveSessions,
  revokeSession,
};
