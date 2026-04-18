/**
 * MongoDB Models Index
 * Exports all Mongoose models for the AI Mock Interview Platform
 */
const User = require('./User');
const Interview = require('./Interview');
const Question = require('./Question');
const Answer = require('./Answer');
const QuestionTemplate = require('./QuestionTemplate');

module.exports = {
  User,
  Interview,
  Question,
  Answer,
  QuestionTemplate
};