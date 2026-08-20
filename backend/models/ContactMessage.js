const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: 2000
    },
    ticketId: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

// Generate ticket ID before saving
contactMessageSchema.statics.generateTicketId = async function () {
    const year = new Date().getFullYear();
    const count = await this.countDocuments();
    const nextNumber = (count + 1).toString().padStart(4, '0');
    return `QH-${year}-${nextNumber}`;
};

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
