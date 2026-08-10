const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
      message: 'Invalid email format',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  monthlyBudget: {
    type: Number,
    default: 3000,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumExpiry: {
    type: Date,
  },
  avatarUrl: {
    type: String,
  },
  streak: {
    type: Number,
    default: 0,
  },
  achievements: [{
    type: String,
  }],
  lastLoginDate: {
    type: Date,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpiry: {
    type: Date,
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true,
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    biometric: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Update streak on login
UserSchema.methods.updateStreak = function() {
  const now = new Date();
  const lastLogin = this.lastLoginDate;
  
  if (!lastLogin) {
    this.streak = 1;
  } else {
    const diff = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
      // Same day, no change
    } else if (diff === 1) {
      this.streak += 1;
    } else {
      this.streak = 1;
    }
  }
  this.lastLoginDate = now;
};

module.exports = mongoose.model('User', UserSchema);