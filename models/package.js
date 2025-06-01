// models/package.js
const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  places: [{
    type: String,
    required: true
  }],
  amenities: {
    type: Map,
    of: String
  },
  duration: {
    type: Number,
    required: true
  },
  availableLocations: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
   location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
}
}
);

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
