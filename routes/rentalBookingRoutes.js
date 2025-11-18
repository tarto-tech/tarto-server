const express = require('express');
const router = express.Router();
const RentalBooking = require('../models/RentalBooking');

// Placeholder notification functions
const notifyVehicleOwner = async (booking) => {
  console.log('Notifying vehicle owner for booking:', booking._id);
};

const notifyUserAdvanceRequired = async (booking) => {
  console.log('Notifying user about advance payment required:', booking._id);
};

const notifyDriverAdvancePaid = async (booking) => {
  console.log('Notifying driver about advance payment completion:', booking._id);
};

// POST /api/rental-bookings - Create rental booking
router.post('/', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Validate required fields
    const requiredFields = [
      'userId', 'userName', 'userPhone', 'vehicleId', 'vehicleType', 
      'vehicleTitle', 'rentalDays', 'kmLimit', 'scheduledDate', 
      'scheduledTime', 'pickupLocation'
    ];
    
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return res.status(400).json({ 
          success: false, 
          message: `${field} is required` 
        });
      }
    }
    
    // Create new rental booking
    const booking = new RentalBooking(bookingData);
    const savedBooking = await booking.save();
    
    // Notify vehicle owner/driver
    await notifyVehicleOwner(savedBooking);
    
    res.status(201).json({
      success: true,
      message: 'Rental booking created successfully',
      data: savedBooking,
      bookingId: savedBooking._id
    });
    
  } catch (error) {
    console.error('Rental booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create rental booking' 
    });
  }
});

// GET all rental bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await RentalBooking.find().sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// GET rental booking by ID
router.get('/:bookingId', async (req, res) => {
  try {
    const booking = await RentalBooking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
});

// GET user rental bookings
router.get('/user/:userId', async (req, res) => {
  try {
    const bookings = await RentalBooking.find({ 
      userId: req.params.userId 
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookings' 
    });
  }
});

// PATCH /rental-bookings/:bookingId/accept - Driver/Owner accepts rental booking
router.patch('/:bookingId/accept', async (req, res) => {
  try {
    const { driverId, advanceAmount, totalAmount } = req.body;
    
    const booking = await RentalBooking.findByIdAndUpdate(
      req.params.bookingId,
      { 
        status: 'confirmed', 
        paymentStatus: 'advance_required',
        driverId,
        acceptedAt: new Date(),
        advanceAmount,
        totalAmount
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    // Notify user about acceptance and advance payment requirement
    await notifyUserAdvanceRequired(booking);
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to accept booking' 
    });
  }
});

// PATCH /rental-bookings/:bookingId/pay-advance - User pays advance amount
router.patch('/:bookingId/pay-advance', async (req, res) => {
  try {
    const { paymentId, paymentMethod = 'upi' } = req.body;
    
    const booking = await RentalBooking.findByIdAndUpdate(
      req.params.bookingId,
      { 
        paymentStatus: 'advance_paid',
        advancePaidAt: new Date(),
        paymentDetails: {
          advancePaymentId: paymentId,
          paymentMethod,
          paidAt: new Date()
        }
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    // Notify driver about advance payment completion
    await notifyDriverAdvancePaid(booking);
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process advance payment' 
    });
  }
});

// PATCH /rental-bookings/:bookingId/complete - Complete rental booking
router.patch('/:bookingId/complete', async (req, res) => {
  try {
    const { finalPaymentId } = req.body;
    
    const booking = await RentalBooking.findByIdAndUpdate(
      req.params.bookingId,
      { 
        status: 'completed',
        paymentStatus: 'completed',
        completedAt: new Date(),
        'paymentDetails.finalPaymentId': finalPaymentId
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete booking' 
    });
  }
});

// PATCH /rental-bookings/:bookingId/status - Update booking status
router.patch('/:bookingId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const booking = await RentalBooking.findByIdAndUpdate(
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