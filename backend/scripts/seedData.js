require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Job.deleteMany({});
        console.log('🗑️  Cleared existing users and jobs');

        // Create Employers
        const employers = [];
        for (let i = 1; i <= 5; i++) {
            employers.push({
                name: `Employer ${i}`,
                email: `employer${i}@example.com`,
                password: 'password123',
                role: 'employer',
                status: 'active',
                isEmailVerified: true,
                phone: `123456789${i}`,
                profile: {
                    company: `Company ${i}`,
                    businessType: 'IT Services',
                    location: `City ${i}, State`,
                    bio: `We are a leading company in sector ${i}.`
                }
            });
        }
        const createdEmployers = await User.create(employers);
        console.log(`✅ Created ${createdEmployers.length} employers`);

        // Create Job Seekers
        const jobSeekers = [];
        for (let i = 1; i <= 5; i++) {
            jobSeekers.push({
                name: `Job Seeker ${i}`,
                email: `seeker${i}@example.com`,
                password: 'password123',
                role: 'jobseeker',
                status: 'active',
                isEmailVerified: true,
                phone: `987654321${i}`,
                profile: {
                    skills: ['JavaScript', 'React', 'Node.js'],
                    experience: '2 years',
                    education: 'Bachelor of Science'
                }
            });
        }
        const createdSeekers = await User.create(jobSeekers);
        console.log(`✅ Created ${createdSeekers.length} job seekers`);

        // Create Jobs
        const jobs = [];
        const jobTypes = ['FULL_TIME', 'PART_TIME', 'REMOTE', 'CONTRACT'];

        for (let i = 0; i < 10; i++) {
            const employer = createdEmployers[i % createdEmployers.length];
            jobs.push({
                employer: employer._id,
                title: `Software Engineer ${i + 1}`,
                description: `We are looking for a skilled Software Engineer ${i + 1} to join our team.`,
                company: employer.profile.company,
                jobType: 'FULL_TIME',
                vacancyType: 'SINGLE',
                salaryType: 'MONTHLY',
                salaryMin: 50000 + (i * 1000),
                salaryMax: 80000 + (i * 1000),
                location: {
                    city: `City ${i}`,
                    state: 'State',
                    address: `123 Street ${i}`
                },
                workersRequired: 1,
                status: i % 3 === 0 ? 'CLOSED' : 'ACTIVE', // Some closed jobs
                autoApprove: false,
                category: 'IT'
            });
        }
        await Job.create(jobs);
        console.log(`✅ Created ${jobs.length} jobs`);

        console.log('🎉 Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
