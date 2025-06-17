// routes/resortBookingRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define the schema only if it doesn't exist
let ResortBooking;
try {
  ResortBooking = mongoose.model('ResortBooking');
} catch (e) {
  const resortBookingSchema = new mongoose.Schema({
    resortId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    checkInDate: {
      type: Date,
      required: true
    },
    checkOutDate: {
      type: Date,
      required: true
    },
    guests: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      default: 'confirmed'
    }
  }, { timestamps: true });
  
  ResortBooking = mongoose.model('ResortBooking', resortBookingSchema);
}

// Book a resort endpoint
router.post('/book', async (req, res) => {
  try {
    const { resortId, checkInDate, checkOutDate, guests, totalPrice } = req.body;
    
    // Create booking
    const booking = new ResortBooking({
      resortId,
      userId: req.body.userId || 'guest',
      checkInDate,
      checkOutDate,
      guests,
      totalPrice
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
