require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Role = require("../models/Role");
const Token = require("../models/Token");
const OAuthProvider = require("../models/OAuthProvider");

const cleanDatabase = async () => {
  try {
    await connectDB();
    console.log("✅ Connected, cleaning database...");

    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Token.deleteMany({}),
      OAuthProvider.deleteMany({}),
    ]);

    console.log("✅ Database cleaned");

    await mongoose.connection.close();
    console.log("✅ Connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

cleanDatabase();
