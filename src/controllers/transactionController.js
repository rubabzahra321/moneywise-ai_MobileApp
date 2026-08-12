const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Category = require('../models/Category');

// Create Transaction - ✅ FIXED
exports.createTransaction = async (req, res) => {
  try {
    const { amount, categoryId, categoryName, description, type, date, isRecurring, recurringFrequency, currency } = req.body;

    // ✅ Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be positive' });
    }
    if (!description || description.trim() === '') {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    // ✅ Find or create category
    let category = null;
    if (categoryId) {
      category = await Category.findOne({ _id: categoryId, userId: req.user._id });
    }
    if (!category && categoryName) {
      category = await Category.findOne({ name: categoryName, userId: req.user._id });
    }
    if (!category) {
      // Create default "Other" category
      const otherCategory = await Category.findOne({ name: 'Other', userId: req.user._id });
      if (otherCategory) {
        category = otherCategory;
      } else {
        const newCategory = new Category({
          userId: req.user._id,
          name: 'Other',
          icon: 'more_horiz',
          color: 0x636E72,
          isDefault: true,
        });
        await newCategory.save();
        category = newCategory;
      }
    }

    const transactionData = {
      userId: req.user._id,
      amount,
      categoryId: category._id,
      categoryName: category.name,
      description: description.trim(),
      type: type || 'expense',
      date: date || new Date(),
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
      currency: currency || 'USD',
      merchant: req.body.merchant || null,
      location: req.body.location || null,
      receiptUrl: req.body.receiptUrl || null,
      aiConfidence: req.body.aiConfidence || null,
      splitWith: req.body.splitWith || [],
      notes: req.body.notes || '',
      tags: req.body.tags || [],
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();

    // Update budget spending
    const monthStart = new Date(transaction.date.getFullYear(), transaction.date.getMonth(), 1);
    await Budget.findOneAndUpdate(
      {
        userId: req.user._id,
        categoryId: transaction.categoryId,
        month: monthStart,
      },
      { $inc: { spent: transaction.amount } },
      { upsert: true }
    );

    // Update category usage
    await Category.findByIdAndUpdate(
      transaction.categoryId,
      { $inc: { usageCount: 1 } }
    );

    console.log('✅ Transaction created:', transaction._id);
    res.status(201).json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('❌ Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message,
    });
  }
};

// Get All Transactions
exports.getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, categoryId, type, limit = 50, page = 1 } = req.query;
    const query = { userId: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (categoryId) query.categoryId = categoryId;
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

// Get Transaction by ID
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transaction' });
  }
};

// Update Transaction
exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // If category changed, update budget
    if (req.body.categoryId && req.body.categoryId !== transaction.categoryId.toString()) {
      const oldMonthStart = new Date(transaction.date.getFullYear(), transaction.date.getMonth(), 1);
      await Budget.findOneAndUpdate(
        { userId: req.user._id, categoryId: transaction.categoryId, month: oldMonthStart },
        { $inc: { spent: -transaction.amount } }
      );

      const newMonthStart = new Date(
        req.body.date ? new Date(req.body.date).getFullYear() : transaction.date.getFullYear(),
        req.body.date ? new Date(req.body.date).getMonth() : transaction.date.getMonth(),
        1
      );
      await Budget.findOneAndUpdate(
        { userId: req.user._id, categoryId: req.body.categoryId, month: newMonthStart },
        { $inc: { spent: req.body.amount || transaction.amount } },
        { upsert: true }
      );
    }

    Object.assign(transaction, req.body);
    await transaction.save();
    res.json({ success: true, transaction });
  } catch (error) {
    console.error('❌ Update transaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to update transaction' });
  }
};

// Delete Transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const monthStart = new Date(transaction.date.getFullYear(), transaction.date.getMonth(), 1);
    await Budget.findOneAndUpdate(
      { userId: req.user._id, categoryId: transaction.categoryId, month: monthStart },
      { $inc: { spent: -transaction.amount } }
    );
    await transaction.deleteOne();

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('❌ Delete transaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete transaction' });
  }
};

// Get Transaction Summary
exports.getSummary = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week': startDate = new Date(now); startDate.setDate(now.getDate() - 7); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      default: startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: now },
    });

    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryBreakdown[t.categoryName] = (categoryBreakdown[t.categoryName] || 0) + t.amount;
    });

    res.json({
      success: true,
      summary: {
        totalExpenses,
        totalIncome,
        netBalance: totalIncome - totalExpenses,
        categoryBreakdown,
        transactionCount: transactions.length,
        period,
      },
    });
  } catch (error) {
    console.error('❌ Get summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get summary' });
  }
};