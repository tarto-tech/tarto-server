//userRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const userController = require('../controllers/userController');
const User = require('../models/userModel');
const auth = require('../middleware/auth');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Add this to userRoutes.js
router.post('/login', userController.loginUser);


// Check if user exists
router.get('/check-exists', userController.checkUserExists);

// Create user
router.post('/', userController.createUser);

// Get user by phone
router.get('/by-phone/:phone', userController.getUserByPhone);

// Update user
router.put('/:phone', userController.updateUser);



// ==================== ADDRESS ROUTES ====================

// Get all addresses for a user
router.get('/:userId/addresses', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user.addresses || []
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses'
    });
  }
});

// Add address to user
router.post('/:userId/addresses', async (req, res) => {
  try {
    const { userId } = req.params;
    const addressData = req.body;
    
    console.log('Adding address for user:', userId);
    console.log('Address data:', addressData);
    
    // Validate address data
    if (!addressData.name || !addressData.address || !addressData.type) {
      return res.status(400).json({
        success: false,
        message: 'Address must include name, address, and type'
      });
    }
    
    // Validate address type
    if (!['home', 'work', 'other'].includes(addressData.type)) {
      return res.status(400).json({
        success: false,
        message: 'Address type must be home, work, or other'
      });
    }
    
    // Add ID to address if not provided
    if (!addressData.id) {
      addressData.id = new mongoose.Types.ObjectId().toString();
    }
    
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Find user first to confirm it exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Find user and update by adding address to addresses array
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { addresses: addressData } },
      { new: true }
    );
    
    console.log('Updated user:', user);
    
    res.status(201).json({
      success: true,
      data: addressData
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address',
      error: error.message
    });
  }
});

// Update address
router.put('/:userId/addresses/:addressId', async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const updates = req.body;
    
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Find user and update the specific address in the array
    const user = await User.findOneAndUpdate(
      { _id: userId, 'addresses.id': addressId },
      { $set: { 'addresses.$': { ...updates, id: addressId } } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User or address not found'
      });
    }
    
    // Find the updated address
    const updatedAddress = user.addresses.find(addr => addr.id === addressId);
    
    res.json({
      success: true,
      data: updatedAddress
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address'
    });
  }
});

// Delete address
router.delete('/:userId/addresses/:addressId', async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Find user and remove the address from the array
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { id: addressId } } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address'
    });
  }
});


module.exports = router;