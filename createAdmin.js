const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'Communityserver@gmail.com' });
    
    if (existingAdmin) {
      console.log('Admin already exists with email: Communityserver@gmail.com');
      console.log('Admin details:', {
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role
      });
      process.exit(0);
    }

    // Create admin
    const admin = await User.create({
      name: 'Community Server Admin',
      email: 'Communityserver@gmail.com',
      password: 'Cser@99',
      phone: '0000000000',
      city: 'System',
      address: 'System HQ',
      role: 'admin'
    });

    console.log('Admin created successfully!');
    console.log('Login credentials:');
    console.log('Email: Communityserver@gmail.com');
    console.log('Password: Cser@99');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
