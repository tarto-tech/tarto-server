const mongoose = require('mongoose');

const resortBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resortId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resort',
    required: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    default: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      default: 'cash'
    },
    status: {
      type: String,
      default: 'pending'
    },
    amount: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ResortBooking = mongoose.model('ResortBooking', resortBookingSchema);
module.exports = ResortBooking;
