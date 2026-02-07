const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

const seedRealUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if these users already exist
        const existingEmployer = await User.findOne({ email: 'john@techsolutions.com' });
        const existingJobSeeker = await User.findOne({ email: 'jane.doe@example.com' });

        if (existingEmployer && existingJobSeeker) {
            console.log('ℹ️  Sample users already exist.');
            process.exit(0);
        }

        const password = await bcrypt.hash('password123', 10);

        if (!existingEmployer) {
            await User.create({
                name: 'John Smith',
                email: 'john@techsolutions.com',
                password: password,
                role: 'employer',
                isEmailVerified: true,
                phone: '555-0123',
                profile: {
                    company: 'Tech Solutions Inc.',
                    location: 'San Francisco, CA',
                    bio: 'Leading tech company specializing in AI solutions.',
                    website: 'https://techsolutions.com',
                    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
                }
            });
            console.log('✅ Created Employer: John Smith (Tech Solutions Inc.)');
        }

        if (!existingJobSeeker) {
            await User.create({
                name: 'Jane Doe',
                email: 'jane.doe@example.com',
                password: password,
                role: 'jobseeker',
                isEmailVerified: true,
                phone: '555-0456',
                profile: {
                    title: 'Software Engineer',
                    location: 'New York, NY',
                    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
                    experience: '3 years',
                    bio: 'Passionate full-stack developer with experience in modern web technologies.',
                    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
                }
            });
            console.log('✅ Created Job Seeker: Jane Doe');
        }

        console.log('✅ Sample data seeded successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedRealUsers();
