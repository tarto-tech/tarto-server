const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Create AppVersion model
const appVersionSchema = new mongoose.Schema({
  latestVersion: String,
  minRequiredVersion: String,
  forceUpdate: Boolean,
  updateMessage: String,
  updateUrl: {
    android: String,
    ios: String
  }
}, { timestamps: true });

const AppVersion = mongoose.model('AppVersion', appVersionSchema);

// Initialize default version if none exists
async function initializeDefaultVersion() {
  const count = await AppVersion.countDocuments();
  if (count === 0) {
    const defaultVersion = new AppVersion({
      latestVersion: "1.0.1",
      minRequiredVersion: "1.0.0",
      forceUpdate: false,
      updateMessage: "New features and bug fixes available. Please update to the latest version.",
      updateUrl: {
        android: "https://play.google.com/store/apps/details?id=com.tarto.tech",
        ios: "https://apps.apple.com/app/tarto/id123456789"
      }
    });
    await defaultVersion.save();
  }
}
initializeDefaultVersion();

// GET endpoint
router.get('/update-info', async (req, res) => {
  try {
    const versionData = await AppVersion.findOne().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: versionData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch update info',
      error: error.message
    });
  }
});

// PUT endpoint
router.put('/update-info', async (req, res) => {
  try {
    const latestVersion = await AppVersion.findOne().sort({ createdAt: -1 });
    
    if (latestVersion) {
      Object.assign(latestVersion, req.body);
      await latestVersion.save();
    } else {
      await new AppVersion(req.body).save();
    }
    
    res.json({
      success: true,
      message: 'Update info updated successfully',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update version info',
      error: error.message
    });
  }
});

// POST endpoint (identical to PUT for compatibility)
router.post('/update-info', async (req, res) => {
  try {
    const latestVersion = await AppVersion.findOne().sort({ createdAt: -1 });
    
    if (latestVersion) {
      Object.assign(latestVersion, req.body);
      await latestVersion.save();
    } else {
      await new AppVersion(req.body).save();
    }
    
    res.json({
      success: true,
      message: 'Update info updated successfully',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update version info',
      error: error.message
    });
  }
});

// PATCH endpoint
router.patch('/update-info', async (req, res) => {
  try {
    const latestVersion = await AppVersion.findOne().sort({ createdAt: -1 });
    
    if (!latestVersion) {
      return res.status(404).json({
        success: false,
        message: 'No version info found to update'
      });
    }
    
    Object.assign(latestVersion, req.body);
    await latestVersion.save();
    
    res.json({
      success: true,
      message: 'Update info partially updated successfully',
      data: latestVersion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to patch version info',
      error: error.message
    });
  }
});

// DELETE endpoint
router.delete('/update-info', async (req, res) => {
  try {
    const result = await AppVersion.deleteMany({});
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} version records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete version info',
      error: error.message
    });
  }
});

module.exports = router;