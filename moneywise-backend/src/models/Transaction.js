const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  categoryName: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  merchant: {
    type: String,
  },
  type: {
    type: String,
    enum: ['expense', 'income', 'transfer'],
    default: 'expense',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
  },
  receiptUrl: {
    type: String,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringFrequency: {
    type: String,
    // ✅ Allow null and the valid frequencies
    enum: [null, 'daily', 'weekly', 'monthly', 'yearly'],
    default: null,
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  splitWith: [{
    type: String,
  }],
  notes: {
    type: String,
  },
  tags: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Index for faster queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, categoryId: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);