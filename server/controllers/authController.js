const authService = require("../services/authService");
const { getCookieOptions } = require("../config/jwt");
const { asyncHandler } = require("../middleware/errorHandler");
const { getIpAddress, parseUserAgent } = require("../utils/helpers");

const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const result = await authService.registerUser({
    firstName,
    lastName,
    email,
    password,
  });

  res.cookie("refreshToken", result.refreshToken, getCookieOptions());
  res.status(201).json({
    success: true,
    message: "Registration successful. Verify email.",
    data: { user: result.user, accessToken: result.accessToken },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const metadata = {
    ipAddress: getIpAddress(req),
    userAgent: req.headers["user-agent"],
    deviceInfo: parseUserAgent(req.headers["user-agent"]),
  };

  const result = await authService.loginUser({ email, password }, metadata);
  res.cookie("refreshToken", result.refreshToken, getCookieOptions());
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user: result.user, accessToken: result.accessToken },
  });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  await authService.logoutUser(req.userId, refreshToken);
  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, message: "Logout successful" });
});

const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, message: "Refresh token required" });
  }

  const result = await authService.refreshAccessToken(refreshToken);
  res.status(200).json({
    success: true,
    message: "Token refreshed",
    data: { accessToken: result.accessToken },
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  res.status(200).json({ success: true, message: "Email verified" });
});

const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerificationEmail(req.body.email);
  res.status(200).json({ success: true, message: "Verification email sent" });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.userId, currentPassword, newPassword);
  res.clearCookie("refreshToken");
  res
    .status(200)
    .json({ success: true, message: "Password changed. Login again." });
});

const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getActiveSessions(req.userId);
  res
    .status(200)
    .json({ success: true, data: { sessions, total: sessions.length } });
});

const revokeSession = asyncHandler(async (req, res) => {
  await authService.revokeSession(req.userId, req.params.sessionId);
  res.status(200).json({ success: true, message: "Session revoked" });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json({ success: true, data: { user: req.user.toSafeObject() } });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
  changePassword,
  getActiveSessions,
  revokeSession,
  getCurrentUser,
};
