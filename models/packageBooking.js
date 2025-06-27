// models/packageBooking.js
const mongoose = require('mongoose');

const packageBookingSchema = new mongoose.Schema({
packageId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Package',
required: true
},
userId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true
},
userName: {
type: String,
required: true
},
userPhone: {
type: String,
required: true
},
pickupAddress: {
type: String,
required: true
},
seats: {
type: Number,
default: 1,
min: 1
},
totalAmount: {
type: Number,
required: true
},
status: {
type: String,
enum: ['pending', 'confirmed', 'cancelled', 'completed'],
default: 'pending'
}
}, {
timestamps: true
});

module.exports = mongoose.model('PackageBooking', packageBookingSchema);