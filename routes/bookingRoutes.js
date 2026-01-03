const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/BookingModel');
const User = require('../models/userModel');


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

// POST /bookings/outstation - Create outstation booking (one-way or round trip)
router.post('/outstation', async (req, res) => {
  try {
    const {
      userId, userName, userPhone, source, destination, stops, vehicleId, vehicleName,
      distance, duration, totalPrice, pickupDate, pickupTime, returnDate,
      isRoundTrip, isOutstationRide
    } = req.body;

    if (!userId || !source || !destination || !vehicleId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (isRoundTrip && !returnDate) {
      return res.status(400).json({ success: false, message: 'Return date required for round trip' });
    }

    if (isRoundTrip && returnDate && new Date(returnDate) < new Date(pickupDate)) {
      return res.status(400).json({ success: false, message: 'Return date must be after pickup date' });
    }

    // Calculate service charge and driver amount
    const serviceCharge = Math.round(distance * 1);
    const driverAmount = Math.round(totalPrice - serviceCharge);

    const booking = new Booking({
      userId, userName, userPhone, vehicleId, vehicleName,
      source, destination, stops: stops || [],
      distance, duration, totalPrice,
      basePrice: totalPrice,
      serviceCharge,
      driverAmount,
      pickupDate, pickupTime,
      returnDate: isRoundTrip ? returnDate : null,
      isRoundTrip: isRoundTrip || false,
      isOutstationRide: isOutstationRide || true,
      type: 'outstation',
      status: 'pending'
    });

    const savedBooking = await booking.save();

    res.status(201).json({
      success: true,
      bookingId: savedBooking._id,
      message: 'Booking created successfully',
      booking: savedBooking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /bookings/outstation/:bookingId - Update outstation booking
router.put('/outstation/:bookingId', async (req, res) => {
  try {
    const { isRoundTrip, returnDate, pickupDate, pickupTime, totalPrice } = req.body;
    
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (isRoundTrip !== undefined && isRoundTrip && !returnDate) {
      return res.status(400).json({ success: false, message: 'Return date required for round trip' });
    }

    if (isRoundTrip !== undefined) booking.isRoundTrip = isRoundTrip;
    if (returnDate !== undefined) booking.returnDate = isRoundTrip ? returnDate : null;
    if (pickupDate) booking.pickupDate = pickupDate;
    if (pickupTime) booking.pickupTime = pickupTime;
    if (totalPrice) booking.totalPrice = totalPrice;

    await booking.save();

    res.json({
      success: true,
      bookingId: booking._id,
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      returnDate,
      status,
      paymentStatus,
      userName,
      userPhone,
      vehicleName,
      isRoundTrip,
      isOutstationRide
    } = req.body;

    // Validate required fields
    if (!userId || !source || !destination || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate service charge and driver amount
    const serviceCharge = Math.round(distance * 1);
    const driverAmount = Math.round((basePrice || totalPrice) - serviceCharge);

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
      serviceCharge,
      driverAmount,
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
      userName,
      userPhone,
      vehicleName,
      isRoundTrip: isRoundTrip || false,
      isOutstationRide: isOutstationRide || false,
      payment: payment || {
        method: 'cash',
        status: paymentStatus || 'pending',
        amount: totalPrice
      },
      status: status || 'pending'
    });

    // Save booking
    const savedBooking = await booking.save();

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

// GET /bookings/nearby/:driverId - Get nearby bookings with location filter
router.get('/nearby/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { lat, lng, radius = 30 } = req.query;

    let query = { status: { $in: ['pending', 'confirmed'] } };

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusInKm = parseFloat(radius);

      const bookings = await Booking.find(query)
        .populate('userId', 'name phone email')
        .populate('vehicleId', 'title type capacity');
      
      const nearbyBookings = bookings.filter(booking => {
        if (!booking.source?.location?.coordinates) return false;
        const distance = calculateDistance(
          latitude,
          longitude,
          booking.source.location.coordinates[1],
          booking.source.location.coordinates[0]
        );
        return distance <= radiusInKm;
      });

      return res.json({ success: true, data: { bookings: nearbyBookings } });
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name phone email')
      .populate('vehicleId', 'title type capacity')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { bookings } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

// GET /bookings/driver/:driverId - Get all bookings for driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const driverId = req.params.driverId;
    
    const regularBookings = await Booking.find({ driverId }).sort({ createdAt: -1 });
    
    const bookings = regularBookings.map(b => ({
      id: b._id,
      type: b.type,
      pickup: b.source?.name || b.source?.address,
      drop: b.destination?.name || b.destination?.address,
      date: b.pickupDate,
      time: b.pickupTime,
      status: b.status,
      amount: b.driverAmount || b.totalPrice,
      customer: { name: b.userName || 'Customer', phone: b.userPhone || '' }
    }));
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// GET /bookings/driver/:driverId/active - Check if driver has active booking
router.get('/driver/:driverId/active', async (req, res) => {
  try {
    const { driverId } = req.params;

    const activeBooking = await Booking.findOne({
      driverId: driverId,
      status: { $in: ['accepted', 'confirmed', 'started'] }
    });

    res.json({
      success: true,
      hasActiveBooking: !!activeBooking,
      activeBooking: activeBooking || null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check active booking',
      error: error.message
    });
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

// PATCH /bookings/:bookingId - Cancel booking (set to pending, remove driver)
router.patch('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (status === 'pending') {
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: 'pending',
          $unset: { driverId: 1, driverName: 1, vehicleName: 1, vehicleNumber: 1, acceptedAt: 1 },
          updatedAt: new Date()
        },
        { new: true }
      );

      return res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: updatedBooking
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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



// POST /bookings/:bookingId/accept - Accept booking with single trip validation
router.post('/:bookingId/accept', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId } = req.body;

    // Validate required fields
    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required'
      });
    }

    // Check if driver already has an active booking
    const existingActiveBooking = await Booking.findOne({
      driverId: driverId,
      status: { $in: ['accepted', 'confirmed', 'started'] }
    });

    if (existingActiveBooking) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active booking. Complete it first.'
      });
    }

    // Find the booking to accept
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Validate booking status
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking is no longer available'
      });
    }

    // Get driver details
    const Driver = require('../models/Driver');
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Update booking with driver details
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'accepted',
        driverId: driverId,
        driverName: driver.name,
        vehicleName: driver.vehicleDetails?.type || 'Vehicle',
        vehicleNumber: driver.vehicleDetails?.registrationNumber,
        acceptedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Booking accepted successfully',
      data: updatedBooking
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

// POST /bookings/:bookingId/reject - Reject booking
router.post('/:bookingId/reject', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId } = req.body;
    
    const booking = await Booking.findById(bookingId);
    
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

// POST /bookings/:bookingId/start - Start trip with advance payment
router.post('/:bookingId/start', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId, startTime } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'confirmed' && booking.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Booking must be confirmed to start trip' });
    }
    
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'started', startTime: startTime || new Date(), updatedAt: new Date() },
      { new: true }
    );
    
    const advanceAmount = booking.payment?.advanceAmount || 0;
    if (advanceAmount > 0) {
      const DriverEarning = require('../models/DriverEarning');
      const Driver = require('../models/Driver');
      
      await DriverEarning.create({
        driverId: booking.driverId,
        bookingId: bookingId,
        tripType: booking.type || 'outstation',
        amount: advanceAmount,
        earningType: 'advance_payment',
        status: 'completed',
        transactionDate: new Date(),
        tripDetails: {
          source: booking.source?.name || booking.source?.address,
          destination: booking.destination?.name || booking.destination?.address,
          distance: booking.distance,
          customerName: booking.userName,
          vehicleType: booking.vehicleName
        }
      });
      
      await Driver.findByIdAndUpdate(booking.driverId, { $inc: { totalEarnings: advanceAmount } });
    }
    
    res.json({
      success: true,
      message: 'Trip started successfully',
      data: {
        booking: updatedBooking,
        advanceEarning: advanceAmount,
        message: advanceAmount > 0 ? `₹${advanceAmount} advance payment added to your earnings` : 'Trip started successfully'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /bookings/:bookingId/generate-otp - Generate OTP for trip completion
router.post('/:bookingId/generate-otp', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await Booking.findByIdAndUpdate(bookingId, {
      completionOTP: otp,
      otpGeneratedAt: new Date()
    });
    
    res.json({ success: true, otp, message: 'OTP sent to customer' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate OTP' });
  }
});

// GET /bookings/test-ids - Get sample booking IDs for testing
router.get('/test-ids', async (req, res) => {
  try {
    const bookings = await Booking.find({}).limit(5).select('_id status');
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch test IDs' });
  }
});

// POST /bookings/:bookingId/complete - Complete trip with OTP verification
router.post('/:bookingId/complete', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp, endTime } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    if (booking.completionOTP !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }
    
    const completedAt = endTime || new Date();
    
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'completed',
        endTime: completedAt,
        completedAt: completedAt,
        $unset: { completionOTP: 1, otpGeneratedAt: 1 }
      },
      { new: true }
    );
    
    // Save to trip history
    if (booking.driverId) {
      const DriverEarning = require('../models/DriverEarning');
      const Driver = require('../models/Driver');
      
      const remainingAmount = booking.driverAmount - (booking.payment?.advanceAmount || 0);
      
      if (remainingAmount > 0) {
        await DriverEarning.create({
          driverId: booking.driverId,
          bookingId: bookingId,
          tripType: booking.type || 'outstation',
          amount: remainingAmount,
          earningType: 'trip_completion',
          status: 'completed',
          transactionDate: completedAt,
          tripDetails: {
            source: booking.source?.name || booking.source?.address,
            destination: booking.destination?.name || booking.destination?.address,
            stops: booking.stops || [],
            distance: booking.distance,
            customerName: booking.userName,
            vehicleType: booking.vehicleName
          }
        });
        
        await Driver.findByIdAndUpdate(booking.driverId, {
          $inc: { totalEarnings: remainingAmount, totalTrips: 1 }
        });
      }
    }
    
    res.json({ success: true, data: updatedBooking, message: 'Trip completed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /bookings/:bookingId/cancel - Cancel booking and reset to pending
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId, reason, cancelledAt } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'pending',
        cancelledAt: cancelledAt || new Date(),
        cancellationReason: reason,
        ...(driverId && { cancelledBy: driverId }),
        $unset: { driverId: 1, driverName: 1, vehicleName: 1, vehicleNumber: 1, acceptedAt: 1 }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, message: 'Booking cancelled and reset to pending', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /bookings/:bookingId/completion-otp - Check for completion OTP (Customer polling)
router.get('/:bookingId/completion-otp', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (!booking.completionOTP) {
      return res.json({ success: false, message: 'No completion OTP generated yet' });
    }
    
    res.json({ success: true, otp: booking.completionOTP, message: 'Completion OTP available' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check OTP' });
  }
});

module.exports = router;