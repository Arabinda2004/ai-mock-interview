const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectMongoDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-content';
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connection established successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

  } catch (error) {
    logger.error('Unable to connect to MongoDB:', error);
    logger.warn('MongoDB connection failed. Running in development mode without database.');
    
    // In development, we can continue without database
    if (process.env.NODE_ENV === 'development') {
      logger.info('Continuing in development mode without MongoDB...');
      return;
    }
    
    throw error;
  }
};

module.exports = {
  connectMongoDB,
  mongoose,
};