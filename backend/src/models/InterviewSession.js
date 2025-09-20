const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  interviewId: {
    type: String,
    required: true,
  },
  questions: [{
    questionId: String,
    questionText: String,
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
    },
    skills: [String],
    orderIndex: Number,
    timeLimit: Number,
    startTime: Date,
    endTime: Date,
    answer: {
      text: String,
      audioUrl: String,
      videoUrl: String,
      type: {
        type: String,
        enum: ['text', 'voice', 'video'],
        default: 'text',
      },
    },
    evaluation: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      feedback: String,
      strengths: [String],
      improvements: [String],
      technicalAccuracy: {
        type: Number,
        min: 0,
        max: 10,
      },
      communication: {
        type: Number,
        min: 0,
        max: 10,
      },
      completeness: {
        type: Number,
        min: 0,
        max: 10,
      },
      evaluatedAt: Date,
      evaluationTime: Number, // time taken to evaluate in ms
    },
    timeTaken: Number, // time taken to answer in seconds
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isEvaluated: {
      type: Boolean,
      default: false,
    },
  }],
  sessionMetadata: {
    jobRole: String,
    experienceLevel: String,
    selectedSkills: [String],
    duration: Number,
    questionCount: Number,
    startTime: Date,
    endTime: Date,
    totalTimeTaken: Number,
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    pausedAt: Date,
    resumedAt: Date,
    pauseDuration: {
      type: Number,
      default: 0, // total pause time in seconds
    },
  },
  status: {
    type: String,
    enum: ['created', 'in_progress', 'completed', 'abandoned'],
    default: 'created',
  },
  overallResults: {
    totalScore: Number,
    averageScore: Number,
    scoreByDifficulty: {
      easy: Number,
      medium: Number,
      hard: Number,
    },
    scoreBySkill: mongoose.Schema.Types.Mixed,
    completionPercentage: Number,
    totalTimeTaken: Number,
    averageTimePerQuestion: Number,
    strengths: [String],
    improvements: [String],
    overallFeedback: String,
  },
  aiMetadata: {
    questionGenerationTime: Number,
    evaluationTime: Number,
    modelUsed: String,
    apiCalls: Number,
    errors: [String],
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

// Indexes
InterviewSessionSchema.index({ sessionId: 1 }, { unique: true });
InterviewSessionSchema.index({ userId: 1, createdAt: -1 });
InterviewSessionSchema.index({ interviewId: 1 });
InterviewSessionSchema.index({ status: 1 });
InterviewSessionSchema.index({ 'sessionMetadata.jobRole': 1 });

// Methods
InterviewSessionSchema.methods.getCurrentQuestion = function() {
  const index = this.sessionMetadata.currentQuestionIndex;
  return this.questions[index] || null;
};

InterviewSessionSchema.methods.moveToNextQuestion = function() {
  if (this.sessionMetadata.currentQuestionIndex < this.questions.length - 1) {
    this.sessionMetadata.currentQuestionIndex += 1;
    return this.save();
  }
  return false;
};

InterviewSessionSchema.methods.calculateOverallResults = function() {
  const completedQuestions = this.questions.filter(q => q.isEvaluated);
  
  if (completedQuestions.length === 0) {
    this.overallResults = { completionPercentage: 0 };
    return;
  }

  const totalScore = completedQuestions.reduce((sum, q) => sum + (q.evaluation.score || 0), 0);
  const averageScore = totalScore / completedQuestions.length;
  
  // Score by difficulty
  const scoreByDifficulty = {
    easy: this.calculateAverageByDifficulty('Easy'),
    medium: this.calculateAverageByDifficulty('Medium'),
    hard: this.calculateAverageByDifficulty('Hard'),
  };

  // Score by skill
  const scoreBySkill = {};
  this.sessionMetadata.selectedSkills.forEach(skill => {
    scoreBySkill[skill] = this.calculateAverageBySkill(skill);
  });

  // Completion percentage
  const completionPercentage = (completedQuestions.length / this.questions.length) * 100;

  // Time calculations
  const totalTimeTaken = completedQuestions.reduce((sum, q) => sum + (q.timeTaken || 0), 0);
  const averageTimePerQuestion = totalTimeTaken / completedQuestions.length;

  // Collect strengths and improvements
  const allStrengths = completedQuestions.flatMap(q => q.evaluation.strengths || []);
  const allImprovements = completedQuestions.flatMap(q => q.evaluation.improvements || []);

  this.overallResults = {
    totalScore,
    averageScore,
    scoreByDifficulty,
    scoreBySkill,
    completionPercentage,
    totalTimeTaken,
    averageTimePerQuestion,
    strengths: [...new Set(allStrengths)], // Remove duplicates
    improvements: [...new Set(allImprovements)], // Remove duplicates
  };

  return this.save();
};

InterviewSessionSchema.methods.calculateAverageByDifficulty = function(difficulty) {
  const questions = this.questions.filter(q => q.difficulty === difficulty && q.isEvaluated);
  if (questions.length === 0) return null;
  
  const totalScore = questions.reduce((sum, q) => sum + (q.evaluation.score || 0), 0);
  return totalScore / questions.length;
};

InterviewSessionSchema.methods.calculateAverageBySkill = function(skill) {
  const questions = this.questions.filter(q => 
    q.skills.includes(skill) && q.isEvaluated
  );
  if (questions.length === 0) return null;
  
  const totalScore = questions.reduce((sum, q) => sum + (q.evaluation.score || 0), 0);
  return totalScore / questions.length;
};

InterviewSessionSchema.methods.pause = function() {
  this.sessionMetadata.isPaused = true;
  this.sessionMetadata.pausedAt = new Date();
  return this.save();
};

InterviewSessionSchema.methods.resume = function() {
  if (this.sessionMetadata.isPaused && this.sessionMetadata.pausedAt) {
    const pauseDuration = Date.now() - this.sessionMetadata.pausedAt.getTime();
    this.sessionMetadata.pauseDuration += Math.floor(pauseDuration / 1000);
    this.sessionMetadata.isPaused = false;
    this.sessionMetadata.resumedAt = new Date();
    this.sessionMetadata.pausedAt = null;
  }
  return this.save();
};

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);