// initRoles.js
require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');

const initializeRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Initialize default roles
    await Role.initializeDefaultRoles();
    
    console.log('✅ Default roles initialized successfully!');
    
    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

initializeRoles();
