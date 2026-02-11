const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        const adminEmail = 'admin@quickhire.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('⚠️ Admin user already exists');
            process.exit();
        }

        const adminUser = await User.create({
            name: 'Super Admin',
            email: adminEmail,
            password: 'password123', // Will be hashed by pre-save hook
            role: 'admin',
            isEmailVerified: true,
            status: 'active'
        });

        console.log('✅ Admin user created successfully:', adminUser.email);
        process.exit();
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
