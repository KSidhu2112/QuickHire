const mongoose = require('mongoose');

const quickhireRagDataSchema = new mongoose.Schema({
    candidateId: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    email: String,
    phone: String,
    skills: [String],
    education: String,
    experience: String,
    projects: [String],
    location: String,
    preferredRole: String,
    resumeText: String,
    candidateSummary: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('QuickhireRagData', quickhireRagDataSchema, 'QuickhireRagData');
