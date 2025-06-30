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

// Import routes after ensuring all dependencies are installed
const userRoutes = require('./routes/userRoutes');
const bannerServicesRoutes = require('./routes/Bannerservices');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const locationRoutes = require('./routes/locationRoutes');
const addressRoutes = require('./routes/addressRoutes');
const homeVehicleRoutes = require('./routes/homeVehicleRoutes');
const appRoutes = require('./routes/appRoutes');

// Routes
app.use('/api/app', appRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', bannerServicesRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', addressRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/Homevehicles', homeVehicleRoutes);

// Load resort routes with error handling
try {
  // Create a custom resort router with full functionality
  const express = require('express');
  const resortRouter = express.Router();
  const Resort = require('./models/Resort');
  
  // Create ResortBooking model on the fly
  console.log('Creating ResortBooking model on the fly');
  
  // Define the schema
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
  
  // Create the model
  const ResortBooking = mongoose.model('ResortBooking', resortBookingSchema);
  
  // Debug middleware
  resortRouter.use((req, res, next) => {
    console.log(`Resort API: ${req.method} ${req.url}`);
    next();
  });
  
  // Simple test route
  resortRouter.get('/test', (req, res) => {
    console.log('Resort test route accessed');
    res.json({
      success: true,
      message: 'Resort router is working',
      timestamp: new Date()
    });
  });
  
  // GET all resorts
  resortRouter.get('/', async (req, res) => {
    try {
      console.log('Fetching all resorts');
      const resorts = await Resort.find();
      console.log(`Found ${resorts.length} resorts`);
      
      res.json({
        success: true,
        data: resorts
      });
    } catch (error) {
      console.error('Error fetching resorts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch resorts'
      });
    }
  });
  
  // POST create resort
  resortRouter.post('/', async (req, res) => {
    try {
      const resort = new Resort(req.body);
      const savedResort = await resort.save();
      
      res.status(201).json({
        success: true,
        data: savedResort
      });
    } catch (error) {
      console.error('Error creating resort:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create resort',
        error: error.message
      });
    }
  });
  
  // GET resort bookings
  resortRouter.get('/bookings', async (req, res) => {
    try {
      const bookings = await ResortBooking.find()
        .populate('userId', 'name phone email')
        .populate('resortId', 'name price imageUrl');
      
      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings'
      });
    }
  });
  
  // GET user's resort bookings
  resortRouter.get('/bookings/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const bookings = await ResortBooking.find({ userId })
        .populate('resortId', 'name price imageUrl');
      
      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user bookings'
      });
    }
  });
  
  // POST create resort booking
  resortRouter.post('/bookings', async (req, res) => {
    try {
      const booking = new ResortBooking(req.body);
      const savedBooking = await booking.save();
      
      res.status(201).json({
        success: true,
        data: savedBooking
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create booking',
        error: error.message
      });
    }
  });
  
  // GET single resort booking
  resortRouter.get('/bookings/:id', async (req, res) => {
    try {
      const booking = await ResortBooking.findById(req.params.id)
        .populate('userId', 'name phone email')
        .populate('resortId', 'name price imageUrl');
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking'
      });
    }
  });
  
  // PATCH update resort booking status
  resortRouter.patch('/bookings/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      
      const booking = await ResortBooking.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update booking status'
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
      console.error('Error fetching resort:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch resort'
      });
    }
  });
  
  // PUT update resort
  resortRouter.put('/:id', async (req, res) => {
    try {
      const resort = await Resort.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      
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
      console.error('Error updating resort:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update resort'
      });
    }
  });
  
  // DELETE resort
  resortRouter.delete('/:id', async (req, res) => {
    try {
      const resort = await Resort.findByIdAndDelete(req.params.id);
      
      if (!resort) {
        return res.status(404).json({
          success: false,
          message: 'Resort not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Resort deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting resort:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete resort'
      });
    }
  });
  
  app.use('/api/resorts', resortRouter);
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

// Load simple resort routes that don't depend on models
try {
  const simpleResortRoutes = require('./routes/simpleResortRoutes');
  app.use('/api/simple-resorts', simpleResortRoutes);
  console.log('Simple resort routes loaded successfully');
} catch (error) {
  console.warn('Simple resort routes not loaded:', error.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date()
  });
});

// Hardcoded resort endpoints
app.get('/api/hardcoded-resorts', (req, res) => {
  console.log('Hardcoded resorts endpoint accessed');
  res.status(200).json({
    success: true,
    data: [
      {
        _id: "6845ad46063e86f16e607009",
        name: "Lakeside Villa",
        description: "Luxurious villa with stunning lake views and private pool",
        price: 12999,
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        amenities: ["Swimming Pool", "WiFi", "Air Conditioning", "Kitchen", "Parking"],
        maxGuests: 6
      }
    ]
  });
});

// Test resort endpoint
app.get('/api/resorts-test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Resort test endpoint is working',
    timestamp: new Date()
  });
});

// Direct resort endpoint in server.js
app.get('/api/direct-resorts', (req, res) => {
  console.log('Direct resort endpoint accessed');
  res.status(200).json({
    success: true,
    data: [
      {
        _id: "6845ad46063e86f16e607009",
        name: "Lakeside Villa",
        description: "Luxurious villa with stunning lake views and private pool",
        price: 12999,
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        amenities: ["Swimming Pool", "WiFi", "Air Conditioning", "Kitchen", "Parking"],
        maxGuests: 6,
        location: {
          type: "Point",
          coordinates: [76.6394, 12.2958]
        },
        createdAt: "2023-06-10T12:00:00.000Z",
        updatedAt: "2023-06-10T12:00:00.000Z"
      }
    ]
  });
});

// Direct single resort endpoint
app.get('/api/direct-resorts/:id', (req, res) => {
  console.log(`Direct single resort endpoint accessed for ID: ${req.params.id}`);
  res.status(200).json({
    success: true,
    data: {
      _id: "6845ad46063e86f16e607009",
      name: "Lakeside Villa",
      description: "Luxurious villa with stunning lake views and private pool",
      price: 12999,
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      amenities: ["Swimming Pool", "WiFi", "Air Conditioning", "Kitchen", "Parking"],
      maxGuests: 6,
      location: {
        type: "Point",
        coordinates: [76.6394, 12.2958]
      },
      createdAt: "2023-06-10T12:00:00.000Z",
      updatedAt: "2023-06-10T12:00:00.000Z"
    }
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