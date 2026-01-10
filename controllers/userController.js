const User = require('../models/userModel');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { generateToken } = require('../utils/jwtUtils');
const { catchAsync } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// Check if user exists by phone number
exports.checkUserExists = catchAsync(async (req, res) => {
  const { phone } = req.query;
  
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }
  
  const user = await User.findOne({ phone });
  
  res.json({
    success: true,
    exists: !!user
  });
});

// Create a new user
exports.createUser = catchAsync(async (req, res) => {
  const { phone, name, email, gender } = req.body;
  
  if (!phone || !name) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and name are required'
    });
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this phone number already exists'
    });
  }
  
  const userData = {
    phone,
    name,
    email,
    isRegistered: true,
    isLoggedIn: true,
    lastLoginAt: new Date()
  };
  
  if (gender && ['male', 'female', 'other'].includes(gender)) {
    userData.gender = gender;
  }
  
  const newUser = new User(userData);
  const savedUser = await newUser.save();
  
  res.status(201).json({
    success: true,
    data: savedUser
  });
});

// Get user by phone number
exports.getUserByPhone = catchAsync(async (req, res) => {
  const { phone } = req.params;
  
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }
  
  const user = await User.findOne({ phone });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const token = generateToken({ id: user._id, phone: user.phone });
  
  res.json({
    success: true,
    token,
    data: user
  });
});

// Update user
exports.updateUser = catchAsync(async (req, res) => {
  const { phone } = req.params;
  const updates = req.body;
  
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }
  
  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Update data is required'
    });
  }
  
  if (updates.gender && !['male', 'female', 'other'].includes(updates.gender)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid gender value. Must be male, female, or other.'
    });
  }
  
  const user = await User.findOneAndUpdate(
    { phone },
    updates,
    { new: true, runValidators: true }
  );
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Login user
exports.loginUser = catchAsync(async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }
  
  const user = await User.findOneAndUpdate(
    { phone },
    { isLoggedIn: true, lastLoginAt: new Date() },
    { new: true }
  );
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const token = generateToken({ id: user._id, phone: user.phone });
  
  res.json({
    success: true,
    token,
    data: user
  });
});

// Send OTP
exports.sendOTP = catchAsync(async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }
  
  const result = await sendOTP(phone);
  
  if (result.success) {
    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.error || 'Failed to send OTP'
    });
  }
});

// Verify OTP
exports.verifyOTP = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  
  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required'
    });
  }
  
  const result = await verifyOTP(phone, otp);
  
  if (result.success) {
    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.error || 'Invalid OTP'
    });
  }
});