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
    enum: ['pending', 'processing', 'completed', 'failed', 'partial'],
    default: 'pending'
  },
  transactionId: String,
  amount: Number,
  advanceAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentId: String,
  paidAt: Date
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
  serviceCharge: { type: Number, default: 0 },
  driverAmount: { type: Number, default: 0 },
  additionalCharges: {
    driverAllowance: { type: Number, default: 0 },
    parkingCharges: { type: Number, default: 0 },
    waitingCharges: { type: Number, default: 0 }
  },
  totalPrice: { type: Number, required: true },
  payment: paymentSchema,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'confirmed', 'in_progress', 'started', 'completed', 'cancelled'],
    default: 'pending'
  },
  acceptedAt: Date,
  rejectedDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }],
  // Add this field to your schema
  type: {
    type: String,
    enum: ['city', 'outstation'],
    required: true
  },
   pickupDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String,
    required: true
  },
  returnDate: {
    type: Date,
  },
  isRoundTrip: { type: Boolean, default: false },
  isOutstationRide: { type: Boolean, default: false },
  userName: String,
  userPhone: String,
  vehicleName: String,
  fareBreakdown: {
    baseFare: Number,
    driverAllowance: { type: Number, default: 0 },
    tollCharges: { type: Number, default: 0 },
    taxes: Number
  },
  calculationValidated: { type: Boolean, default: false },
  serverCalculatedAt: { type: Date, default: Date.now },
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


// Validation: returnDate required for round trips
bookingSchema.pre('save', function(next) {
  if (this.isRoundTrip && !this.returnDate) {
    return next(new Error('Return date is required for round trip bookings'));
  }
  if (this.isRoundTrip && this.returnDate && this.pickupDate && this.returnDate < this.pickupDate) {
    return next(new Error('Return date must be after pickup date'));
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
