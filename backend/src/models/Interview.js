const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Interview Schema for MongoDB
 * Follows the architecture specification for AI Mock Interview Platform
 */
const interviewSchema = new mongoose.Schema({
  interviewId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title must not exceed 200 characters']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: [
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
    ]
  },
  experienceLevel: {
    type: String,
    required: [true, 'Experience level is required'],
    enum: [
      'Entry Level (0-2 years)',
      'Mid Level (2-5 years)',
      'Senior Level (5-10 years)',
      'Lead Level (10+ years)',
      // Accept short formats from frontend
      'junior',
      'intermediate',
      'senior',
      'expert'
    ]
  },
  skillsTargeted: {
    type: [String],
    required: [true, 'At least one skill must be targeted'],
    validate: {
      validator: function (skills) {
        return Array.isArray(skills) && skills.length > 0;
      },
      message: 'At least one skill must be selected'
    }
  },
  status: {
    type: String,
    enum: ['completed', 'ongoing', 'pending'],
    default: 'pending'
  },
  durationMinutes: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [10, 'Duration must be at least 10 minutes'],
    max: [120, 'Duration must not exceed 120 minutes'],
    default: 30
  },
  aiModelUsed: {
    type: String,
    default: 'deberta-v3-base'
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  results: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    technicalScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    communicationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    verdict: {
      type: String,
      default: ''
    },
    strengths: {
      type: [String],
      default: []
    },
    improvements: {
      type: [String],
      default: []
    }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for faster queries
interviewSchema.index({ userId: 1, createdAt: -1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ interviewId: 1 });

// Instance method to calculate actual duration
interviewSchema.methods.calculateActualDuration = function () {
  if (this.startedAt && this.completedAt) {
    return Math.round((this.completedAt - this.startedAt) / 1000 / 60); // in minutes
  }
  return null;
};

// Instance method to check if interview is completed
interviewSchema.methods.isCompleted = function () {
  return this.status === 'completed';
};

// Instance method to check if interview can start
interviewSchema.methods.canStart = function () {
  return this.status === 'pending';
};

// Instance method to start interview
interviewSchema.methods.startInterview = function () {
  this.status = 'ongoing';
  this.startedAt = new Date();
};

// Instance method to complete interview
interviewSchema.methods.completeInterview = function (results) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (results) {
    this.results = { ...this.results, ...results };
  }
};

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;