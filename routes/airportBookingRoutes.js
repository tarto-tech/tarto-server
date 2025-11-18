const express = require('express');
const router = express.Router();
const AirportBooking = require('../models/AirportBooking');

// GET all airport bookings
router.get('/all', async (req, res) => {
  try {
    const bookings = await AirportBooking.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch airport bookings'
    });
  }
});

// GET user airport bookings
router.get('/user/:userId', async (req, res) => {
  try {
    const bookings = await AirportBooking.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user airport bookings'
    });
  }
});

// GET single airport booking
router.get('/:bookingId', async (req, res) => {
  try {
    const booking = await AirportBooking.findById(req.params.bookingId)
      .populate('userId', 'name email phone');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Airport booking not found'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch airport booking'
    });
  }
});

// POST create airport booking
router.post('/book', async (req, res) => {
  try {
    const {
      userId,
      bookingType,
      passengerName,
      phoneNumber,
      flightNumber,
      airline,
      pickupLocation,
      dropLocation,
      scheduledTime,
      vehicleType,
      passengers,
      luggage,
      totalPrice,
      paymentMode,
      paymentId,
      specialRequests
    } = req.body;
    
    // Validate required fields
    if (!userId || !bookingType || !passengerName || !phoneNumber || !flightNumber || !scheduledTime || !vehicleType || !passengers || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const booking = new AirportBooking({
      userId,
      bookingType,
      passengerName,
      phoneNumber,
      flightNumber,
      airline,
      pickupLocation,
      dropLocation,
      scheduledTime,
      vehicleType,
      passengers,
      luggage: luggage || 0,
      totalPrice,
      specialRequests: specialRequests || '',
      status: 'pending'
    });
    
    await booking.save();
    
    res.status(201).json({
      success: true,
      message: 'Airport booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error creating airport booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create airport booking',
      error: error.message
    });
  }
});

// POST driver accepts booking
router.post('/:bookingId/accept', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId } = req.body;
    
    const booking = await AirportBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not available for acceptance'
      });
    }
    
    // Calculate advance amount (25% of total price)
    const advanceAmount = Math.round(booking.totalPrice * 0.25);
    
    const updatedBooking = await AirportBooking.findByIdAndUpdate(
      bookingId,
      {
        status: 'driver_accepted',
        driverId,
        advanceAmount
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Booking accepted',
      data: {
        bookingId,
        status: 'driver_accepted',
        advanceAmount
      }
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept booking',
      error: error.message
    });
  }
});

// POST process payment
router.post('/:bookingId/payment', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentMode, paymentId, amount } = req.body;
    
    const booking = await AirportBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    if (booking.status !== 'driver_accepted') {
      return res.status(400).json({
        success: false,
        message: 'Payment not allowed for this booking status'
      });
    }
    
    if (amount !== booking.advanceAmount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }
    
    const updatedBooking = await AirportBooking.findByIdAndUpdate(
      bookingId,
      {
        status: 'payment_completed',
        paymentMode,
        paymentId
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Payment successful',
      data: {
        bookingId,
        status: 'payment_completed'
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
});

// PATCH update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'driver_accepted', 'payment_completed', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const booking = await AirportBooking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Airport booking not found'
      });
    }

    res.json({
      success: true,
      message: `Airport booking status updated to ${status}`,
      data: booking
    });
  } catch (error) {
    console.error('Error updating airport booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update airport booking status',
      error: error.message
    });
  }
});

// PUT update airport booking
router.put('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updateData = req.body;
    
    const updatedBooking = await AirportBooking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    );
    
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Airport booking not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error updating airport booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update airport booking',
      error: error.message
    });
  }
});

module.exports = router;