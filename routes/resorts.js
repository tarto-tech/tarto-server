// routes/resortBookingRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Create resort booking schema
const resortBookingSchema = new mongoose.Schema({
  resortId: {
    type: mongoose.Schema.Types.ObjectId,
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
    enum: ['confirmed', 'pending', 'cancelled'],
    default: 'confirmed'
  }
}, { timestamps: true });

// Create model
const ResortBooking = mongoose.model('ResortBooking', resortBookingSchema);

// Book a resort
router.post('/book', async (req, res) => {
  try {
    console.log('Booking request received:', req.body);
    
    const { resortId, checkInDate, checkOutDate, guests, totalPrice } = req.body;
    
    // Create booking
    const booking = new ResortBooking({
      resortId,
      userId: req.body.userId || 'guest',
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
