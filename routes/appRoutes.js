// routes/appRoutes.js
const express = require('express');
const router = express.Router();

// App update info endpoint
router.get('/update-info', (req, res) => {
  res.json({
    success: true,
    data: {
      latestVersion: "1.0.1",
      minRequiredVersion: "1.0.0",
      forceUpdate: false,
      updateMessage: "New features and bug fixes available. Please update to the latest version.",
      updateUrl: {
        android: "https://play.google.com/store/apps/details?id=com.tarto.tech"
      }
    }
  });
});

module.exports = router;
