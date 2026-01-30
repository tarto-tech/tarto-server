const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver.js');

// POST /api/drivers/register - Register new driver
router.post('/register', async (req, res) => {
  try {
    const { 
      phone, 
      name, 
      email, 
      agencyName,
      panNumber,
      address,
      dateOfBirth,
      licenseNumber,
      vehicleDetails,
      gender
    } = req.body;
    
    // Check if driver already exists
    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        error: 'Driver already registered with this phone number'
      });
    }
    
    // Create driver with pending documents
    const driver = new Driver({
      phone,
      name,
      email,
      agencyName,
      panNumber,
      address,
      dateOfBirth,
      licenseNumber,
      vehicleDetails,
      gender,
      status: 'pending',
      documents: {
        aadhar: { status: 'pending' },
        license: { status: 'pending' }
      }
    });
    
    await driver.save();
    
    res.status(201).json({
      success: true,
      data: {
        _id: driver._id,
        phone: driver.phone,
        name: driver.name,
        email: driver.email,
        status: driver.status,
        documents: driver.documents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH /api/drivers/:driverId - Update driver documents
router.patch('/:driverId', async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.driverId,
      { 
        ...req.body,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }
    
    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH /api/drivers/:driverId/approve - Admin approve driver
router.patch('/:driverId/approve', async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.driverId,
      {
        status: 'approved',
        'documents.aadhar.status': 'approved',
        'documents.license.status': 'approved',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Driver approved successfully',
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH /api/drivers/:driverId/reject - Admin reject driver
router.patch('/:driverId/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    const driver = await Driver.findByIdAndUpdate(
      req.params.driverId,
      {
        status: 'rejected',
        rejectionReason,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Driver rejected',
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/drivers/profile/phone/:phoneNumber - Get driver by phone
router.get('/profile/phone/:phoneNumber', async (req, res) => {
  try {
    const driver = await Driver.findOne({ phone: req.params.phoneNumber });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        _id: driver._id,
        phone: driver.phone,
        name: driver.name,
        email: driver.email,
        status: driver.status,
        documents: driver.documents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
