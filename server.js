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
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || '*'
    : '*',
  credentials: true
}));
app.use(express.json());
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

// Import routes
const userRoutes = require('./routes/userRoutes');
const bannerServicesRoutes = require('./routes/Bannerservices');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const locationRoutes = require('./routes/locationRoutes');
const addressRoutes = require('./routes/addressRoutes');
const homeVehicleRoutes = require('./routes/homeVehicleRoutes');
const appRoutes = require('./routes/appRoutes');
const airportBookingNewRoutes = require('./routes/airportBookingNewRoutes');
const rentalBookingRoutes = require('./routes/rentalBookingRoutes');
const driverRoutes = require('./routes/driverRoutes');
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
app.use('/api/airport-bookings', airportBookingNewRoutes);
app.use('/api/rental-bookings', rentalBookingRoutes);
app.use('/api/drivers', driverRoutes);

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

// Airport booking routes
try {
  const airportBookingRoutes = require('./routes/airportBookingRoutes');
  app.use('/api/airport-bookings', airportBookingRoutes);
  console.log('Airport booking routes loaded successfully');
} catch (error) {
  console.warn('Airport booking routes not loaded:', error.message);
}

// Fallback resort booking endpoint with UPI support
try {
  const ResortBooking = require('./models/resortBooking');
  
  app.post('/api/resort-bookings/book', async (req, res) => {
    try {
      const { userId, resortId, checkInDate, checkOutDate, guests, totalPrice, paymentMode, paymentId } = req.body;
      
      console.log('Payment data received:', { paymentMode, paymentId });
      
      const booking = new ResortBooking({
        userId,
        resortId,
        checkInDate,
        checkOutDate,
        guests,
        totalPrice,
        status: 'pending',
        payment: {
          method: paymentMode === 'upi' ? 'upi' : 'cash',
          status: paymentMode === 'upi' ? 'completed' : 'pending',
          transactionId: paymentMode === 'upi' ? paymentId : null
        }
      });
      
      await booking.save();
      
      res.status(201).json({
        success: true,
        message: 'Resort booking created successfully',
        data: booking
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create resort booking',
        error: error.message
      });
    }
  });
} catch (error) {
  console.warn('Resort booking fallback not loaded:', error.message);
}

// Resort routes
try {
  const resortRoutes = require('./routes/resortRoutes');
  app.use('/api/resorts', resortRoutes);
  console.log('Resort routes loaded successfully');
} catch (error) {
  console.warn('Resort routes not loaded:', error.message);
  
  // Simple fallback routes for resorts
  const Resort = require('./models/Resort');
  
  // GET all resorts
  app.get('/api/resorts', async (req, res) => {
    try {
      const { lat, lng, radius = 50 } = req.query;
      let query = { isActive: true };
      
      if (lat && lng) {
        query['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: radius * 1000
          }
        };
      }
      
      const resorts = await Resort.find(query).sort({ createdAt: -1 });
      
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
  
  // GET single resort
  app.get('/api/resorts/:id', async (req, res) => {
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
  
  // POST create resort
  app.post('/api/resorts', async (req, res) => {
    try {
      const resort = new Resort(req.body);
      const savedResort = await resort.save();
      res.status(201).json({ success: true, data: savedResort });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
}

// Try to load packages route if it exists
try {
  const packageRoutes = require('./routes/packages');
  app.use('/api/packages', packageRoutes);
  console.log('Package routes loaded successfully');
} catch (error) {
  console.warn('Package routes not loaded:', error.message);
}

// Airport routes - Direct implementation
const airportSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  city: { type: String, required: true, trim: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const Airport = mongoose.models.Airport || mongoose.model('Airport', airportSchema);

// GET all airports
app.get('/api/airports', async (req, res) => {
  try {
    const airports = await Airport.find({ active: true }).sort({ city: 1 });
    res.json({ success: true, data: airports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch airports' });
  }
});

// POST create airport
app.post('/api/airports', async (req, res) => {
  try {
    const airport = new Airport(req.body);
    const savedAirport = await airport.save();
    res.status(201).json({ success: true, data: savedAirport });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create airport' });
  }
});

// PUT update airport
app.put('/api/airports/:id', async (req, res) => {
  try {
    const airport = await Airport.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!airport) return res.status(404).json({ success: false, message: 'Airport not found' });
    res.json({ success: true, data: airport });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update airport' });
  }
});

// DELETE airport
app.delete('/api/airports/:id', async (req, res) => {
  try {
    const airport = await Airport.findByIdAndDelete(req.params.id);
    if (!airport) return res.status(404).json({ success: false, message: 'Airport not found' });
    res.json({ success: true, message: 'Airport deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete airport' });
  }
});

// Resort UPDATE test endpoint
const Resort = require('./models/Resort');
app.patch('/api/resorts/:id', async (req, res) => {
  try {
    console.log('PATCH resort request received:', req.params.id, req.body);
    const resort = await Resort.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!resort) {
      return res.status(404).json({ success: false, message: 'Resort not found' });
    }
    
    res.json({ success: true, data: resort });
  } catch (error) {
    console.error('Error updating resort:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Resort DELETE fallback
app.delete('/api/resorts/:id', async (req, res) => {
  try {
    const resort = await Resort.findByIdAndDelete(req.params.id);
    if (!resort) {
      return res.status(404).json({ success: false, message: 'Resort not found' });
    }
    res.json({ success: true, message: 'Resort deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete resort' });
  }
});

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

// Outstation booking endpoints
const outstationBookingSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  userPhone: String,
  type: { type: String, default: 'outstation' },
  tripType: String,
  source: String,
  destination: String,
  vehicleId: String,
  vehicleType: String,
  totalPrice: Number,
  distance: Number,
  scheduledDate: String,
  scheduledTime: String,
  returnDate: String,
  returnTime: String,
  status: { type: String, default: 'pending' },
  paymentStatus: { type: String, default: 'pending' },
  pickupLocation: {
    name: String,
    latitude: Number,
    longitude: Number
  },
  dropLocation: {
    name: String,
    latitude: Number,
    longitude: Number
  }
}, { timestamps: true });

const OutstationBooking = mongoose.models.OutstationBooking || mongoose.model('OutstationBooking', outstationBookingSchema);

// GET outstation bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const { userId, type } = req.query;
    let query = {};
    
    if (userId) query.userId = userId;
    if (type === 'outstation') query.type = 'outstation';
    
    const bookings = await OutstationBooking.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// POST create outstation booking
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = new OutstationBooking(req.body);
    const savedBooking = await booking.save();
    
    res.status(201).json({
      success: true,
      bookingId: savedBooking._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
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