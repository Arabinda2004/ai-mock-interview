const express = require('express');
const router = express.Router();
const {
  submitAnswer,
  getInterviewAnswers
} = require('../controllers/answerController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /answers/submit
 * @desc Submit user answer
 * @access Private
 */
router.post('/submit', authenticateToken, submitAnswer);

/**
 * @route GET /answers/interview/:interviewId
 * @desc Get all answers for an interview
 * @access Private
 */
router.get('/interview/:interviewId', authenticateToken, getInterviewAnswers);

module.exports = router;
