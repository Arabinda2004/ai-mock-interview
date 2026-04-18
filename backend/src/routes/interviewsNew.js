const express = require('express');
const router = express.Router();
const {
  createInterview,
  getUserInterviews,
  getInterviewById,
  startInterview,
  completeInterview
} = require('../controllers/interviewController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /interviews/create
 * @desc Create a new interview
 * @access Private
 */
router.post('/create', authenticateToken, createInterview);

/**
 * @route GET /interviews/:userId
 * @desc Get all interviews for a user
 * @access Private
 */
router.get('/:userId', authenticateToken, getUserInterviews);

/**
 * @route GET /interview/:interviewId
 * @desc Get specific interview by ID
 * @access Private
 */
router.get('/interview/:interviewId', authenticateToken, getInterviewById);

/**
 * @route POST /interview/:interviewId/start
 * @desc Start an interview
 * @access Private
 */
router.post('/interview/:interviewId/start', authenticateToken, startInterview);

/**
 * @route POST /interview/:interviewId/complete
 * @desc Complete an interview
 * @access Private
 */
router.post('/interview/:interviewId/complete', authenticateToken, completeInterview);

module.exports = router;
