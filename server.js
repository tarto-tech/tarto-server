//server
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Call the function after connection is established
mongoose.connection.once('open', async () => {
  console.log('MongoDB connection established');
  
  // Create geospatial index for drivers
  try {
    const Driver = require('./models/Driver');
    await Driver.collection.createIndex({ location: '2dsphere' });
    console.log('✅ Geospatial index ensured on Driver.location');
  } catch (error) {
    console.warn('Geospatial index creation warning:', error.message);
  }
});

const app = express();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : false)
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));

// Rate limiting
const routeCalculationLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many route calculations, try again later' }
});

const bookingLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many booking attempts, try again later' }
});

app.set('routeCalculationLimit', routeCalculationLimit);
app.set('bookingLimit', bookingLimit);

// Import middleware
const { authenticateToken, requireAdmin } = require('./middleware/auth');

// Import routes
const mapsRoutes = require('./routes/maps');
const userRoutes = require('./routes/userRoutes');
const bannerServicesRoutes = require('./routes/Bannerservices');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const locationRoutes = require('./routes/locationRoutes');
const addressRoutes = require('./routes/addressRoutes');
const homeVehicleRoutes = require('./routes/homeVehicleRoutes');
const appRoutes = require('./routes/appRoutes');

const driverRoutes = require('./routes/driverRoutes');

const proxyRoutes = require('./routes/proxyRoutes');
const pricingRoutes = require('./routes/pricingRoutes');

// Routes
app.use('/api/maps', mapsRoutes);

app.use('/api', appRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', bannerServicesRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', addressRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/Homevehicles', homeVehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/driver', driverRoutes);

app.use('/api/proxy', proxyRoutes);
app.use('/api/pricing', pricingRoutes);

// App version routes
try {
  const appVersionRoutes = require('./routes/appVersionRoutes');
  app.use('/api/appversions', appVersionRoutes);
  app.use('/api', appVersionRoutes);
  console.log('App version routes loaded successfully');
} catch (error) {
  console.warn('App version routes not loaded:', error.message);
}

// Driver app version routes
try {
  const driverAppVersionRoutes = require('./routes/driverAppVersionRoutes');
  app.use('/api', driverAppVersionRoutes);
  console.log('Driver app version routes loaded successfully');
} catch (error) {
  console.warn('Driver app version routes not loaded:', error.message);
}



// Booking update endpoints
const Booking = require('./models/BookingModel');

// Update booking stops
app.put('/api/bookings/:bookingId/stops', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { stops } = req.body;
    
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { stops, updatedAt: new Date() },
      { new: true }
    );
    
    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update booking schedule
app.put('/api/bookings/:bookingId/schedule', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { pickupDate, pickupTime, returnDate } = req.body;
    
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { pickupDate, pickupTime, returnDate, updatedAt: new Date() },
      { new: true }
    );
    
    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// General booking update
app.put('/api/bookings/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
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
      bookingId,
      updateData,
      { new: true }
    );
    
    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date()
  });
});

// Driver app versions endpoint
app.get('/api/driver-appversions', async (req, res) => {
  try {
    const driverAppVersion = {
      latestVersion: "1.2.0",
      minRequiredVersion: "1.1.0", 
      forceUpdate: false,
      updateMessage: "New driver features available!",
      updateUrl: {
        android: "https://play.google.com/store/apps/details?id=com.tarto.driver",
        ios: "https://apps.apple.com/app/tarto-driver/id123456789"
      },
      releaseNotes: [
        "Improved trip tracking",
        "Better earnings calculation", 
        "Bug fixes and performance improvements"
      ],
      appType: "driver"
    };

    res.json({
      success: true,
      data: driverAppVersion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch driver app version info"
    });
  }
});

// POST driver app versions endpoint
app.post('/api/driver-update-info', async (req, res) => {
  try {
    const DriverAppVersion = require('./models/DriverAppVersion');
    const { latestVersion, minRequiredVersion, forceUpdate, updateMessage, updateUrl } = req.body;
    
    if (!latestVersion || !minRequiredVersion) {
      return res.status(400).json({
        success: false,
        message: 'Latest version and minimum required version are required'
      });
    }

    const versionData = {
      latestVersion,
      minRequiredVersion,
      forceUpdate: forceUpdate || false,
      updateMessage: updateMessage || 'New version available',
      updateUrl: {
        android: updateUrl?.android || "https://play.google.com/store/apps/details?id=com.tarto.driver",
        ios: updateUrl?.ios || "https://apps.apple.com/app/tarto-driver/id123456789"
      }
    };

    const updatedVersion = await DriverAppVersion.findOneAndUpdate(
      {},
      versionData,
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: updatedVersion
    });
  } catch (error) {
    console.error('Driver app version update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app version info',
      error: error.message
    });
  }
});

// GET - Fetch driver app version
app.get('/api/driver-update-info', async (req, res) => {
  try {
    const DriverAppVersion = require('./models/DriverAppVersion');
    const driverVersion = await DriverAppVersion.findOne({});
    
    if (!driverVersion) {
      return res.json({
        success: true,
        data: {
          latestVersion: "1.0.0",
          minRequiredVersion: "1.0.0",
          forceUpdate: false,
          updateMessage: "Driver app available",
          updateUrl: {
            android: "https://play.google.com/store/apps/details?id=com.tarto.driver",
            ios: "https://apps.apple.com/app/tarto-driver/id123456789"
          }
        }
      });
    }

    res.json({ success: true, data: driverVersion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch driver app version' });
  }
});

// PUT - Update driver app version
app.put('/api/driver-update-info', async (req, res) => {
  try {
    const DriverAppVersion = require('./models/DriverAppVersion');
    const updateData = req.body;
    
    const updatedVersion = await DriverAppVersion.findOneAndUpdate({}, updateData, { new: true });

    if (!updatedVersion) {
      return res.status(404).json({ success: false, message: 'Driver app version not found' });
    }

    res.json({ success: true, data: updatedVersion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update driver app version' });
  }
});

// PATCH - Partially update driver app version
app.patch('/api/driver-update-info', async (req, res) => {
  try {
    const DriverAppVersion = require('./models/DriverAppVersion');
    const updateData = req.body;
    
    const updatedVersion = await DriverAppVersion.findOneAndUpdate({}, updateData, { new: true });

    if (!updatedVersion) {
      return res.status(404).json({ success: false, message: 'Driver app version not found' });
    }

    res.json({ success: true, data: updatedVersion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to patch driver app version' });
  }
});

// DELETE - Remove driver app version
app.delete('/api/driver-update-info', async (req, res) => {
  try {
    const DriverAppVersion = require('./models/DriverAppVersion');
    
    const deletedVersion = await DriverAppVersion.findOneAndDelete({});
    
    if (!deletedVersion) {
      return res.status(404).json({ success: false, message: 'Driver app version not found' });
    }

    res.json({ success: true, message: 'Driver app version deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete driver app version' });
  }
});





// App version manager page
app.get('/app-version-manager', (req, res) => {
  res.sendFile(__dirname + '/public/app-version.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'production'} mode on http://${HOST}:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});