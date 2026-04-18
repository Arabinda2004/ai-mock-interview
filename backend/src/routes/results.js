const express = require('express');
const router = express.Router();
const {
  getInterviewResults
} = require('../controllers/resultsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /results/:interviewId
 * @desc Get interview results
 * @access Private
 */
router.get('/:interviewId', authenticateToken, getInterviewResults);

module.exports = router;
