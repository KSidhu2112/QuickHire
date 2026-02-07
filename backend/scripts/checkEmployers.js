const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const checkEmployers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const employers = await User.find({ role: 'employer' });
        console.log('Total Employers:', employers.length);

        employers.forEach((emp, index) => {
            console.log(`${index + 1}. ${emp.name} - ${emp.email} - ${emp.profile?.company || 'N/A'}`);
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

checkEmployers();
