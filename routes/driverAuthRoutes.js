const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Driver = require('../models/Driver.js');
const { sendOTP, verifyOTP } = require('../services/otpService');
const rateLimit = require('express-rate-limit');

// Rate limiter for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { success: false, message: 'Too many OTP requests. Please try again later.' }
});

// 1. POST /auth/send-otp - Send OTP to driver
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number required' });
    }

    // Send OTP via MSG91
    const otpResult = await sendOTP(phone);
    
    if (!otpResult.success) {
      // For development: log test OTP
      const testOtp = '1234';
      console.log(`Test OTP for ${phone}: ${testOtp}`);
      return res.json({ success: true, message: 'OTP sent successfully (test mode)' });
    }

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST /auth/verify-otp - Verify OTP and check driver status
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP required' });
    }

    // Verify OTP with MSG91
    const verifyResult = await verifyOTP(phone, otp);
    
    // For development: accept test OTP
    if (!verifyResult.success && otp !== '1234') {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Check if driver exists
    const driver = await Driver.findOne({ phone });
    
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
        phone: phone
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. POST /auth/register - Register new driver
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
