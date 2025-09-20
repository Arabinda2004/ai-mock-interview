const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgresql');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  interviewId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Interviews',
      key: 'id',
    },
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
    allowNull: false,
  },
  skills: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 300, // 5 minutes in seconds
    validate: {
      min: 60,
      max: 1800, // 30 minutes max
    },
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  evaluationCriteria: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  optimalAnswer: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  hints: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  source: {
    type: DataTypes.ENUM('AI_Generated', 'Predefined', 'Custom'),
    defaultValue: 'AI_Generated',
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  indexes: [
    {
      fields: ['interviewId'],
    },
    {
      fields: ['difficulty'],
    },
    {
      fields: ['orderIndex'],
    },
    {
      fields: ['source'],
    },
  ],
});

// Instance methods
Question.prototype.getDifficultyScore = function() {
  const scores = {
    'Easy': 1,
    'Medium': 2,
    'Hard': 3,
  };
  return scores[this.difficulty] || 1;
};

Question.prototype.hasTimeExpired = function(startTime) {
  if (!startTime) return false;
  const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  return elapsed > this.timeLimit;
};

Question.prototype.getRemainingTime = function(startTime) {
  if (!startTime) return this.timeLimit;
  const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  return Math.max(0, this.timeLimit - elapsed);
};

module.exports = Question;