// routes/packages.js
const express = require('express');
const router = express.Router();
const Package = require('../models/package');

// Get all packages or filter by address
router.get('/', async (req, res) => {
  try {
    const { address } = req.query;
    
    let query = {};
    if (address) {
      // Search for packages available in the given location
      // This uses a text search on availableLocations
      query = { 
        $or: [
          { availableLocations: { $regex: new RegExp(address, 'i') } },
          // Add a fallback to return all packages if none match the location
          ...(await Package.countDocuments({ availableLocations: { $regex: new RegExp(address, 'i') } }) === 0 ? [{}] : [])
        ]
      };
    }
    
    const packages = await Package.find(query);
    
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

// Get package by ID
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

// Create a new package
router.post('/', async (req, res) => {
  try {
    const package = new Package(req.body);
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

// Book a package
router.post('/book', async (req, res) => {
  try {
    const { packageId, userId, pickupAddress, pickupDate, numberOfPeople } = req.body;
    
    // Create a booking record
    const booking = new Booking({
      packageId,
      userId,
      pickupAddress,
      pickupDate: pickupDate || new Date(),
      numberOfPeople: numberOfPeople || 1,
      status: 'confirmed'
    });
    
    await booking.save();
    
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error booking package:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to book package',
      error: error.message
    });
  }
});

module.exports = router;
