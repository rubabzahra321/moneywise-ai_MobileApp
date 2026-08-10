const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  currentAmount: {
    type: Number,
    default: 0,
  },
  deadline: {
    type: Date,
  },
  icon: {
    type: String,
    default: 'flag',
  },
  color: {
    type: Number,
    default: 0x6C63FF,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Goal', GoalSchema);