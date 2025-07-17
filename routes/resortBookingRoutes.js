const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

// Try to load models with error handling
let ResortBooking, Resort;
try {
  ResortBooking = require('../models/ResortBooking');
  Resort = require('../models/Resort');
} catch (error) {
  console.error('Failed to load models, creating inline:', error.message);
  
  // Create ResortBooking model inline if file doesn't exist
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
  
  ResortBooking = mongoose.model('ResortBooking', resortBookingSchema);
  
  try {
    Resort = require('../models/Resort');
  } catch (resortError) {
    console.error('Resort model also missing');
  }
}

// GET all bookings
router.get('/all', async (req, res) => {
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

// PATCH update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`Updating resort booking ${id} status to ${status}`);

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const booking = await ResortBooking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'name email phone')
     .populate('resortId', 'name description price imageUrl amenities');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Resort booking not found'
      });
    }

    res.json({
      success: true,
      message: `Resort booking status updated to ${status}`,
      data: booking
    });
  } catch (error) {
    console.error('Error updating resort booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resort booking status',
      error: error.message
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

// POST create booking (new endpoint)
router.post('/book', async (req, res) => {
  try {
    const { userId, resortId, checkInDate, checkOutDate, guests, totalPrice } = req.body;
    
    if (!userId || !resortId || !checkInDate || !checkOutDate || !guests || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const booking = new ResortBooking({
      userId,
      resortId,
      checkInDate,
      checkOutDate,
      guests,
      totalPrice,
      status: 'pending'
    });
    
    await booking.save();
    
    res.status(201).json({
      success: true,
      message: 'Resort booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error creating resort booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resort booking',
      error: error.message
    });
  }
});

// PUT update resort booking
router.put('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { checkInDate, checkOutDate, guests, totalPrice } = req.body;
    
    console.log('Updating resort booking:', bookingId);
    console.log('Request body:', req.body);
    
    // Update the booking in the database
    const updatedBooking = await ResortBooking.findByIdAndUpdate(
      bookingId,
      { 
        checkInDate, 
        checkOutDate, 
        guests: parseInt(guests),
        totalPrice: parseFloat(totalPrice)
      },
      { new: true } // This option returns the updated document
    );
    
    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    console.log('Updated booking:', updatedBooking);
    return res.status(200).json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error('Error updating resort booking:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST book resort (legacy endpoint)
router.post('/:id/book', async (req, res) => {
  try {
    const { userId, checkInDate, checkOutDate, guests } = req.body;
    const resortId = req.params.id;
    
    const resort = await Resort.findById(resortId);
    if (!resort) {
      return res.status(404).json({
        success: false,
        message: 'Resort not found'
      });
    }
    
    const totalPrice = resort.price * guests;
    
    const booking = new ResortBooking({
      userId,
      resortId,
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
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
});

module.exports = router;