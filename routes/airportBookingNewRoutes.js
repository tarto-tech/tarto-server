const express = require('express');
const router = express.Router();
const AirportBooking = require('../models/AirportBookingNew');

// Placeholder for driver notification
const notifyNearbyDrivers = async (booking) => {
  // Implement driver notification logic here
  console.log('Notifying drivers for booking:', booking._id);
};

// POST /api/bookings - Create airport booking
router.post('/', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Validate required fields
    const requiredFields = ['userId', 'userName', 'userPhone', 'bookingType', 'source', 'destination', 'vehicleId', 'totalPrice', 'scheduledDate', 'scheduledTime'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }
    
    // Create new booking
    const booking = new AirportBooking(bookingData);
    const savedBooking = await booking.save();
    
    // Notify nearby drivers
    await notifyNearbyDrivers(savedBooking);
    
    res.status(201).json({
      success: true,
      message: 'Airport booking created successfully',
      data: savedBooking,
      bookingId: savedBooking._id
    });
    
  } catch (error) {
    console.error('Airport booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await AirportBooking.find().sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// GET booking by ID
router.get('/:bookingId', async (req, res) => {
  try {
    const booking = await AirportBooking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
});

// PATCH /bookings/:bookingId/accept - Driver accepts booking
router.patch('/:bookingId/accept', async (req, res) => {
  try {
    const { driverId } = req.body;
    const booking = await AirportBooking.findByIdAndUpdate(
      req.params.bookingId,
      { 
        status: 'accepted', 
        paymentStatus: 'advance_required',
        driverId,
        acceptedAt: new Date()
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to accept booking' });
  }
});

// PATCH /bookings/:bookingId/pay-advance - User pays advance
router.patch('/:bookingId/pay-advance', async (req, res) => {
  try {
    const booking = await AirportBooking.findByIdAndUpdate(
      req.params.bookingId,
      { 
        status: 'confirmed',
        paymentStatus: 'advance_paid',
        advancePaidAt: new Date()
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process advance payment' });
  }
});

// PATCH /bookings/:bookingId/complete - Complete booking
router.patch('/:bookingId/complete', async (req, res) => {
  try {
    const booking = await AirportBooking.findByIdAndUpdate(
      req.params.bookingId,
      { 
        status: 'completed',
        paymentStatus: 'completed',
        completedAt: new Date()
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to complete booking' });
  }
});

// PATCH /bookings/:bookingId/status - Update booking status
router.patch('/:bookingId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const booking = await AirportBooking.findByIdAndUpdate(
      req.params.bookingId,
      { status },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
});

module.exports = router;