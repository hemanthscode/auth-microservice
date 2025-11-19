// seedData.js
require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const { logger } = require('../services/loggerService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-microservice';

const defaultRoles = [
  {
    name: 'superadmin',
    displayName: 'Super Administrator',
    description: 'Full system access with all permissions',
    level: 10,
    isSystem: true,
    isActive: true,
    permissions: [
      { resource: 'users', actions: ['manage'] },
      { resource: 'roles', actions: ['manage'] },
      { resource: 'posts', actions: ['manage'] },
      { resource: 'comments', actions: ['manage'] },
      { resource: 'settings', actions: ['manage'] },
      { resource: 'analytics', actions: ['manage'] },
      { resource: 'reports', actions: ['manage'] },
      { resource: 'files', actions: ['manage'] },
      { resource: 'notifications', actions: ['manage'] },
      { resource: 'logs', actions: ['manage'] },
    ],
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Administrative access with most permissions',
    level: 8,
    isSystem: true,
    isActive: true,
    permissions: [
      { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'posts', actions: ['manage'] },
      { resource: 'comments', actions: ['manage'] },
      { resource: 'settings', actions: ['read', 'update'] },
      { resource: 'analytics', actions: ['read'] },
      { resource: 'reports', actions: ['read'] },
      { resource: 'files', actions: ['manage'] },
    ],
  },
  {
    name: 'moderator',
    displayName: 'Moderator',
    description: 'Content moderation and user management',
    level: 5,
    isSystem: true,
    isActive: true,
    permissions: [
      { resource: 'users', actions: ['read', 'update'] },
      { resource: 'posts', actions: ['read', 'update', 'delete'] },
      { resource: 'comments', actions: ['read', 'update', 'delete'] },
      { resource: 'files', actions: ['read', 'update', 'delete'] },
    ],
  },
  {
    name: 'user',
    displayName: 'User',
    description: 'Standard user with basic permissions',
    level: 3,
    isSystem: true,
    isActive: true,
    permissions: [
      { resource: 'posts', actions: ['create', 'read', 'update'] },
      { resource: 'comments', actions: ['create', 'read', 'update'] },
      { resource: 'files', actions: ['create', 'read', 'update'] },
    ],
  },
  {
    name: 'guest',
    displayName: 'Guest',
    description: 'Limited read-only access',
    level: 1,
    isSystem: true,
    isActive: true,
    permissions: [
      { resource: 'posts', actions: ['read'] },
      { resource: 'comments', actions: ['read'] },
    ],
  },
];

const sampleUsers = [
  {
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@example.com',
    password: 'SuperAdmin123!',
    roleName: 'superadmin',
    isEmailVerified: true,
  },
  {
    firstName: 'Alice',
    lastName: 'Admin',
    email: 'alice.admin@example.com',
    password: 'AdminPass123!',
    roleName: 'admin',
    isEmailVerified: true,
  },
  {
    firstName: 'Mark',
    lastName: 'Moderator',
    email: 'mark.moderator@example.com',
    password: 'Moderator123!',
    roleName: 'moderator',
    isEmailVerified: true,
  },
  {
    firstName: 'User',
    lastName: 'One',
    email: 'user.one@example.com',
    password: 'UserPass123!',
    roleName: 'user',
    isEmailVerified: false, // unverified user for testing
  },
];

async function seedRoles() {
  for (const roleData of defaultRoles) {
    const existingRole = await Role.findOne({ name: roleData.name });
    if (!existingRole) {
      await Role.create(roleData);
      logger.info(`Role created: ${roleData.name}`);
    } else {
      logger.info(`Role already exists: ${roleData.name}`);
    }
  }
}

async function seedUsers() {
  for (const userData of sampleUsers) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      const role = await Role.findOne({ name: userData.roleName });
      if (!role) {
        logger.error(`Role not found for user ${userData.email}: ${userData.roleName}`);
        continue;
      }
      const user = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email.toLowerCase(),
        password: userData.password, // Will be hashed in pre-save hook
        role: role._id,
        isEmailVerified: userData.isEmailVerified,
        provider: 'local',
      });
      await user.save();
      logger.info(`User created: ${user.email} with role ${userData.roleName}`);
    } else {
      logger.info(`User already exists: ${userData.email}`);
    }
  }
}

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    await seedRoles();
    await seedUsers();

    logger.info('Seeding completed');
    await mongoose.disconnect();
  } catch (error) {
    logger.error('Seeding failed', error);
    process.exit(1);
  }
}

main();

