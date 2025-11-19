/**
 * Password Controller
 * 
 * This module handles HTTP requests for password management endpoints.
 * Processes password reset and email verification operations.
 * 
 * @module controllers/passwordController
 */

const User = require('../models/User');
const emailService = require('../services/emailService');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../utils/errors');
const { logger } = require('../services/loggerService');

/**
 * Forgot Password
 * 
 * @route   POST /api/v1/password/forgot
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    // Return success even if user not found (security best practice)
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.',
    });
  }
  
  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });
  
  // Send password reset email
  try {
    await emailService.sendPasswordResetEmail(user.email, resetToken);
    
    logger.info(`Password reset email sent to: ${user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    // Clear reset token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    logger.error(`Failed to send password reset email: ${error.message}`);
    
    throw new AppError('Failed to send password reset email. Please try again later.', 500);
  }
});

/**
 * Reset Password
 * 
 * @route   POST /api/v1/password/reset/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  
  // Find user by reset token
  const user = await User.findByPasswordResetToken(token);
  
  if (!user) {
    throw new AppError('Invalid or expired password reset token', 400);
  }
  
  // Update password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  // Revoke all existing tokens for security
  const Token = require('../models/Token');
  await Token.revokeUserTokens(user._id, 'Password reset');
  
  // Send confirmation email
  try {
    await emailService.sendPasswordChangedEmail(user.email);
  } catch (error) {
    logger.error(`Failed to send password changed email: ${error.message}`);
  }
  
  logger.info(`Password reset successful for user: ${user.email}`);
  
  res.status(200).json({
    success: true,
    message: 'Password reset successful. Please login with your new password.',
  });
});

/**
 * Verify Reset Token
 * 
 * @route   GET /api/v1/password/verify/:token
 * @access  Public
 */
const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  // Find user by reset token
  const user = await User.findByPasswordResetToken(token);
  
  if (!user) {
    throw new AppError('Invalid or expired password reset token', 400);
  }
  
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      email: user.email,
    },
  });
});

module.exports = {
  forgotPassword,
  resetPassword,
  verifyResetToken,
};
