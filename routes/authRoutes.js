const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver.js');
const jwt = require('jsonwebtoken');

// POST /api/auth/register - Register new driver
router.post('/register', async (req, res) => {
  try {
    const { phone } = req.body;
    
    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        error: 'Driver already registered with this phone number'
      });
    }
    
    const driver = new Driver({
      ...req.body,
      status: 'pending'
    });
    
    await driver.save();
    
    const token = jwt.sign(
      { 
        driverId: driver._id, 
        phone: driver.phone,
        type: 'driver' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      success: true,
      data: {
        _id: driver._id,
        phone: driver.phone,
        name: driver.name,
        email: driver.email,
        status: driver.status,
        documents: driver.documents
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
