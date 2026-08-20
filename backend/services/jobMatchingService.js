const JobNotification = require('../models/JobNotification');
const QuickhireRagData = require('../models/QuickhireRagData');
const User = require('../models/User');
const { sendJobAlertEmails } = require('./emailService');

async function processJobMatchAndNotify(job) {
    try {
        console.log(`🔍 Starting AI Matching for Job: ${job.title} (${job._id})`);

        const MATCH_THRESHOLD = parseFloat(process.env.MATCH_THRESHOLD) || 0.7;
        const MAX_CANDIDATES = parseInt(process.env.MAX_NOTIFICATION_CANDIDATES) || 100;

        // 1. Create text representation of the job for vector search
        const skillsString = (job.skills || []).join(', ');
        const locationString = job.location ? `${job.location.city || ''} ${job.location.state || ''}` : '';
        const jobText = `
            Job Title: ${job.title}
            Description: ${job.description}
            Category: ${job.category || 'Any'}
            Required Skills: ${skillsString}
            Experience Level: ${job.experience || 'Any'}
            Location: ${locationString}
        `.trim();

        // 2. Perform Vector Search using MongoDB Atlas AutoEmbed
        const pipeline = [
            {
                "$vectorSearch": {
                    "index": "autoembed_index",
                    "path": "candidateSummary",
                    "query": jobText,
                    "numCandidates": Math.max(MAX_CANDIDATES * 2, 200),
                    "limit": MAX_CANDIDATES
                }
            },
            {
                "$project": {
                    "candidateId": 1,
                    "score": { "$meta": "vectorSearchScore" }
                }
            }
        ];

        let searchResults = [];
        try {
            searchResults = await QuickhireRagData.aggregate(pipeline);
        } catch (error) {
            console.error('❌ Vector Search Failed during match:', error.message);
            return;
        }

        console.log(`🧠 AI Vector Search returned ${searchResults.length} candidates.`);

        // 3. Filter candidates by threshold score
        const matchedCandidates = searchResults.filter(c => c.score >= MATCH_THRESHOLD);
        console.log(`🎯 ${matchedCandidates.length} candidates met the threshold score of ${MATCH_THRESHOLD}`);

        if (matchedCandidates.length === 0) return;

        // 4. Fetch valid active user accounts from the database
        const candidateIds = matchedCandidates.map(c => c.candidateId);

        const activeUsers = await User.find({
            _id: { $in: candidateIds },
            status: 'active',
            email: { $exists: true, $ne: '' },
            role: { $in: ['jobseeker', 'employee', 'employ'] }
        });

        // 5. Create a map for quick lookup
        const userMap = new Map(activeUsers.map(u => [u._id.toString(), u]));

        const employeesToNotify = [];
        const jobNotificationsToInsert = [];

        for (const match of matchedCandidates) {
            const user = userMap.get(match.candidateId.toString());
            if (user) {
                employeesToNotify.push(user);
                jobNotificationsToInsert.push({
                    jobId: job._id,
                    employeeId: user._id,
                    email: user.email,
                    matchScore: match.score,
                    status: 'pending'
                });
            }
        }

        if (jobNotificationsToInsert.length === 0) return;

        // 6. Bulk Insert JobNotifications to track State
        await JobNotification.insertMany(jobNotificationsToInsert, { ordered: false }).catch(err => {
            // Ignore duplicate key errors if already partially tracked
            console.log('⚠️ Some notifications may already exist in DB tracking.');
        });

        // 7. Send Emails using Background Worker Pattern (simulate with promise chains)
        // SetImmediate prevents blocking the main thread execution long
        setImmediate(async () => {
            await sendJobAlertEmails(employeesToNotify, job);
        });

    } catch (error) {
        console.error('❌ Error in processJobMatchAndNotify:', error);
    }
}

module.exports = {
    processJobMatchAndNotify
};
