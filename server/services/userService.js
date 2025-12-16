const User = require("../models/User");
const Role = require("../models/Role");
const Token = require("../models/Token");
const { AppError } = require("../utils/errors");
const { logger } = require("./loggerService");
const { generatePaginationInfo } = require("../utils/helpers");

const getUserProfile = async (userId) => {
  const user = await User.findById(userId).populate("role");
  if (!user) throw new AppError("User not found", 404);
  return user.toSafeObject();
};

const updateUserProfile = async (userId, updates) => {
  const allowedUpdates = [
    "firstName",
    "lastName",
    "phoneNumber",
    "dateOfBirth",
    "bio",
    "avatar",
  ];
  const filtered = {};

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }

  const user = await User.findByIdAndUpdate(userId, filtered, {
    new: true,
    runValidators: true,
  }).populate("role");

  if (!user) throw new AppError("User not found", 404);

  logger.info(`Profile updated: ${user.email}`);
  return user.toSafeObject();
};

const updateUserPreferences = async (userId, preferences) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (preferences.language) user.preferences.language = preferences.language;
  if (preferences.timezone) user.preferences.timezone = preferences.timezone;
  if (preferences.notifications) {
    user.preferences.notifications = {
      ...user.preferences.notifications,
      ...preferences.notifications,
    };
  }

  await user.save();
  logger.info(`Preferences updated: ${user.email}`);
  return user.preferences;
};

const deleteUserAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  await Token.revokeUserTokens(userId, "Account deleted");
  await user.deleteOne();

  logger.info(`Account deleted: ${user.email}`);
};

const listUsers = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    filters = {},
    sort = { createdAt: -1 },
  } = options;

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filters)
      .populate("role")
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .select("-password"),
    User.countDocuments(filters),
  ]);

  return {
    users: users.map((u) => u.toSafeObject()),
    pagination: generatePaginationInfo(page, limit, total),
  };
};

const searchUsers = async (query, options = {}) => {
  const { limit = 10 } = options;

  const searchRegex = new RegExp(query, "i");
  const users = await User.find({
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ],
  })
    .populate("role")
    .limit(limit)
    .select("-password");

  return users.map((u) => u.toSafeObject());
};

const updateUserRole = async (userId, roleId) => {
  const [user, role] = await Promise.all([
    User.findById(userId),
    Role.findById(roleId),
  ]);

  if (!user) throw new AppError("User not found", 404);
  if (!role) throw new AppError("Role not found", 404);

  user.role = roleId;
  await user.save();

  await Token.revokeUserTokens(userId, "Role changed");

  logger.info(`Role updated: ${user.email} -> ${role.name}`);
  return (await User.findById(userId).populate("role")).toSafeObject();
};

const activateUserAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  user.isActive = true;
  user.isLocked = false;
  user.lockUntil = null;
  await user.save();

  logger.info(`Account activated: ${user.email}`);
};

const deactivateUserAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  user.isActive = false;
  await user.save();

  await Token.revokeUserTokens(userId, "Account deactivated");

  logger.info(`Account deactivated: ${user.email}`);
};

const getUserStatistics = async () => {
  const [total, active, verified, locked] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isEmailVerified: true }),
    User.countDocuments({ isLocked: true }),
  ]);

  return { total, active, verified, locked };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateUserPreferences,
  deleteUserAccount,
  listUsers,
  searchUsers,
  updateUserRole,
  activateUserAccount,
  deactivateUserAccount,
  getUserStatistics,
};
