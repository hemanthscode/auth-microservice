const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const {
  authLimiter,
  createAccountLimiter,
  emailVerificationLimiter,
} = require("../middleware/rateLimiter");
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  changePasswordValidation,
  logoutValidation,
} = require("../validators/authValidator");

router.post(
  "/register",
  createAccountLimiter,
  registerValidation,
  validate,
  authController.register,
);
router.post(
  "/login",
  authLimiter,
  loginValidation,
  validate,
  authController.login,
);
router.post(
  "/logout",
  authenticate,
  logoutValidation,
  validate,
  authController.logout,
);
router.post(
  "/refresh",
  refreshTokenValidation,
  validate,
  authController.refreshToken,
);
router.post(
  "/verify-email/:token",
  verifyEmailValidation,
  validate,
  authController.verifyEmail,
);
router.post(
  "/resend-verification",
  emailVerificationLimiter,
  resendVerificationValidation,
  validate,
  authController.resendVerification,
);
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword,
);
router.get("/me", authenticate, authController.getCurrentUser);
router.get("/sessions", authenticate, authController.getActiveSessions);
router.delete(
  "/sessions/:sessionId",
  authenticate,
  authController.revokeSession,
);

module.exports = router;
