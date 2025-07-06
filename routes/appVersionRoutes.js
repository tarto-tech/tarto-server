const express = require('express');
const router = express.Router();
const AppVersion = require('../models/AppVersion');

// GET /api/appversions - Get latest app version info
router.get('/', async (req, res) => {
  try {
    const versionInfo = await AppVersion.findOne().sort({ createdAt: -1 });
    
    if (!versionInfo) {
      return res.status(404).json({
        success: false,
        message: 'No version information found'
      });
    }

    res.json(versionInfo);
  } catch (error) {
    console.error('Error fetching app version:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/direct-update-info - Alternative endpoint for admin panel
router.get('/direct-update-info', async (req, res) => {
  try {
    const versionInfo = await AppVersion.findOne().sort({ createdAt: -1 });
    
    if (!versionInfo) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: versionInfo
    });
  } catch (error) {
    console.error('Error fetching app version:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/direct-update-info - Create or update app version info
router.post('/direct-update-info', async (req, res) => {
  try {
    const {
      latestVersion,
      minRequiredVersion,
      forceUpdate,
      updateMessage,
      updateUrl
    } = req.body;

    if (!latestVersion || !minRequiredVersion || !updateMessage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Find existing version info or create new one
    let versionInfo = await AppVersion.findOne().sort({ createdAt: -1 });
    
    if (versionInfo) {
      // Update existing
      versionInfo.latestVersion = latestVersion;
      versionInfo.minRequiredVersion = minRequiredVersion;
      versionInfo.forceUpdate = forceUpdate || false;
      versionInfo.updateMessage = updateMessage;
      versionInfo.updateUrl = updateUrl || {};
      
      await versionInfo.save();
    } else {
      // Create new
      versionInfo = new AppVersion({
        latestVersion,
        minRequiredVersion,
        forceUpdate: forceUpdate || false,
        updateMessage,
        updateUrl: updateUrl || {}
      });
      
      await versionInfo.save();
    }

    res.json({
      success: true,
      message: 'App version info updated successfully',
      data: versionInfo
    });
  } catch (error) {
    console.error('Error updating app version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app version info'
    });
  }
});

// PUT /api/direct-update-info - Update app version info
router.put('/direct-update-info', async (req, res) => {
  try {
    const {
      latestVersion,
      minRequiredVersion,
      forceUpdate,
      updateMessage,
      updateUrl
    } = req.body;

    if (!latestVersion || !minRequiredVersion || !updateMessage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Find and update existing version info
    let versionInfo = await AppVersion.findOne().sort({ createdAt: -1 });
    
    if (versionInfo) {
      versionInfo.latestVersion = latestVersion;
      versionInfo.minRequiredVersion = minRequiredVersion;
      versionInfo.forceUpdate = forceUpdate || false;
      versionInfo.updateMessage = updateMessage;
      versionInfo.updateUrl = updateUrl || {};
      
      await versionInfo.save();
    } else {
      return res.status(404).json({
        success: false,
        message: 'No version info found to update'
      });
    }

    res.json({
      success: true,
      message: 'App version info updated successfully',
      data: versionInfo
    });
  } catch (error) {
    console.error('Error updating app version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app version info'
    });
  }
});

// PUT /api/appversions/:id - Update specific app version by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      latestVersion,
      minRequiredVersion,
      forceUpdate,
      updateMessage,
      updateUrl
    } = req.body;

    if (!latestVersion || !minRequiredVersion || !updateMessage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const versionInfo = await AppVersion.findByIdAndUpdate(
      id,
      {
        latestVersion,
        minRequiredVersion,
        forceUpdate: forceUpdate || false,
        updateMessage,
        updateUrl: updateUrl || {}
      },
      { new: true, runValidators: true }
    );

    if (!versionInfo) {
      return res.status(404).json({
        success: false,
        message: 'Version info not found'
      });
    }

    res.json({
      success: true,
      message: 'App version info updated successfully',
      data: versionInfo
    });
  } catch (error) {
    console.error('Error updating app version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app version info'
    });
  }
});

module.exports = router;