const mongoose = require('mongoose');

const driverOTPSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.models.DriverOTP || mongoose.model('DriverOTP', driverOTPSchema);