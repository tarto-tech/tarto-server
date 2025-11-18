const mongoose = require('mongoose');

const airportBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingType: {
    type: String,
    enum: ['pickup', 'drop'],
    required: true
  },
  passengerName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  flightNumber: {
    type: String,
    required: true
  },
  airline: {
    type: String,
    required: true
  },
  pickupLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  dropLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'hatchback', 'luxury'],
    required: true
  },
  passengers: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  luggage: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'driver_accepted', 'payment_completed', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  driverId: {
    type: String,
    default: null
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'card'],
    default: null
  },
  paymentId: {
    type: String,
    default: null
  },
  advanceAmount: {
    type: Number,
    default: 0
  },
  specialRequests: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.AirportBooking || mongoose.model('AirportBooking', airportBookingSchema);