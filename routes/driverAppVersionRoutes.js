const express = require('express');
const router = express.Router();
const driverAppVersionController = require('../controllers/driverAppVersionController');

// Public routes (no authentication required)
router.get('/driver-appversions', driverAppVersionController.getDriverAppVersions);
router.get('/driver-update-info', driverAppVersionController.getDriverUpdateInfo);
router.post('/driver-update-info', driverAppVersionController.createDriverUpdateInfo);
router.put('/driver-update-info', driverAppVersionController.updateDriverUpdateInfo);
router.patch('/driver-update-info', driverAppVersionController.patchDriverUpdateInfo);
router.delete('/driver-update-info', driverAppVersionController.deleteDriverUpdateInfo);

module.exports = router;