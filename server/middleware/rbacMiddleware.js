const { AppError } = require("../utils/errors");
const { logger } = require("../services/loggerService");

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (!req.user.role) {
      logger.error(`No role assigned: ${req.user._id}`);
      return next(new AppError("No role assigned", 403));
    }

    const userRole = req.user.role.name;

    if (!roles.includes(userRole)) {
      logger.warn(
        `Access denied: ${req.user.email}, role ${userRole}. Required: ${roles.join(", ")}`,
      );
      return next(new AppError("Insufficient permissions", 403));
    }

    if (process.env.NODE_ENV === "development") {
      logger.debug(`Access granted: ${req.user.email}, role ${userRole}`);
    }

    next();
  };
};

const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    
    if (!req.user.role) {
      logger.error(`No role assigned: ${req.user._id}`);
      return next(new AppError("No role assigned", 403));
    }

    // Check if role has hasPermission method
    if (typeof req.user.role.hasPermission !== 'function') {
      logger.error(`Role object missing hasPermission method: ${req.user.role.name}`);
      return next(new AppError("Role configuration error", 500));
    }

    const hasPermission = req.user.role.hasPermission(resource, action);

    if (!hasPermission) {
      logger.warn(
        `Permission denied: ${req.user.email} (${req.user.role.name}). Needs: ${resource}:${action}`,
      );
      return next(new AppError(`Cannot ${action} ${resource}`, 403));
    }

    if (process.env.NODE_ENV === "development") {
      logger.debug(`Permission granted: ${req.user.email} can ${action} ${resource}`);
    }

    next();
  };
};

const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    
    if (!req.user.role) {
      return next(new AppError("No role assigned", 403));
    }

    const hasAny = permissions.some(({ resource, action }) =>
      req.user.role.hasPermission(resource, action),
    );

    if (!hasAny) {
      const permList = permissions
        .map((p) => `${p.resource}:${p.action}`)
        .join(" OR ");
      logger.warn(`Permission denied: ${req.user.email}. Needs one of: ${permList}`);
      return next(new AppError("Insufficient permissions", 403));
    }

    next();
  };
};

const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    
    if (!req.user.role) {
      return next(new AppError("No role assigned", 403));
    }

    const missing = permissions.filter(
      ({ resource, action }) => !req.user.role.hasPermission(resource, action),
    );

    if (missing.length > 0) {
      const missingList = missing
        .map((p) => `${p.resource}:${p.action}`)
        .join(", ");
      logger.warn(
        `Missing permissions: ${req.user.email}. Missing: ${missingList}`,
      );
      return next(new AppError("Missing required permissions", 403));
    }

    next();
  };
};

const requireOwnerOrAdmin = (userIdField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    const ownerId =
      req.params[userIdField] ||
      req.body[userIdField] ||
      req.query[userIdField];

    if (!ownerId) {
      logger.error(`Owner ID field '${userIdField}' not found in request`);
      return next(new AppError("Owner identification failed", 400));
    }

    const isOwner = req.user._id.toString() === ownerId.toString();
    const isAdmin = ["admin", "superadmin"].includes(req.user.role.name);

    if (!isOwner && !isAdmin) {
      logger.warn(
        `Access denied: ${req.user.email}. Not owner/admin. Resource owner: ${ownerId}`,
      );
      return next(new AppError("Can only access own resources", 403));
    }

    req.isOwner = isOwner;
    req.isAdmin = isAdmin;

    next();
  };
};

const requireMinimumRoleLevel = (minimumLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    
    if (!req.user.role) {
      return next(new AppError("No role assigned", 403));
    }

    if (req.user.role.level < minimumLevel) {
      logger.warn(
        `Role level denied: ${req.user.email}. Level ${req.user.role.level} < required ${minimumLevel}`,
      );
      return next(new AppError("Insufficient role level", 403));
    }

    next();
  };
};

const checkResourceOwnership = (user, resourceOwnerId) => {
  if (!user || !resourceOwnerId) return false;

  const isOwner = user._id.toString() === resourceOwnerId.toString();
  const isAdmin = ["admin", "superadmin"].includes(user.role?.name);

  return isOwner || isAdmin;
};

module.exports = {
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireOwnerOrAdmin,
  requireMinimumRoleLevel,
  checkResourceOwnership,
};
