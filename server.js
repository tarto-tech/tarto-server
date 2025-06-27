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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes after ensuring all dependencies are installed
const userRoutes = require('./routes/userRoutes');
const bannerServicesRoutes = require('./routes/Bannerservices');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const locationRoutes = require('./routes/locationRoutes');
const addressRoutes = require('./routes/addressRoutes');
const homeVehicleRoutes = require('./routes/homeVehicleRoutes');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/services', bannerServicesRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', addressRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/Homevehicles', homeVehicleRoutes);

// Load resort routes with error handling
try {
  // Try to load ResortBooking model or create it if it doesn't exist
  try {
    require('./models/ResortBooking');
  } catch (modelError) {
    // Create ResortBooking model on the fly if it doesn't exist
    console.log('Creating ResortBooking model on the fly');
    const mongoose = require('mongoose');
    
    const resortBookingSchema = new mongoose.Schema({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      resortId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resort',
        required: true
      },
      checkInDate: {
        type: Date,
        required: true
      },
      checkOutDate: {
        type: Date,
        required: true
      },
      guests: {
        type: Number,
        required: true,
        default: 1
      },
      totalPrice: {
        type: Number,
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
      },
      payment: {
        method: {
          type: String,
          default: 'cash'
        },
        status: {
          type: String,
          default: 'pending'
        }
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }, { timestamps: true });
    
    // Register the model
    mongoose.model('ResortBooking', resortBookingSchema);
  }
  
  // Now load the resort routes
  const resortRoutes = require('./routes/resortRoutes');
  app.use('/api/resorts', resortRoutes);
  console.log('Resort routes loaded successfully');
} catch (error) {
  console.warn('Resort routes not loaded:', error.message);
  
  // Try to load just the basic resort routes without booking functionality
  try {
    const Resort = require('./models/Resort');
    const express = require('express');
    const basicResortRouter = express.Router();
    
    // Basic GET all resorts route
    basicResortRouter.get('/', async (req, res) => {
      try {
        const resorts = await Resort.find();
        res.json({ success: true, data: resorts });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });
    
    // Basic GET single resort route
    basicResortRouter.get('/:id', async (req, res) => {
      try {
        const resort = await Resort.findById(req.params.id);
        if (!resort) return res.status(404).json({ success: false, message: 'Resort not found' });
        res.json({ success: true, data: resort });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });
    
    app.use('/api/resorts', basicResortRouter);
    console.log('Basic resort routes loaded successfully');
  } catch (innerError) {
    console.warn('Could not load basic resort routes:', innerError.message);
  }
}

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