const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
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
    enum: ['One Way', 'outstation'],
    default: 'One Way'
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
  isAvailable: {
    type: Boolean,
    default: true
  },
  driverBata: {
    type: Number,
    default: 0
  },
  dailyKilometer: {
    type: Number,
    default: 280
  }
}, { timestamps: true });

// Create geospatial index
vehicleSchema.index({ location: '2dsphere' });
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ isAvailable: 1 });
vehicleSchema.index({ model: 1 });

// Pre-save hook to ensure defaults
vehicleSchema.pre('save', function(next) {
  if (!this.model) {
    this.model = 'SEDAN';
  }
  if (this.hasAC === undefined) {
    this.hasAC = true;
  }
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);