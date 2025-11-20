const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  vehicleType: { type: String },
  vehicleNumber: { type: String },
  licenseNumber: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  earnings: {
    today: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.models.Driver || mongoose.model('Driver', driverSchema);