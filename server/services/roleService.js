const Role = require("../models/Role");
const User = require("../models/User");
const { AppError } = require("../utils/errors");
const { logger } = require("./loggerService");
const { generatePaginationInfo } = require("../utils/helpers");

const createRole = async (roleData) => {
  const { name, displayName, description, level, permissions } = roleData;

  const existing = await Role.findOne({ name: name.toLowerCase() });
  if (existing) throw new AppError("Role already exists", 409);

  const role = await Role.create({
    name: name.toLowerCase(),
    displayName,
    description,
    level,
    permissions,
  });

  logger.info(`Role created: ${role.name}`);
  return role;
};

const listAllRoles = async (options = {}) => {
  const { activeOnly = false } = options;
  const query = activeOnly ? { isActive: true } : {};
  return await Role.find(query).sort({ level: -1 });
};

const getRoleById = async (roleId) => {
  const role = await Role.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);
  return role;
};

const updateRole = async (roleId, updates) => {
  const role = await Role.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);
  if (role.isSystem && updates.name)
    throw new AppError("Cannot rename system role", 400);

  Object.assign(role, updates);
  await role.save();

  logger.info(`Role updated: ${role.name}`);
  return role;
};

const deleteRole = async (roleId, force = false) => {
  const role = await Role.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);
  
  // Check if system role
  if (role.isSystem && !force) {
    throw new AppError(
      "Cannot delete system role. Use force=true query parameter to override (not recommended).",
      400
    );
  }

  // Check if role is assigned to users
  const usersWithRole = await User.countDocuments({ role: roleId });
  if (usersWithRole > 0) {
    throw new AppError(
      `Cannot delete role. ${usersWithRole} user(s) assigned to this role.`,
      400
    );
  }

  await role.deleteOne();
  logger.warn(`Role deleted: ${role.name}${force ? " (FORCED)" : ""}`);
  
  return { deleted: true, roleName: role.name };
};

const addPermissionToRole = async (roleId, resource, action) => {
  const role = await Role.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);

  await role.addPermission(resource, action);
  logger.info(`Permission added: ${role.name} - ${resource}:${action}`);
  return role;
};

const removePermissionFromRole = async (roleId, resource, action) => {
  const role = await Role.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);

  await role.removePermission(resource, action);
  logger.info(`Permission removed: ${role.name} - ${resource}:${action}`);
  return role;
};

const getRolePermissions = async (roleId) => {
  const role = await Role.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);
  return role.getAllPermissions();
};

const getUsersByRole = async (roleId, options = {}) => {
  const { page = 1, limit = 10 } = options;

  const role = await Role.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find({ role: roleId }).skip(skip).limit(limit).select("-password"),
    User.countDocuments({ role: roleId }),
  ]);

  return {
    users,
    pagination: generatePaginationInfo(page, limit, total),
  };
};

const getRoleStatistics = async () => {
  const [total, active, byLevel] = await Promise.all([
    Role.countDocuments(),
    Role.countDocuments({ isActive: true }),
    Role.aggregate([
      { $group: { _id: "$level", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
  ]);

  return { total, active, byLevel };
};

const initializeDefaultRoles = async () => {
  await Role.initializeDefaultRoles();
  logger.info("Default roles initialized");
};

module.exports = {
  createRole,
  listAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  addPermissionToRole,
  removePermissionFromRole,
  getRolePermissions,
  getUsersByRole,
  getRoleStatistics,
  initializeDefaultRoles,
};
