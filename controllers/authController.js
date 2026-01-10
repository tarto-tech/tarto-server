const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { catchAsync } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// Create/Update user profile
exports.createProfile = catchAsync(async (req, res) => {
  const { phone, name, email } = req.body;

  if (!phone || !name) {
    return res.status(400).json({
      success: false,
      message: 'Phone and name are required'
    });
  }

  // Create or update user
  const user = await User.findOneAndUpdate(
    { phone },
    {
      name,
      email,
      isRegistered: true,
      isLoggedIn: true,
      lastLoginAt: new Date()
    },
    { new: true, upsert: true }
  );

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

  res.json({
    success: true,
    data: {
      userId: user._id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      token
    }
  });
});

// Check registration status
exports.checkRegistration = catchAsync(async (req, res) => {
  const { phone } = req.params;
  const user = await User.findOne({ phone });

  res.json({
    success: true,
    isRegistered: user?.isRegistered ?? false
  });
});

// Get user data
exports.getUserData = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      userId: user._id,
      phone: user.phone,
      name: user.name,
      email: user.email
    }
  });
});

// Update login status
exports.updateLoginStatus = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { status } = req.body;

  await User.findByIdAndUpdate(
    userId,
    { 
      isLoggedIn: status,
      ...(status && { lastLoginAt: new Date() })
    }
  );

  res.json({
    success: true,
    message: `Login status updated to ${status}`
  });
});

// Logout
exports.logout = catchAsync(async (req, res) => {
  const { userId } = req.user;
  await User.findByIdAndUpdate(
    userId,
    { isLoggedIn: false }
  );

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});
