const { Question, Interview } = require('../models');
const mlService = require('../services/mlService');
const logger = require('../utils/logger');

/**
 * Generate interview questions using AI
 * @route POST /ai/generateQuestions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with generated questions
 */
const generateQuestions = async (req, res) => {
  try {
    const {
      interviewId,
      role,
      skills,
      experienceLevel
    } = req.body;

    // Validate required fields
    if (!interviewId || !role || !skills || !experienceLevel) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: interviewId, role, skills, experienceLevel'
      });
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Skills must be a non-empty array'
      });
    }

    // Check if interview exists
    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Generate questions using ML-backed question bank with architecture-compatible format
    const generatedQuestions = await mlService.generateQuestionsArchitecture({
      role,
      skills,
      experienceLevel
    });

    // Save questions to database
    const savedQuestions = [];
    for (let i = 0; i < generatedQuestions.length; i++) {
      const question = new Question({
        interviewId,
        questionNumber: i + 1,
        questionText: generatedQuestions[i].questionText,
        questionCategory: generatedQuestions[i].category || 'General',
        difficulty: generatedQuestions[i].difficulty || 'Medium',
        aiGenerated: true
      });
      await question.save();
      savedQuestions.push(question);
    }

    logger.info(`Generated ${savedQuestions.length} questions for interview: ${interviewId}`);

    return res.status(201).json({
      success: true,
      message: 'Questions generated successfully',
      data: {
        interviewId,
        questions: savedQuestions,
        count: savedQuestions.length
      }
    });
  } catch (error) {
    logger.error('Error generating questions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate questions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Review user's answer using AI
 * @route POST /ai/reviewAnswer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with AI evaluation
 */
const reviewAnswer = async (req, res) => {
  try {
    const {
      questionText,
      userAnswer
    } = req.body;

    // Validate required fields
    if (!questionText || !userAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: questionText, userAnswer'
      });
    }

    // Review answer using ML service with architecture-compatible output format
    const evaluation = await mlService.evaluateAnswerArchitecture({
      question: questionText,
      answer: userAnswer
    });

    logger.info('Answer reviewed successfully');

    return res.json({
      success: true,
      message: 'Answer reviewed successfully',
      data: {
        evaluation
      }
    });
  } catch (error) {
    logger.error('Error reviewing answer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to review answer',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  generateQuestions,
  reviewAnswer
};
