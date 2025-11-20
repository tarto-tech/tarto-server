const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  vehicleDetails: {
    type: { type: String, required: true },
    registrationNumber: { type: String, required: true }
  },
  documents: {
    licenseNumber: { type: String, required: true }
  },
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'approved', 'active', 'inactive', 'rejected'] 
  },
  rating: { type: Number, default: 0 },
  totalTrips: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  location: {
    latitude: Number,
    longitude: Number
  }
}, { timestamps: true });

module.exports = mongoose.models.Driver || mongoose.model('Driver', driverSchema);