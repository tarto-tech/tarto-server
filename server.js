const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const logger = require('./config/logger');
const { globalErrorHandler, notFound } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize Express app first
const app = express();

// Connect to MongoDB (non-blocking)
connectDB().catch(err => {
  console.error('MongoDB connection failed, continuing without DB:', err.message);
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false)
    : true,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Body parsing middleware
const maxFileSize = process.env.MAX_FILE_SIZE || '10mb';
app.use(express.json({ limit: maxFileSize }));
app.use(express.urlencoded({ limit: maxFileSize, extended: true }));

// Static files
app.use(express.static('public'));

// Rate limiting
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || windowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || max,
  message: { success: false, message },
  standardHeaders: true,
  legacyHeaders: false
});

const routeCalculationLimit = createRateLimit(
  parseInt(process.env.ROUTE_CALC_LIMIT_WINDOW_MS) || 60000,
  parseInt(process.env.ROUTE_CALC_LIMIT_MAX) || 10,
  'Too many route calculations, try again later'
);

const bookingLimit = createRateLimit(
  parseInt(process.env.BOOKING_LIMIT_WINDOW_MS) || 300000,
  parseInt(process.env.BOOKING_LIMIT_MAX) || 5,
  'Too many booking attempts, try again later'
);

app.set('routeCalculationLimit', routeCalculationLimit);
app.set('bookingLimit', bookingLimit);

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

// API routes
app.use('/api/maps', mapsRoutes);
app.use('/api', appRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', bannerServicesRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/Homevehicles', homeVehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/pricing', pricingRoutes);

// Optional routes with error handling
const loadOptionalRoutes = () => {
  try {
    const appVersionRoutes = require('./routes/appVersionRoutes');
    app.use('/api/appversions', appVersionRoutes);
    app.use('/api', appVersionRoutes);
    logger.info('App version routes loaded');
  } catch (error) {
    logger.warn('App version routes not loaded:', error.message);
  }

  try {
    const driverAppVersionRoutes = require('./routes/driverAppVersionRoutes');
    app.use('/api', driverAppVersionRoutes);
    logger.info('Driver app version routes loaded');
  } catch (error) {
    logger.warn('Driver app version routes not loaded:', error.message);
  }
};

loadOptionalRoutes();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'production',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// App version manager page (admin only)
app.get('/app-version-manager', (req, res) => {
  res.sendFile(__dirname + '/public/app-version.html');
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'production'} mode on http://${HOST}:${PORT}`);
  
  // Initialize geospatial indexes after server starts
  mongoose.connection.once('open', async () => {
    logger.info('MongoDB connection established');
    
    try {
      const Driver = require('./models/Driver');
      await Driver.collection.createIndex({ location: '2dsphere' });
      logger.info('Geospatial index ensured on Driver.location');
    } catch (error) {
      logger.warn('Geospatial index creation warning:', error.message);
    }
  });
});

// Graceful shutdown handlers
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;