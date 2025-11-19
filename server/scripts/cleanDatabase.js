// src/scripts/cleanDatabase.js

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Role = require('../models/Role');
const Token = require('../models/Token');
const OAuthProvider = require('../models/OAuthProvider');

const cleanDatabase = async () => {
  try {
    // Connect to database using your existing connectDB function
    await connectDB();

    console.log('Connected to MongoDB, cleaning database...');

    // Delete all documents from collections
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Token.deleteMany({}),
      OAuthProvider.deleteMany({}),
    ]);

    console.log('✅ Database cleaned: all users, roles, tokens, OAuth providers removed.');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed, script finished.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
};

// Run the cleaning script
cleanDatabase();
