const mongoose = require('mongoose');

const ragDataSchema = new mongoose.Schema({
    sourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    sourceCollection: {
        type: String,
        default: 'users'
    },
    candidateSummary: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('RagData', ragDataSchema, 'ragdatas');
