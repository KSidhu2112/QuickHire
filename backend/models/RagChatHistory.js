const mongoose = require('mongoose');

const ragChatHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
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
        }]
    },
    {
        timestamps: true,
    }
);

ragChatHistorySchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model('RagChatHistory', ragChatHistorySchema);
