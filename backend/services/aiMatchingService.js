/**
 * Service to handle AI matching and ranking for workers and jobs.
 * Implements a hybrid approach combining MongoDB Atlas Vector Search (with high-fidelity in-memory fallback),
 * multi-criteria metadata ranking, and Groq-powered RAG explanations.
 */

const User = require('../models/User');
const Job = require('../models/Job');
const embeddingService = require('./embeddingService');

/**
 * Calculate cosine similarity between two vectors.
 * @param {Number[]} vecA 
 * @param {Number[]} vecB 
 * @returns {Number} Cosine similarity score [0, 1]
 */
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Generate a highly-engaging AI match explanation using Groq LLM.
 * @param {Object} worker - Worker user document
 * @param {Object} job - Job document
 * @returns {Promise<String>} Generated summary/explanation
 */
const generateAIExplanation = async (worker, job) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return getStandardExplanation(worker, job);
    }

    try {
        const workerSkills = Array.isArray(worker.profile?.skills) ? worker.profile.skills.join(', ') : 'None';
        const jobSkills = Array.isArray(job.skills) ? job.skills.join(', ') : 'None';
        
        const systemPrompt = "You are QuickHire's AI Matching Assistant. Your job is to summarize in 2 short, enthusiastic, and highly professional sentences why a worker is a great match for a job post. Keep it concise, focused, and under 250 characters.";
        const userPrompt = `Match explanation for:
Worker: ${worker.name}
Worker Skills: ${workerSkills}
Worker Experience: ${worker.profile?.experience || 'Fresher'}
Job Title: ${job.title}
Job Company: ${job.company}
Job Description: ${job.description}
Required Skills: ${jobSkills}

Provide a direct, conversational explanation. Use "we recommend" or "this match".`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            console.warn(`Groq API returned error status ${response.status}. Using standard explanation.`);
            return getStandardExplanation(worker, job);
        }

        const data = await response.json();
        if (data?.choices?.[0]?.message?.content) {
            return data.choices[0].message.content.trim();
        }

        return getStandardExplanation(worker, job);
    } catch (err) {
        console.error('⚠️ Failed to generate AI explanation with Groq:', err.message);
        return getStandardExplanation(worker, job);
    }
};

/**
 * Graceful fallback standard explanation when Groq is unavailable.
 */
const getStandardExplanation = (worker, job) => {
    const workerSkills = worker.profile?.skills || [];
    const jobSkills = job.skills || [];
    const overlap = jobSkills.filter(s => workerSkills.some(ws => ws.toLowerCase() === s.toLowerCase()));
    
    let skillsPhrase = overlap.length > 0 
        ? `excellent overlap in required skills like ${overlap.slice(0, 3).join(', ')}` 
        : 'solid foundational capabilities';

    return `This match is highly recommended. ${worker.name} has a trust score of ${worker.trustScore || 100}% and shows ${skillsPhrase} matching ${job.title} at ${job.company}.`;
};

/**
 * Match and rank top workers for a specific job.
 * @param {String} jobId 
 * @param {Object} options 
 * @returns {Promise<Object[]>} List of ranked workers
 */
const matchWorkersForJob = async (jobId, options = {}) => {
    const limit = parseInt(options.limit) || 5;
    
    // 1. Fetch the Job
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');

    // Make sure job has embedding
    if (!job.embedding || job.embedding.length === 0) {
        const text = embeddingService.buildJobText(job);
        job.embedding = await embeddingService.generateEmbedding(text);
        await job.save();
    }

    let candidates = [];
    let usedVectorSearch = false;

    // 2. Retrieve Candidates (Try Atlas Vector Search)
    try {
        // Query Vector Search
        // We look for jobseekers who are active
        candidates = await User.aggregate([
            {
                $vectorSearch: {
                    index: 'user_vector_index',
                    path: 'embedding',
                    queryVector: job.embedding,
                    numCandidates: 100,
                    limit: 30
                }
            },
            {
                $match: {
                    role: 'jobseeker',
                    status: 'active'
                }
            }
        ]);
        usedVectorSearch = candidates.length > 0;
    } catch (err) {
        // Fallback to in-memory cosine similarity (extremely robust and works locally!)
        console.log('💡 MongoDB Atlas Vector Search index not available. Falling back to in-memory matching.');
    }

    if (!usedVectorSearch) {
        candidates = await User.find({
            role: 'jobseeker',
            status: 'active'
        });
    }

    // 3. Rank Candidates using Multi-Criteria System
    const rankedResults = [];

    for (const worker of candidates) {
        // Ensure worker has an embedding
        if (!worker.embedding || worker.embedding.length === 0) {
            const text = embeddingService.buildWorkerProfileText(worker);
            worker.embedding = embeddingService.generateDeterministicEmbedding(text);
            // Save non-blocking
            worker.save().catch(e => console.error('Failed to save worker auto-embedding:', e.message));
        }

        // A. Semantic Similarity Score
        const semanticScore = cosineSimilarity(job.embedding, worker.embedding);

        // B. Skill Match Score (Case-insensitive overlap)
        const jobSkills = (job.skills || []).map(s => s.trim()).filter(Boolean);
        const workerSkills = (worker.profile?.skills || []).map(s => s.trim()).filter(Boolean);
        let skillScore = 1.0;
        let skillOverlapCount = 0;
        
        if (jobSkills.length > 0) {
            const matchedSkills = jobSkills.filter(skill => 
                workerSkills.some(ws => ws.toLowerCase() === skill.toLowerCase())
            );
            skillOverlapCount = matchedSkills.length;
            skillScore = skillOverlapCount / jobSkills.length;

            // Strictly require at least one matching skill if the job specifies required skills
            if (skillOverlapCount === 0) {
                continue;
            }
        }

        // C. Distance / Location Score
        let locationScore = 0.5; // Neutral default
        
        // Simple city-matching fallback
        if (job.location?.city && worker.profile?.location) {
            const jobCity = job.location.city.toLowerCase().trim();
            const workerLoc = worker.profile.location.toLowerCase().trim();
            if (workerLoc.includes(jobCity) || jobCity.includes(workerLoc)) {
                locationScore = 0.95;
            } else {
                locationScore = 0.4;
            }
        }

        // D. Rating Score
        const ratingScore = (worker.stats?.avgRating || 0) / 5;

        // E. Reliability Score
        const reliabilityScore = (worker.stats?.reliabilityScore || 0) / 100;

        // F. Availability Score (1.0 for active jobseekers)
        const availabilityScore = 1.0;

        // Calculate Weighted Score (Sum of weights: 0.5 + 0.2 + 0.15 + 0.1 + 0.05 = 1.0)
        const finalScore = (
            (skillScore * 0.5) +
            (semanticScore * 0.2) +
            (locationScore * 0.15) +
            (ratingScore * 0.1) +
            (reliabilityScore * 0.05)
        ) * availabilityScore;

        const matchPercentage = parseFloat((finalScore * 100).toFixed(1));

        rankedResults.push({
            worker: {
                id: worker._id,
                name: worker.name,
                email: worker.email,
                phone: worker.phone,
                profile: worker.profile,
                trustScore: worker.trustScore,
                stats: worker.stats,
                badges: worker.badges
            },
            scores: {
                matchPercentage,
                semanticSimilarity: parseFloat((semanticScore * 100).toFixed(1)),
                skillMatch: parseFloat((skillScore * 100).toFixed(1)),
                locationScore: parseFloat((locationScore * 100).toFixed(1)),
                ratingScore: parseFloat((ratingScore * 100).toFixed(1)),
                reliabilityScore: parseFloat((reliabilityScore * 100).toFixed(1))
            },
            skillOverlap: {
                matched: jobSkills.filter(s => workerSkills.some(ws => ws.toLowerCase() === s.toLowerCase())),
                missing: jobSkills.filter(s => !workerSkills.some(ws => ws.toLowerCase() === s.toLowerCase()))
            }
        });
    }

    // Sort by match percentage descending
    rankedResults.sort((a, b) => b.scores.matchPercentage - a.scores.matchPercentage);

    // Slice to limit
    const topMatches = rankedResults.slice(0, limit);

    // 4. Generate AI explanations for top matches (RAG pipeline step)
    for (const match of topMatches) {
        // Fetch raw mongoose document
        const workerDoc = candidates.find(c => c._id.toString() === match.worker.id.toString());
        match.aiExplanation = await generateAIExplanation(workerDoc, job);
    }

    return topMatches;
};

/**
 * Match and rank top jobs for a specific worker.
 * @param {String} workerId 
 * @param {Object} options 
 * @returns {Promise<Object[]>} List of ranked jobs
 */
const matchJobsForWorker = async (workerId, options = {}) => {
    const limit = parseInt(options.limit) || 5;

    // 1. Fetch Worker
    const worker = await User.findById(workerId);
    if (!worker) throw new Error('Worker not found');

    // Make sure worker has embedding
    if (!worker.embedding || worker.embedding.length === 0) {
        const text = embeddingService.buildWorkerProfileText(worker);
        worker.embedding = await embeddingService.generateEmbedding(text);
        await worker.save();
    }

    let candidates = [];
    let usedVectorSearch = false;

    // 2. Retrieve Candidates (Try Atlas Vector Search)
    try {
        candidates = await Job.aggregate([
            {
                $vectorSearch: {
                    index: 'job_vector_index',
                    path: 'embedding',
                    queryVector: worker.embedding,
                    numCandidates: 100,
                    limit: 30
                }
            },
            {
                $match: {
                    status: 'ACTIVE'
                }
            }
        ]);
        usedVectorSearch = candidates.length > 0;
    } catch (err) {
        console.log('💡 MongoDB Atlas Vector Search index not available. Falling back to in-memory matching.');
    }

    if (!usedVectorSearch) {
        candidates = await Job.find({ status: 'ACTIVE' });
    }

    // Populate employer details for rating/reliability ranking
    candidates = await Job.populate(candidates, {
        path: 'employer',
        select: 'name email phone company stats trustScore'
    });

    // 3. Rank Candidates using Multi-Criteria System
    const rankedResults = [];

    for (const job of candidates) {
        // Ensure job has embedding
        if (!job.embedding || job.embedding.length === 0) {
            const text = embeddingService.buildJobText(job);
            job.embedding = embeddingService.generateDeterministicEmbedding(text);
            job.save().catch(e => console.error('Failed to save job auto-embedding:', e.message));
        }

        // A. Semantic Similarity Score
        const semanticScore = cosineSimilarity(worker.embedding, job.embedding);

        // B. Skill Match Score (Case-insensitive overlap)
        const jobSkills = (job.skills || []).map(s => s.trim()).filter(Boolean);
        const workerSkills = (worker.profile?.skills || []).map(s => s.trim()).filter(Boolean);
        let skillScore = 1.0;
        let skillOverlapCount = 0;

        if (jobSkills.length > 0) {
            const matchedSkills = jobSkills.filter(skill => 
                workerSkills.some(ws => ws.toLowerCase() === skill.toLowerCase())
            );
            skillOverlapCount = matchedSkills.length;
            skillScore = skillOverlapCount / jobSkills.length;

            // Strictly require at least one matching skill if the job specifies required skills
            if (skillOverlapCount === 0) {
                continue;
            }
        }

        // C. Distance / Location Score
        let locationScore = 0.5;
        if (job.location?.city && worker.profile?.location) {
            const jobCity = job.location.city.toLowerCase().trim();
            const workerLoc = worker.profile.location.toLowerCase().trim();
            if (workerLoc.includes(jobCity) || jobCity.includes(workerLoc)) {
                locationScore = 0.95;
            } else {
                locationScore = 0.4;
            }
        }

        // D. Rating Score (Employer rating)
        const ratingScore = (job.employer?.stats?.avgRating || 0) / 5;

        // E. Reliability Score (Employer reliability percentage)
        const reliabilityScore = (job.employer?.stats?.reliabilityPercentage || 100) / 100;

        // F. Availability Score (1.0 for active jobs)
        const availabilityScore = 1.0;

        // Calculate Weighted Score (Sum of weights: 0.5 + 0.2 + 0.15 + 0.1 + 0.05 = 1.0)
        const finalScore = (
            (skillScore * 0.5) +
            (semanticScore * 0.2) +
            (locationScore * 0.15) +
            (ratingScore * 0.1) +
            (reliabilityScore * 0.05)
        ) * availabilityScore;

        const matchPercentage = parseFloat((finalScore * 100).toFixed(1));

        rankedResults.push({
            job: {
                id: job._id,
                title: job.title,
                company: job.company,
                description: job.description,
                jobType: job.jobType,
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                salaryType: job.salaryType,
                location: job.location,
                category: job.category,
                isUrgent: job.isUrgent,
                employer: job.employer
            },
            scores: {
                matchPercentage,
                semanticSimilarity: parseFloat((semanticScore * 100).toFixed(1)),
                skillMatch: parseFloat((skillScore * 100).toFixed(1)),
                locationScore: parseFloat((locationScore * 100).toFixed(1)),
                ratingScore: parseFloat((ratingScore * 100).toFixed(1)),
                reliabilityScore: parseFloat((reliabilityScore * 100).toFixed(1))
            },
            skillOverlap: {
                matched: jobSkills.filter(s => workerSkills.some(ws => ws.toLowerCase() === s.toLowerCase())),
                missing: jobSkills.filter(s => !workerSkills.some(ws => ws.toLowerCase() === s.toLowerCase()))
            }
        });
    }

    // Sort by match percentage descending
    rankedResults.sort((a, b) => b.scores.matchPercentage - a.scores.matchPercentage);

    // Slice to limit
    const topMatches = rankedResults.slice(0, limit);

    // 4. Generate AI explanations for top matches (RAG pipeline step)
    for (const match of topMatches) {
        const jobDoc = candidates.find(c => c._id.toString() === match.job.id.toString());
        match.aiExplanation = await generateAIExplanation(worker, jobDoc);
    }

    return topMatches;
};

module.exports = {
    cosineSimilarity,
    generateAIExplanation,
    matchWorkersForJob,
    matchJobsForWorker
};
