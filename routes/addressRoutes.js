// routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const auth = require('../middleware/auth');

// Get all saved addresses for a user
router.get('/:userId/addresses', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify user has permission
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to access these addresses' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.status(200).json({ 
      success: true, 
      addresses: user.addresses || [] 
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching addresses' 
    });
  }
});

// Add a new address
router.post('/:userId/addresses', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const addressData = req.body;
    
    // Verify user has permission
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to add address for this user' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const newAddress = {
      id: addressData.id || new Date().getTime().toString(),
      name: addressData.name,
      address: addressData.address,
      type: addressData.type || 'home'
    };
    
    if (!user.addresses) {
      user.addresses = [];
    }
    user.addresses.push(newAddress);
    await user.save();
    
    return res.status(201).json({ 
      success: true, 
      address: newAddress 
    });
  } catch (error) {
    console.error('Error adding address:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while adding address' 
    });
  }
});

// Update an address
router.put('/:userId/addresses/:addressId', auth, async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const addressData = req.body;
    
    // Verify user has permission
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to update this address' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const addressIndex = user.addresses.findIndex(addr => addr.id === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex],
      ...addressData,
      id: addressId // Ensure ID doesn't change
    };
    
    await user.save();
    
    return res.status(200).json({ 
      success: true, 
      address: user.addresses[addressIndex] 
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while updating address' 
    });
  }
});

// Delete an address
router.delete('/:userId/addresses/:addressId', auth, async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    
    // Verify user has permission
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to delete this address' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.addresses = user.addresses.filter(addr => addr.id !== addressId);
    await user.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Address deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting address' 
    });
  }
});

module.exports = router;
