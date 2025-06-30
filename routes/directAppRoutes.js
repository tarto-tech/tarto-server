// Direct app version endpoints
const express = require('express');
const directAppRouter = express.Router();

// In-memory version data
let versionData = {
  latestVersion: "1.0.1",
  minRequiredVersion: "1.0.0",
  forceUpdate: false,
  updateMessage: "New features and bug fixes available. Please update to the latest version.",
  updateUrl: {
    android: "https://play.google.com/store/apps/details?id=com.tarto.tech"
  }
};

// GET endpoint
directAppRouter.get('/update-info', (req, res) => {
  console.log('Direct GET /update-info accessed');
  res.json({
    success: true,
    data: versionData
  });
});

// PUT endpoint
directAppRouter.put('/update-info', (req, res) => {
  console.log('Direct PUT /update-info accessed');
  console.log('Request body:', req.body);
  
  // Update the in-memory data
  versionData = { ...versionData, ...req.body };
  
  res.json({
    success: true,
    message: 'Update info updated successfully',
    data: versionData
  });
});

module.exports = directAppRouter;