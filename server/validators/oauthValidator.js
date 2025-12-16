const { body, param } = require("express-validator");

const ALLOWED_PROVIDERS = ["google", "github"];

const oauthProviderValidation = [
  param("provider")
    .notEmpty()
    .withMessage("Provider required")
    .isIn(ALLOWED_PROVIDERS)
    .withMessage("Invalid provider (google, github only)"),
];

const linkOAuthValidation = [
  body("provider")
    .notEmpty()
    .withMessage("Provider required")
    .isIn(ALLOWED_PROVIDERS)
    .withMessage("Invalid provider"),
  body("providerId").notEmpty().withMessage("Provider ID required").isString(),
  body("accessToken")
    .notEmpty()
    .withMessage("Access token required")
    .isString(),
  body("refreshToken").optional().isString(),
  body("expiresIn").optional().isInt({ min: 0 }).toInt(),
  body("profile").optional().isObject(),
];

const unlinkOAuthValidation = [
  param("provider")
    .notEmpty()
    .withMessage("Provider required")
    .isIn(ALLOWED_PROVIDERS)
    .withMessage("Invalid provider"),
];

module.exports = {
  oauthProviderValidation,
  linkOAuthValidation,
  unlinkOAuthValidation,
};
