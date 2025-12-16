const userService = require("../services/userService");
const { asyncHandler } = require("../middleware/errorHandler");

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.userId);
  res.status(200).json({ success: true, data: { user } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateUserProfile(req.userId, req.body);
  res
    .status(200)
    .json({ success: true, message: "Profile updated", data: { user } });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await userService.updateUserPreferences(
    req.userId,
    req.body,
  );
  res
    .status(200)
    .json({
      success: true,
      message: "Preferences updated",
      data: { preferences },
    });
});

const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deleteUserAccount(req.userId);
  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, message: "Account deleted" });
});

const listUsers = asyncHandler(async (req, res) => {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    filters: {},
    sort: req.sort || { createdAt: -1 },
  };

  if (req.query.role) options.filters.role = req.query.role;
  if (req.query.isActive !== undefined)
    options.filters.isActive = req.query.isActive;

  const result = await userService.listUsers(options);
  res.status(200).json({ success: true, data: result });
});

const searchUsers = asyncHandler(async (req, res) => {
  const users = await userService.searchUsers(req.query.q, {
    limit: parseInt(req.query.limit) || 10,
  });
  res.status(200).json({ success: true, data: { users, total: users.length } });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.params.userId);
  res.status(200).json({ success: true, data: { user } });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(
    req.params.userId,
    req.body.roleId,
  );
  res
    .status(200)
    .json({ success: true, message: "Role updated", data: { user } });
});

const activateUser = asyncHandler(async (req, res) => {
  await userService.activateUserAccount(req.params.userId);
  res.status(200).json({ success: true, message: "Account activated" });
});

const deactivateUser = asyncHandler(async (req, res) => {
  await userService.deactivateUserAccount(req.params.userId);
  res.status(200).json({ success: true, message: "Account deactivated" });
});

const getUserStatistics = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStatistics();
  res.status(200).json({ success: true, data: { stats } });
});

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  deleteAccount,
  listUsers,
  searchUsers,
  getUserById,
  updateUserRole,
  activateUser,
  deactivateUser,
  getUserStatistics,
};
