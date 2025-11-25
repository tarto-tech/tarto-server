const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/BookingModel');
const User = require('../models/userModel');
const AirportBooking = require('../models/AirportBookingNew');
const RentalBooking = require('../models/RentalBooking');

// Get all bookings (for admin panel)
// IMPORTANT: This route must come BEFORE the /:id route
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name phone email')
      .populate('vehicleId', 'title type capacity imageUrl basePrice')
      .populate('driverId', 'name phone');
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      vehicleId,
      source,
      destination,
      stops,
      distance,
      duration,
      basePrice,
      totalPrice,
      type,
      payment,
      additionalCharges,
      pickupDate,
      pickupTime,
      returnDate
    } = req.body;

    // Validate required fields
    if (!userId || !source || !destination || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create booking
    const booking = new Booking({
      userId,
      vehicleId,
      source,
      destination,
      stops: stops || [],
      distance,
      duration,
      basePrice: basePrice || totalPrice,
      additionalCharges: additionalCharges || {
        driverAllowance: 0,
        parkingCharges: 0,
        waitingCharges: 0
      },
      totalPrice,
      type,
      pickupDate,
      pickupTime,
      returnDate,
      payment: payment || {
        method: 'cash',
        status: 'pending',
        amount: totalPrice
      },
      status: 'pending'
    });

    // Save booking
    const savedBooking = await booking.save();

    // Update vehicle availability (commented out for testing)
    // await Vehicle.findByIdAndUpdate(vehicleId, { isAvailable: false });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: savedBooking,
       bookingId: savedBooking._id 
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

// GET /bookings/driver/:driverId - Get all bookings for driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const driverId = req.params.driverId;
    
    const airportBookings = await AirportBooking.find({ driverId }).sort({ createdAt: -1 });
    const rentalBookings = await RentalBooking.find({ driverId }).sort({ createdAt: -1 });
    
    const bookings = [
      ...airportBookings.map(b => ({
        id: b._id,
        type: 'airport',
        pickup: b.pickupLocation?.name || b.source,
        drop: b.dropLocation?.name || b.destination,
        date: b.scheduledDate,
        time: b.scheduledTime,
        status: b.status,
        amount: b.totalPrice,
        customer: { name: b.userName, phone: b.userPhone }
      })),
      ...rentalBookings.map(b => ({
        id: b._id,
        type: 'rental',
        pickup: b.pickupLocation?.name,
        drop: 'Rental',
        date: b.scheduledDate,
        time: b.scheduledTime,
        status: b.status,
        amount: b.totalAmount,
        customer: { name: b.userName, phone: b.userPhone }
      }))
    ];
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// Get user's bookings
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    const query = { userId };
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('vehicleId', 'title type capacity imageUrl basePrice')
      .populate('driverId', 'name phone');
    
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

// Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Find booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking status and timestamps
    booking.status = status;

    if (status === 'in_progress') {
      booking.startedAt = new Date();
    } else if (status === 'completed') {
      booking.completedAt = new Date();
      await Vehicle.findByIdAndUpdate(booking.vehicleId, { isAvailable: true });
    } else if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      await Vehicle.findByIdAndUpdate(booking.vehicleId, { isAvailable: true });
    }

    await booking.save();

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
});

// General booking update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body, updatedAt: new Date() };
    
    // Function to recursively remove _id fields
    function removeIds(obj) {
      if (Array.isArray(obj)) {
        return obj.map(item => removeIds(item));
      } else if (obj && typeof obj === 'object') {
        const { _id, ...objWithoutId } = obj;
        const cleaned = {};
        for (const [key, value] of Object.entries(objWithoutId)) {
          cleaned[key] = removeIds(value);
        }
        return cleaned;
      }
      return obj;
    }
    
    updateData = removeIds(updateData);
    
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user details from a booking
// Get user details from a booking
router.get('/:id/user', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    if (!booking.userId) {
      return res.status(404).json({
        success: false,
        message: 'No user ID associated with this booking'
      });
    }
    
    // Directly fetch the user instead of relying on populate
    const user = await User.findById(booking.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with ID: ' + booking.userId
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user details from booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
});

// Get booking by ID
// IMPORTANT: This route must come AFTER the / route
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name phone email')
      .populate('vehicleId', 'title type capacity imageUrl basePrice')
      .populate('driverId', 'name phone');
    
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

// Cancel booking
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Booking already ${booking.status}`
      });
    }
    
    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by user';
    booking.cancelledAt = new Date();
    
    await booking.save();
    
    // Make vehicle available again
    await Vehicle.findByIdAndUpdate(booking.vehicleId, { isAvailable: true });
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
});

// POST /bookings/:bookingId/accept - Accept booking
router.post('/:bookingId/accept', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId } = req.body;
    
    let booking = await AirportBooking.findById(bookingId);
    if (!booking) booking = await RentalBooking.findById(bookingId);
    if (!booking) booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    booking.status = 'accepted';
    booking.driverId = driverId;
    booking.acceptedAt = new Date();
    await booking.save();
    
    res.json({ success: true, message: 'Booking accepted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to accept booking' });
  }
});

// POST /bookings/:bookingId/reject - Reject booking
router.post('/:bookingId/reject', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId } = req.body;
    
    let booking = await AirportBooking.findById(bookingId);
    if (!booking) booking = await RentalBooking.findById(bookingId);
    if (!booking) booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (!booking.rejectedDrivers) booking.rejectedDrivers = [];
    if (driverId && !booking.rejectedDrivers.includes(driverId)) {
      booking.rejectedDrivers.push(driverId);
    }
    await booking.save();
    
    res.json({ success: true, message: 'Booking rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject booking' });
  }
});

// POST /bookings/:bookingId/start - Start trip
router.post('/:bookingId/start', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    let booking = await AirportBooking.findById(bookingId);
    if (!booking) booking = await RentalBooking.findById(bookingId);
    if (!booking) booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    booking.status = 'in_progress';
    booking.startedAt = new Date();
    await booking.save();
    
    res.json({ success: true, message: 'Trip started' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to start trip' });
  }
});

// POST /bookings/:bookingId/complete - Complete trip
router.post('/:bookingId/complete', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { endLocation, finalAmount } = req.body;
    
    let booking = await AirportBooking.findById(bookingId);
    if (!booking) booking = await RentalBooking.findById(bookingId);
    if (!booking) booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    booking.status = 'completed';
    booking.completedAt = new Date();
    if (finalAmount) booking.totalPrice = finalAmount;
    await booking.save();
    
    res.json({ success: true, message: 'Trip completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to complete trip' });
  }
});

module.exports = router;