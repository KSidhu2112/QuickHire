const User = require('../models/User');
const RagData = require('../models/RagData');
const axios = require('axios');

// Convert an employee record to a rich text representation
function createEmployeeSummary(employee) {
    let summary = `Candidate Name: ${employee.name}\n`;
    if (employee.email) summary += `Contact: ${employee.email}\n`;

    if (employee.profile) {
        const p = employee.profile;
        if (p.category) summary += `Job Category: ${p.category}\n`;
        if (p.skills && p.skills.length > 0) summary += `Skills: ${p.skills.join(', ')}\n`;
        if (p.experience) summary += `Experience: ${p.experience}\n`;
        if (p.education) summary += `Education: ${p.education}\n`;
        if (p.certifications && p.certifications.length > 0) summary += `Certifications: ${p.certifications.join(', ')}\n`;
        if (p.projects && p.projects.length > 0) summary += `Projects: ${p.projects.join(', ')}\n`;
        if (p.resume) summary += `Resume link/data: ${p.resume}\n`;

        if (p.preferredJobRole) summary += `Preferred Role: ${p.preferredJobRole}\n`;
        if (p.expectedSalary) summary += `Expected Salary: ${p.expectedSalary}\n`;
        if (p.noticePeriod) summary += `Notice Period: ${p.noticePeriod}\n`;
    }
    summary += `Profile Stats: ${employee.stats?.jobsCompleted || 0} jobs completed. Reliability: ${employee.stats?.reliabilityPercentage || 100}%`;
    return summary;
}

// Sync all employee records to vectors
async function syncEmployeesToVectors() {
    try {
        console.log("Starting Employee Sync to Vector DB...");
        // Find users who are jobseekers or employees
        const employees = await User.find({ role: { $in: ['jobseeker', 'employee', 'employ'] } });
        console.log(`Found ${employees.length} candidates to process.`);

        for (const employee of employees) {
            try {
                const text = createEmployeeSummary(employee);

                await RagData.findOneAndUpdate(
                    { sourceId: employee._id },
                    {
                        sourceId: employee._id,
                        sourceCollection: 'users',
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

// Answer queries using RAG
async function queryCandidateRAG(query) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not set in environment variables');
    }

    // 2. Perform Vector Search using Auto Embeddings with 'query' instead of 'queryVector'
    const pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "candidateSummary",
                "query": query,
                "numCandidates": 100,
                "limit": 5
            }
        },
        {
            "$project": {
                "candidateSummary": 1,
                "sourceId": 1,
                "score": { "$meta": "vectorSearchScore" }
            }
        }
    ];

    let searchResults;
    try {
        console.log("Executing Atlas Vector Search Pipeline:", JSON.stringify(pipeline, null, 2));
        searchResults = await RagData.aggregate(pipeline);
    } catch (dbError) {
        console.error("MongoDB Atlas Vector Search Error Details:", dbError);
        throw new Error(`MongoDB Vector search failed: ${dbError.message}`);
    }

    if (!searchResults || searchResults.length === 0) {
        return {
            answer: "I couldn't find any relevant candidates matching your criteria.",
            retrievedCandidates: []
        };
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
                    { role: 'system', content: 'You are an expert HR recruitment assistant for the QuickHire platform.' },
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
            retrievedCandidates: searchResults.map(r => r.sourceId)
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
