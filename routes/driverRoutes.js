const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Driver = require('../models/Driver.js');
const Booking = require('../models/BookingModel.js');
const DriverAppVersion = require('../models/DriverAppVersion.js');
const DriverEarning = require('../models/DriverEarning');

// POST /drivers/auth/verify-otp
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp, userType } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP required' });
    }

    if (otp.length !== 4) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const driver = await Driver.findOne({ phone: phoneNumber });
    
    if (driver) {
      const token = jwt.sign(
        { 
          driverId: driver._id, 
          phone: driver.phone,
          type: 'driver' 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        data: {
          driverId: driver._id,
          token: token,
          driver: {
            id: driver._id,
            name: driver.name,
            phone: driver.phone,
            status: driver.status,
            email: driver.email,
            vehicleDetails: driver.vehicleDetails,
            totalTrips: driver.totalTrips,
            totalEarnings: driver.totalEarnings
          }
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Driver not found',
        message: 'Driver not found with this phone number'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /drivers/login
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }
    
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`OTP for ${phone}: ${otp}`);
    
    res.json({ success: true, message: 'OTP generated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate OTP' });
  }
});

// POST /drivers/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    }
    
    let driver = await Driver.findOne({ phone });
    
    if (!driver) {
      driver = new Driver({ phone, name: 'Driver' });
      await driver.save();
    }
    
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

// GET /drivers/profile/phone/:phoneNumber
router.get('/profile/phone/:phoneNumber', async (req, res) => {
  try {
    const driver = await Driver.findOne({ phone: req.params.phoneNumber });
    
    if (driver) {
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

// POST /drivers/auth/register - Register new driver with JWT
router.post('/auth/register', async (req, res) => {
  try {
    const { phone } = req.body;
    
    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        error: 'Driver already registered with this phone number'
      });
    }
    
    const driver = new Driver({
      ...req.body,
      status: 'pending'
    });
    
    await driver.save();
    
    const token = jwt.sign(
      { 
        driverId: driver._id, 
        phone: driver.phone,
        type: 'driver' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      success: true,
      data: {
        _id: driver._id,
        phone: driver.phone,
        name: driver.name,
        email: driver.email,
        status: driver.status,
        documents: driver.documents
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /drivers/profile/:driverId
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
      agencyName: driver.agencyName,
      panNumber: driver.panNumber,
      address: driver.address,
      dateOfBirth: driver.dateOfBirth,
      licenseNumber: driver.licenseNumber,
      gender: driver.gender,
      vehicleDetails: driver.vehicleDetails,
      documents: driver.documents,
      status: driver.status,
      rating: driver.rating,
      totalTrips: driver.totalTrips,
      totalEarnings: driver.totalEarnings,
      currentLocation: driver.currentLocation,
      isOnline: driver.isOnline,
      isAvailable: driver.isAvailable,
      workLocations: driver.workLocations,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// PATCH /drivers/:driverId
router.patch('/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const updates = req.body;

    delete updates._id;
    delete updates.phone;
    delete updates.totalTrips;
    delete updates.totalEarnings;
    delete updates.createdAt;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.json({ success: true, data: { driver } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /drivers/:driverId/work-locations
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

// POST /drivers/:driverId/work-locations
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

// POST /drivers/:driverId/location
router.post('/:driverId/location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    await Driver.findByIdAndUpdate(req.params.driverId, {
      location: { latitude, longitude },
      currentLocation: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });
    
    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /drivers/:driverId/fcm-token
router.post('/:driverId/fcm-token', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }
    
    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { fcmToken },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    res.json({ success: true, message: 'FCM token updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /drivers/app-version
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

// GET /drivers/:driverId/earnings
router.get('/:driverId/earnings', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, earningType, period } = req.query;
    const filter = { driverId: req.params.driverId };
    
    if (status) filter.status = status;
    if (earningType) filter.earningType = earningType;
    
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
    
    const tripHistory = earnings.map(earning => ({
      tripId: earning.bookingId?._id || earning._id,
      from: earning.tripDetails?.source || earning.bookingId?.from || 'N/A',
      to: earning.tripDetails?.destination || earning.bookingId?.to || 'N/A',
      stops: earning.tripDetails?.stops || [],
      distance: earning.tripDetails?.distance || earning.bookingId?.distance || 0,
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

// GET /drivers/:driverId/stats
router.get('/:driverId/stats', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    const earningsStats = await DriverEarning.aggregate([
      { $match: { driverId: new mongoose.Types.ObjectId(req.params.driverId), status: 'completed' } },
      { $group: { _id: null, totalEarnings: { $sum: '$amount' }, totalTrips: { $sum: 1 } } }
    ]);
    
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

// GET /drivers/:driverId/bookings/history
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

// PATCH /drivers/:driverId/earnings
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

// POST /drivers/:driverId/trips
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

// POST /drivers/:driverId/complete-trip
router.post('/:driverId/complete-trip', async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { tripData, endLatitude, endLongitude } = req.body;
      const driverId = req.params.driverId;
      
      const earning = new DriverEarning({
        ...tripData,
        driverId,
        ...(endLatitude && { endLatitude }),
        ...(endLongitude && { endLongitude })
      });
      await earning.save({ session });
      
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

// PATCH /drivers/:driverId/stats
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

// GET /drivers/:driverId/dashboard
router.get('/:driverId/dashboard', async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEarnings = await DriverEarning.aggregate([
      { $match: { driverId: new mongoose.Types.ObjectId(driverId), createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' }, trips: { $sum: 1 } } }
    ]);

    const activeBooking = await Booking.findOne({
      driverId,
      status: { $in: ['accepted', 'confirmed', 'started'] }
    });

    const dashboardData = {
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        status: driver.status,
        totalTrips: driver.totalTrips || 0,
        totalEarnings: driver.totalEarnings || 0
      },
      today: {
        earnings: todayEarnings[0]?.total || 0,
        trips: todayEarnings[0]?.trips || 0
      },
      activeBooking: activeBooking || null
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /drivers/:driverId/status
router.patch('/:driverId/status', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, timestamp } = req.body;

    const validStatuses = ['active', 'inactive', 'busy', 'offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: active, inactive, busy, or offline' 
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      {
        status,
        lastStatusUpdate: timestamp || new Date()
      },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.json({ 
      success: true, 
      message: 'Driver status updated successfully',
      data: { status: driver.status, lastStatusUpdate: driver.lastStatusUpdate }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /drivers/check-exists
router.get('/check-exists', async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const driver = await Driver.findOne({ phone });

    res.json({
      success: true,
      exists: !!driver,
      data: driver ? {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        status: driver.status
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /drivers/pending-verification/list
router.get('/pending-verification/list', async (req, res) => {
  try {
    const drivers = await Driver.find({ status: 'pending_verification' })
      .select('name phone email agencyName panNumber licenseNumber vehicleDetails documents status createdAt')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: drivers,
      count: drivers.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
