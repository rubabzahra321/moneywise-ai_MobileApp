require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function testConnection() {
  console.log('🔍 Testing MongoDB Connection...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas!');
    
    // Check existing users
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find().limit(3);
      console.log('👤 Users:', users.map(u => ({
        id: u._id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt
      })));
    } else {
      console.log('⚠️ No users found in database');
    }
    
    await mongoose.disconnect();
    console.log('✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConnection();