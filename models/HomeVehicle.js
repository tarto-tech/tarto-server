// models/HomeVehicle.js

const mongoose = require('mongoose');

const homeVehicleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  capacity: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['city', 'outstation'],
    default: 'city'
  },
  model: {
    type: String,
    enum: ['HATCHBACK', 'SEDAN', 'SUV', 'INNOVA', 'ERTIGA', 'CRYSTA', 'BUS'],
    default: 'SEDAN'
  },
  hasAC: {
    type: Boolean,
    default: true
  },
  description: {
    type: String
  },
  basePrice: {
    type: Number,
    required: true
  },
  pricePerKm: {
    type: Number,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const HomeVehicle = mongoose.model('HomeVehicle', homeVehicleSchema);
module.exports = HomeVehicle;
