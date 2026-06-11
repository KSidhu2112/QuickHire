const mongoose = require('mongoose');

const employeeVectorSchema = new mongoose.Schema({
    sourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    sourceCollection: {
        type: String,
        default: 'users'
    },
    text: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeVector', employeeVectorSchema);
