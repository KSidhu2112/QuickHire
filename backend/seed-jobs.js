const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

const Job = require('./models/Job');
const User = require('./models/User');

// Sample jobs data for different employers
const sampleJobs = async () => {
    try {
        // First, find or create sample employers
        const employers = await User.find({ role: 'employer' }).limit(5);

        if (employers.length === 0) {
            console.log('⚠️  No employers found. Please create employer accounts first.');
            console.log('💡 You can create employers through the registration page.');
            process.exit(0);
        }

        console.log(`📊 Found ${employers.length} employers`);

        // Delete existing sample jobs (optional)
        // await Job.deleteMany({});
        // console.log('🗑️  Cleared existing jobs');

        // Create sample jobs
        const jobs = [
            // Full-Time Jobs
            {
                employer: employers[0]._id,
                title: 'Restaurant Manager',
                description: 'Looking for an experienced restaurant manager to oversee daily operations, manage staff, and ensure excellent customer service. Must have knowledge of food safety regulations and team management.',
                company: 'McDonald\'s Bangalore',
                jobType: 'FULL_TIME',
                salaryType: 'MONTHLY',
                salaryMin: 25000,
                salaryMax: 35000,
                location: {
                    city: 'Bangalore',
                    state: 'Karnataka',
                    address: 'MG Road, Bangalore',
                    zipCode: '560001'
                },
                skills: ['Customer Service', 'Team Management', 'Food Safety'],
                experience: 'MID',
                status: 'ACTIVE'
            },
            {
                employer: employers[0]._id,
                title: 'Warehouse Supervisor',
                description: 'Amazon is hiring warehouse supervisors to manage inventory, coordinate shipments, and lead warehouse teams. Experience with logistics and inventory management systems required.',
                company: 'Amazon Warehouse Hyderabad',
                jobType: 'FULL_TIME',
                salaryType: 'MONTHLY',
                salaryMin: 30000,
                salaryMax: 45000,
                location: {
                    city: 'Hyderabad',
                    state: 'Telangana',
                    address: 'Gachibowli, Hyderabad',
                    zipCode: '500032'
                },
                skills: ['Inventory Management', 'Leadership', 'Logistics'],
                experience: 'ENTRY',
                status: 'ACTIVE'
            },
            {
                employer: employers[1] ? employers[1]._id : employers[0]._id,
                title: 'Store Manager',
                description: 'DMart seeks an energetic store manager to oversee retail operations, manage staff, handle customer queries, and ensure store cleanliness and organization.',
                company: 'DMart Pune',
                jobType: 'FULL_TIME',
                salaryType: 'MONTHLY',
                salaryMin: 28000,
                salaryMax: 40000,
                location: {
                    city: 'Pune',
                    state: 'Maharashtra',
                    address: 'Kothrud, Pune',
                    zipCode: '411038'
                },
                skills: ['Retail Management', 'Customer Service', 'Inventory'],
                experience: 'MID',
                status: 'ACTIVE'
            },

            // Part-Time Jobs
            {
                employer: employers[1] ? employers[1]._id : employers[0]._id,
                title: 'Cashier',
                description: 'Part-time cashier needed for billing operations, customer assistance, and maintaining checkout areas. Flexible shifts available.',
                company: 'DMart',
                jobType: 'PART_TIME',
                salaryType: 'MONTHLY',
                salaryMin: 12000,
                salaryMax: 18000,
                location: {
                    city: 'Hyderabad',
                    state: 'Telangana',
                    address: 'Kukatpally, Hyderabad'
                },
                skills: ['Billing', 'Customer Service', 'Cash Handling'],
                experience: 'FRESHER',
                status: 'ACTIVE'
            },
            {
                employer: employers[2] ? employers[2]._id : employers[0]._id,
                title: 'Kitchen Helper',
                description: 'Looking for kitchen helpers to assist with food preparation, maintaining kitchen cleanliness, and supporting the main chef. Part-time evening shifts.',
                company: 'KFC Restaurant',
                jobType: 'PART_TIME',
                salaryType: 'MONTHLY',
                salaryMin: 10000,
                salaryMax: 15000,
                location: {
                    city: 'Bangalore',
                    state: 'Karnataka',
                    address: 'Indiranagar, Bangalore'
                },
                skills: ['Food Preparation', 'Kitchen Hygiene', 'Teamwork'],
                experience: 'FRESHER',
                status: 'ACTIVE'
            },
            {
                employer: employers[2] ? employers[2]._id : employers[0]._id,
                title: 'Customer Support Representative',
                description: 'Part-time customer support role handling phone calls, emails, and chat support. Good communication skills required. Work from office.',
                company: 'Flipkart Support Center',
                jobType: 'PART_TIME',
                salaryType: 'HOURLY',
                salaryMin: 150,
                salaryMax: 200,
                location: {
                    city: 'Chennai',
                    state: 'Tamil Nadu',
                    address: 'Thoraipakkam, Chennai'
                },
                skills: ['Communication', 'Problem Solving', 'Computer Skills'],
                experience: 'FRESHER',
                status: 'ACTIVE'
            },

            // Daily Jobs
            {
                employer: employers[3] ? employers[3]._id : employers[0]._id,
                title: 'Delivery Partner',
                description: 'Need delivery partners for grocery deliveries. Must have own two-wheeler and valid driving license. Same-day payment.',
                company: 'BigBasket',
                jobType: 'DAILY',
                salaryType: 'DAILY',
                salaryMin: 800,
                salaryMax: 1200,
                location: {
                    city: 'Pune',
                    state: 'Maharashtra',
                    address: 'Viman Nagar, Pune'
                },
                workDate: new Date(new Date().setDate(new Date().getDate() + 2)), // 2 days from now
                startTime: '09:00',
                endTime: '18:00',
                workersRequired: 5,
                workersHired: 3,
                skills: ['Bike License', 'Navigation', 'Customer Service'],
                experience: 'ANY',
                status: 'ACTIVE'
            },
            {
                employer: employers[3] ? employers[3]._id : employers[0]._id,
                title: 'Event Helper',
                description: 'Helpers needed for wedding event setup, serving, and cleanup. Food and transport provided.',
                company: 'Grand Events & Catering',
                jobType: 'DAILY',
                salaryType: 'DAILY',
                salaryMin: 1000,
                salaryMax: 1000,
                location: {
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    address: 'Andheri West, Mumbai'
                },
                workDate: new Date(new Date().setDate(new Date().getDate() + 5)), // 5 days from now
                startTime: '14:00',
                endTime: '23:00',
                workersRequired: 10,
                workersHired: 4,
                skills: ['Event Support', 'Customer Service', 'Physical Fitness'],
                experience: 'ANY',
                status: 'ACTIVE'
            },
            {
                employer: employers[4] ? employers[4]._id : employers[0]._id,
                title: 'Warehouse Packing Associate',
                description: 'Urgent requirement for packing associates for one-day Amazon sale event. Pack and label products for shipment.',
                company: 'Amazon Fulfillment Center',
                jobType: 'DAILY',
                salaryType: 'DAILY',
                salaryMin: 700,
                salaryMax: 900,
                location: {
                    city: 'Delhi',
                    state: 'Delhi',
                    address: 'Mundka, Delhi'
                },
                workDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
                startTime: '08:00',
                endTime: '20:00',
                workersRequired: 20,
                workersHired: 12,
                skills: ['Packing', 'Attention to Detail', 'Physical Stamina'],
                experience: 'ANY',
                status: 'ACTIVE'
            },
            {
                employer: employers[4] ? employers[4]._id : employers[0]._id,
                title: 'Store Helper',
                description: 'Need helpers for inventory counting and shelf stocking for one day. Basic knowledge of retail operations preferred.',
                company: 'Reliance Fresh',
                jobType: 'DAILY',
                salaryType: 'DAILY',
                salaryMin: 600,
                salaryMax: 800,
                location: {
                    city: 'Bangalore',
                    state: 'Karnataka',
                    address: 'Koramangala, Bangalore'
                },
                workDate: new Date(new Date().setDate(new Date().getDate() + 3)), // 3 days from now
                startTime: '10:00',
                endTime: '19:00',
                workersRequired: 8,
                workersHired: 2,
                skills: ['Retail Operations', 'Inventory', 'Teamwork'],
                experience: 'ANY',
                status: 'ACTIVE'
            },
            {
                employer: employers[0]._id,
                title: 'Cleaning Staff',
                description: 'Restaurant cleaning staff needed for deep cleaning. All cleaning supplies provided.',
                company: 'Domino\'s Pizza',
                jobType: 'DAILY',
                salaryType: 'DAILY',
                salaryMin: 500,
                salaryMax: 700,
                location: {
                    city: 'Chennai',
                    state: 'Tamil Nadu',
                    address: 'Anna Nagar, Chennai'
                },
                workDate: new Date(new Date().setDate(new Date().getDate() + 4)), // 4 days from now
                startTime: '06:00',
                endTime: '12:00',
                workersRequired: 3,
                workersHired: 1,
                skills: ['Cleaning', 'Hygiene Standards'],
                experience: 'ANY',
                status: 'ACTIVE'
            }
        ];

        // Insert jobs
        const createdJobs = await Job.insertMany(jobs);
        console.log(`✅ Successfully created ${createdJobs.length} sample jobs!`);
        console.log('\n📋 Job Summary:');
        console.log(`   - Full-Time Jobs: ${jobs.filter(j => j.jobType === 'FULL_TIME').length}`);
        console.log(`   - Part-Time Jobs: ${jobs.filter(j => j.jobType === 'PART_TIME').length}`);
        console.log(`   - Daily Jobs: ${jobs.filter(j => j.jobType === 'DAILY').length}`);
        console.log('\n🎉 Sample jobs are now available in the employee dashboard!');
        console.log('🌐 Visit http://localhost:5173 and login as a job seeker to view them.');

    } catch (error) {
        console.error('❌ Error creating sample jobs:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n👋 Database connection closed.');
    }
};

// Run the seeder
sampleJobs();
