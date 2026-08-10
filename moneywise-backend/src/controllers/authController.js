const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const Category = require('../models/Category');
const { defaultCategories } = require('../utils/constants');
const crypto = require('crypto');

// Register - ✅ FIXED
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = new User({ email, password, name });
    await user.save();

    // Create default categories for user
    const categories = defaultCategories.map(cat => ({
      ...cat,
      userId: user._id,
      isDefault: true,
    }));
    await Category.insertMany(categories);

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    console.log('✅ User registered:', user._id);
    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        currency: user.currency,
        monthlyBudget: user.monthlyBudget,
        isPremium: user.isPremium,
        streak: user.streak,
        achievements: user.achievements,
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.updateStreak();
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        currency: user.currency,
        monthlyBudget: user.monthlyBudget,
        isPremium: user.isPremium,
        streak: user.streak,
        achievements: user.achievements,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
};

// Update Profile - ✅ FIXED
exports.updateProfile = async (req, res) => {
  try {
    const { name, currency, monthlyBudget, settings } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (currency) user.currency = currency;
    if (monthlyBudget !== undefined) user.monthlyBudget = monthlyBudget;
    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();
    console.log('✅ Profile updated:', user._id);

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        currency: user.currency,
        monthlyBudget: user.monthlyBudget,
        isPremium: user.isPremium,
        streak: user.streak,
        achievements: user.achievements,
        settings: user.settings,
      },
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = Date.now() + 3600000;
    await user.save();

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to send reset email' });
  }
};