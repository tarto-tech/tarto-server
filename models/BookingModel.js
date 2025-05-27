//BookingModel.js
const mongoose = require('mongoose');
const geolib = require('geolib');

const locationSchema = new mongoose.Schema({
  name: String,
  address: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'upi', 'card'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  transactionId: String,
  amount: Number
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  source: locationSchema,
  destination: locationSchema,
  stops: [locationSchema],
  distance: { type: Number, required: true }, // in km
  duration: { type: Number, required: true }, // in minutes
  basePrice: { type: Number, required: true },
  additionalCharges: {
    driverAllowance: { type: Number, default: 0 },
    parkingCharges: { type: Number, default: 0 },
    waitingCharges: { type: Number, default: 0 }
  },
  totalPrice: { type: Number, required: true },
  payment: paymentSchema,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Add this field to your schema
  type: {
    type: String,
    enum: ['city', 'outstation'],
    required: true
  },
  cancellationReason: String,
  cancelledAt: Date,
  startedAt: Date,
  completedAt: Date
}, { timestamps: true });

// Add this pre-save hook to set the type based on distance if not provided
bookingSchema.pre('save', function(next) {
  if (!this.type) {
    this.type = this.distance > 100 ? 'outstation' : 'city';
  }
  next();
});


// Update total price when additional charges change
bookingSchema.pre('save', function(next) {
  this.totalPrice = this.basePrice + 
    this.additionalCharges.driverAllowance +
    this.additionalCharges.parkingCharges +
    this.additionalCharges.waitingCharges;
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
