const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ai_interview_platform',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false }); // Set to true only for development reset
    logger.info('PostgreSQL connection established successfully');
  } catch (error) {
    logger.error('Unable to connect to PostgreSQL:', error);
    logger.warn('PostgreSQL connection failed. Running in development mode without database.');
    
    // In development, we can continue without database
    if (process.env.NODE_ENV === 'development') {
      logger.info('Continuing in development mode without PostgreSQL...');
      return;
    }
    
    throw error;
  }
};

module.exports = {
  sequelize,
  connectPostgreSQL,
};