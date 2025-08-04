// routes/packages.js
const express = require('express');
const router = express.Router();
const Package = require('../models/packageModel');
const auth = require('../middleware/auth');
const PackageBooking = require('../models/packageBooking');

// GET all package bookings - MUST BE BEFORE /:id ROUTE
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await PackageBooking.find()
      .sort({ createdAt: -1 })
      .populate('packageId', 'title price imageUrl')
      .populate('userId', 'name phone');
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching package bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch package bookings',
      error: error.message
    });
  }
});

// GET bookings for a specific user - MUST BE BEFORE /:id ROUTE
router.get('/bookings/user/:userId', async (req, res) => {
  try {
    const bookings = await PackageBooking.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('packageId', 'title price imageUrl');
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching user package bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user package bookings',
      error: error.message
    });
  }
});

// PUT update package booking details
router.put('/bookings/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { pickupAddress, seats, totalAmount } = req.body;
    
    // Get the current booking to check original seat count
    const currentBooking = await PackageBooking.findById(bookingId);
    if (!currentBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Get the package to check available seats
    const package = await Package.findById(currentBooking.packageId);
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // Calculate the seat difference
    const seatDifference = seats - currentBooking.seats;
    
    // Check if enough seats are available
    if (package.availableSeats != null && seatDifference > 0) {
      if (seatDifference > package.availableSeats) {
        return res.status(400).json({ 
          success: false, 
          message: `Only ${package.availableSeats} additional seats available` 
        });
      }
      
      // Update package available seats
      await Package.findByIdAndUpdate(
        package._id,
        { $inc: { availableSeats: -seatDifference } }
      );
    } else if (seatDifference < 0) {
      // If reducing seats, add them back to available
      await Package.findByIdAndUpdate(
        package._id,
        { $inc: { availableSeats: Math.abs(seatDifference) } }
      );
    }
    
    // Always include totalAmount in the update
    let calculatedTotalAmount;
    
    // Calculate new total amount based on seats
    if (seats !== currentBooking.seats) {
      calculatedTotalAmount = package.price * seats;
      console.log(`Recalculating totalAmount: ${seats} seats * ${package.price} = ${calculatedTotalAmount}`);
    }
    
    // Use provided totalAmount if available, otherwise use calculated or current
    const finalTotalAmount = totalAmount || calculatedTotalAmount || currentBooking.totalAmount;
    
    // Create update data with totalAmount always included
    const updateData = { 
      pickupAddress, 
      seats, 
      totalAmount: finalTotalAmount 
    };
    
    console.log('Update data:', updateData);
    
    // Update the booking
    const updatedBooking = await PackageBooking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    );
    
    return res.status(200).json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error('Error updating package booking:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH update package booking status
router.patch('/bookings/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    const booking = await PackageBooking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
});

// Get all packages or filter by address
router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    let packages = [];

    if (lat && lng) {
      // Convert lat/lng to numbers
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      // Search for packages within 30km radius
      packages = await Package.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude] // MongoDB uses [lng, lat] order
            },
            $maxDistance: 30000 // 30km in meters
          }
        }
      });
    } else {
      // If no lat/lng provided, return all packages
      packages = await Package.find();
    }

    res.status(200).json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
      error: error.message
    });
  }
});

// Book a package
router.post('/book', async (req, res) => {
  try {
    console.log('Request body:', req.body);

    const { packageId, userId, userName, userPhone, pickupAddress, seats = 1, status = 'pending' } = req.body;

    // Check if package exists
    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Check if enough seats are available
    if (package.availableSeats != null && package.availableSeats < seats) {
      return res.status(400).json({
        success: false,
        message: `Only ${package.availableSeats} seats available`
      });
    }

    // Calculate total amount
    const totalAmount = package.price * seats;

    // Create booking
    const booking = new PackageBooking({
      packageId,
      userId,
      userName,
      userPhone,
      pickupAddress,
      seats,
      totalAmount,
      status: status
    });

    await booking.save();

    // Update available seats
    if (package.availableSeats != null) {
      package.availableSeats -= seats;
      await package.save();
    }

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error booking package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book package',
      error: error.message
    });
  }
});

// Create a new package
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      imageUrl,
      places,
      amenities,
      duration,
      availableLocations,
      location,
      totalSeats,
      availableSeats,
      organizer,
      startDate,
      endDate
    } = req.body;

    // Validate required fields including new date fields
    if (!title || !description || !price || !imageUrl || !duration || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, price, imageUrl, duration, startDate, endDate'
      });
    }

    // Validate that endDate is after startDate
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const package = new Package({
      title,
      description,
      price,
      imageUrl,
      places: places || [],
      amenities: amenities || {},
      duration,
      availableLocations: availableLocations || [],
      location,
      totalSeats: totalSeats || 30,
      availableSeats: availableSeats || totalSeats || 30,
      organizer,
      startDate,
      endDate
    });

    await package.save();

    res.status(201).json({
      success: true,
      data: package
    });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create package',
      error: error.message
    });
  }
});

// Update package
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating package ID:', req.params.id);
    console.log('Update data:', req.body);

    // Validate dates if both are provided
    if (req.body.startDate && req.body.endDate) {
      if (new Date(req.body.endDate) <= new Date(req.body.startDate)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedPackage
    });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update package',
      error: error.message
    });
  }
});

// Delete package
router.delete('/:id', async (req, res) => {
  try {
    const deletedPackage = await Package.findByIdAndDelete(req.params.id);

    if (!deletedPackage) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete package',
      error: error.message
    });
  }
});

// Get package by ID - MUST BE AFTER ALL SPECIFIC ROUTES
router.get('/:id', async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.status(200).json({
      success: true,
      data: package
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch package',
      error: error.message
    });
  }
});

module.exports = router;