const Subscription = require('../models/Subscription');
const Category = require('../models/Category');

// Create subscription
exports.createSubscription = async (req, res) => {
  try {
    const { name, amount, frequency, nextPaymentDate, categoryId, isActive, logoUrl } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Subscription name is required' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be positive' });
    }
    if (!nextPaymentDate) {
      return res.status(400).json({ success: false, message: 'Next payment date is required' });
    }

    // Auto-assign "Subscriptions" category if missing
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      let category = await Category.findOne({ name: 'Subscriptions', userId: req.user._id });
      if (!category) {
        category = new Category({
          userId: req.user._id,
          name: 'Subscriptions',
          icon: 'subscriptions',
          color: 0xFD79A8,
          isDefault: true,
        });
        await category.save();
      }
      finalCategoryId = category._id;
    }

    const subscription = new Subscription({
      userId: req.user._id,
      name: name.trim(),
      amount,
      frequency: frequency || 'monthly',
      nextPaymentDate: new Date(nextPaymentDate),
      categoryId: finalCategoryId,
      isActive: isActive !== undefined ? isActive : true,
      logoUrl: logoUrl || null,
      autoDetected: false,
    });

    await subscription.save();
    console.log('✅ Subscription created:', subscription._id);
    res.status(201).json({ success: true, subscription });
  } catch (error) {
    console.error('❌ Create subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to create subscription', error: error.message });
  }
};

// Get all subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id }).sort({ nextPaymentDate: 1 });
    res.json({ success: true, subscriptions });
  } catch (error) {
    console.error('❌ Get subscriptions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
};

// Update subscription
exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, userId: req.user._id });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    Object.assign(subscription, req.body);
    await subscription.save();
    res.json({ success: true, subscription });
  } catch (error) {
    console.error('❌ Update subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to update subscription' });
  }
};

// Delete subscription
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, userId: req.user._id });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    await subscription.deleteOne();
    res.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('❌ Delete subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete subscription' });
  }
};