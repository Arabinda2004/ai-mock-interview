const { Answer, Question } = require('../models');
const mlService = require('../services/mlService');
const logger = require('../utils/logger');

/**
 * Submit user answer for a question
 * @route POST /answers/submit
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with answer and AI review
 */
const submitAnswer = async (req, res) => {
  try {
    const {
      interviewId,
      questionId,
      userAnswer,
      answerTimeSeconds
    } = req.body;

    // Validate required fields
    if (!interviewId || !questionId || !userAnswer || answerTimeSeconds === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: interviewId, questionId, userAnswer, answerTimeSeconds'
      });
    }

    // Get the question
    const question = await Question.findOne({ questionId });
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Create answer record
    const answer = new Answer({
      interviewId,
      questionId,
      userAnswer,
      answerTimeSeconds
    });

    // Get AI review using ML service with architecture-compatible output
    try {
      logger.info(`Requesting AI evaluation for question: ${questionId}`);

      const evaluation = await mlService.evaluateAnswerArchitecture({
        question: question.questionText,
        answer: userAnswer
      });

      // Validate evaluation response
      if (!evaluation || typeof evaluation.score === 'undefined') {
        throw new Error('Invalid evaluation response from AI service');
      }

      // Store AI review in answer with proper validation
      answer.aiReview = {
        score: parseFloat(evaluation.score) || 0,
        maxScore: parseFloat(evaluation.maxScore) || 10,
        technicalScore: parseFloat(evaluation.technicalScore) || parseFloat(evaluation.score) || 0,
        communicationScore: parseFloat(evaluation.communicationScore) || parseFloat(evaluation.score) || 0,
        quality: evaluation.quality || 'Average',
        feedback: evaluation.feedback || 'Answer evaluated successfully.',
        missingPoints: Array.isArray(evaluation.missingPoints) ? evaluation.missingPoints : [],
        improvementTip: evaluation.improvementTip || 'Keep practicing to improve.'
      };

      logger.info(`AI evaluation completed: Score ${answer.aiReview.score}/10, Quality: ${answer.aiReview.quality}`);
    } catch (aiError) {
      logger.error('Error getting AI review:', aiError);

      // Provide a default evaluation instead of leaving it empty
      answer.aiReview = {
        score: 5,
        maxScore: 10,
        quality: 'Average',
        feedback: 'Answer received but could not be fully evaluated. Please ensure your response is clear and addresses the question.',
        missingPoints: [],
        improvementTip: 'Try to provide more detailed explanations and examples in your answers.'
      };
    }

    await answer.save();

    logger.info(`Answer submitted for question: ${questionId}`);

    return res.status(201).json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        answer
      }
    });
  } catch (error) {
    logger.error('Error submitting answer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit answer',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all answers for a specific interview
 * @route GET /answers/interview/:interviewId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with all answers
 */
const getInterviewAnswers = async (req, res) => {
  try {
    const { interviewId } = req.params;

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        error: 'Interview ID is required'
      });
    }

    const answers = await Answer.find({ interviewId });

    logger.info(`Retrieved ${answers.length} answers for interview: ${interviewId}`);

    return res.json({
      success: true,
      data: {
        answers,
        count: answers.length
      }
    });
  } catch (error) {
    logger.error('Error retrieving answers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve answers',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  submitAnswer,
  getInterviewAnswers
};
