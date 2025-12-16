const roleService = require("../services/roleService");
const { asyncHandler } = require("../middleware/errorHandler");

const createRole = asyncHandler(async (req, res) => {
  const role = await roleService.createRole(req.body);
  res
    .status(201)
    .json({ success: true, message: "Role created", data: { role } });
});

const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.listAllRoles({
    activeOnly: req.query.activeOnly === "true",
  });
  res.status(200).json({ success: true, data: { roles, total: roles.length } });
});

const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.roleId);
  res.status(200).json({ success: true, data: { role } });
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(req.params.roleId, req.body);
  res
    .status(200)
    .json({ success: true, message: "Role updated", data: { role } });
});

const deleteRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const force = req.query.force === "true";

  const result = await roleService.deleteRole(roleId, force);

  res.status(200).json({
    success: true,
    message: "Role deleted successfully",
    data: result,
  });
});

const addPermission = asyncHandler(async (req, res) => {
  const { resource, action } = req.body;
  const role = await roleService.addPermissionToRole(
    req.params.roleId,
    resource,
    action,
  );
  res
    .status(200)
    .json({ success: true, message: "Permission added", data: { role } });
});

const removePermission = asyncHandler(async (req, res) => {
  const { resource, action } = req.body;
  const role = await roleService.removePermissionFromRole(
    req.params.roleId,
    resource,
    action,
  );
  res
    .status(200)
    .json({ success: true, message: "Permission removed", data: { role } });
});

const getRolePermissions = asyncHandler(async (req, res) => {
  const permissions = await roleService.getRolePermissions(req.params.roleId);
  res.status(200).json({ success: true, data: { permissions } });
});

const getUsersByRole = asyncHandler(async (req, res) => {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };
  const result = await roleService.getUsersByRole(req.params.roleId, options);
  res.status(200).json({ success: true, data: result });
});

const getRoleStatistics = asyncHandler(async (req, res) => {
  const stats = await roleService.getRoleStatistics();
  res.status(200).json({ success: true, data: { stats } });
});

const initializeRoles = asyncHandler(async (req, res) => {
  await roleService.initializeDefaultRoles();
  res.status(200).json({ success: true, message: "Default roles initialized" });
});

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  addPermission,
  removePermission,
  getRolePermissions,
  getUsersByRole,
  getRoleStatistics,
  initializeRoles,
};
