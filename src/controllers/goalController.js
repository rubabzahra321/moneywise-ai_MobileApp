const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');

// Create goal - ✅ FIXED
exports.createGoal = async (req, res) => {
  try {
    const { title, targetAmount, currentAmount, deadline, icon, color, isCompleted, category } = req.body;

    // ✅ Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Goal title is required' });
    }
    if (!targetAmount || targetAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Target amount must be positive' });
    }

    const goalData = {
      userId: req.user._id,
      title: title.trim(),
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline: deadline || null,
      icon: icon || 'flag',
      color: color || 0x6C63FF,
      isCompleted: isCompleted || false,
      category: category || null,
    };

    const goal = new Goal(goalData);
    await goal.save();

    console.log('✅ Goal created:', goal._id);
    res.status(201).json({
      success: true,
      goal,
    });
  } catch (error) {
    console.error('❌ Create goal error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create goal',
      error: error.message,
    });
  }
};

// Get all goals
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (error) {
    console.error('❌ Get goals error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch goals' });
  }
};

// Update goal - ✅ FIXED
exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const { title, targetAmount, currentAmount, deadline, icon, color, isCompleted, category } = req.body;
    if (title !== undefined) goal.title = title;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (currentAmount !== undefined) goal.currentAmount = currentAmount;
    if (deadline !== undefined) goal.deadline = deadline;
    if (icon !== undefined) goal.icon = icon;
    if (color !== undefined) goal.color = color;
    if (isCompleted !== undefined) goal.isCompleted = isCompleted;
    if (category !== undefined) goal.category = category;

    await goal.save();
    console.log('✅ Goal updated:', goal._id);
    res.json({ success: true, goal });
  } catch (error) {
    console.error('❌ Update goal error:', error);
    res.status(500).json({ success: false, message: 'Failed to update goal', error: error.message });
  }
};

// Delete goal
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    await goal.deleteOne();
    console.log('✅ Goal deleted:', req.params.id);
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('❌ Delete goal error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete goal' });
  }
};