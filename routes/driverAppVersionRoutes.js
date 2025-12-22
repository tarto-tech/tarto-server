const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Create DriverAppVersion model
const driverAppVersionSchema = new mongoose.Schema({
  latestVersion: String,
  minRequiredVersion: String,
  forceUpdate: Boolean,
  updateMessage: String,
  updateUrl: {
    android: String,
    ios: String
  }
}, { timestamps: true });

const DriverAppVersion = mongoose.model('DriverAppVersion', driverAppVersionSchema);

// Initialize default version if none exists
async function initializeDefaultDriverVersion() {
  const count = await DriverAppVersion.countDocuments();
  if (count === 0) {
    const defaultVersion = new DriverAppVersion({
      latestVersion: "1.0.11",
      minRequiredVersion: "1.0.11",
      forceUpdate: true,
      updateMessage: "Demo",
      updateUrl: {
        android: "https://play.google.com/store/apps/details?id=com.tarto.tech",
        ios: "https://play.google.com/store/apps/details?id=com.tarto.tech"
      }
    });
    await defaultVersion.save();
  }
}
initializeDefaultDriverVersion();

// GET endpoint
router.get('/driver-update-info', async (req, res) => {
  try {
    const versionData = await DriverAppVersion.findOne().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: versionData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver update info',
      error: error.message
    });
  }
});

// PUT endpoint
router.put('/driver-update-info', async (req, res) => {
  try {
    const latestVersion = await DriverAppVersion.findOne().sort({ createdAt: -1 });
    
    if (latestVersion) {
      Object.assign(latestVersion, req.body);
      await latestVersion.save();
    } else {
      await new DriverAppVersion(req.body).save();
    }
    
    res.json({
      success: true,
      message: 'Driver update info updated successfully',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update driver version info',
      error: error.message
    });
  }
});

// POST endpoint
router.post('/driver-update-info', async (req, res) => {
  try {
    const latestVersion = await DriverAppVersion.findOne().sort({ createdAt: -1 });
    
    if (latestVersion) {
      Object.assign(latestVersion, req.body);
      await latestVersion.save();
    } else {
      await new DriverAppVersion(req.body).save();
    }
    
    res.json({
      success: true,
      message: 'Driver update info updated successfully',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update driver version info',
      error: error.message
    });
  }
});

// PATCH endpoint
router.patch('/driver-update-info', async (req, res) => {
  try {
    const latestVersion = await DriverAppVersion.findOne().sort({ createdAt: -1 });
    
    if (!latestVersion) {
      return res.status(404).json({
        success: false,
        message: 'No driver version info found to update'
      });
    }
    
    Object.assign(latestVersion, req.body);
    await latestVersion.save();
    
    res.json({
      success: true,
      message: 'Driver update info partially updated successfully',
      data: latestVersion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to patch driver version info',
      error: error.message
    });
  }
});

// DELETE endpoint
router.delete('/driver-update-info', async (req, res) => {
  try {
    const result = await DriverAppVersion.deleteMany({});
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} driver version records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete driver version info',
      error: error.message
    });
  }
});

module.exports = router;