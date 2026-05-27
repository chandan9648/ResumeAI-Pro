const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resumeai-pro';
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('💡 Make sure MongoDB is running (mongod) or set MONGODB_URI in .env to your Atlas connection string.');
    // Graceful degradation — server keeps running but DB ops will fail
    setTimeout(() => connectDB(), 3000); // retry every 5s
  }
};

module.exports = connectDB;
