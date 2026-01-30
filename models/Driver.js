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
    type: { type: String, enum: ['auto', 'bike', 'car', 'hatchback', 'sedan', 'suv'] },
    number: { type: String },
    registrationNumber: { type: String },
    model: { type: String },
    color: { type: String }
  },
  
  documents: {
    aadhar: {
      frontUrl: { type: String },
      backUrl: { type: String },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    },
    license: {
      url: { type: String },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    },
    rc: {
      url: { type: String },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    },
    insurance: {
      url: { type: String },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    }
  },
  
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'approved', 'active', 'inactive', 'busy', 'rejected', 'suspended'] 
  },
  
  rejectionReason: { type: String },
  
  rating: { type: Number, default: 0 },
  totalTrips: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  
  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: false },
  
  fcmToken: { type: String, default: null },
  
  workLocations: [{
    name: String,
    city: String,
    lat: String,
    lng: String
  }],
  
  lastActiveAt: { type: Date }
}, { timestamps: true });

driverSchema.index({ currentLocation: '2dsphere' });

driverSchema.set('timestamps', true);

module.exports = mongoose.models.Driver || mongoose.model('Driver', driverSchema);