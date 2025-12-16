const User = require("../models/User");
const emailService = require("../services/emailService");
const { asyncHandler } = require("../middleware/errorHandler");
const { AppError } = require("../utils/errors");
const { logger } = require("../services/loggerService");

const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });

  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If account exists, reset link sent.",
    });
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordResetEmail(user.email, resetToken);
    logger.info(`Password reset sent: ${user.email}`);
    res.status(200).json({ success: true, message: "Reset link sent" });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    logger.error(`Reset email failed: ${error.message}`);
    throw new AppError("Email send failed. Try again later.", 500);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findByPasswordResetToken(req.params.token);
  if (!user) throw new AppError("Invalid or expired token", 400);

  user.password = req.body.newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const Token = require("../models/Token");
  await Token.revokeUserTokens(user._id, "Password reset");

  try {
    await emailService.sendPasswordChangedEmail(user.email);
  } catch (error) {
    logger.error(`Changed email failed: ${error.message}`);
  }

  logger.info(`Password reset: ${user.email}`);
  res
    .status(200)
    .json({ success: true, message: "Password reset. Login again." });
});

const verifyResetToken = asyncHandler(async (req, res) => {
  const user = await User.findByPasswordResetToken(req.params.token);
  if (!user) throw new AppError("Invalid or expired token", 400);

  res
    .status(200)
    .json({
      success: true,
      message: "Token valid",
      data: { email: user.email },
    });
});

module.exports = { forgotPassword, resetPassword, verifyResetToken };
