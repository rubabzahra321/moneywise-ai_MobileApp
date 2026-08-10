const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  frequency: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly',
  },
  nextPaymentDate: {
    type: Date,
    required: true,
    default: Date.now, // ✅ fallback if not provided
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    // ✅ Make optional – allow null
    required: false,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  logoUrl: {
    type: String,
  },
  autoDetected: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);