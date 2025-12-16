const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // This already creates index
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[a-z]+$/.test(v);
        },
        message: 'Role name must contain only lowercase letters'
      }
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 200,
    },
    permissions: [
      {
        resource: {
          type: String,
          required: true,
          enum: [
            "users",
            "roles",
            "posts",
            "comments",
            "settings",
            "analytics",
            "reports",
            "files",
            "notifications",
            "logs",
          ],
        },
        actions: [
          {
            type: String,
            required: true,
            enum: ["create", "read", "update", "delete", "manage"],
          },
        ],
      },
    ],
    level: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    userCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes (removed duplicate name index)
roleSchema.index({ level: -1 });
roleSchema.index({ isActive: 1 });

// Instance Methods
roleSchema.methods.hasPermission = function (resource, action) {
  const permission = this.permissions.find((p) => p.resource === resource);
  if (!permission) return false;
  return (
    permission.actions.includes(action) || permission.actions.includes("manage")
  );
};

roleSchema.methods.addPermission = async function (resource, action) {
  const permission = this.permissions.find((p) => p.resource === resource);

  if (permission) {
    if (!permission.actions.includes(action)) {
      permission.actions.push(action);
    }
  } else {
    this.permissions.push({ resource, actions: [action] });
  }

  return await this.save();
};

roleSchema.methods.removePermission = async function (resource, action) {
  const permission = this.permissions.find((p) => p.resource === resource);

  if (permission) {
    permission.actions = permission.actions.filter((a) => a !== action);
    if (permission.actions.length === 0) {
      this.permissions = this.permissions.filter(
        (p) => p.resource !== resource,
      );
    }
  }

  return await this.save();
};

roleSchema.methods.getAllPermissions = function () {
  return this.permissions.map((p) => ({
    resource: p.resource,
    actions: p.actions,
  }));
};

// Static Methods
roleSchema.statics.findByName = async function (name) {
  return await this.findOne({ name: name.toLowerCase() });
};

roleSchema.statics.getDefaultRole = async function () {
  return await this.findOne({ name: "user" });
};

roleSchema.statics.getActiveRoles = async function () {
  return await this.find({ isActive: true }).sort({ level: -1 });
};

roleSchema.statics.getRoleHierarchy = async function () {
  return await this.find().sort({ level: -1 });
};

roleSchema.statics.initializeDefaultRoles = async function () {
  const defaultRoles = [
    {
      name: "superadmin",
      displayName: "Super Administrator",
      description: "Full system access with all permissions",
      level: 10,
      isSystem: true,
      permissions: [
        { resource: "users", actions: ["manage"] },
        { resource: "roles", actions: ["manage"] },
        { resource: "posts", actions: ["manage"] },
        { resource: "comments", actions: ["manage"] },
        { resource: "settings", actions: ["manage"] },
        { resource: "analytics", actions: ["manage"] },
        { resource: "reports", actions: ["manage"] },
        { resource: "files", actions: ["manage"] },
        { resource: "notifications", actions: ["manage"] },
        { resource: "logs", actions: ["manage"] },
      ],
    },
    {
      name: "admin",
      displayName: "Administrator",
      description: "Administrative access with most permissions",
      level: 8,
      isSystem: true,
      permissions: [
        { resource: "users", actions: ["create", "read", "update", "delete"] },
        { resource: "roles", actions: ["read"] },
        { resource: "posts", actions: ["manage"] },
        { resource: "comments", actions: ["manage"] },
        { resource: "settings", actions: ["read", "update"] },
        { resource: "analytics", actions: ["read"] },
        { resource: "reports", actions: ["read"] },
        { resource: "files", actions: ["manage"] },
      ],
    },
    {
      name: "moderator",
      displayName: "Moderator",
      description: "Content moderation and user management",
      level: 5,
      isSystem: true,
      permissions: [
        { resource: "users", actions: ["read", "update"] },
        { resource: "posts", actions: ["read", "update", "delete"] },
        { resource: "comments", actions: ["read", "update", "delete"] },
        { resource: "files", actions: ["read", "update", "delete"] },
      ],
    },
    {
      name: "user",
      displayName: "User",
      description: "Standard user with basic permissions",
      level: 3,
      isSystem: true,
      permissions: [
        { resource: "posts", actions: ["create", "read", "update"] },
        { resource: "comments", actions: ["create", "read", "update"] },
        { resource: "files", actions: ["create", "read", "update"] },
      ],
    },
    {
      name: "guest",
      displayName: "Guest",
      description: "Limited read-only access",
      level: 1,
      isSystem: true,
      permissions: [
        { resource: "posts", actions: ["read"] },
        { resource: "comments", actions: ["read"] },
      ],
    },
  ];

  for (const roleData of defaultRoles) {
    const existing = await this.findOne({ name: roleData.name });
    if (!existing) {
      await this.create(roleData);
    } else {
      if (existing.isSystem) {
        existing.permissions = roleData.permissions;
        await existing.save();
      }
    }
  }
};

// Pre-save hook
roleSchema.pre('save', function(next) {
  if (this.isModified('name') && this.isSystem && !this.isNew) {
    return next(new Error('Cannot modify system role name'));
  }
  next();
});

// Pre-remove hook
roleSchema.pre('remove', function(next) {
  if (this.isSystem) {
    return next(new Error('Cannot delete system role'));
  }
  next();
});

module.exports = mongoose.model("Role", roleSchema);
