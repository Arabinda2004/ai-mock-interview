const express = require('express');
const router = express.Router();

// Placeholder routes - to be implemented
router.post('/answer', (req, res) => {
  res.status(501).json({ message: 'Evaluate answer endpoint to be implemented' });
});

router.get('/results/:interviewId', (req, res) => {
  res.status(501).json({ message: 'Get results endpoint to be implemented' });
});

module.exports = router;