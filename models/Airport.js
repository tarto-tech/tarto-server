const mongoose = require('mongoose');

const airportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 3,
    maxlength: 3
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Airport', airportSchema);