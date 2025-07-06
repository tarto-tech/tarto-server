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
mongoose.connection.once('open', () => {
  console.log('MongoDB connection established');
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

// App version routes
try {
  const appVersionRoutes = require('./routes/appVersionRoutes');
  app.use('/api/appversions', appVersionRoutes);
  app.use('/api', appVersionRoutes);
  console.log('App version routes loaded successfully');
} catch (error) {
  console.warn('App version routes not loaded:', error.message);
}
// app.use('/api/resort-bookings', resortBookingRoutes);

// Resort booking routes
try {
  const resortBookingRoutes = require('./routes/resortBookingRoutes');
  app.use('/api/resort-bookings', resortBookingRoutes);
  console.log('Resort booking routes loaded successfully');
} catch (error) {
  console.warn('Resort booking routes not loaded:', error.message);
}

// Resort routes
const resortRoutes = require('./routes/resortRoutes');
app.use('/api/resorts', resortRoutes);

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