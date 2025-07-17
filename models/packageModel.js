 // models/packageModel.js
const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
title: {
type: String,
required: [true, 'Package title is required'],
trim: true
},
description: {
type: String,
required: [true, 'Package description is required']
},
price: {
type: Number,
required: [true, 'Package price is required']
},
imageUrl: {
type: String,
required: [true, 'Package image URL is required']
},
places: {
type: [String],
default: []
},
amenities: {
type: Map,
of: String,
default: {}
},
duration: {
type: Number,
required: [true, 'Package duration is required']
},
availableLocations: {
type: [String],
default: []
},
location: {
type: {
type: String,
enum: ['Point'],
default: 'Point'
},
coordinates: {
type: [Number],
required: true
}
},
totalSeats: {
type: Number,
default: 30
},
availableSeats: {
type: Number,
default: 30
},
// Dynamic organizer field without defaults
organizer: {
name: String,
contact: String,
description: String
}
}, {
timestamps: true
});

// Add geospatial index for location-based queries
packageSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Package', packageSchema);