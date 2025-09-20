const express = require('express');
const router = express.Router();

// Placeholder routes - to be implemented
router.get('/performance', (req, res) => {
  res.status(501).json({ message: 'Performance analytics endpoint to be implemented' });
});

router.get('/skills-progress', (req, res) => {
  res.status(501).json({ message: 'Skills progress endpoint to be implemented' });
});

module.exports = router;