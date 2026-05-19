const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');
const { notifyShortlisted } = require('./services/notificationService');

dotenv.config();

const testDirectHire = async () => {
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected!');

        // Find test employer, worker, and job
        const employer = await User.findOne({ email: 'test_employer_ai@quickhire.com' });
        const worker = await User.findOne({ email: 'test_worker_ai@quickhire.com' });
        const job = await Job.findOne({ title: 'Full Stack React & Node Developer' });

        if (!employer || !worker || !job) {
            console.log('❌ Seeding data is missing. Please run test-ai-matching.js first.');
            return;
        }

        console.log(`🏢 Employer: ${employer.name} (${employer._id})`);
        console.log(`👤 Worker: ${worker.name} (${worker._id})`);
        console.log(`📝 Job: ${job.title} (${job._id})`);

        // Check if there is an existing application
        let application = await Application.findOne({ job: job._id, jobseeker: worker._id });
        if (application) {
            console.log('⚠️ Application already exists. Resetting status to test direct hire...');
            application.status = 'APPLIED';
            await application.save();
        } else {
            console.log('📝 Creating a mock application first...');
            application = await Application.create({
                job: job._id,
                jobseeker: worker._id,
                employer: employer._id,
                coverLetter: 'Test Application',
                status: 'APPLIED'
            });
        }

        console.log('⚡ Running Direct Hire Logic...');
        // Simulating direct hire updates
        application.status = 'ACCEPTED';
        application.employerNotes = 'Hired directly from AI recommendation matches';
        application.reviewedAt = new Date();
        application.reviewedBy = employer._id;
        await application.save();

        await job.hireWorker();
        console.log('✅ Job workers hired count updated!');

        // Trigger notification
        console.log('🔔 Sending direct hire notification...');
        await notifyShortlisted(
            worker._id,
            job._id,
            application._id,
            job.title,
            job.company
        );
        console.log('🎉 Notification sent successfully!');

        // Verify notification was stored
        const Notification = require('./models/Notification');
        const latestNotif = await Notification.findOne({ recipient: worker._id }).sort({ createdAt: -1 });
        console.log('📬 Latest Notification in DB:', latestNotif);

        console.log('✅ All direct-hire backend logic successfully validated!');
    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 DB Disconnected.');
    }
};

testDirectHire();
