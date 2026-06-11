const mongoose = require('mongoose');

const ragMessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ['user', 'bot'],
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    candidates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ragConversationSchema = new mongoose.Schema({
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    messages: [ragMessageSchema]
}, {
    timestamps: true
});

ragConversationSchema.index({ employerId: 1, updatedAt: -1 });

module.exports = mongoose.model('RagConversation', ragConversationSchema);
