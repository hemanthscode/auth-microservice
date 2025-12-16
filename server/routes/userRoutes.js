const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  requireRole,
  requirePermission,
  requireMinimumRoleLevel,
} = require("../middleware/rbacMiddleware");
const {
  validate,
  validatePagination,
  validateSort,
} = require("../middleware/validationMiddleware");
const {
  updateProfileValidation,
  updatePreferencesValidation,
  userIdValidation,
  searchUsersValidation,
  listUsersValidation,
  updateUserRoleValidation,
} = require("../validators/userValidator");

// ============================================
// CURRENT USER ROUTES (no ID param)
// ============================================
router.get("/profile", authenticate, userController.getProfile);

router.put(
  "/profile",
  authenticate,
  updateProfileValidation,
  validate,
  userController.updateProfile,
);

router.put(
  "/preferences",
  authenticate,
  updatePreferencesValidation,
  validate,
  userController.updatePreferences,
);

router.delete("/profile", authenticate, userController.deleteAccount);

// ============================================
// ADMIN ROUTES - SPECIFIC PATHS (before :userId)
// ============================================

// Search users
router.get(
  "/search",
  authenticate,
  searchUsersValidation,
  validate,
  userController.searchUsers,
);

// User statistics (Admin only) - MUST be before /:userId
router.get(
  "/statistics",
  authenticate,
  requireMinimumRoleLevel(8), // Admin or Superadmin
  userController.getUserStatistics,
);

// List all users with pagination
router.get(
  "/",
  authenticate,
  requirePermission("users", "read"),
  listUsersValidation,
  validate,
  validatePagination(),
  validateSort(["createdAt", "firstName", "lastName", "email"]),
  userController.listUsers,
);

// ============================================
// PARAMETERIZED ROUTES (must be last)
// ============================================

// Get user by ID
router.get(
  "/:userId",
  authenticate,
  requirePermission("users", "read"),
  userIdValidation,
  validate,
  userController.getUserById,
);

// Update user role
router.put(
  "/:userId/role",
  authenticate,
  requirePermission("users", "update"),
  updateUserRoleValidation,
  validate,
  userController.updateUserRole,
);

// Activate user
router.put(
  "/:userId/activate",
  authenticate,
  requirePermission("users", "update"),
  userIdValidation,
  validate,
  userController.activateUser,
);

// Deactivate user
router.put(
  "/:userId/deactivate",
  authenticate,
  requirePermission("users", "update"),
  userIdValidation,
  validate,
  userController.deactivateUser,
);

module.exports = router;
