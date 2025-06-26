const express = require('express');
const router = express.Router();
const Resort = require('../models/Resort');
const ResortBooking = require('../models/ResortBooking');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Resort API: ${req.method} ${req.url}`);
  next();
});

// GET all resorts
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all resorts');
    const resorts = await Resort.find();
    console.log(`Found ${resorts.length} resorts`);
    
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

// POST create resort
router.post('/', async (req, res) => {
  try {
    const resort = new Resort(req.body);
    const savedResort = await resort.save();
    
    res.status(201).json({
      success: true,
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

// GET resort bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await ResortBooking.find()
      .populate('userId', 'name phone email')
      .populate('resortId', 'name price imageUrl');
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// GET user's resort bookings
router.get('/bookings/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const bookings = await ResortBooking.find({ userId })
      .populate('resortId', 'name price imageUrl');
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings'
    });
  }
});

// POST create resort booking
router.post('/bookings', async (req, res) => {
  try {
    const booking = new ResortBooking(req.body);
    const savedBooking = await booking.save();
    
    res.status(201).json({
      success: true,
      data: savedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

// GET single resort booking
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await ResortBooking.findById(req.params.id)
      .populate('userId', 'name phone email')
      .populate('resortId', 'name price imageUrl');
    
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
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking'
    });
  }
});

// PATCH update resort booking status
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await ResortBooking.findByIdAndUpdate(
      req.params.id,
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

// PUT update resort
router.put('/:id', async (req, res) => {
  try {
    const resort = await Resort.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
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
    console.error('Error updating resort:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resort'
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

module.exports = router;
