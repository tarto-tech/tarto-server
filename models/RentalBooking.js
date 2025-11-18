const mongoose = require('mongoose');

const rentalBookingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  type: { type: String, default: 'rental' },
  vehicleId: { type: String, required: true },
  vehicleType: { type: String, required: true },
  vehicleTitle: { type: String, required: true },
  rentalDays: { type: Number, required: true },
  kmLimit: { type: Number, required: true },
  scheduledDate: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  pickupLocation: {
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'advance_required', 'advance_paid', 'completed'], 
    default: 'pending' 
  },
  driverId: { type: String, default: null },
  acceptedAt: { type: Date, default: null },
  advancePaidAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  advanceAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paymentDetails: {
    advancePaymentId: String,
    finalPaymentId: String,
    paymentMethod: String,
    paidAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.models.RentalBooking || mongoose.model('RentalBooking', rentalBookingSchema);