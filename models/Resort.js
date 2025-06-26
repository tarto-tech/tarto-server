//models//Resort.js
const mongoose = require('mongoose');

const resortSchema = new mongoose.Schema({
  name: {
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
  amenities: [{
    type: String
  }],
  maxGuests: {
    type: Number,
    default: 2
  },
  location: {
    address: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

resortSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Resort', resortSchema);
