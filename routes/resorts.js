const express = require('express');
const router = express.Router();
const Resort = require('../models/Resort');
const ResortBooking = require('../models/ResortBooking');

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
          $maxDistance: radius * 1000 // Convert km to meters
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

// Add these routes to your existing resorts.js file

// PUT update resort booking
router.put('/bookings/:id', async (req, res) => {
  try {
    const booking = await ResortBooking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Resort booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Resort booking updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error updating resort booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resort booking'
    });
  }
});

// DELETE resort booking
router.delete('/bookings/:id', async (req, res) => {
  try {
    const booking = await ResortBooking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Resort booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Resort booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resort booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resort booking'
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
        message: 'Resort booking not found'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching resort booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resort booking'
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

// POST create resort booking
router.post('/bookings', async (req, res) => {
  try {
    const {
      userId,
      resortId,
      checkInDate,
      checkOutDate,
      guests,
      totalPrice
    } = req.body;

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

    const savedBooking = await booking.save();

    res.status(201).json({
      success: true,
      message: 'Resort booking created successfully',
      data: savedBooking
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

// GET user's resort bookings
router.get('/bookings/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const bookings = await ResortBooking.find({ userId })
      .sort({ createdAt: -1 })
      .populate('resortId', 'name price imageUrl');
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching user resort bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resort bookings'
    });
  }
});

// GET all resort bookings (admin)
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await ResortBooking.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name phone email')
      .populate('resortId', 'name price imageUrl');
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching resort bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resort bookings'
    });
  }
});

// PATCH update resort booking status
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const booking = await ResortBooking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

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
      message: 'Failed to update resort booking status'
    });
  }
});

module.exports = router;
