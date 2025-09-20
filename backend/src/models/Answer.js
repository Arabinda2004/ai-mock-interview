const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgresql');

const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  questionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Questions',
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  interviewId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Interviews',
      key: 'id',
    },
  },
  answerText: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  answerType: {
    type: DataTypes.ENUM('text', 'voice', 'video'),
    defaultValue: 'text',
  },
  audioUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  timeTaken: {
    type: DataTypes.INTEGER,
    allowNull: true, // in seconds
  },
  score: {
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
  evaluationDetails: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  strengths: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  improvements: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  technicalAccuracy: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  communication: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  completeness: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  isEvaluated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  evaluatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  hooks: {
    beforeUpdate: (answer) => {
      if (answer.endTime && answer.startTime) {
        answer.timeTaken = Math.round((answer.endTime - answer.startTime) / 1000);
      }
      if (answer.changed('score') || answer.changed('feedback')) {
        answer.isEvaluated = true;
        answer.evaluatedAt = new Date();
      }
    },
  },
  indexes: [
    {
      fields: ['questionId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['interviewId'],
    },
    {
      fields: ['answerType'],
    },
    {
      fields: ['isEvaluated'],
    },
  ],
});

// Instance methods
Answer.prototype.calculateDuration = function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / 1000); // in seconds
  }
  return null;
};

Answer.prototype.isCompleted = function() {
  return this.endTime !== null;
};

Answer.prototype.hasContent = function() {
  return !!(this.answerText || this.audioUrl || this.videoUrl);
};

Answer.prototype.getOverallScore = function() {
  if (this.technicalAccuracy && this.communication && this.completeness) {
    // Weighted average: 40% technical, 30% communication, 30% completeness
    return (
      (this.technicalAccuracy * 0.4 + 
       this.communication * 0.3 + 
       this.completeness * 0.3) * 10
    );
  }
  return this.score || 0;
};

module.exports = Answer;