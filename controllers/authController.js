const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Create/Update user profile
exports.createProfile = async (req, res) => {
  try {
    const { phone, name, email } = req.body;

    if (!phone || !name) {
      return res.status(400).json({
        success: false,
        message: 'Phone and name are required'
      });
    }

    // Generate unique userId
    const userId = `USER${Date.now()}`;

    // Create or update user
    const user = await User.findOneAndUpdate(
      { phone },
      {
        userId,
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
      { userId: user.userId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        userId: user.userId,
        phone: user.phone,
        name: user.name,
        email: user.email,
        token
      }
    });

  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create profile'
    });
  }
};

// Check registration status
exports.checkRegistration = async (req, res) => {
  try {
    const { phone } = req.params;
    const user = await User.findOne({ phone });

    res.json({
      success: true,
      isRegistered: user?.isRegistered ?? false
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check registration status'
    });
  }
};

// Get user data
exports.getUserData = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user.userId,
        phone: user.phone,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
};

// Update login status
exports.updateLoginStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status } = req.body;

    await User.findOneAndUpdate(
      { userId },
      { 
        isLoggedIn: status,
        ...(status && { lastLoginAt: new Date() })
      }
    );

    res.json({
      success: true,
      message: `Login status updated to ${status}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update login status'
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { userId } = req.user;
    await User.findOneAndUpdate(
      { userId },
      { isLoggedIn: false }
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
};
