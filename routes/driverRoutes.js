const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const DriverOTP = require('../models/DriverOTP');
const Booking = require('../models/BookingModel');


// POST /drivers/login - Generate OTP
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }
    
    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Delete any existing OTP for this phone
    await DriverOTP.deleteMany({ phone });
    
    // Store OTP in database (expires in 10 minutes)
    await DriverOTP.create({
      phone,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    
    console.log(`OTP for ${phone}: ${otp}`);
    
    res.json({ success: true, message: 'OTP generated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate OTP' });
  }
});

// POST /drivers/verify-otp - Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    }
    
    // Find OTP in database
    const otpRecord = await DriverOTP.findOne({ phone, otp });
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    if (otpRecord.expiresAt < new Date()) {
      await DriverOTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    
    // Find or create driver
    let driver = await Driver.findOne({ phone });
    
    if (!driver) {
      driver = new Driver({ phone, name: 'Driver' });
      await driver.save();
    }
    
    // Delete used OTP
    await DriverOTP.deleteOne({ _id: otpRecord._id });
    
    // Generate token
    const token = Buffer.from(`${driver._id}:${Date.now()}`).toString('base64');
    
    res.json({ 
      success: true, 
      data: {
        token,
        driver: {
          id: driver._id,
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          vehicleDetails: driver.vehicleDetails,
          documents: driver.documents,
          status: driver.status,
          rating: driver.rating,
          totalTrips: driver.totalTrips,
          totalEarnings: driver.totalEarnings
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// GET /drivers/phone/:phone - Check if driver exists
router.get('/phone/:phone', async (req, res) => {
  try {
    const driver = await Driver.findOne({ phone: req.params.phone });
    
    if (driver) {
      res.json({ success: true, data: driver });
    } else {
      res.json({ success: false, message: 'Driver not found', data: null });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /drivers/register - Register new driver
router.post('/register', async (req, res) => {
  try {
    const { phone, name, email, vehicleDetails, documents } = req.body;
    
    // Check if driver already exists
    let driver = await Driver.findOne({ phone });
    if (driver) {
      return res.status(400).json({ success: false, message: 'Driver already exists' });
    }
    
    // Create new driver
    driver = new Driver({
      phone,
      name,
      email,
      vehicleDetails,
      documents,
      status: 'pending'
    });
    
    await driver.save();
    
    // Generate token
    const token = Buffer.from(`${driver._id}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        token,
        driver
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      email: driver.email,
      vehicleDetails: driver.vehicleDetails,
      documents: driver.documents,
      status: driver.status,
      rating: driver.rating,
      totalTrips: driver.totalTrips,
      totalEarnings: driver.totalEarnings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// POST /drivers/:driverId/update - Update driver profile
router.post('/:driverId/update', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { name, email, vehicleDetails } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Update fields
    if (name) driver.name = name;
    if (email) driver.email = email;
    if (vehicleDetails?.registrationNumber) {
      driver.vehicleDetails.registrationNumber = vehicleDetails.registrationNumber;
    }

    await driver.save();

    res.json({ success: true, data: { driver } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /drivers/:driverId/work-locations - Update driver work locations
router.post('/:driverId/work-locations', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { workLocations } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    driver.workLocations = workLocations;
    await driver.save();

    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: driver.totalEarnings || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch earnings' });
  }
});

// PUT /drivers/:id/approve - Approve driver
router.put('/:id/approve', async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /drivers/:id/status - Update driver status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /drivers/:driverId/status - Update driver status (alternative endpoint)
router.post('/:driverId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.driverId,
      { status },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    res.json({ success: true, data: { driver } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// GET /drivers/:driverId/bookings - Get driver bookings with filters
router.get('/:driverId/bookings', async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = { driverId: req.params.driverId };
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /drivers/:driverId/active-bookings - Get active bookings
router.get('/:driverId/active-bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      driverId: req.params.driverId,
      status: { $in: ['accepted', 'in_progress', 'started'] }
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /drivers/:driverId/trips - Get trip history
router.get('/:driverId/trips', async (req, res) => {
  try {
    const { status } = req.query;
    const query = { driverId: req.params.driverId };
    if (status) query.status = status;
    
    const trips = await Booking.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /drivers/:driverId/available-trips - Get available trips
router.get('/:driverId/available-trips', async (req, res) => {
  try {
    const trips = await Booking.find({ 
      status: 'pending',
      $or: [
        { driverId: { $exists: false } },
        { driverId: null }
      ]
    }).sort({ createdAt: -1 }).limit(20);
    
    res.json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /drivers/:driverId/accept-trip - Accept a trip
router.post('/:driverId/accept-trip', async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { driverId: req.params.driverId, status: 'accepted' },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /drivers/:driverId/work-locations - Update work locations
router.put('/:driverId/work-locations', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { workLocations } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { workLocations },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /drivers/:driverId - Get driver by ID (MUST BE LAST)
router.get('/:driverId', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;