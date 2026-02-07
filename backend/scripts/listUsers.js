const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'name email role createdAt');
        console.log('--- USERS ---');
        users.forEach(u => {
            console.log(`${u.role}: ${u.name} (${u.email}) - Created: ${u.createdAt}`);
        });
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
