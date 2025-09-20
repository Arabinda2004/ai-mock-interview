const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   POST /api/interviews/questions/generate
 * @desc    Generate interview questions based on user setup
 * @access  Private
 */
router.post('/questions/generate', authenticateToken, async (req, res) => {
  try {
    const {
      jobRole,
      customJobRole,
      skills,
      experienceLevel,
      interviewType,
      difficulty,
      duration
    } = req.body;

    // Validate required fields
    if (!jobRole || !skills || !experienceLevel || !interviewType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: jobRole, skills, experienceLevel, interviewType'
      });
    }

    // Validate skills array
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Skills must be a non-empty array'
      });
    }

    // Validate numeric fields
    if (duration && (isNaN(duration) || duration < 5 || duration > 120)) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 5 and 120 minutes'
      });
    }

    const interviewSetup = {
      jobRole,
      customJobRole,
      skills,
      experienceLevel,
      interviewType,
      difficulty: difficulty || 'medium',
      duration: duration || 30
    };

    logger.info(`Generating questions for user ${req.user.id}, role: ${jobRole}`);

    // Generate questions using Gemini AI
    const questions = await geminiService.generateInterviewQuestions(interviewSetup);

    // TODO: Store interview session in database
    const interviewId = `interview_${Date.now()}_${req.user.id}`;
    
    res.json({
      success: true,
      data: {
        interviewId,
        questions,
        setup: interviewSetup,
        totalQuestions: questions.length,
        estimatedDuration: `${Math.ceil(questions.length * 4)} minutes`
      }
    });

  } catch (error) {
    logger.error('Error generating interview questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interview questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/interviews/:interviewId/answer
 * @desc    Submit answer for a question and get evaluation
 * @access  Private
 */
router.post('/:interviewId/answer', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { questionId, answer, timeSpent } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and answer are required'
      });
    }

    // TODO: Validate interview exists and belongs to user
    // TODO: Get original question from database
    
    // For now, we'll use a placeholder question
    const question = "Please describe your experience with the requested technology.";
    
    logger.info(`Evaluating answer for interview ${interviewId}, question ${questionId}`);

    // Evaluate the answer using Gemini AI
    const evaluation = await geminiService.evaluateAnswer(question, answer, {
      interviewId,
      questionId,
      userId: req.user.id,
      timeSpent
    });

    // TODO: Store answer and evaluation in database

    res.json({
      success: true,
      data: {
        questionId,
        evaluation,
        timeSpent,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error evaluating answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate answer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/interviews/:interviewId/followup
 * @desc    Generate follow-up question based on previous answer
 * @access  Private
 */
router.post('/:interviewId/followup', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { originalQuestion, previousAnswer } = req.body;

    if (!originalQuestion || !previousAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Original question and previous answer are required'
      });
    }

    logger.info(`Generating follow-up question for interview ${interviewId}`);

    // Generate follow-up question using Gemini AI
    const followUpQuestion = await geminiService.generateFollowUpQuestion({
      originalQuestion,
      previousAnswer,
      interviewId,
      userId: req.user.id
    });

    if (!followUpQuestion) {
      return res.status(200).json({
        success: true,
        data: {
          hasFollowUp: false,
          message: 'No follow-up question generated'
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasFollowUp: true,
        question: followUpQuestion,
        type: 'followup',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error generating follow-up question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate follow-up question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/interviews/:interviewId/summary
 * @desc    Get interview summary and overall evaluation
 * @access  Private
 */
router.get('/:interviewId/summary', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;

    // TODO: Get interview data from database
    // For now, return a placeholder summary
    
    logger.info(`Generating summary for interview ${interviewId}`);

    const summary = {
      interviewId,
      userId: req.user.id,
      status: 'completed',
      totalQuestions: 8,
      answeredQuestions: 6,
      averageScore: 7.2,
      totalDuration: '28 minutes',
      strengths: [
        'Strong technical knowledge',
        'Clear communication',
        'Good problem-solving approach'
      ],
      improvements: [
        'Could provide more specific examples',
        'Consider edge cases in solutions',
        'Practice explaining complex concepts simply'
      ],
      overallFeedback: 'Good performance overall. Continue practicing to improve confidence and technical depth.',
      completedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Error generating interview summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interview summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/interviews/history
 * @desc    Get user's interview history
 * @access  Private
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // TODO: Get actual interview history from database
    // For now, return mock data
    
    const mockHistory = [
      {
        id: 'interview_1234567890',
        jobRole: 'Full Stack Developer',
        skills: ['React', 'Node.js', 'MongoDB'],
        experienceLevel: 'Mid-Level (2-5 years)',
        interviewType: 'mixed',
        score: 7.5,
        status: 'completed',
        duration: '32 minutes',
        createdAt: '2024-01-15T10:30:00Z',
        completedAt: '2024-01-15T11:02:00Z'
      },
      {
        id: 'interview_1234567891',
        jobRole: 'Frontend Developer',
        skills: ['React', 'JavaScript', 'CSS'],
        experienceLevel: 'Junior (0-2 years)',
        interviewType: 'technical',
        score: 6.8,
        status: 'completed',
        duration: '25 minutes',
        createdAt: '2024-01-10T14:15:00Z',
        completedAt: '2024-01-10T14:40:00Z'
      }
    ];

    res.json({
      success: true,
      data: {
        interviews: mockHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockHistory.length,
          totalPages: Math.ceil(mockHistory.length / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching interview history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/interviews/:interviewId
 * @desc    Delete an interview record
 * @access  Private
 */
router.delete('/:interviewId', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;

    // TODO: Delete interview from database
    // TODO: Verify interview belongs to authenticated user
    
    logger.info(`Deleting interview ${interviewId} for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Interview deleted successfully',
      data: {
        interviewId,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error deleting interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;