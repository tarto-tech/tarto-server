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
    const { phoneNumber, phone } = req.body;
    const phoneNum = phoneNumber || phone;
    
    // Validate phone number
    if (!phoneNum || !/^[0-9]{10}$/.test(phoneNum)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number required' });
    }
    
    // Let MSG91 generate and send OTP
    try {
      const msg91Response = await axios.post(
        `https://control.msg91.com/api/v5/otp?template_id=${process.env.MSG91_WIDGET_ID}&mobile=91${phoneNum}`,
        {},
        {
          headers: {
            'authkey': process.env.MSG91_AUTH_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('MSG91 Response:', msg91Response.data);
      
      res.json({ 
        success: true, 
        message: 'OTP sent successfully'
      });
    } catch (msg91Error) {
      console.error('MSG91 Error:', msg91Error.response?.data || msg91Error.message);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP. Please try again.' 
      });
    }
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, phone, otp } = req.body;
    const phoneNum = phoneNumber || phone;

    if (!phoneNum || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP required' });
    }

    // Verify OTP with MSG91
    try {
      const verifyResponse = await axios.post(
        `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=91${phoneNum}`,
        {},
        {
          headers: {
            'authkey': process.env.MSG91_AUTH_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('MSG91 Verify Response:', verifyResponse.data);
      
      // Check if verification was successful
      if (verifyResponse.data.type !== 'success') {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
    } catch (msg91Error) {
      console.error('MSG91 Verify Error:', msg91Error.response?.data || msg91Error.message);
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Check if driver exists
    const driver = await Driver.findOne({ phone: phoneNum });
    
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
        phoneNumber: phoneNum
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
