const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Example protected route - only accessible with valid JWT
router.get('/profile', protect, (req, res) => {
  // req.user is set by protect middleware (decoded token)
  res.json({
    message: `Welcome, your email is ${req.user.email}`,
    user: req.user,
  });
});

module.exports = router;
