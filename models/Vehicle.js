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
  // Add model field
  model: {
    type: String,
    enum: ['HATCHBACK', 'SEDAN', 'SUV', 'INNOVA', 'ERTIGA', 'CRYSTA', 'BUS'],
    default: 'SEDAN'
  },
  // Add AC availability field
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
      type: [Number], // [longitude, latitude]
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
  }
}, { timestamps: true });

// Create a geospatial index on the location field
vehicleSchema.index({ location: '2dsphere' });

// Add pre-save hook to ensure model and hasAC are always set
vehicleSchema.pre('save', function(next) {
  // Force set model if not present
  if (!this.model) {
    this.model = 'SEDAN';
    console.log('Setting default model: SEDAN');
  }
  
  // Force set hasAC if not present
  if (this.hasAC === undefined) {
    this.hasAC = true;
    console.log('Setting default hasAC: true');
  }
  
  console.log('Saving vehicle with model:', this.model, 'hasAC:', this.hasAC);
  next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;