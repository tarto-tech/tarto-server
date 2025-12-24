const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Driver = require('../models/Driver.js');
const Booking = require('../models/BookingModel.js');
const DriverAppVersion = require('../models/DriverAppVersion.js');
const DriverEarning = require('../models/DriverEarning');

// POST /drivers/login - Generate OTP
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }
    
    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    
    
    // Store OTP in database (expires in 10 minutes)
  
    
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
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    
    // Find or create driver
    let driver = await Driver.findOne({ phone });
    
    if (!driver) {
      driver = new Driver({ phone, name: 'Driver' });
      await driver.save();
    }
    
    // Delete used OTP
    
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

// GET /drivers/app-version - Get current app version for driver app
router.get('/app-version', async (req, res) => {
  try {
    const version = await DriverAppVersion.findOne().sort({ createdAt: -1 });
    if (!version) {
      return res.status(404).json({ success: false, message: 'App version not found' });
    }
    res.json({ success: true, data: version });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



// GET /drivers/:driverId/earnings - Get driver earnings
router.get('/:driverId/earnings', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, earningType, period } = req.query;
    const filter = { driverId: req.params.driverId };
    
    if (status) filter.status = status;
    if (earningType) filter.earningType = earningType;
    
    // Add period filter
    if (period) {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }
    
    const earnings = await DriverEarning.find(filter)
      .populate('bookingId', 'bookingId tripType status from to distance totalFare paymentMethod completedAt createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await DriverEarning.countDocuments(filter);
    const totalEarnings = await DriverEarning.aggregate([
      { $match: { driverId: new mongoose.Types.ObjectId(req.params.driverId), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Format trip history
    const tripHistory = earnings.map(earning => ({
      tripId: earning.bookingId?._id || earning._id,
      from: earning.bookingId?.from || 'N/A',
      to: earning.bookingId?.to || 'N/A',
      distance: earning.bookingId?.distance || 0,
      totalFare: earning.bookingId?.totalFare || earning.amount,
      driverEarning: earning.amount,
      paymentMethod: earning.bookingId?.paymentMethod || 'cash',
      completedAt: earning.bookingId?.completedAt || earning.createdAt,
      bookedAt: earning.bookingId?.createdAt || earning.createdAt
    }));
    
    res.json({ 
      success: true, 
      data: {
        totalEarnings: totalEarnings[0]?.total || 0,
        totalTrips: total,
        tripHistory,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /drivers/:driverId/stats - Get driver stats/analytics
router.get('/:driverId/stats', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    // Get total earnings from DriverEarning collection
    const earningsStats = await DriverEarning.aggregate([
      { $match: { driverId: new mongoose.Types.ObjectId(req.params.driverId), status: 'completed' } },
      { $group: { _id: null, totalEarnings: { $sum: '$amount' }, totalTrips: { $sum: 1 } } }
    ]);
    
    // Get total distance from bookings
    const distanceStats = await Booking.aggregate([
      { $match: { driverId: new mongoose.Types.ObjectId(req.params.driverId), status: 'completed' } },
      { $group: { _id: null, totalDistance: { $sum: '$distance' } } }
    ]);
    
    const stats = earningsStats[0] || { totalEarnings: 0, totalTrips: 0 };
    const distance = distanceStats[0] || { totalDistance: 0 };
    
    res.json({
      success: true,
      data: {
        totalTrips: stats.totalTrips,
        totalEarnings: stats.totalEarnings,
        averageRating: driver.rating || 0,
        totalDistance: distance.totalDistance,
        onlineHours: driver.onlineHours || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /drivers/:driverId/bookings/history - Get driver booking history
router.get('/:driverId/bookings/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { driverId: req.params.driverId };
    
    const bookings = await Booking.find(filter)
      .select('bookingId from to fare driverEarning status completedAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const totalCount = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      success: true,
      data: {
        bookings: bookings.map(booking => ({
          bookingId: booking.bookingId || booking._id,
          from: booking.from,
          to: booking.to,
          fare: booking.fare,
          driverEarning: booking.driverEarning,
          status: booking.status,
          completedAt: booking.completedAt
        })),
        totalCount,
        currentPage: parseInt(page),
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /drivers/:driverId/earnings - Update earnings
router.patch('/:driverId/earnings', async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.driverId,
      { $inc: { totalEarnings: req.body.amount, totalTrips: 1 } },
      { new: true }
    );
    if (!driver) return res.status(404).json({ success: false, error: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /drivers/:driverId/trips - Add trip to history
router.post('/:driverId/trips', async (req, res) => {
  try {
    const earning = new DriverEarning({
      ...req.body,
      driverId: req.params.driverId
    });
    await earning.save();
    res.json({ success: true, data: earning });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /drivers/:driverId/complete-trip - Optimized trip completion with transaction
// POST /drivers/:driverId/complete-trip - Optimized trip completion with transaction
router.post('/:driverId/complete-trip', async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { tripData, endLatitude, endLongitude } = req.body;
      const driverId = req.params.driverId;
      
      // Create earning record with end coordinates
      const earning = new DriverEarning({
        ...tripData,
        driverId,
        ...(endLatitude && { endLatitude }),
        ...(endLongitude && { endLongitude })
      });
      await earning.save({ session });
      
      // Update driver stats atomically
      await Driver.findByIdAndUpdate(
        driverId,
        {
          $inc: { 
            totalTrips: 1, 
            totalEarnings: tripData.driverEarning 
          },
          lastTripDate: new Date(),
          ...(endLatitude && endLongitude && { 
            lastKnownLocation: { lat: endLatitude, lng: endLongitude } 
          })
        },
        { session, new: true }
      );
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
});


// PATCH /drivers/:driverId/stats - Update trip statistics
router.patch('/:driverId/stats', async (req, res) => {
  try {
    const { totalTrips, totalEarnings, lastTripDate } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.driverId,
      { totalTrips, totalEarnings, lastActiveAt: lastTripDate },
      { new: true }
    );
    if (!driver) return res.status(404).json({ success: false, error: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;