const { body, param, query } = require("express-validator");
const { RESOURCES, ACTIONS } = require("../utils/constants");

const createRoleValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name required")
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-z]+$/)
    .withMessage("Lowercase letters only"),
  body("displayName")
    .trim()
    .notEmpty()
    .withMessage("Display name required")
    .isLength({ min: 3, max: 50 }),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description required")
    .isLength({ min: 10, max: 200 }),
  body("level")
    .notEmpty()
    .withMessage("Level required")
    .isInt({ min: 1, max: 10 })
    .toInt(),
  body("permissions").isArray({ min: 1 }).withMessage("Permissions required"),
  body("permissions.*.resource").notEmpty().isIn(Object.values(RESOURCES)),
  body("permissions.*.actions").isArray({ min: 1 }),
  body("permissions.*.actions.*").isIn(Object.values(ACTIONS)),
];

const updateRoleValidation = [
  param("roleId").notEmpty().isMongoId().withMessage("Invalid role ID"),
  body("displayName").optional().trim().isLength({ min: 3, max: 50 }),
  body("description").optional().trim().isLength({ min: 10, max: 200 }),
  body("level").optional().isInt({ min: 1, max: 10 }).toInt(),
  body("permissions").optional().isArray(),
  body("permissions.*.resource").optional().isIn(Object.values(RESOURCES)),
  body("permissions.*.actions").optional().isArray({ min: 1 }),
  body("permissions.*.actions.*").optional().isIn(Object.values(ACTIONS)),
  body("isActive").optional().isBoolean().toBoolean(),
];

const roleIdValidation = [
  param("roleId").notEmpty().isMongoId().withMessage("Invalid role ID"),
];

const addPermissionValidation = [
  param("roleId").notEmpty().isMongoId().withMessage("Invalid role ID"),
  body("resource").notEmpty().isIn(Object.values(RESOURCES)),
  body("action").notEmpty().isIn(Object.values(ACTIONS)),
];

const removePermissionValidation = [
  param("roleId").notEmpty().isMongoId().withMessage("Invalid role ID"),
  body("resource").notEmpty().isIn(Object.values(RESOURCES)),
  body("action").notEmpty().isIn(Object.values(ACTIONS)),
];

const getUsersByRoleValidation = [
  param("roleId").notEmpty().isMongoId().withMessage("Invalid role ID"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  addPermissionValidation,
  removePermissionValidation,
  getUsersByRoleValidation,
};
