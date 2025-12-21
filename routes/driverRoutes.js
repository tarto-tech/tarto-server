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

// GET /drivers/profile/phone/:phoneNumber - Check if driver exists and get profile
router.get('/profile/phone/:phoneNumber', async (req, res) => {
  try {
    const driver = await Driver.findOne({ phone: req.params.phoneNumber });
    
    if (driver) {
      // Generate token
      const token = Buffer.from(`${driver._id}:${Date.now()}`).toString('base64');
      
      res.json({ 
        success: true, 
        data: {
          _id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          gender: driver.gender,
          profileImage: driver.profileImage,
          status: driver.status,
          vehicleDetails: driver.vehicleDetails,
          documents: driver.documents,
          rating: driver.rating,
          totalTrips: driver.totalTrips,
          totalEarnings: driver.totalEarnings,
          createdAt: driver.createdAt
        },
        token
      });
    } else {
      res.status(404).json({ success: false, message: 'Driver not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /drivers/auth/register - Register new driver
router.post('/auth/register', async (req, res) => {
  try {
    const { 
      phone, 
      name, 
      email, 
      agencyName,
      panNumber,
      address,
      dateOfBirth,
      licenseNumber,
      vehicleDetails,
      gender,
      documents 
    } = req.body;
    
    // Check if driver already exists
    let driver = await Driver.findOne({ phone });
    if (driver) {
      return res.status(400).json({ success: false, message: 'Driver already exists' });
    }
    
    // Validate required fields
    if (!phone || !name || !email || !agencyName || !panNumber || !licenseNumber || !vehicleDetails?.vehicleNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone, name, email, agency name, PAN number, license number, and vehicle number are required' 
      });
    }
    
    // Validate PAN number format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber.toUpperCase())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid PAN number format' 
      });
    }
    
    // Validate vehicle number format
    const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    if (!vehicleRegex.test(vehicleDetails.vehicleNumber.toUpperCase())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid vehicle number format' 
      });
    }
    
    // Create new driver
    driver = new Driver({
      phone,
      name,
      email,
      agencyName,
      panNumber: panNumber.toUpperCase(),
      address,
      dateOfBirth,
      licenseNumber,
      vehicleDetails: {
        vehicleNumber: vehicleDetails.vehicleNumber.toUpperCase(),
        vehicleType: vehicleDetails.vehicleType
      },
      gender,
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

// GET /drivers/:driverId/work-locations - Get driver work locations
router.get('/:driverId/work-locations', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId, 'workLocations');
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    res.json({ success: true, data: driver.workLocations || [] });
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /drivers/:driverId/earnings - Get driver total earnings and trip history
router.get('/:driverId/earnings', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const trips = await Booking.find({ 
      driverId, 
      status: 'completed' 
    })
    .select('source destination distance totalPrice driverAmount payment.method completedAt createdAt')
    .sort({ completedAt: -1 });
    
    const totalEarnings = trips.reduce((sum, trip) => sum + (trip.driverAmount || 0), 0);
    
    const tripHistory = trips.map(trip => ({
      tripId: trip._id,
      from: trip.source?.name || trip.source?.address,
      to: trip.destination?.name || trip.destination?.address,
      distance: trip.distance,
      totalFare: trip.totalPrice,
      driverEarning: trip.driverAmount,
      paymentMethod: trip.payment?.method,
      completedAt: trip.completedAt,
      bookedAt: trip.createdAt
    }));
    
    res.json({ 
      success: true, 
      data: {
        totalEarnings,
        totalTrips: trips.length,
        tripHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;ed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
});

// GET /drivers/:driverId/available-trips - Get trips based on driver's location and work locations
router.get('/:driverId/available-trips', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { latitude, longitude, radius = 50 } = req.query;
    
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    const searchLat = latitude ? parseFloat(latitude) : driver.location?.latitude;
    const searchLng = longitude ? parseFloat(longitude) : driver.location?.longitude;
    
    if (!searchLat || !searchLng) {
      return res.status(400).json({ success: false, message: 'Location required' });
    }
    
    const bookings = await Booking.find({
      status: 'pending',
      driverId: { $exists: false },
      rejectedDrivers: { $ne: driverId }
    }).populate('userId', 'name phone').populate('vehicleId', 'name type');
    
    const nearbyTrips = bookings.filter(booking => {
      if (!booking.source?.location?.coordinates) return false;
      const [lng, lat] = booking.source.location.coordinates;
      const distance = getDistance(searchLat, searchLng, lat, lng);
      return distance <= radius;
    }).map(booking => {
      const [lng, lat] = booking.source.location.coordinates;
      return {
        ...booking.toObject(),
        distanceFromDriver: getDistance(searchLat, searchLng, lat, lng)
      };
    }).sort((a, b) => a.distanceFromDriver - b.distanceFromDriver);
    
    res.json({ success: true, data: nearbyTrips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// GET /drivers/:driverId/earnings - Get driver earnings history
router.get('/:driverId/earnings', async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const DriverEarning = require('../models/DriverEarning');
    const mongoose = require('mongoose');
    
    const filter = { driverId: req.params.driverId };
    if (type) filter.earningType = type;
    
    const earnings = await DriverEarning.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('bookingId', 'source destination distance');
    
    const totalEarnings = await DriverEarning.aggregate([
      { $match: { driverId: new mongoose.Types.ObjectId(req.params.driverId), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        earnings,
        totalEarnings: totalEarnings[0]?.total || 0,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: await DriverEarning.countDocuments(filter)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    
    console.log('Fetching bookings with filter:', filter);
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    console.log('Found bookings:', bookings.length);
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching driver bookings:', error);
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

// GET /drivers/:driverId/active-booking - Check if driver has active booking
router.get('/:driverId/active-booking', async (req, res) => {
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