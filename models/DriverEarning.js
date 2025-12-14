const mongoose = require('mongoose');

const driverEarningSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  tripType: { type: String, enum: ['outstation', 'rental', 'airport'], required: true },
  amount: { type: Number, required: true },
  earningType: { type: String, enum: ['advance_payment', 'trip_completion', 'bonus', 'penalty'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
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
