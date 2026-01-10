const DriverAppVersion = require('../models/DriverAppVersion');
const { catchAsync } = require('../middleware/errorHandler');

// GET /api/driver-appversions - Get driver app version info
exports.getDriverAppVersions = catchAsync(async (req, res) => {
  const driverVersion = await DriverAppVersion.findOne({}).sort({ createdAt: -1 });
  
  const defaultVersion = {
    latestVersion: "1.0.0",
    minRequiredVersion: "1.0.0",
    forceUpdate: false,
    updateMessage: "Driver app available",
    updateUrl: {
      android: "https://play.google.com/store/apps/details?id=com.tarto.driver",
      ios: "https://apps.apple.com/app/tarto-driver/id123456789"
    },
    appType: "driver"
  };

  res.json({
    success: true,
    data: driverVersion || defaultVersion
  });
});

// GET /api/driver-update-info - Get driver update info
exports.getDriverUpdateInfo = catchAsync(async (req, res) => {
  const driverVersion = await DriverAppVersion.findOne({}).sort({ createdAt: -1 });
  
  if (!driverVersion) {
    return res.json({
      success: true,
      data: {
        latestVersion: "1.0.0",
        minRequiredVersion: "1.0.0",
        forceUpdate: false,
        updateMessage: "Driver app available",
        updateUrl: {
          android: "https://play.google.com/store/apps/details?id=com.tarto.driver",
          ios: "https://apps.apple.com/app/tarto-driver/id123456789"
        }
      }
    });
  }

  res.json({ success: true, data: driverVersion });
});

// POST /api/driver-update-info - Create/Update driver app version
exports.createDriverUpdateInfo = catchAsync(async (req, res) => {
  const { latestVersion, minRequiredVersion, forceUpdate, updateMessage, updateUrl } = req.body;
  
  if (!latestVersion || !minRequiredVersion) {
    return res.status(400).json({
      success: false,
      message: 'Latest version and minimum required version are required'
    });
  }

  const versionData = {
    latestVersion,
    minRequiredVersion,
    forceUpdate: forceUpdate || false,
    updateMessage: updateMessage || 'New version available',
    updateUrl: {
      android: updateUrl?.android || "https://play.google.com/store/apps/details?id=com.tarto.driver",
      ios: updateUrl?.ios || "https://apps.apple.com/app/tarto-driver/id123456789"
    }
  };

  const updatedVersion = await DriverAppVersion.findOneAndUpdate(
    {},
    versionData,
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    data: updatedVersion
  });
});

// PUT /api/driver-update-info - Update driver app version
exports.updateDriverUpdateInfo = catchAsync(async (req, res) => {
  const updateData = req.body;
  
  const updatedVersion = await DriverAppVersion.findOneAndUpdate({}, updateData, { new: true });

  if (!updatedVersion) {
    return res.status(404).json({ success: false, message: 'Driver app version not found' });
  }

  res.json({ success: true, data: updatedVersion });
});

// PATCH /api/driver-update-info - Partially update driver app version
exports.patchDriverUpdateInfo = catchAsync(async (req, res) => {
  const updateData = req.body;
  
  const updatedVersion = await DriverAppVersion.findOneAndUpdate({}, updateData, { new: true });

  if (!updatedVersion) {
    return res.status(404).json({ success: false, message: 'Driver app version not found' });
  }

  res.json({ success: true, data: updatedVersion });
});

// DELETE /api/driver-update-info - Remove driver app version
exports.deleteDriverUpdateInfo = catchAsync(async (req, res) => {
  const deletedVersion = await DriverAppVersion.findOneAndDelete({});
  
  if (!deletedVersion) {
    return res.status(404).json({ success: false, message: 'Driver app version not found' });
  }

  res.json({ success: true, message: 'Driver app version deleted successfully' });
});