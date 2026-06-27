const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Seed a default admin user if none exists in the database
 */
const seedAdmin = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('No admin users found. Seeding default admin account...');
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@communityservice.com';
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPassword123!';
      
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        phone: '0000000000',
        city: 'System',
        address: 'System HQ',
        role: 'admin'
      });
      console.log(`Default admin created successfully with email: ${adminEmail}`);
    }
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

/**
 * Establish connection to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/community_service_db');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // Seed default admin account
    await seedAdmin();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;

