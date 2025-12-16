const { body, param } = require("express-validator");
const { PASSWORD_REQUIREMENTS } = require("../utils/constants");

const registerValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name: 2-50 chars")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Letters only"),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name: 2-50 chars")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Letters only"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email")
    .normalizeEmail()
    .toLowerCase(),
  body("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: PASSWORD_REQUIREMENTS.MIN_LENGTH })
    .withMessage(`Min ${PASSWORD_REQUIREMENTS.MIN_LENGTH} chars`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Need uppercase, lowercase, number, special char"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords must match"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email")
    .normalizeEmail()
    .toLowerCase(),
  body("password").notEmpty().withMessage("Password required"),
];

const refreshTokenValidation = [
  body("refreshToken")
    .notEmpty()
    .withMessage("Refresh token required")
    .isString(),
];

const verifyEmailValidation = [
  param("token")
    .notEmpty()
    .withMessage("Token required")
    .isString()
    .isLength({ min: 32 }),
];

const resendVerificationValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email")
    .normalizeEmail()
    .toLowerCase(),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password required")
    .isLength({ min: PASSWORD_REQUIREMENTS.MIN_LENGTH })
    .withMessage(`Min ${PASSWORD_REQUIREMENTS.MIN_LENGTH} chars`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Need uppercase, lowercase, number, special char")
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage("Must differ from current"),
  body("confirmNewPassword")
    .notEmpty()
    .withMessage("Confirm password")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Passwords must match"),
];

const logoutValidation = [body("refreshToken").optional().isString()];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  changePasswordValidation,
  logoutValidation,
};
