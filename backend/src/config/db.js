require('dotenv').config();
const mongoose = require('mongoose');

let cachedConnection = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  cachedConnection = mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await cachedConnection;
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    cachedConnection = null;
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

module.exports = connectDB;
