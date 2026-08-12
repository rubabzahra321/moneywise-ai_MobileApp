const groqService = require('../services/ai/groqService');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// Parse expense text
exports.parseExpense = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required',
      });
    }

    const result = await groqService.parseExpense(text);
    
    res.json({
      success: true,
      data: result || { description: text },
    });
  } catch (error) {
    console.error('Parse expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to parse expense',
      error: error.message,
    });
  }
};

// Auto-categorize
exports.autoCategorize = async (req, res) => {
  try {
    const { description, amount } = req.body;
    
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Description is required',
      });
    }

    const result = await groqService.categorizeTransaction(description, amount || 0);
    
    // Find matching category in user's categories
    if (result && result.category) {
      // First try exact match
      let category = await Category.findOne({
        userId: req.user._id,
        name: { $regex: new RegExp(`^${result.category}$`, 'i') },
      });

      // If no exact match, try partial match
      if (!category) {
        category = await Category.findOne({
          userId: req.user._id,
          name: { $regex: new RegExp(result.category, 'i') },
        });
      }

      // If still no match, try to find by keyword
      if (!category) {
        const categories = await Category.find({ userId: req.user._id });
        for (const cat of categories) {
          if (result.category.toLowerCase().includes(cat.name.toLowerCase()) ||
              cat.name.toLowerCase().includes(result.category.toLowerCase())) {
            category = cat;
            break;
          }
        }
      }

      if (category) {
        result.categoryId = category._id;
        result.categoryName = category.name;
      } else {
        // Default to 'Other' category
        const otherCategory = await Category.findOne({
          userId: req.user._id,
          name: 'Other',
        });
        if (otherCategory) {
          result.categoryId = otherCategory._id;
          result.categoryName = otherCategory.name;
        }
      }
    }
    
    res.json({
      success: true,
      data: result || { category: 'other', confidence: 0.5 },
    });
  } catch (error) {
    console.error('Auto-categorize error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to categorize',
      error: error.message,
    });
  }
};

// Generate AI insights
exports.generateInsights = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: now },
    }).sort({ date: -1 });

    if (transactions.length === 0) {
      return res.json({
        success: true,
        insights: [{
          title: 'No Transactions Yet',
          description: 'Start adding your expenses to get personalized insights and financial advice.',
          type: 'summary',
          value: null,
        }],
      });
    }

    const insights = await groqService.generateInsights(transactions, req.user);

    res.json({
      success: true,
      insights: insights || [],
    });
  } catch (error) {
    console.error('Generate insights error:', error);
    // Return fallback insights if AI fails
    const fallbackInsights = await generateFallbackInsights(req.user._id);
    res.json({
      success: true,
      insights: fallbackInsights,
      message: 'Using fallback insights (AI service unavailable)',
    });
  }
};

// Get savings opportunities
exports.getSavingsTips = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id,
      type: 'expense',
    }).sort({ date: -1 }).limit(50);

    if (transactions.length === 0) {
      return res.json({
        success: true,
        tips: [{
          tip: 'Start tracking your expenses to get personalized savings tips!',
          potentialSavings: 0,
          category: 'general',
        }],
      });
    }

    const tips = await groqService.generateSavingsTips(transactions);

    res.json({
      success: true,
      tips: tips || [],
    });
  } catch (error) {
    console.error('Savings tips error:', error);
    res.json({
      success: true,
      tips: [{
        tip: 'Review your recurring subscriptions to find potential savings.',
        potentialSavings: 50,
        category: 'subscriptions',
      }],
    });
  }
};

// Scan receipt (OCR)
exports.scanReceipt = async (req, res) => {
  try {
    // This is handled by ML Kit on the client side
    // This endpoint is a fallback for server-side processing
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required',
      });
    }

    // TODO: Implement server-side OCR if needed
    // For now, return mock response
    res.json({
      success: true,
      data: {
        amount: 25.50,
        merchant: 'Store Name',
        description: 'Receipt scan',
        items: ['Item 1', 'Item 2'],
        date: new Date().toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Receipt scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan receipt',
    });
  }
};

// Fallback insights generator (when AI is unavailable)
async function generateFallbackInsights(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const transactions = await Transaction.find({
    userId: userId,
    date: { $gte: startOfMonth, $lte: now },
    type: 'expense',
  });

  if (transactions.length === 0) {
    return [{
      title: 'Start Tracking',
      description: 'Add your first transaction to get started with MoneyWise AI!',
      type: 'summary',
      value: null,
    }];
  }

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const avgSpending = totalSpent / transactions.length;

  // Category breakdown
  const categoryTotals = {};
  transactions.forEach(t => {
    categoryTotals[t.categoryName] = (categoryTotals[t.categoryName] || 0) + t.amount;
  });

  const topCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0];

  const insights = [
    {
      title: 'Monthly Summary',
      description: `You've spent $${totalSpent.toFixed(2)} across ${transactions.length} transactions this month.`,
      type: 'summary',
      value: totalSpent,
    },
  ];

  if (topCategory) {
    insights.push({
      title: 'Top Spending Category',
      description: `Your highest spending is on ${topCategory[0]} at $${topCategory[1].toFixed(2)}.`,
      type: 'category',
      value: topCategory[1],
      category: topCategory[0],
    });
  }

  if (transactions.length > 5) {
    insights.push({
      title: 'Spending Pattern',
      description: `Average transaction amount: $${avgSpending.toFixed(2)}. Consider reviewing smaller recurring purchases.`,
      type: 'savings',
      value: avgSpending,
    });
  }

  return insights;
}
// Add this to your existing aiController.js

// Get AI suggestions (legacy endpoint for compatibility)
exports.getAISuggestions = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: now },
    });

    const insights = await groqService.generateInsights(transactions, req.user);

    res.json({
      success: true,
      insights: insights || [],
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI suggestions',
    });
  }
};