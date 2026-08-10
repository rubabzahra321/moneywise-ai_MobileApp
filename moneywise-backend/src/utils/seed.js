require('dotenv').config();
const mongoose = require('mongoose');
const { defaultCategories } = require('./constants');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create default categories if they don't exist
    // This runs during user registration instead

    console.log('✅ Database seed completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();