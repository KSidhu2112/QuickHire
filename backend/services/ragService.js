const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const QuickhireRagData = require('../models/QuickhireRagData');
const axios = require('axios');

// Convert an employee record to a rich text representation
function createEmployeeSummary(employee) {
    let summary = `Candidate Name: ${employee.name}\n`;
    // DO NOT include email, phone, or personal contact info for privacy

    if (employee.profile) {
        const p = employee.profile;
        if (p.category) summary += `Job Category: ${p.category}\n`;
        if (p.skills && p.skills.length > 0) summary += `Skills: ${p.skills.join(', ')}\n`;
        if (p.experience) summary += `Experience: ${p.experience}\n`;
        if (p.education) summary += `Education: ${p.education}\n`;
        if (p.certifications && p.certifications.length > 0) summary += `Certifications: ${p.certifications.join(', ')}\n`;
        if (p.preferredJobRole) summary += `Preferred Role: ${p.preferredJobRole}\n`;
        if (p.expectedSalary) summary += `Expected Salary: ${p.expectedSalary}\n`;
        if (p.availableForWork !== undefined) summary += `Available for Work: ${p.availableForWork ? 'Yes' : 'No'}\n`;
    }

    summary += `Completed Jobs: ${employee.stats?.jobsCompleted || 0}\n`;
    summary += `Average Rating: ${employee.stats?.avgRating || 0}\n`;
    summary += `Trust Score: ${employee.trustScore || 50}\n`;
    summary += `Reliability: ${employee.stats?.reliabilityPercentage || 100}%`;
    return summary;
}

// Sync all employee records to vectors
async function syncEmployeesToVectors() {
    try {
        console.log("Starting Employee Sync to Vector DB...");
        const employees = await User.find({ role: { $in: ['jobseeker', 'employee', 'employ'] } });
        console.log(`Found ${employees.length} candidates to process.`);

        for (const employee of employees) {
            try {
                // Try to use EmployeeProfile's detailed summary first
                const profile = await EmployeeProfile.findOne({ user: employee._id });
                let text;

                if (profile) {
                    await profile.generateSummary();
                    await profile.save();
                    text = profile.candidateSummary;
                } else {
                    text = createEmployeeSummary(employee);
                }

                await QuickhireRagData.findOneAndUpdate(
                    { candidateId: employee._id.toString() },
                    {
                        candidateId: employee._id.toString(),
                        name: employee.name,
                        // DO NOT store email/phone in RAG for privacy
                        skills: employee.profile?.skills || [],
                        experience: employee.profile?.experience || '',
                        location: profile?.currentLocation?.city || '',
                        preferredRole: employee.profile?.preferredJobRole || '',
                        candidateSummary: text
                    },
                    { upsert: true, new: true }
                );
                console.log(`Successfully synced candidate: ${employee.name}`);
            } catch (err) {
                console.error(`Failed to sync candidate ${employee.name}:`, err.message);
            }
        }
        console.log("Sync completed.");
        return true;
    } catch (error) {
        console.error("Error in syncEmployeesToVectors:", error);
        throw error;
    }
}

// Privacy guardrails for RAG prompt
const PRIVACY_SYSTEM_PROMPT = `You are an expert HR recruitment assistant for the QuickHire platform.

STRICT PRIVACY RULES - YOU MUST FOLLOW THESE:
1. NEVER reveal or mention phone numbers, email addresses, home addresses, passwords, Aadhaar numbers, PAN numbers, or any government IDs.
2. NEVER share personal contact information of any candidate.
3. Only provide job-relevant information: name, skills, experience, job preferences, ratings, trust score, availability, and work history.
4. If an employer asks for contact details, respond: "For privacy reasons, I cannot share personal contact information. Please use the QuickHire platform to connect with candidates."
5. Do not fabricate or hallucinate any skills, ratings, or experience not explicitly stated in the candidate profile.
6. Always be professional and focus on job-relevant qualifications.`;

// Answer queries using RAG
async function queryCandidateRAG(query) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not set in environment variables');
    }

    // 2. Perform Vector Search using Auto Embeddings with 'query' instead of 'queryVector'
    const pipeline = [
        {
            "$vectorSearch": {
                "index": "autoembed_index",
                "path": "candidateSummary",
                "query": query,
                "numCandidates": 100,
                "limit": 5
            }
        },
        {
            "$project": {
                "candidateSummary": 1,
                "candidateId": 1,
                "score": { "$meta": "vectorSearchScore" }
            }
        }
    ];

    let searchResults;
    try {
        console.log("Executing Atlas Vector Search Pipeline:", JSON.stringify(pipeline, null, 2));
        searchResults = await QuickhireRagData.aggregate(pipeline);
    } catch (dbError) {
        console.error("MongoDB Atlas Vector Search Error Details:", dbError);
        throw new Error(`MongoDB Vector search failed: ${dbError.message}`);
    }

    if (!searchResults || searchResults.length === 0) {
        console.log("Vector Search returned 0 candidates. Falling back to simple text match.");
        const words = query.split(' ').filter(w => w.length > 3);
        const searchRegex = words.length > 0 ? new RegExp(words.join('|'), 'i') : new RegExp(query, 'i');

        const fallbackResults = await QuickhireRagData.find({
            candidateSummary: { $regex: searchRegex }
        }).limit(5);

        if (!fallbackResults || fallbackResults.length === 0) {
            return {
                answer: "I couldn't find any relevant candidates matching your criteria.",
                retrievedCandidates: []
            };
        }

        searchResults = fallbackResults.map(r => ({
            candidateSummary: r.candidateSummary,
            candidateId: r.candidateId
        }));
    }

    // 3. Prepare Context for LLM
    let context = "Below are the profiles of our most relevant candidates:\n\n";
    searchResults.forEach((r, idx) => {
        context += `--- Candidate ${idx + 1} ---\n${r.candidateSummary}\n\n`;
    });

    const prompt = `An employer has asked the following query: "${query}"

Use the provided candidate profiles below to answer the employer's question accurately. 
Only base your answer on the profiles provided. Do not hallucinate or make up skills that are not explicitly stated. 
If no candidate fits perfectly, explain who are the closest matches and why.
NEVER reveal email addresses, phone numbers, home addresses, Aadhaar numbers, PAN numbers, passwords, or any government IDs.
Only share job-relevant information like name, skills, experience, ratings, trust score, and availability.

Context (Candidate Profiles):
${context}

Answer:`;

    // 4. Query Groq Model
    try {
        console.log("Calling Groq API for Answer Generation...");
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
                messages: [
                    { role: 'system', content: PRIVACY_SYSTEM_PROMPT },
                    { role: 'user', content: prompt }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const responseText = response.data.choices[0].message.content;

        return {
            answer: responseText,
            retrievedCandidates: searchResults.map(r => r.candidateId)
        };
    } catch (aiError) {
        const errDetails = aiError.response ? aiError.response.data : aiError.message;
        console.error("Groq API Error Details:", errDetails);
        throw new Error(`Answer generation failed via Groq API: ${aiError.response?.data?.error?.message || aiError.message}`);
    }
}

module.exports = {
    createEmployeeSummary,
    syncEmployeesToVectors,
    queryCandidateRAG
};
