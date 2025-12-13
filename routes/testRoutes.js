const express = require('express');
const router = express.Router();

// Test endpoint to check environment variables
router.get('/env-check', (req, res) => {
  res.json({
    MSG91_WIDGET_ID: process.env.MSG91_WIDGET_ID ? 'Set' : 'Not set',
    MSG91_AUTH_TOKEN: process.env.MSG91_AUTH_TOKEN ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV
  });
});

module.exports = router;