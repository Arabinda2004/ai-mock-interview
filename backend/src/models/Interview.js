const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgresql');

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 200],
    },
  },
  jobRole: {
    type: DataTypes.ENUM(
      'Full Stack Developer',
      'Frontend Developer', 
      'Backend Developer',
      'Data Scientist',
      'DevOps Engineer',
      'Mobile Developer',
      'Software Engineer',
      'Product Manager',
      'UI/UX Designer',
      'Other'
    ),
    allowNull: false,
  },
  experienceLevel: {
    type: DataTypes.ENUM(
      'Entry Level (0-2 years)',
      'Mid Level (2-5 years)', 
      'Senior Level (5-10 years)',
      'Lead Level (10+ years)'
    ),
    allowNull: false,
  },
  selectedSkills: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidSkills(value) {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('At least one skill must be selected');
        }
      },
    },
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    validate: {
      min: 10,
      max: 120,
    },
  },
  questionCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: 5,
      max: 50,
    },
  },
  status: {
    type: DataTypes.ENUM(
      'created',
      'in_progress', 
      'completed',
      'abandoned'
    ),
    defaultValue: 'created',
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  overallScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['jobRole'],
    },
    {
      fields: ['createdAt'],
    },
  ],
});

// Instance methods
Interview.prototype.calculateDuration = function() {
  if (this.startedAt && this.completedAt) {
    return Math.round((this.completedAt - this.startedAt) / 1000 / 60); // in minutes
  }
  return null;
};

Interview.prototype.isCompleted = function() {
  return this.status === 'completed';
};

Interview.prototype.canStart = function() {
  return this.status === 'created';
};

module.exports = Interview;