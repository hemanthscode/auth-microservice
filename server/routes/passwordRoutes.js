const express = require("express");
const router = express.Router();
const passwordController = require("../controllers/passwordController");
const { validate } = require("../middleware/validationMiddleware");
const { passwordResetLimiter } = require("../middleware/rateLimiter");
const {
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyTokenValidation,
} = require("../validators/passwordValidator");

router.post(
  "/forgot",
  passwordResetLimiter,
  forgotPasswordValidation,
  validate,
  passwordController.forgotPassword,
);
router.post(
  "/reset/:token",
  resetPasswordValidation,
  validate,
  passwordController.resetPassword,
);
router.get(
  "/verify/:token",
  verifyTokenValidation,
  validate,
  passwordController.verifyResetToken,
);

module.exports = router;
