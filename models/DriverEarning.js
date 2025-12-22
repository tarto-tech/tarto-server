const mongoose = require('mongoose');

const driverEarningSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  tripType: { type: String },
  amount: { type: Number, required: true },
  earningType: { type: String, enum: ['trip_earning', 'advance_payment', 'bonus', 'adjustment'], default: 'trip_earning' },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  transactionDate: { type: Date, default: Date.now },
  tripDetails: {
    source: String,
    destination: String,
    distance: Number,
    customerName: String,
    vehicleType: String
  }
}, { timestamps: true });

module.exports = mongoose.model('DriverEarning', driverEarningSchema);
