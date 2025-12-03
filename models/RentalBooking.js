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
    enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending' 
  },
  driverId: { type: String, default: null },
  acceptedAt: { type: Date, default: null },
  advancePaidAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  basePrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  driverAmount: { type: Number, default: 0 },
  advanceAmount: { type: Number, default: 0 },
  advancePaid: { type: Boolean, default: false },
  paymentDetails: {
    advancePaymentId: String,
    finalPaymentId: String,
    paymentMethod: String,
    paidAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.models.RentalBooking || mongoose.model('RentalBooking', rentalBookingSchema);