const Booking = require('../models/BookingModel');
const { catchAsync } = require('../middleware/errorHandler');
const logger = require('../config/logger');

exports.createBooking = catchAsync(async (req, res) => {
  const { packageId, userId, pickupAddress, seats = 1 } = req.body;
  
  // Validate required fields
  if (!packageId || !userId || !pickupAddress) {
    return res.status(400).json({
      success: false,
      message: 'Package ID, User ID, and pickup address are required'
    });
  }
  
  // Check if package exists
  const Package = require('../models/packageModel');
  const package = await Package.findById(packageId);
  if (!package) {
    return res.status(404).json({
      success: false,
      message: 'Package not found'
    });
  }
  
  // Check seat availability
  if (package.availableSeats < seats) {
    return res.status(400).json({
      success: false,
      message: `Only ${package.availableSeats} seats available`
    });
  }
  
  // Create booking
  const booking = await Booking.create({
    package: packageId,
    user: userId,
    pickupAddress,
    seats,
    totalAmount: package.price * seats,
    status: 'confirmed'
  });
  
  // Update available seats
  package.availableSeats -= seats;
  await package.save();
  
  res.status(201).json({
    success: true,
    data: booking
  });
});
