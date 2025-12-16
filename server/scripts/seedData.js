require("dotenv").config();
const mongoose = require("mongoose");
const Role = require("../models/Role");
const User = require("../models/User");
const { logger } = require("../services/loggerService");

const MONGODB_URI = process.env.MONGODB_URI;

const sampleUsers = [
  {
    firstName: "Super",
    lastName: "Admin",
    email: "superadmin@example.com",
    password: "SuperAdmin123!",
    roleName: "superadmin",
    isEmailVerified: true,
  },
  {
    firstName: "Alice",
    lastName: "Admin",
    email: "alice.admin@example.com",
    password: "AdminPass123!",
    roleName: "admin",
    isEmailVerified: true,
  },
  {
    firstName: "Mark",
    lastName: "Moderator",
    email: "mark.moderator@example.com",
    password: "Moderator123!",
    roleName: "moderator",
    isEmailVerified: true,
  },
  {
    firstName: "User",
    lastName: "One",
    email: "user.one@example.com",
    password: "UserPass123!",
    roleName: "user",
    isEmailVerified: false,
  },
];

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("Connected to MongoDB");

    await Role.initializeDefaultRoles();

    for (const userData of sampleUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const role = await Role.findOne({ name: userData.roleName });
        if (!role) {
          logger.error(`Role not found: ${userData.roleName}`);
          continue;
        }
        await User.create({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email.toLowerCase(),
          password: userData.password,
          role: role._id,
          isEmailVerified: userData.isEmailVerified,
          provider: "local",
        });
        logger.info(`User created: ${userData.email}`);
      } else {
        logger.info(`User exists: ${userData.email}`);
      }
    }

    logger.info("Seeding completed");
    await mongoose.disconnect();
  } catch (error) {
    logger.error("Seeding failed", error);
    process.exit(1);
  }
}

main();
