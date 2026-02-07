const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

const cleanFakeData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Find fake users (created by seedData.js)
        // Pattern: Name starts with "Employer " or "Job Seeker " followed by a number
        const fakeUserPattern = /^(Employer|Job Seeker) \d+$/;

        const fakeUsers = await User.find({ name: { $regex: fakeUserPattern } });
        const fakeUserIds = fakeUsers.map(u => u._id);

        console.log(`🔍 Found ${fakeUsers.length} fake users.`);

        if (fakeUsers.length > 0) {
            // 2. Delete Jobs posted by fake employers
            const deletedJobs = await Job.deleteMany({ employer: { $in: fakeUserIds } });
            console.log(`🗑️  Deleted ${deletedJobs.deletedCount} jobs posted by fake employers.`);

            // 3. Delete Applications made by fake job seekers
            const deletedApplications = await Application.deleteMany({ applicant: { $in: fakeUserIds } });
            console.log(`🗑️  Deleted ${deletedApplications.deletedCount} applications by fake job seekers.`);

            // 4. Delete the fake users themselves
            const deletedUsers = await User.deleteMany({ _id: { $in: fakeUserIds } });
            console.log(`🗑️  Deleted ${deletedUsers.deletedCount} fake users.`);
        } else {
            console.log('ℹ️  No fake users found to delete.');
        }

        console.log('✅ Database cleanup complete. Real users should remain.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning data:', error);
        process.exit(1);
    }
};

cleanFakeData();
