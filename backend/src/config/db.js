require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

// Configure custom DNS servers for MongoDB Atlas SRV query resolution on Windows
if (process.platform === 'win32') {
  dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
  ]);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
};

module.exports = connectDB;
