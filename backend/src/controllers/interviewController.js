const { Interview, Question } = require('../models');
const logger = require('../utils/logger');

/**
 * Create a new interview
 * @route POST /interviews/create
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with created interview
 */
const createInterview = async (req, res) => {
  try {
    const {
      userId,
      title,
      role,
      experienceLevel,
      skillsTargeted,
      durationMinutes,
      aiModelUsed
    } = req.body;

    // Validate required fields
    if (!userId || !title || !role || !experienceLevel || !skillsTargeted || skillsTargeted.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, title, role, experienceLevel, skillsTargeted'
      });
    }

    // Create interview
    const interview = new Interview({
      userId,
      title,
      role,
      experienceLevel,
      skillsTargeted,
      durationMinutes: durationMinutes || 30,
      aiModelUsed: aiModelUsed || 'deberta-v3-base',
      status: 'pending'
    });

    await interview.save();

    logger.info(`Interview created: ${interview.interviewId} for user: ${userId}`);

    return res.status(201).json({
      success: true,
      message: 'Interview created successfully',
      data: {
        interview
      }
    });
  } catch (error) {
    logger.error('Error creating interview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create interview',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all interviews for a specific user
 * @route GET /interviews/:userId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with user's interviews
 */
const getUserInterviews = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Find all interviews for user
    const interviews = await Interview.find({ userId })
      .sort({ createdAt: -1 });

    logger.info(`Retrieved ${interviews.length} interviews for user: ${userId}`);

    return res.json({
      success: true,
      data: {
        interviews,
        count: interviews.length
      }
    });
  } catch (error) {
    logger.error('Error retrieving user interviews:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve interviews',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get a specific interview by ID
 * @route GET /interview/:interviewId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with interview details
 */
const getInterviewById = async (req, res) => {
  try {
    const { interviewId } = req.params;

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        error: 'Interview ID is required'
      });
    }

    // Find interview by interviewId
    const interview = await Interview.findOne({ interviewId });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Get questions for this interview
    const questions = await Question.find({ interviewId })
      .sort({ questionNumber: 1 });

    logger.info(`Retrieved interview: ${interviewId}`);

    return res.json({
      success: true,
      data: {
        interview,
        questions,
        questionCount: questions.length
      }
    });
  } catch (error) {
    logger.error('Error retrieving interview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve interview',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Start an interview (change status to ongoing)
 * @route POST /interview/:interviewId/start
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated interview
 */
const startInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findOne({ interviewId });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    if (!interview.canStart()) {
      return res.status(400).json({
        success: false,
        error: 'Interview cannot be started. Check status.'
      });
    }

    interview.startInterview();
    await interview.save();

    logger.info(`Interview started: ${interviewId}`);

    return res.json({
      success: true,
      message: 'Interview started successfully',
      data: {
        interview
      }
    });
  } catch (error) {
    logger.error('Error starting interview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start interview',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Complete an interview (change status to completed)
 * @route POST /interview/:interviewId/complete
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated interview
 */
const completeInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { results } = req.body;

    const interview = await Interview.findOne({ interviewId });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    interview.completeInterview(results);
    await interview.save();

    logger.info(`Interview completed: ${interviewId}`);

    return res.json({
      success: true,
      message: 'Interview completed successfully',
      data: {
        interview
      }
    });
  } catch (error) {
    logger.error('Error completing interview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete interview',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createInterview,
  getUserInterviews,
  getInterviewById,
  startInterview,
  completeInterview
};
