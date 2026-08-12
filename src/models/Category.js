const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'more_horiz',
  },
  color: {
    type: Number,
    default: 0x636E72,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Unique constraint per user
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', CategorySchema);