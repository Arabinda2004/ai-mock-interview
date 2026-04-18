const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * User Schema for MongoDB
 * Follows the architecture specification for AI Mock Interview Platform
 */
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must not exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number'],
    default: null
  },
  experienceLevel: {
    type: String,
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
    ],
    default: 'Entry Level (0-2 years)'
  },
  primaryRole: {
    type: String,
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
    ],
    default: 'Software Engineer'
  },
  skills: {
    type: [String],
    default: []
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to validate password
userSchema.methods.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Instance method to get sanitized user data (without password)
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.__v;
  return userObject;
};

// Override toJSON to exclude sensitive data
userSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;