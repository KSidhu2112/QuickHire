const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
        },
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        attachments: [String],
        isRead: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            enum: ['TEXT', 'FILE', 'SYSTEM'],
            default: 'TEXT',
        },
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ job: 1 });

module.exports = mongoose.model('Message', messageSchema);
