const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

// Get all categories - ✅ FIXED (returns 'id' field)
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      userId: req.user._id,
      isActive: true,
    }).sort({ usageCount: -1, name: 1 });

    // ✅ Map to include 'id' field for frontend
    const result = categories.map(cat => ({
      id: cat._id.toString(),
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      parentId: cat.parentId,
      isDefault: cat.isDefault,
      usageCount: cat.usageCount,
    }));

    res.json({
      success: true,
      categories: result,
    });
  } catch (error) {
    console.error('❌ Get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name, icon, color, parentId } = req.body;
    const existingCategory = await Category.findOne({
      userId: req.user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = new Category({ userId: req.user._id, name, icon, color, parentId });
    await category.save();
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    if (req.body.name) {
      const existing = await Category.findOne({
        userId: req.user._id,
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
        _id: { $ne: category._id },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }
    }
    Object.assign(category, req.body);
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    if (category.isDefault) {
      return res.status(400).json({ success: false, message: 'Cannot delete default category' });
    }

    const otherCategory = await Category.findOne({ userId: req.user._id, name: 'Other' });
    if (otherCategory) {
      await Transaction.updateMany(
        { userId: req.user._id, categoryId: category._id },
        { categoryId: otherCategory._id, categoryName: otherCategory.name }
      );
    }
    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};

// Auto-categorize
exports.autoCategorize = async (req, res) => {
  try {
    const { description, amount } = req.body;
    const categories = await Category.find({ userId: req.user._id });

    const keywords = {
      'Food & Dining': ['coffee', 'restaurant', 'lunch', 'dinner', 'pizza', 'burger', 'starbucks', 'cafe', 'meal'],
      'Transport': ['uber', 'lyft', 'gas', 'fuel', 'taxi', 'parking', 'metro', 'bus', 'train'],
      'Shopping': ['amazon', 'walmart', 'target', 'mall', 'clothes', 'shoes', 'zara'],
      'Entertainment': ['netflix', 'spotify', 'movie', 'game', 'concert', 'cinema'],
      'Groceries': ['grocery', 'supermarket', 'whole foods', 'trader', 'safeway'],
      'Subscriptions': ['subscription', 'monthly', 'premium', 'membership'],
      'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medicine', 'dentist'],
      'Bills & Utilities': ['electric', 'water', 'gas bill', 'phone bill', 'internet'],
    };

    let matchedCategory = null;
    const lowerDesc = description.toLowerCase();

    for (const [categoryName, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (lowerDesc.includes(word)) {
          const cat = categories.find(c => c.name === categoryName);
          if (cat) { matchedCategory = cat; break; }
        }
      }
      if (matchedCategory) break;
    }

    if (!matchedCategory) {
      matchedCategory = categories.find(c => c.name === 'Other') || categories[0];
    }

    res.json({
      success: true,
      data: {
        categoryId: matchedCategory._id,
        categoryName: matchedCategory.name,
        confidence: 0.75,
      },
    });
  } catch (error) {
    console.error('❌ Auto-categorize error:', error);
    res.status(500).json({ success: false, message: 'Failed to auto-categorize' });
  }
};