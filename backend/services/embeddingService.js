/**
 * Service to generate text embeddings for workers and jobs.
 * Supports standard OpenAI Embeddings (text-embedding-3-small) when an API key is present.
 * Provides an advanced, high-fidelity, L2-normalized deterministic vector hashing trick fallback of size 1536
 * when no OpenAI key is configured, ensuring the application is fully functional out-of-the-box.
 */

/**
 * Clean and concatenate worker profile fields into a single semantic text string.
 * @param {Object} user - User document of role 'jobseeker'
 * @returns {String}
 */
const buildWorkerProfileText = (user) => {
    if (!user) return '';

    const name = user.name || '';
    const skills = Array.isArray(user.profile?.skills) ? user.profile.skills.join(', ') : '';
    const experience = user.profile?.experience || '';
    const education = user.profile?.education || '';
    const location = user.profile?.location || user.profile?.company || ''; // In case employer/location is mixed
    
    // Rating & reliability
    const avgRating = user.stats?.avgRating || 0;
    const reliabilityScore = user.stats?.reliabilityScore || 0;
    const jobsCompleted = user.stats?.jobsCompleted || 0;

    // Build rich descriptive text
    return `Worker Name: ${name}. ` +
           `Category/Role: Worker, Jobseeker. ` +
           `Skills: ${skills}. ` +
           `Experience: ${experience}. ` +
           `Education: ${education}. ` +
           `Location: ${location}. ` +
           `Average Rating: ${avgRating} stars. ` +
           `Reliability Score: ${reliabilityScore}%. ` +
           `Jobs Completed: ${jobsCompleted}.`;
};

/**
 * Clean and concatenate job posting fields into a single semantic text string.
 * @param {Object} job - Job document
 * @returns {String}
 */
const buildJobText = (job) => {
    if (!job) return '';

    const title = job.title || '';
    const company = job.company || '';
    const category = job.category || '';
    const description = job.description || '';
    const skills = Array.isArray(job.skills) ? job.skills.join(', ') : '';
    const location = job.location ? `${job.location.address || ''} ${job.location.city || ''} ${job.location.state || ''}` : '';
    const jobType = job.jobType || '';
    const experience = job.experience || 'ANY';

    return `Job Title: ${title}. ` +
           `Company: ${company}. ` +
           `Category: ${category}. ` +
           `Job Type: ${jobType}. ` +
           `Description: ${description}. ` +
           `Required Skills: ${skills}. ` +
           `Experience Level Required: ${experience}. ` +
           `Location: ${location}.`;
};

/**
 * Generate 1536-dimensional L2-normalized deterministic vector from text.
 * Uses a stable hashing trick mapping terms to 1536 buckets.
 * @param {String} text 
 * @returns {Number[]} Array of 1536 floats
 */
const generateDeterministicEmbedding = (text) => {
    const vectorSize = 1536;
    const vector = new Array(vectorSize).fill(0);
    
    if (!text || typeof text !== 'string') {
        vector[0] = 1.0;
        return vector;
    }

    // Lowercase and extract alphanumeric words
    const words = text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 0);

    if (words.length === 0) {
        vector[0] = 1.0;
        return vector;
    }

    // Hash words into vector buckets
    for (const word of words) {
        let hash = 0;
        for (let i = 0; i < word.length; i++) {
            hash = (hash * 31 + word.charCodeAt(i)) | 0;
        }

        const bucket = Math.abs(hash) % vectorSize;
        // Term frequency weight
        vector[bucket] += 1;
    }

    // Calculate L2 norm (magnitude)
    let sumSquares = 0;
    for (let i = 0; i < vectorSize; i++) {
        sumSquares += vector[i] * vector[i];
    }
    const magnitude = Math.sqrt(sumSquares);

    // Normalize to unit vector
    if (magnitude > 0) {
        for (let i = 0; i < vectorSize; i++) {
            vector[i] /= magnitude;
        }
    } else {
        vector[0] = 1.0;
    }

    return vector;
};

/**
 * Generate semantic embedding vector using OpenAI or Fallback.
 * @param {String} text 
 * @returns {Promise<Number[]>}
 */
const generateEmbedding = async (text) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        // Fallback to advanced deterministic vector
        return generateDeterministicEmbedding(text);
    }

    try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: text,
                model: 'text-embedding-3-small'
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.warn(`OpenAI Embedding API error (status ${response.status}): ${errBody}. Falling back to deterministic embedding.`);
            return generateDeterministicEmbedding(text);
        }

        const data = await response.json();
        if (data && data.data && data.data[0] && Array.isArray(data.data[0].embedding)) {
            return data.data[0].embedding;
        }

        console.warn('Unexpected OpenAI Embeddings response format. Falling back to deterministic embedding.');
        return generateDeterministicEmbedding(text);
    } catch (err) {
        console.error('Failed to connect to OpenAI Embeddings API. Falling back to deterministic embedding. Error:', err.message);
        return generateDeterministicEmbedding(text);
    }
};

module.exports = {
    buildWorkerProfileText,
    buildJobText,
    generateDeterministicEmbedding,
    generateEmbedding
};
