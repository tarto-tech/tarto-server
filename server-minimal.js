const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Basic booking routes
const Booking = require('./models/BookingModel');

// POST cancel endpoint
app.post('/api/bookings/:bookingId/cancel', async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    if (booking.status === 'pending') {
      await Booking.findByIdAndDelete(bookingId);
      return res.json({ success: true, message: 'Pending booking deleted successfully', deleted: true });
    } else {
      await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled', cancelledAt: new Date() });
      return res.json({ success: true, message: 'Booking cancelled successfully', deleted: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

// DELETE endpoint
app.delete('/api/bookings/:bookingId/tripcancelbyuser', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.bookingId);
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
});

const PORT = process.env.PORT || 5000;

// Start server first, then connect to MongoDB
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  
  // Connect to MongoDB after server starts
  if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('MongoDB connected'))
      .catch(err => console.log('MongoDB connection failed:', err.message));
  }
});