const express = require('express');
const router = express.Router();
const {
  generateQuestions,
  reviewAnswer
} = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /ai/generateQuestions
 * @desc Generate interview questions using AI
 * @access Private
 */
router.post('/generateQuestions', authenticateToken, generateQuestions);

/**
 * @route POST /ai/reviewAnswer
 * @desc Review answer using AI
 * @access Private
 */
router.post('/reviewAnswer', authenticateToken, reviewAnswer);

module.exports = router;
