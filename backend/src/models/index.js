const { sequelize } = require('../config/postgresql');
const User = require('./User');
const Interview = require('./Interview');
const Question = require('./Question');
const Answer = require('./Answer');

// Define associations
User.hasMany(Interview, {
  foreignKey: 'userId',
  as: 'interviews',
  onDelete: 'CASCADE',
});

Interview.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Interview.hasMany(Question, {
  foreignKey: 'interviewId',
  as: 'questions',
  onDelete: 'CASCADE',
});

Question.belongsTo(Interview, {
  foreignKey: 'interviewId',
  as: 'interview',
});

Question.hasMany(Answer, {
  foreignKey: 'questionId',
  as: 'answers',
  onDelete: 'CASCADE',
});

Answer.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question',
});

Answer.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(Answer, {
  foreignKey: 'userId',
  as: 'answers',
  onDelete: 'CASCADE',
});

Answer.belongsTo(Interview, {
  foreignKey: 'interviewId',
  as: 'interview',
});

Interview.hasMany(Answer, {
  foreignKey: 'interviewId',
  as: 'answers',
  onDelete: 'CASCADE',
});

// Sync models (only in development)
const syncModels = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized');
    }
  } catch (error) {
    console.error('Error synchronizing models:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Interview,
  Question,
  Answer,
  syncModels,
};