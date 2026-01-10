const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const userController = require('../controllers/userController');
const User = require('../models/userModel');
const auth = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// Get all users
router.get('/', catchAsync(async (req, res) => {
  const users = await User.find()
    .sort({ createdAt: -1 })
    .select('-__v');
  
  res.json({
    success: true,
    data: users
  });
}));

// Authentication routes
router.post('/login', userController.loginUser);
router.post('/send-otp', userController.sendOTP);
router.post('/verify-otp', userController.verifyOTP);

// User management routes
router.get('/check-exists', userController.checkUserExists);
router.post('/', userController.createUser);
router.get('/by-phone/:phone', userController.getUserByPhone);
router.put('/:phone', userController.updateUser);

// Update FCM token
router.post('/:userId/fcm-token', catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { fcmToken } = req.body;
  
  if (!fcmToken) {
    return res.status(400).json({ 
      success: false, 
      message: 'FCM token is required' 
    });
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    { fcmToken },
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
    message: 'FCM token updated successfully' 
  });
}));

// Address management routes

// Get all addresses for a user
router.get('/:userId/addresses', catchAsync(async (req, res) => {
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
}));

// Add address to user
router.post('/:userId/addresses', catchAsync(async (req, res) => {
  const { userId } = req.params;
  const addressData = req.body;
  
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
  
  // Add address to user
  const user = await User.findByIdAndUpdate(
    userId,
    { $push: { addresses: addressData } },
    { new: true }
  );
  
  res.status(201).json({
    success: true,
    data: addressData
  });
}));

// Update address
router.put('/:userId/addresses/:addressId', catchAsync(async (req, res) => {
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
}));

// Delete address
router.delete('/:userId/addresses/:addressId', catchAsync(async (req, res) => {
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
}));

module.exports = router;