const express = require('express');
const router = express.Router();

// Placeholder routes - to be implemented
router.post('/generate', (req, res) => {
  res.status(501).json({ message: 'Generate questions endpoint to be implemented' });
});

router.get('/interview/:id', (req, res) => {
  res.status(501).json({ message: 'Get interview questions endpoint to be implemented' });
});

module.exports = router;