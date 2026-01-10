const User = require('../models/userModel');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { generateToken } = require('../utils/jwtUtils');

// Check if user exists by phone number
exports.checkUserExists = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error checking user existence:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  try {
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
    
    // Create new user with explicit gender field
    const userData = {
      phone,
      name,
      email,
      isRegistered: true,
      isLoggedIn: true,
      lastLoginAt: new Date()
    };
    
    // Only add gender if it's provided and valid
    if (gender && ['male', 'female', 'other'].includes(gender)) {
      userData.gender = gender;
    }
    
    const newUser = new User(userData);
    const savedUser = await newUser.save();
    
    res.status(201).json({
      success: true,
      data: savedUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user by phone number
exports.getUserByPhone = async (req, res) => {
  try {
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
    
    // Generate JWT token
    const token = generateToken({ id: user._id, phone: user.phone });
    
    res.json({
      success: true,
      token,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user by phone:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update the updateUser function
exports.updateUser = async (req, res) => {
  try {
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
    
    // Validate gender if it's being updated
    if (updates.gender && !['male', 'female', 'other'].includes(updates.gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender value. Must be male, female, or other.'
      });
    }
    
    // Find user and update
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
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid update data',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
// Login user (new method for explicit login)
exports.loginUser = async (req, res) => {
  try {
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
    
    // Generate JWT token
    const token = generateToken({ id: user._id, phone: user.phone });
    
    res.json({
      success: true,
      token,
      data: user
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send OTP
exports.sendOTP = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};