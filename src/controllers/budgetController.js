const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// Create budget - ✅ FIXED with month validation
exports.createBudget = async (req, res) => {
  try {
    const { categoryId, categoryName, amount, month, rollover } = req.body;

    // ✅ Validate required fields
    if (!categoryId || !categoryName || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid budget data' });
    }

    // ✅ Ensure month is a valid Date object
    const budgetMonth = month ? new Date(month) : new Date();
    if (isNaN(budgetMonth.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid month format' });
    }
    const monthStart = new Date(budgetMonth.getFullYear(), budgetMonth.getMonth(), 1);

    // ✅ Check if budget already exists for this category and month
    const existingBudget = await Budget.findOne({
      userId: req.user._id,
      categoryId,
      month: monthStart,
    });

    if (existingBudget) {
      return res.status(400).json({ success: false, message: 'Budget already exists for this category and month' });
    }

    // ✅ Create new budget
    const budget = new Budget({
      userId: req.user._id,
      categoryId,
      categoryName,
      amount,
      month: monthStart,
      rollover: rollover || false,
    });

    // ✅ Calculate spent amount from existing transactions
    const spent = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          categoryId,
          type: 'expense',
          date: {
            $gte: monthStart,
            $lt: new Date(budgetMonth.getFullYear(), budgetMonth.getMonth() + 1, 1),
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    budget.spent = spent.length > 0 ? spent[0].total : 0;
    await budget.save();

    console.log('✅ Budget created:', budget._id);
    res.status(201).json({ success: true, budget });
  } catch (error) {
    console.error('❌ Create budget error:', error);
    res.status(500).json({ success: false, message: 'Failed to create budget', error: error.message });
  }
};

// Get all budgets
exports.getBudgets = async (req, res) => {
  try {
    const { month } = req.query;
    const budgetMonth = month ? new Date(month) : new Date();
    // ✅ Ensure the month is valid, default to current month if invalid
    const monthStart = isNaN(budgetMonth.getTime()) 
      ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      : new Date(budgetMonth.getFullYear(), budgetMonth.getMonth(), 1);

    const budgets = await Budget.find({
      userId: req.user._id,
      month: monthStart,
      isActive: true,
    });

    res.json({ success: true, budgets });
  } catch (error) {
    console.error('❌ Get budgets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch budgets' });
  }
};

// Get budget status
exports.getBudgetStatus = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id, isActive: true });
    const status = budgets.map(budget => ({
      ...budget.toObject(),
      remaining: budget.amount - budget.spent,
      progress: budget.amount > 0 ? (budget.spent / budget.amount) : 0,
      isOverBudget: budget.spent > budget.amount,
      isNearLimit: budget.spent >= budget.amount * 0.8,
    }));
    res.json({ success: true, status });
  } catch (error) {
    console.error('❌ Get budget status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get budget status' });
  }
};

// Update budget
exports.updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    Object.assign(budget, req.body);
    await budget.save();
    res.json({ success: true, budget });
  } catch (error) {
    console.error('❌ Update budget error:', error);
    res.status(500).json({ success: false, message: 'Failed to update budget' });
  }
};

// Delete budget
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    await budget.deleteOne();
    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('❌ Delete budget error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete budget' });
  }
};