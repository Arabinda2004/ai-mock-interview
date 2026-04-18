const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Answer Schema for MongoDB
 * Follows the architecture specification for AI Mock Interview Platform
 */
const answerSchema = new mongoose.Schema({
  answerId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true,
    index: true
  },
  interviewId: {
    type: String,
    required: [true, 'Interview ID is required'],
    index: true
  },
  questionId: {
    type: String,
    required: [true, 'Question ID is required'],
    index: true
  },
  userAnswer: {
    type: String,
    required: [true, 'User answer is required'],
    trim: true
  },
  answerTimeSeconds: {
    type: Number,
    required: [true, 'Answer time is required'],
    min: 0
  },
  aiReview: {
    score: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    maxScore: {
      type: Number,
      default: 10
    },
    technicalScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    communicationScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    quality: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Below Average', 'Poor', ''],
      default: ''
    },
    feedback: {
      type: String,
      default: ''
    },
    missingPoints: {
      type: [String],
      default: []
    },
    improvementTip: {
      type: String,
      default: ''
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // Using custom createdAt field
});

// Indexes for faster queries
answerSchema.index({ interviewId: 1 });
answerSchema.index({ questionId: 1 });
answerSchema.index({ answerId: 1 });

// Instance method to check if answer is reviewed
answerSchema.methods.isReviewed = function() {
  return this.aiReview && this.aiReview.score !== null;
};

// Instance method to get quality rating
answerSchema.methods.getQualityRating = function() {
  return this.aiReview?.quality || 'Not Reviewed';
};

// Instance method to calculate percentage score
answerSchema.methods.getPercentageScore = function() {
  if (this.aiReview?.score !== null && this.aiReview?.maxScore) {
    return (this.aiReview.score / this.aiReview.maxScore) * 100;
  }
  return 0;
};

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;