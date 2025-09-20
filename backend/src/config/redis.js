const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('end', () => {
      logger.warn('Redis client disconnected');
    });

    await redisClient.connect();
    logger.info('Redis connection established successfully');

  } catch (error) {
    logger.error('Unable to connect to Redis:', error);
    // Don't throw error for Redis as it's optional for caching
    logger.warn('Continuing without Redis caching...');
  }
};

const getRedisClient = () => {
  return redisClient;
};

const setCache = async (key, value, expireInSeconds = 3600) => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.setEx(key, expireInSeconds, JSON.stringify(value));
    }
  } catch (error) {
    logger.error('Redis set error:', error);
  }
};

const getCache = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    }
    return null;
  } catch (error) {
    logger.error('Redis get error:', error);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.del(key);
    }
  } catch (error) {
    logger.error('Redis delete error:', error);
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
};