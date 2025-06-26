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
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  imageUrl: {
    type: String,
    required: true
  },
  availableSeats: {
    type: Number,
    default: null // null means unlimited
  },
  destinations: [{
    name: String,
    description: String
  }],
  inclusions: [String],
  exclusions: [String],
  itinerary: [{
    day: Number,
    title: String,
    description: String,
    activities: [String]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['adventure', 'family', 'romantic', 'religious', 'beach', 'mountain', 'cultural'],
    default: 'family'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'difficult'],
    default: 'easy'
  }
}, {
  timestamps: true
});

const Package = mongoose.model('Package', packageSchema);
module.exports = Package;