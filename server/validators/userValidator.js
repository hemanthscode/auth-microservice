const { body, param, query } = require("express-validator");

const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Letters only"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Letters only"),
  body("phoneNumber")
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/),
  body("dateOfBirth")
    .optional()
    .isISO8601()
    .custom((value) => {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      if (age < 13) throw new Error("Min age 13");
      if (age > 120) throw new Error("Invalid date");
      return true;
    }),
  body("bio").optional().trim().isLength({ max: 500 }),
  body("avatar").optional().isURL(),
];

const updatePreferencesValidation = [
  body("language").optional().isString().isLength({ min: 2, max: 5 }),
  body("timezone").optional().isString(),
  body("notifications").optional().isObject(),
  body("notifications.email").optional().isBoolean(),
  body("notifications.push").optional().isBoolean(),
];

const userIdValidation = [
  param("userId").notEmpty().isMongoId().withMessage("Invalid user ID"),
];

const searchUsersValidation = [
  query("q").optional().trim().isLength({ min: 2 }),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

const listUsersValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("sortBy")
    .optional()
    .isIn(["createdAt", "firstName", "lastName", "email"]),
  query("order").optional().isIn(["asc", "desc"]),
  query("role").optional().isMongoId(),
  query("isActive").optional().isBoolean().toBoolean(),
];

const updateUserRoleValidation = [
  param("userId").notEmpty().isMongoId().withMessage("Invalid user ID"),
  body("roleId").notEmpty().isMongoId().withMessage("Invalid role ID"),
];

const deleteUserValidation = [
  param("userId").notEmpty().isMongoId().withMessage("Invalid user ID"),
  body("confirmation").optional().isBoolean(),
];

module.exports = {
  updateProfileValidation,
  updatePreferencesValidation,
  userIdValidation,
  searchUsersValidation,
  listUsersValidation,
  updateUserRoleValidation,
  deleteUserValidation,
};
