const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true, // ✅ Creates an index automatically
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  addresses: [{
    id: String,
    name: String,
    address: String,
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    }
  }],
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male'
  },
  isRegistered: {
    type: Boolean,
    default: true
  },
  isLoggedIn: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ❌ REMOVE this line to prevent duplicate index warning
// userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema);
