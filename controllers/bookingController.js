// controllers/bookingController.js
const Booking = require('../models/bookingModel');
const Package = require('../models/packageModel');

exports.createBooking = async (req, res) => {
  try {
    const { packageId, userId, pickupAddress, seats = 1 } = req.body;
    
    // Check if package exists and has enough seats
    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    // Check if enough seats are available
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
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
};
