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

// Create a test resort if none exist
async function createTestResort() {
  try {
    const Resort = require('./models/Resort');
    const count = await Resort.countDocuments();
    
    if (count === 0) {
      console.log('No resorts found, creating a test resort');
      const testResort = new Resort({
        name: 'Test Resort',
        description: 'A beautiful resort for testing',
        price: 5000,
        imageUrl: 'https://example.com/image.jpg',
        amenities: ['WiFi', 'Pool', 'Spa'],
        maxGuests: 4,
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716]
        }
      });
      
      await testResort.save();
      console.log('Test resort created successfully');
    }
  } catch (error) {
    console.error('Error creating test resort:', error);
  }
}

// Call the function after connection is established
mongoose.connection.once('open', () => {
  console.log('MongoDB connection established, checking for test data');
  createTestResort();
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import routes
const userRoutes = require('./routes/userRoutes');
const bannerServicesRoutes = require('./routes/Bannerservices');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const locationRoutes = require('./routes/locationRoutes');
const addressRoutes = require('./routes/addressRoutes');
const homeVehicleRoutes = require('./routes/homeVehicleRoutes');
const appRoutes = require('./routes/appRoutes');
// const resortBookingRoutes = require('./routes/resortBookingRoutes');

// Routes
app.use('/api', appRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', bannerServicesRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', addressRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/Homevehicles', homeVehicleRoutes);
// app.use('/api/resort-bookings', resortBookingRoutes);

// Resort routes (only for resort CRUD)
const resortRouter = express.Router();
const Resort = require('./models/Resort');

// GET all resorts
resortRouter.get('/', async (req, res) => {
  try {
    const resorts = await Resort.find();
    res.json({
      success: true,
      data: resorts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resorts'
    });
  }
});

// GET single resort
resortRouter.get('/:id', async (req, res) => {
  try {
    const resort = await Resort.findById(req.params.id);
    
    if (!resort) {
      return res.status(404).json({
        success: false,
        message: 'Resort not found'
      });
    }
    
    res.json({
      success: true,
      data: resort
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resort'
    });
  }
});
  
app.use('/api/resorts', resortRouter);
console.log('Resort routes loaded successfully');

// Try to load packages route if it exists
try {
  const packageRoutes = require('./routes/packages');
  app.use('/api/packages', packageRoutes);
  console.log('Package routes loaded successfully');
} catch (error) {
  console.warn('Package routes not loaded:', error.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date()
  });
});

// App version manager page
app.get('/app-version-manager', (req, res) => {
  res.sendFile(__dirname + '/public/app-version.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
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