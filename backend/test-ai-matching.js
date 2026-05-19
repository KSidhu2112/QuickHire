const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Job = require('./models/Job');
const aiMatchingService = require('./services/aiMatchingService');
const embeddingService = require('./services/embeddingService');

// Load env
dotenv.config();

const runTest = async () => {
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas!');

        // 1. Find or create a test worker
        let testWorker = await User.findOne({ email: 'test_worker_ai@quickhire.com' });
        if (!testWorker) {
            console.log('👤 Creating a new test worker...');
            testWorker = await User.create({
                name: 'Gopal Krishnan',
                email: 'test_worker_ai@quickhire.com',
                password: 'password123',
                role: 'jobseeker',
                isEmailVerified: true,
                phone: '9876543210',
                profile: {
                    skills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'],
                    experience: '3 years of web development',
                    education: 'Bachelor of Computer Science',
                    location: 'Bangalore'
                },
                stats: {
                    avgRating: 4.8,
                    reliabilityScore: 95,
                    jobsCompleted: 12
                }
            });
            console.log('✅ Created test worker:', testWorker.name);
        } else {
            console.log('✅ Found existing test worker:', testWorker.name);
            // Regenerate to make sure
            const text = embeddingService.buildWorkerProfileText(testWorker);
            testWorker.embedding = await embeddingService.generateEmbedding(text);
            await testWorker.save();
        }

        // 2. Find or create a test employer
        let testEmployer = await User.findOne({ email: 'test_employer_ai@quickhire.com' });
        if (!testEmployer) {
            console.log('🏢 Creating a new test employer...');
            testEmployer = await User.create({
                name: 'QuickHire HR',
                email: 'test_employer_ai@quickhire.com',
                password: 'password123',
                role: 'employer',
                isEmailVerified: true,
                profile: {
                    company: 'Tech Solutions Inc',
                    businessType: 'IT Services',
                    location: 'Bangalore'
                }
            });
            console.log('✅ Created test employer:', testEmployer.name);
        } else {
            console.log('✅ Found existing test employer:', testEmployer.name);
        }

        // 3. Find or create a test job
        let testJob = await Job.findOne({ title: 'Full Stack React & Node Developer' });
        if (!testJob) {
            console.log('📝 Creating a new test job...');
            testJob = await Job.create({
                employer: testEmployer._id,
                title: 'Full Stack React & Node Developer',
                description: 'We are looking for a skilled developer to build responsive UI and Express API backends. Must understand state management and database optimizations.',
                company: 'Tech Solutions Inc',
                jobType: 'PART_TIME',
                salaryType: 'HOURLY',
                salaryMin: 45,
                salaryMax: 60,
                location: {
                    city: 'Bangalore',
                    state: 'Karnataka',
                    address: '123 Tech Park'
                },
                skills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript'],
                experience: 'MID',
                category: 'DEVELOPER',
                workingHours: '20 hours/week'
            });
            console.log('✅ Created test job:', testJob.title);
        } else {
            console.log('✅ Found existing test job:', testJob.title);
            // Force save to trigger pre-save embedding hook
            const text = embeddingService.buildJobText(testJob);
            testJob.embedding = await embeddingService.generateEmbedding(text);
            await testJob.save();
        }

        // 4. Run Matching - Workers for Job
        console.log('\n--- MATCHING WORKERS FOR JOB ---');
        console.log(`Job: "${testJob.title}"`);
        console.log(`Required Skills: ${testJob.skills.join(', ')}`);
        
        const workerMatches = await aiMatchingService.matchWorkersForJob(testJob._id, { limit: 3 });
        console.log(`\nMatches found: ${workerMatches.length}`);
        workerMatches.forEach((m, idx) => {
            console.log(`\nRank ${idx + 1}: ${m.worker.name}`);
            console.log(`- Overall Match Score: ${m.scores.matchPercentage}%`);
            console.log(`  - Semantic Similarity: ${m.scores.semanticSimilarity}%`);
            console.log(`  - Skill Match: ${m.scores.skillMatch}%`);
            console.log(`  - Location Score: ${m.scores.locationScore}%`);
            console.log(`  - Rating Score: ${m.scores.ratingScore}%`);
            console.log(`  - Reliability Score: ${m.scores.reliabilityScore}%`);
            console.log(`- Skills Overlap Matched: [${m.skillOverlap.matched.join(', ')}]`);
            console.log(`- AI Explanation (RAG): "${m.aiExplanation}"`);
        });

        // 5. Run Matching - Jobs for Worker
        console.log('\n--- RECOMMEND JOBS FOR WORKER ---');
        console.log(`Worker: "${testWorker.name}"`);
        console.log(`Worker Skills: ${testWorker.profile.skills.join(', ')}`);

        const jobRecommendations = await aiMatchingService.matchJobsForWorker(testWorker._id, { limit: 3 });
        console.log(`\nRecommendations found: ${jobRecommendations.length}`);
        jobRecommendations.forEach((m, idx) => {
            console.log(`\nRank ${idx + 1}: ${m.job.title} at ${m.job.company}`);
            console.log(`- Overall Match Score: ${m.scores.matchPercentage}%`);
            console.log(`  - Semantic Similarity: ${m.scores.semanticSimilarity}%`);
            console.log(`  - Skill Match: ${m.scores.skillMatch}%`);
            console.log(`  - Location Score: ${m.scores.locationScore}%`);
            console.log(`  - Rating Score (Employer): ${m.scores.ratingScore}%`);
            console.log(`  - Reliability Score (Employer): ${m.scores.reliabilityScore}%`);
            console.log(`- Skills Overlap Matched: [${m.skillOverlap.matched.join(', ')}]`);
            console.log(`- AI Explanation (RAG): "${m.aiExplanation}"`);
        });

        console.log('\n🎉 Integration test completed successfully!');
    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database disconnected.');
    }
};

runTest();
