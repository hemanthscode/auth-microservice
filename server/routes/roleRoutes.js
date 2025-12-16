const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  requireRole,
  requirePermission,
  requireMinimumRoleLevel,
} = require("../middleware/rbacMiddleware");
const {
  validate,
  validatePagination,
} = require("../middleware/validationMiddleware");
const {
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  addPermissionValidation,
  removePermissionValidation,
  getUsersByRoleValidation,
} = require("../validators/roleValidator");

// Initialize default roles (Superadmin only)
router.post(
  "/initialize",
  authenticate,
  requireRole("superadmin"),
  roleController.initializeRoles,
);

// Get role statistics (Admin+ can view)
router.get(
  "/statistics",
  authenticate,
  requireMinimumRoleLevel(8), // Admin level
  roleController.getRoleStatistics,
);

// Create new role (Superadmin only)
router.post(
  "/",
  authenticate,
  requireRole("superadmin"),
  createRoleValidation,
  validate,
  roleController.createRole,
);

// List all roles (Admin+ can view)
router.get(
  "/",
  authenticate,
  requireMinimumRoleLevel(8), // Admin level or above
  roleController.getAllRoles,
);

// Get role by ID (Admin+ can view)
router.get(
  "/:roleId",
  authenticate,
  requireMinimumRoleLevel(8),
  roleIdValidation,
  validate,
  roleController.getRoleById,
);

// Update role (Superadmin only)
router.put(
  "/:roleId",
  authenticate,
  requireRole("superadmin"),
  updateRoleValidation,
  validate,
  roleController.updateRole,
);

// Delete role (Superadmin only)
router.delete(
  "/:roleId",
  authenticate,
  requireRole("superadmin"),
  roleIdValidation,
  validate,
  roleController.deleteRole,
);

// Get role permissions (Admin+ can view)
router.get(
  "/:roleId/permissions",
  authenticate,
  requireMinimumRoleLevel(8),
  roleIdValidation,
  validate,
  roleController.getRolePermissions,
);

// Add permission to role (Superadmin only)
router.post(
  "/:roleId/permissions",
  authenticate,
  requireRole("superadmin"),
  addPermissionValidation,
  validate,
  roleController.addPermission,
);

// Remove permission from role (Superadmin only)
router.delete(
  "/:roleId/permissions",
  authenticate,
  requireRole("superadmin"),
  removePermissionValidation,
  validate,
  roleController.removePermission,
);

// Get users by role (Admin+ can view)
router.get(
  "/:roleId/users",
  authenticate,
  requireMinimumRoleLevel(8),
  getUsersByRoleValidation,
  validate,
  validatePagination(),
  roleController.getUsersByRole,
);

module.exports = router;
