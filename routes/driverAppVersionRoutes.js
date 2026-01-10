const express = require('express');
const router = express.Router();
const driverAppVersionController = require('../controllers/driverAppVersionController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/driver-appversions', driverAppVersionController.getDriverAppVersions);
router.get('/driver-update-info', driverAppVersionController.getDriverUpdateInfo);

// Admin routes (require authentication)
router.post('/driver-update-info', authenticateToken, driverAppVersionController.createDriverUpdateInfo);
router.put('/driver-update-info', authenticateToken, driverAppVersionController.updateDriverUpdateInfo);
router.patch('/driver-update-info', authenticateToken, driverAppVersionController.patchDriverUpdateInfo);
router.delete('/driver-update-info', authenticateToken, driverAppVersionController.deleteDriverUpdateInfo);

module.exports = router;