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
    required: true,
    min: 0
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
    default: 2,
    min: 1
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  category: {
    type: String,
    enum: ['luxury', 'budget', 'mid-range', 'boutique'],
    default: 'mid-range'
  }
}, {
  timestamps: true
});

// Create geospatial index
resortSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Resort', resortSchema);