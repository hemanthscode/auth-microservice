const { body, param } = require("express-validator");
const { PASSWORD_REQUIREMENTS } = require("../utils/constants");

const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email")
    .normalizeEmail()
    .toLowerCase(),
];

const resetPasswordValidation = [
  param("token")
    .notEmpty()
    .withMessage("Token required")
    .isString()
    .isLength({ min: 32 }),
  body("newPassword")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: PASSWORD_REQUIREMENTS.MIN_LENGTH })
    .withMessage(`Min ${PASSWORD_REQUIREMENTS.MIN_LENGTH} chars`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Need uppercase, lowercase, number, special char"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Passwords must match"),
];

const verifyTokenValidation = [
  param("token")
    .notEmpty()
    .withMessage("Token required")
    .isString()
    .isLength({ min: 32 }),
];

module.exports = {
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyTokenValidation,
};
