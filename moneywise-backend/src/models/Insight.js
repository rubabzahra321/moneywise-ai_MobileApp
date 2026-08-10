const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['category', 'savings', 'anomaly', 'summary', 'forecast', 'subscription'],
    default: 'general',
  },
  value: {
    type: Number,
  },
  category: {
    type: String,
  },
  actionUrl: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isDismissed: {
    type: Boolean,
    default: false,
  },
  expiryDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Insight', InsightSchema);