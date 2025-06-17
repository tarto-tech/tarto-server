// routes/resorts.js
const express = require('express');
const router = express.Router();
const Resort = require('../models/resort');
const ResortBooking = require('../models/resortBooking');
const auth = require('../middleware/auth');

// Book a resort
router.post('/book', async (req, res) => {
  try {
    const { resortId, userId, checkInDate, checkOutDate, guests, totalPrice } = req.body;
    
    // Check if resort exists
    const resort = await Resort.findById(resortId);
    if (!resort) {
      return res.status(404).json({
        success: false,
        message: 'Resort not found'
      });
    }
    
    // Create booking
    const booking = new ResortBooking({
      resortId,
      userId,
      checkInDate,
      checkOutDate,
      guests,
      totalPrice,
      status: 'confirmed'
    });
    
    await booking.save();
    
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error booking resort:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book resort',
      error: error.message
    });
  }
});

module.exports = router;
