const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/BookingModel');
const User = require('../models/userModel');
const { sendNotification } = require('../services/notificationService');
const { catchAsync } = require('../middleware/errorHandler');
const bookingUpdateController = require('../controllers/bookingUpdateController');
const { authenticateToken } = require('../middleware/auth');

// Booking update endpoints
router.put('/:bookingId/stops', authenticateToken, bookingUpdateController.updateBookingStops);
router.put('/:bookingId/schedule', authenticateToken, bookingUpdateController.updateBookingSchedule);
router.put('/:bookingId', authenticateToken, bookingUpdateController.updateBooking);

// Notification service function for customers
async function sendNotificationToCustomer({ customerId, type, title, body, data }) {
  try {
    // Get customer's FCM token
    const customer = await User.findById(customerId);
    if (!customer?.fcmToken) {
      console.log('No FCM token found for customer:', customerId);
      return;
    }
    
    // Send FCM notification
    await sendNotification({
      to: customer.fcmToken,
      notification: { title, body },
      data: { ...data, type }
    });
    
    console.log('Notification sent to customer:', customerId);
  } catch (error) {
    console.error('Error sending notification to customer:', error);
  }
}

// Function to notify nearby drivers about new trip requests
async function notifyNearbyDrivers({ bookingId, pickupLocation, dropoffLocation, fare, distance, pickupAddress, dropoffAddress }) {
  try {
    const Driver = require('../models/Driver');
    const admin = require('firebase-admin');
    
    // Get all active drivers within 30km radius using location (which has 2dsphere index)
    const nearbyDrivers = await Driver.find({
      status: 'active',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [pickupLocation.longitude, pickupLocation.latitude]
          },
          $maxDistance: 30000 // 30km in meters
        }
      },
      fcmToken: { $exists: true, $ne: null }
    });

    // Send notification to each driver
    const notifications = nearbyDrivers.map(driver => ({
      token: driver.fcmToken,
      notification: {
        title: 'New Trip Request 🚗',
        body: `${pickupAddress} → ${dropoffAddress}\n₹${fare} • ${distance}km`
      },
      data: {
        type: 'new_trip_request',
        booking_id: bookingId.toString(),
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        fare: fare.toString(),
        distance: distance.toString(),
        pickup_lat: pickupLocation.latitude.toString(),
        pickup_lng: pickupLocation.longitude.toString(),
        dropoff_lat: dropoffLocation.latitude.toString(),
        dropoff_lng: dropoffLocation.longitude.toString()
      }
    }));

    // Send batch notifications
    if (notifications.length > 0 && admin.apps.length > 0) {
      await admin.messaging().sendAll(notifications);
      console.log(`Sent trip notifications to ${notifications.length} drivers`);
    } else {
      console.log('No nearby active drivers found or Firebase not initialized');
    }
  } catch (error) {
    console.error('Error notifying drivers:', error);
  }
}


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

    // Notify nearby drivers about new outstation trip request
    if (source?.location?.coordinates && destination?.location?.coordinates) {
      await notifyNearbyDrivers({
        bookingId: savedBooking._id,
        pickupLocation: {
          latitude: source.location.coordinates[1],
          longitude: source.location.coordinates[0]
        },
        dropoffLocation: {
          latitude: destination.location.coordinates[1],
          longitude: destination.location.coordinates[0]
        },
        fare: totalPrice,
        distance: distance,
        pickupAddress: source.name || source.address,
        dropoffAddress: destination.name || destination.address
      });
    }

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

    // Notify nearby drivers about new trip request
    if (source?.location?.coordinates && destination?.location?.coordinates) {
      await notifyNearbyDrivers({
        bookingId: savedBooking._id,
        pickupLocation: {
          latitude: source.location.coordinates[1],
          longitude: source.location.coordinates[0]
        },
        dropoffLocation: {
          latitude: destination.location.coordinates[1],
          longitude: destination.location.coordinates[0]
        },
        fare: totalPrice,
        distance: distance,
        pickupAddress: source.name || source.address,
        dropoffAddress: destination.name || destination.address
      });
    }

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

// PATCH /bookings/:id - Update booking with partial data (accept, start, complete)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, driverId, otp, acceptedAt, startedAt, completedAt } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Handle status-specific logic
    if (status === 'accepted' && driverId) {
      // Check if driver already has active booking
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
      
      // Get driver details
      const Driver = require('../models/Driver');
      const driver = await Driver.findById(driverId);
      if (driver) {
        booking.driverName = driver.name;
        booking.vehicleNumber = driver.vehicleDetails?.registrationNumber;
        booking.advanceAmount = Math.round(booking.totalPrice * 0.2);
      }
    }
    
    if (status === 'completed' && otp) {
      // Verify OTP
      if (booking.completionOTP !== otp) {
        return res.status(400).json({ success: false, error: 'Invalid OTP' });
      }
      booking.completionOTP = undefined;
      booking.otpGeneratedAt = undefined;
    }
    
    // Update only provided fields
    if (status) booking.status = status;
    if (driverId) booking.driverId = driverId;
    if (acceptedAt) booking.acceptedAt = acceptedAt;
    if (startedAt) booking.startedAt = startedAt;
    if (completedAt) booking.completedAt = completedAt;
    
    booking.updatedAt = new Date();
    await booking.save();
    
    res.json({ success: true, data: booking });
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

// POST /bookings/:bookingId/driver-arrived - Driver arrived at pickup
router.post('/:bookingId/driver-arrived', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Update booking status
    await Booking.findByIdAndUpdate(bookingId, {
      status: 'driver_arrived',
      arrivedAt: new Date()
    });
    
    // Send notification to user
    if (booking.userId) {
      await sendNotificationToCustomer({
        customerId: booking.userId,
        type: 'driver_arrived',
        title: 'Driver Arrived 🚗',
        body: 'Your driver has arrived at pickup location',
        data: {
          trip_id: bookingId,
          driver_id: driverId
        }
      });
    }
    
    res.json({ success: true, message: 'Driver arrival notification sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    
    // Send notification to user
    if (booking.userId) {
      await sendNotificationToCustomer({
        customerId: booking.userId,
        type: 'trip_started',
        title: 'Trip Started 🚀',
        body: 'Your journey has begun. Have a safe trip!',
        data: {
          trip_id: bookingId
        }
      });
    }
    
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

// POST /bookings/:bookingId/cancel - Driver cancels accepted trip, returns to pending for reassignment
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const { driverId, reason } = req.body;
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }
    
    // Reset booking to pending state for reassignment
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId, 
      {
        status: 'pending',
        driverId: null,
        driverName: null,
        vehicleNumber: null,
        advanceAmount: null,
        acceptedAt: null,
        cancelledBy: driverId,
        cancellationReason: reason,
        cancelledAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    
    // Notify customer about driver cancellation
    if (booking.userId) {
      await sendNotificationToCustomer({
        customerId: booking.userId,
        type: 'driver_cancelled',
        title: 'Driver Cancelled',
        body: 'Your driver cancelled the trip. We are finding another driver for you.',
        data: {
          trip_id: bookingId,
          status: 'pending'
        }
      });
    }
    
    // Notify nearby drivers about newly available trip
    if (updatedBooking.source?.location?.coordinates && updatedBooking.destination?.location?.coordinates) {
      await notifyNearbyDrivers({
        bookingId: updatedBooking._id,
        pickupLocation: {
          latitude: updatedBooking.source.location.coordinates[1],
          longitude: updatedBooking.source.location.coordinates[0]
        },
        dropoffLocation: {
          latitude: updatedBooking.destination.location.coordinates[1],
          longitude: updatedBooking.destination.location.coordinates[0]
        },
        fare: updatedBooking.totalPrice,
        distance: updatedBooking.distance,
        pickupAddress: updatedBooking.source.name || updatedBooking.source.address,
        dropoffAddress: updatedBooking.destination.name || updatedBooking.destination.address
      });
    }
    
    return res.json({ 
      success: true, 
      message: 'Trip returned to pending for reassignment',
      data: updatedBooking
    });
    
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel booking',
      details: error.message
    });
  }
});

// DELETE /bookings/:bookingId/tripcancelbyuser - Delete booking by user
router.delete('/:bookingId/tripcancelbyuser', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Delete from database
    await Booking.findByIdAndDelete(bookingId);
    
    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking'
    });
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