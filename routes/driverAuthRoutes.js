const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();
const Driver = require('../models/Driver.js');
const OTP = require('../models/OTP.js');
const rateLimit = require('express-rate-limit');

// Rate limiter for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { success: false, message: 'Too many OTP requests. Please try again later.' }
});

// POST /auth/send-otp
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Validate phone number
    if (!phoneNumber || !/^[0-9]{10}$/.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number required' });
    }
    
    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    
    // Delete old OTPs for this phone number
    await OTP.deleteMany({ phoneNumber });
    
    // Store OTP in database with 10 minute expiry
    await OTP.create({
      phoneNumber,
      otp: otp.toString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    
    // Send via MSG91
    try {
      await axios.get('https://api.msg91.com/api/v5/otp', {
        params: {
          authkey: process.env.MSG91_AUTH_TOKEN,
          mobile: phoneNumber,
          otp: otp,
          template_id: process.env.MSG91_WIDGET_ID
        }
      });
    } catch (msg91Error) {
      console.log('MSG91 error, using test mode:', msg91Error.message);
    }
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP required' });
    }

    // Find OTP in database
    const otpRecord = await OTP.findOne({ phoneNumber, otp: otp.toString() });
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Check if driver exists
    const driver = await Driver.findOne({ phone: phoneNumber });
    
    if (driver) {
      // Driver exists - generate JWT token
      const token = jwt.sign(
        { 
          driverId: driver._id, 
          phone: driver.phone,
          type: 'driver' 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.json({
        success: true,
        isRegistered: true,
        data: {
          token,
          driver: {
            id: driver._id,
            name: driver.name,
            phone: driver.phone,
            email: driver.email,
            status: driver.status,
            vehicleDetails: driver.vehicleDetails,
            totalTrips: driver.totalTrips,
            totalEarnings: driver.totalEarnings,
            rating: driver.rating
          }
        }
      });
    } else {
      // Driver not found - needs registration
      return res.json({
        success: true,
        isRegistered: false,
        message: 'Please complete registration',
        phoneNumber: phoneNumber
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /auth/register
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
      gender,
      documents 
    } = req.body;
    
    // Check if driver already exists
    let driver = await Driver.findOne({ phone });
    if (driver) {
      return res.status(400).json({ success: false, message: 'Driver already exists' });
    }
    
    // Validate required fields
    if (!phone || !name || !email || !agencyName || !panNumber || !licenseNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone, name, email, agency name, PAN number, and license number are required' 
      });
    }
    
    // Create new driver
    driver = new Driver({
      phone,
      name,
      email,
      agencyName,
      panNumber: panNumber?.toUpperCase(),
      address,
      dateOfBirth,
      licenseNumber,
      vehicleDetails,
      gender,
      documents,
      status: 'pending_verification'
    });
    
    await driver.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        driverId: driver._id, 
        phone: driver.phone,
        type: 'driver' 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        driver: {
          id: driver._id,
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          status: driver.status,
          vehicleDetails: driver.vehicleDetails
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
