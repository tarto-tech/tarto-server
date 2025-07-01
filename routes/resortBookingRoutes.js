const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// ResortBooking Schema
const resortBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resort',
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
    required: true,
    default: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      default: 'cash'
    },
    status: {
      type: String,
      default: 'pending'
    }
  }
}, { timestamps: true });

const ResortBooking = mongoose.model('ResortBooking', resortBookingSchema);

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await ResortBooking.find()
      .populate('userId', 'name email phone')
      .populate('resortId', 'name description price');
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// GET single booking
router.get('/:bookingId', async (req, res) => {
  try {
    const booking = await ResortBooking.findById(req.params.bookingId)
      .populate('userId', 'name email phone')
      .populate('resortId', 'name description price imageUrl amenities');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking'
    });
  }
});

// GET user bookings
router.get('/user/:userId', async (req, res) => {
  try {
    const bookings = await ResortBooking.find({ userId: req.params.userId })
      .populate('resortId', 'name description price imageUrl');
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings'
    });
  }
});

module.exports = router;