const mongoose = require('mongoose');

const airportBookingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  type: { type: String, default: 'airport' },
  bookingType: { type: String, enum: ['to_airport', 'from_airport'], required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  vehicleId: { type: String, required: true },
  vehicleType: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  distance: { type: Number, required: true },
  scheduledDate: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'confirmed', 'in_progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'advance_required', 'advance_paid', 'completed'], 
    default: 'pending' 
  },
  airportDetails: {
    airportName: String,
    direction: String,
    location: String
  },
  pickupLocation: {
    name: String,
    latitude: Number,
    longitude: Number
  },
  dropLocation: {
    name: String,
    latitude: Number,
    longitude: Number
  },
  driverId: { type: String, default: null },
  acceptedAt: { type: Date, default: null },
  advancePaidAt: { type: Date, default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.AirportBookingNew || mongoose.model('AirportBookingNew', airportBookingSchema);