// routes/resortRoutes.js
const express = require('express');
const router = express.Router();
const Resort = require('../models/ResortModel');

// Get all resorts
router.get('/', async (req, res) => {
  try {
    const resorts = await Resort.find();
    
    res.json({
      success: true,
      data: resorts
    });
  } catch (error) {
    console.error('Error fetching resorts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resorts'
    });
  }
});

// Add this to your existing routes/resortRoutes.js file

// Book a resort
router.post('/book', async (req, res) => {
  try {
    console.log('Resort booking request received:', req.body);
    
    const { resortId, checkInDate, checkOutDate, guests, totalPrice } = req.body;
    
    // Create a schema for resort bookings if it doesn't exist
    const resortBookingSchema = new mongoose.Schema({
      resortId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      userId: {
        type: String,
        required: false // Make this optional for now
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
        min: 1
      },
      totalPrice: {
        type: Number,
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'confirmed'
      }
    }, {
      timestamps: true
    });
    
    // Create the model if it doesn't exist
    const ResortBooking = mongoose.models.ResortBooking || 
      mongoose.model('ResortBooking', resortBookingSchema);
    
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
    console.log('Resort booking created:', booking._id);
    
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


// Get resort by ID
router.get('/:id', async (req, res) => {
  try {
    const resort = await Resort.findById(req.params.id);
    
    if (!resort) {
      return res.status(404).json({
        success: false,
        message: 'Resort not found'
      });
    }
    
    res.json({
      success: true,
      data: resort
    });
  } catch (error) {
    console.error('Error fetching resort:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resort'
    });
  }
});

// Create a new resort (admin only)
router.post('/', async (req, res) => {
  try {
    const resort = new Resort(req.body);
    await resort.save();
    
    res.status(201).json({
      success: true,
      data: resort
    });
  } catch (error) {
    console.error('Error creating resort:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create resort',
      error: error.message
    });
  }
});

module.exports = router;
