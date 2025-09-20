const mongoose = require('mongoose');

const QuestionTemplateSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  jobRole: {
    type: String,
    required: true,
  },
  skills: [{
    type: String,
    required: true,
  }],
  category: {
    type: String,
    required: true,
  },
  timeLimit: {
    type: Number,
    default: 300, // 5 minutes in seconds
    min: 60,
    max: 1800,
  },
  evaluationCriteria: [{
    type: String,
    required: true,
  }],
  optimalAnswer: {
    type: String,
    required: true,
  },
  hints: [{
    type: String,
  }],
  tags: [{
    type: String,
  }],
  source: {
    type: String,
    enum: ['AI_Generated', 'Expert_Created', 'Community'],
    default: 'Expert_Created',
  },
  usage: {
    count: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
    },
    averageScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  metadata: {
    createdBy: String,
    reviewedBy: String,
    version: {
      type: String,
      default: '1.0',
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for better query performance
QuestionTemplateSchema.index({ jobRole: 1, difficulty: 1 });
QuestionTemplateSchema.index({ skills: 1 });
QuestionTemplateSchema.index({ category: 1 });
QuestionTemplateSchema.index({ isActive: 1 });
QuestionTemplateSchema.index({ 'usage.averageScore': -1 });

// Methods
QuestionTemplateSchema.methods.incrementUsage = function() {
  this.usage.count += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

QuestionTemplateSchema.methods.updateAverageScore = function(newScore) {
  if (this.usage.averageScore) {
    // Calculate running average
    this.usage.averageScore = (
      (this.usage.averageScore * (this.usage.count - 1) + newScore) / 
      this.usage.count
    );
  } else {
    this.usage.averageScore = newScore;
  }
  return this.save();
};

// Static methods
QuestionTemplateSchema.statics.findByJobRole = function(jobRole, difficulty = null) {
  const query = { jobRole, isActive: true };
  if (difficulty) query.difficulty = difficulty;
  return this.find(query).sort({ 'usage.averageScore': -1 });
};

QuestionTemplateSchema.statics.findBySkills = function(skills, difficulty = null) {
  const query = { 
    skills: { $in: skills },
    isActive: true,
  };
  if (difficulty) query.difficulty = difficulty;
  return this.find(query).sort({ 'usage.averageScore': -1 });
};

QuestionTemplateSchema.statics.getRandomQuestions = function(filter, count = 10) {
  return this.aggregate([
    { $match: { ...filter, isActive: true } },
    { $sample: { size: count } },
  ]);
};

module.exports = mongoose.model('QuestionTemplate', QuestionTemplateSchema);