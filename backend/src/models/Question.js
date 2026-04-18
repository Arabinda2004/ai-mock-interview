const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Question Schema for MongoDB
 * Follows the architecture specification for AI Mock Interview Platform
 */
const questionSchema = new mongoose.Schema({
  questionId: {
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
  questionNumber: {
    type: Number,
    required: [true, 'Question number is required'],
    min: 1
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  questionCategory: {
    type: String,
    required: [true, 'Question category is required'],
    trim: true
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  aiGenerated: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // Using custom createdAt field
});

// Indexes for faster queries
questionSchema.index({ interviewId: 1, questionNumber: 1 });
questionSchema.index({ questionId: 1 });

// Instance method to get difficulty score
questionSchema.methods.getDifficultyScore = function() {
  const scores = {
    'Easy': 1,
    'Medium': 2,
    'Hard': 3
  };
  return scores[this.difficulty] || 2;
};

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;