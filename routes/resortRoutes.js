const express = require('express');
const router = express.Router();
const Resort = require('../models/Resort');
const mongoose = require('mongoose');

// Create ResortBooking model
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

// GET all resorts
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;
    let query = { isActive: true };
    
    if (lat && lng) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000
        }
      };
    }
    
    const resorts = await Resort.find(query).sort({ createdAt: -1 });
    
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

// GET single resort
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

// POST create resort
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      imageUrl,
      amenities,
      maxGuests,
      location
    } = req.body;

    if (!name || !description || !price || !imageUrl || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const resort = new Resort({
      name,
      description,
      price,
      imageUrl,
      amenities: amenities || [],
      maxGuests: maxGuests || 2,
      location
    });

    const savedResort = await resort.save();

    res.status(201).json({
      success: true,
      message: 'Resort created successfully',
      data: savedResort
    });
  } catch (error) {
    console.error('Error creating resort:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resort',
      error: error.message
    });
  }
});

// PUT update resort
router.put('/:id', async (req, res) => {
  try {
    const resort = await Resort.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!resort) {
      return res.status(404).json({
        success: false,
        message: 'Resort not found'
      });
    }

    res.json({
      success: true,
      message: 'Resort updated successfully',
      data: resort
    });
  } catch (error) {
    console.error('Error updating resort:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resort',
      error: error.message
    });
  }
});

// DELETE resort
router.delete('/:id', async (req, res) => {
  try {
    const resort = await Resort.findByIdAndDelete(req.params.id);

    if (!resort) {
      return res.status(404).json({
        success: false,
        message: 'Resort not found'
      });
    }

    res.json({
      success: true,
      message: 'Resort deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resort:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resort'
    });
  }
});

// PATCH update resort booking status
router.patch('/bookings/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    const booking = await ResortBooking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
});

module.exports = router;