const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  agencyName: { type: String, required: true },
  panNumber: { type: String, required: true },
  address: { type: String },
  dateOfBirth: { type: Date },
  licenseNumber: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  profileImage: { type: String },
  
  vehicleDetails: {
    vehicleNumber: { type: String },
    vehicleType: { type: String },
    type: { type: String, enum: ['auto', 'bike', 'car'] },
    number: { type: String },
    registrationNumber: { type: String },
    model: { type: String },
    color: { type: String }
  },
  
  documents: {
    license: {
      number: { type: String },
      expiryDate: { type: Date },
      imageUrl: { type: String },
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
    },
    licenseNumber: { type: String },
    rc: {
      number: { type: String },
      imageUrl: { type: String },
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
    },
    insurance: {
      number: { type: String },
      expiryDate: { type: Date },
      imageUrl: { type: String },
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
    },
    aadhar: {
      number: { type: String },
      imageUrl: { type: String },
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
    }
  },
  
  status: { 
    type: String, 
    default: 'pending_verification', 
    enum: ['pending_verification', 'pending', 'approved', 'active', 'inactive', 'busy', 'rejected', 'suspended'] 
  },
  
  rating: { type: Number, default: 0 },
  totalTrips: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  
  location: {
    latitude: Number,
    longitude: Number
  },
  
  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: false },
  
  workLocations: [{
    name: String,
    city: String,
    lat: String,
    lng: String
  }],
  
  lastActiveAt: { type: Date }
}, { timestamps: true });

driverSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.models.Driver || mongoose.model('Driver', driverSchema);