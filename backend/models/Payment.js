const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // New field for admin dashboard display
  userRole: {
    type: String,
    default: ''
  },
  // Legacy field (kept for backward compat)
  role: {
    type: String,
    default: ''
  },
  // Denormalized user info for admin queries
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  paymentType: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: 'Razorpay'
  },
  // New status field (Success / Failed / Pending)
  status: {
    type: String,
    default: 'Pending'
  },
  // Legacy status field
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  action: {
    type: String,
    enum: ['apply', 'post_job'],
    default: 'apply'
  },
  used: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  strict: false  // Allow fields not in schema (important for legacy compat)
});

// Virtual for paymentId
paymentSchema.virtual('paymentId').get(function () {
  return this._id.toString();
});

paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

// Indexes for admin queries
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ userRole: 1 });
paymentSchema.index({ role: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
