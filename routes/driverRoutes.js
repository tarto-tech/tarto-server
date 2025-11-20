const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const Booking = require('../models/BookingModel');
const AirportBooking = require('../models/AirportBookingNew');
const RentalBooking = require('../models/RentalBooking');

// Store OTPs temporarily (use Redis in production)
const otpStore = new Map();

// POST /drivers/login - Send OTP
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }
    
    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store OTP (expires in 5 minutes)
    otpStore.set(phone, { otp, expires: Date.now() + 300000 });
    
    // TODO: Send OTP via SMS service
    console.log(`OTP for ${phone}: ${otp}`);
    
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// POST /drivers/verify-otp - Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    }
    
    const storedData = otpStore.get(phone);
    
    if (!storedData || storedData.expires < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    
    if (storedData.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // Find or create driver
    let driver = await Driver.findOne({ phone });
    
    if (!driver) {
      driver = new Driver({ phone, name: 'Driver' });
      await driver.save();
    }
    
    // Clear OTP
    otpStore.delete(phone);
    
    // Generate token (simplified - use JWT in production)
    const token = Buffer.from(`${driver._id}:${Date.now()}`).toString('base64');
    
    res.json({ 
      success: true, 
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicle: {
          type: driver.vehicleType,
          number: driver.vehicleNumber
        },
        status: driver.status
      },
      token 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// GET /drivers/profile/:driverId - Get driver profile
router.get('/profile/:driverId', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    res.json({
      id: driver._id,
      name: driver.name,
      phone: driver.phone,
      vehicle: {
        type: driver.vehicleType,
        number: driver.vehicleNumber
      },
      status: driver.status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// POST /drivers/:driverId/location - Update driver location
router.post('/:driverId/location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    await Driver.findByIdAndUpdate(req.params.driverId, {
      location: { latitude, longitude }
    });
    
    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
});

// GET /drivers/:driverId/earnings - Get driver earnings
router.get('/:driverId/earnings', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    res.json({
      today: driver.earnings.today || 0,
      thisWeek: driver.earnings.thisWeek || 0,
      thisMonth: driver.earnings.thisMonth || 0,
      total: driver.earnings.total || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch earnings' });
  }
});

// GET /drivers/:driverId/trips - Get trip history
router.get('/:driverId/trips', async (req, res) => {
  try {
    const driverId = req.params.driverId;
    
    const airportTrips = await AirportBooking.find({ driverId }).sort({ createdAt: -1 });
    const rentalTrips = await RentalBooking.find({ driverId }).sort({ createdAt: -1 });
    
    const trips = [
      ...airportTrips.map(t => ({
        id: t._id,
        date: t.scheduledDate,
        pickup: t.pickupLocation?.name || t.source,
        drop: t.dropLocation?.name || t.destination,
        amount: t.totalPrice,
        status: t.status,
        type: 'airport'
      })),
      ...rentalTrips.map(t => ({
        id: t._id,
        date: t.scheduledDate,
        pickup: t.pickupLocation?.name,
        drop: 'Rental',
        amount: t.totalAmount,
        status: t.status,
        type: 'rental'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(trips);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trips' });
  }
});

module.exports = router;