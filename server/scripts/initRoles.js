require("dotenv").config();
const mongoose = require("mongoose");
const Role = require("../models/Role");

const initializeRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    await Role.initializeDefaultRoles();

    console.log("✅ Default roles initialized");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

initializeRoles();
