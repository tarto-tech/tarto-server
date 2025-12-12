const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/BookingModel');
const User = require('../models/userModel');
const AirportBooking = require('../models/AirportBookingNew');
const RentalBooking = require('../models/RentalBooking');
const { calculateDistanceAndDuration } = require('../services/googleMapsService');
const { calculateSecureFare } = require('../services/pricingService');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { authenticateToken, requireAdmin, verifyOwnership, verifyUserAccess } = require('../middleware/auth');
const { otpLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput } = require('../middleware/sanitize');
const { enforceHTTPS, requestSizeLimiter, bookingLimiter } = require('../middleware/security');

// Apply input sanitization to all routes
router.use(sanitizeInput);

// POST /rental-bookings - Create rental booking
router.post('/rental-bookings', enforceHTTPS, requestSizeLimiter, bookingLimiter, authenticateToken, async (req, res) => {
  try {
    const { userId, userName, userPhone, vehicleId, vehicleType, vehicleTitle, rentalDays, kmLimit, scheduledDate, scheduledTime, pickupLocation, totalPrice, basePrice } = req.body;

    if (!userId || !vehicleId || !rentalDays || !basePrice) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Verify user can only create bookings for themselves
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot create booking for another user' });
    }

    if (rentalDays <= 0) {
      return res.status(400).json({ success: false, message: 'Rental days must be positive' });
    }

    const calculatedPrice = basePrice * rentalDays;
    if (totalPrice !== calculatedPrice) {
      return res.status(400).json({ success: false, message: 'Invalid price calculation' });
    }

    const rentalBooking = new RentalBooking({ userId, userName, userPhone, type: 'rental', vehicleId, vehicleType, vehicleTitle, rentalDays, kmLimit, scheduledDate, scheduledTime, pickupLocation, totalPrice, basePrice, status: 'pending', paymentStatus: 'pending' });
    const saved = await rentalBooking.save();

    res.status(201).json({ success: true, message: 'Rental booking created successfully', data: saved });
  } catch (error) {
    console.error('Rental booking error:', error);
    res.status(500).json({ success: false, message: 'Booking creation failed' });
  }
});

// GET /rental-bookings/user/:userId - Get user rental bookings
router.get('/rental-bookings/user/:userId', authenticateToken, verifyUserAccess, async (req, res) => {
  try {
    const bookings = await RentalBooking.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Rental bookings error:', error);
    res.status(500).json({ success: false, message: 'Unable to retrieve rental bookings' });
  }
});

// PUT /rental-bookings/:bookingId - Update rental booking
router.put('/rental-bookings/:bookingId', authenticateToken, verifyOwnership(RentalBooking), async (req, res) => {
  try {
    const { rentalDays, scheduledDate, scheduledTime, pickupLocation } = req.body;
    const updateData = {};
    
    if (rentalDays) {
      const booking = await RentalBooking.findById(req.params.bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      updateData.rentalDays = rentalDays;
      updateData.totalPrice = booking.basePrice * rentalDays;
    }
    if (scheduledDate) updateData.scheduledDate = scheduledDate;
    if (scheduledTime) updateData.scheduledTime = scheduledTime;
    if (pickupLocation) updateData.pickupLocation = pickupLocation;

    const updated = await RentalBooking.findByIdAndUpdate(req.params.bookingId, updateData, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, message: 'Booking updated successfully', data: updated });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /rental-bookings/:bookingId - Cancel rental booking
router.delete('/rental-bookings/:bookingId', authenticateToken, verifyOwnership(RentalBooking), async (req, res) => {
  try {
    const updated = await RentalBooking.findByIdAndUpdate(req.params.bookingId, { status: 'cancelled' }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Rental booking cancelled successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /rental-bookings/:bookingId/pay-advance - Pay advance
router.post('/rental-bookings/:bookingId/pay-advance', enforceHTTPS, requestSizeLimiter, authenticateToken, verifyOwnership(RentalBooking), async (req, res) => {
  try {
    const { amount, paymentId, paymentMethod } = req.body;
    
    if (!amount || amount <= 0 || !paymentId || !/^[a-zA-Z0-9_-]+$/.test(paymentId)) {
      return res.status(const express = require('express');
const router = express.Router();
const { Booking, RentalBooking } = require('../models/BookingModel');
const { authenticateToken, requireAdmin, verifyUserAccess } = require('../middleware/auth');
const { enforceHTTPS, requestSizeLimiter, bookingLimiter, otpLimiter } = require('../middleware/security');
const { calculateDistanceAndDuration } = require('../services/googleMapsService');
const { calculateSecureFare } = require('../services/pricingService');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { encrypt, decrypt } = require('../utils/encryption');
const { sanitizeQuery, validateObjectId } = require('../utils/validation');

// POST /advance-payment - Secure payment processing
router.post('/advance-payment/:bookingId', enforceHTTPS, authenticateToken, async (req, res) => {
  try {
    const { amount, paymentId, paymentMethod } = req.body;
    
    if (!amount || !paymentId || !paymentMethod || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment details' });
    }
    
    if (!validateObjectId(req.params.bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }
    
    const booking = await RentalBooking.findById(req.params.bookingId);
    
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'accepted') return res.status(400).json({ success: false, message: 'Booking must be accepted first' });

    booking.advanceAmount = amount;
    booking.advancePaid = true;
    booking.paymentStatus = 'paid';
    booking.paymentDetails = { 
      advancePaymentId: encrypt(paymentId), 
      paymentMethod, 
      paidAt: new Date() 
    };
    await booking.save();

    res.json({ success: true, message: 'Advance payment successful' });
  } catch (error) {
    console.error('Payment error occurred');
    res.status(500).json({ success: false, message: 'Payment processing failed' });
  }
});

// POST /calculate-route - Secure route calculation
router.post('/calculate-route', enforceHTTPS, requestSizeLimiter, authenticateToken, async (req, res) => {
  try {
    const { source, stops, isRoundTrip, vehicleType = 'sedan' } = req.body;
    
    if (!source || !stops || stops.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Source and destination stops are required' 
      });
    }
    
    const { distance, duration } = await calculateDistanceAndDuration(source, stops);
    const fareDetails = calculateSecureFare(distance, vehicleType, isRoundTrip);
    
    res.json({
      success: true,
      data: {
        distance,
        duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
        ...fareDetails
      }
    });
  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate route' 
    });
  }
});

// GET / - Get all bookings (for admin panel)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sanitized = sanitizeQuery(req.query);
    
    const query = {};
    if (sanitized.status && sanitized.status !== 'all') {
      query.status = sanitized.status;
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

// POST /outstation - Secure outstation booking with server-side validation
router.post('/outstation', enforceHTTPS, requestSizeLimiter, bookingLimiter, authenticateToken, async (req, res) => {
  try {
    const {
      userId, userName, userPhone, source, stops, vehicleId, vehicleName,
      pickupDate, pickupTime, returnDate, isRoundTrip, vehicleType,
      clientCalculatedFare
    } = req.body;

    if (!userId || !source || !stops || stops.length === 0 || !vehicleId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate phone number format
    if (userPhone && !/^[+]?[1-9]\d{1,14}$/.test(userPhone.replace(/\s/g, ''))) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    // Validate date formats
    if (pickupDate && isNaN(Date.parse(pickupDate))) {
      return res.status(400).json({ success: false, message: 'Invalid pickup date format' });
    }
    if (returnDate && isNaN(Date.parse(returnDate))) {
      return res.status(400).json({ success: false, message: 'Invalid return date format' });
    }

    // Verify user can only create bookings for themselves
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot create booking for another user' });
    }

    if (isRoundTrip && !returnDate) {
      return res.status(400).json({ success: false, message: 'Return date required for round trip' });
    }

    if (isRoundTrip && returnDate && new Date(returnDate) < new Date(pickupDate)) {
      return res.status(400).json({ success: false, message: 'Return date must be after pickup date' });
    }

    // SERVER-SIDE RECALCULATION
    const { distance, duration } = await calculateDistanceAndDuration(source, stops);
    const serverFareDetails = calculateSecureFare(distance, vehicleType || 'sedan', isRoundTrip);

    // FRAUD DETECTION
    if (clientCalculatedFare && Math.abs(serverFareDetails.totalFare - clientCalculatedFare) > serverFareDetails.totalFare * 0.02) {
      console.warn('Fare manipulation attempt detected');
      return res.status(400).json({ 
        success: false, 
        message: 'Price validation failed. Please refresh and try again.' 
      });
    }

    const serviceCharge = Math.round(distance * 1);
    const driverAmount = Math.round(serverFareDetails.totalFare - serviceCharge);

    const booking = new Booking({
      userId, userName, userPhone, vehicleId, vehicleName,
      source,
      destination: stops[stops.length - 1],
      stops,
      distance,
      duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
      totalPrice: serverFareDetails.totalFare,
      basePrice: serverFareDetails.baseFare,
      serviceCharge,
      driverAmount,
      fareBreakdown: {
        baseFare: serverFareDetails.baseFare,
        driverAllowance: serverFareDetails.driverAllowance,
        tollCharges: serverFareDetails.tollCharges,
        taxes: serverFareDetails.taxes
      },
      pickupDate, pickupTime,
      returnDate: isRoundTrip ? returnDate : null,
      isRoundTrip: isRoundTrip || false,
      isOutstationRide: true,
      type: 'outstation',
      status: 'pending',
      calculationValidated: true,
      serverCalculatedAt: new Date()
    });

    const savedBooking = await booking.save();
    res.status(201).json({
      success: true,
      message: 'Outstation booking created successfully',
      data: savedBooking
    });
  } catch (error) {
    console.error('Outstation booking error occurred');
    res.status(500).json({
      success: false,
      message: 'Booking creation failed'
    });
  }
});

// GET /user/:userId - Get user bookings
router.get('/user/:userId', authenticateToken, verifyUserAccess, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('vehicleId', 'title type imageUrl');
    
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('User bookings error occurred');
    res.status(500).json({ success: false, message: 'Unable to retrieve user bookings' });
  }
});

// PUT /:id/status - Update booking status
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, driverId } = req.body;
    const updateData = { status };
    if (driverId) updateData.driverId = driverId;
    
    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Status update error occurred');
    res.status(500).json({ success: false, message: 'Status update failed' });
  }
});

// POST /send-otp - Send OTP for booking verification
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[+]?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ success: false, message: 'Valid phone number required' });
    }
    
    const result = await sendOTP(phone);
    if (result.success) {
      res.json({ success: true, message: 'OTP sent successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to send OTP' });
    }
  } catch (error) {
    console.error('OTP send error occurred');
    res.status(500).json({ success: false, message: 'OTP service unavailable' });
  }
});

// POST /verify-otp - Verify OTP
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp || !/^[+]?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, '')) || !/^\d{4,6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Valid phone and OTP required' });
    }
    
    const result = await verifyOTP(phone, otp);
    if (result.success) {
      res.json({ success: true, message: 'OTP verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('OTP verify error occurred');
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
});

module.exports = router;