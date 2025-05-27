const express = require('express');
const router = express.Router();
const Location = require('../models/LocationModel');

// Get all locations
router.get('/', async (req, res) => {
  try {
    const { isPopular } = req.query;
    
    const query = {};
    if (isPopular !== undefined) {
      query.isPopular = isPopular === 'true';
    }
    
    const locations = await Location.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations'
    });
  }
});

// Create new location
router.post('/', async (req, res) => {
  try {
    const { name, address, coordinates, isPopular } = req.body;
    
    if (!name || !address || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, address and valid coordinates [longitude, latitude]'
      });
    }
    
    const location = new Location({
      name,
      address,
      location: {
        type: 'Point',
        coordinates
      },
      isPopular: isPopular || false
    });
    
    const savedLocation = await location.save();
    
    res.status(201).json({
      success: true,
      data: savedLocation
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create location'
    });
  }
});

// Get location by ID
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location'
    });
  }
});

// Update location
router.put('/:id', async (req, res) => {
  try {
    const { name, address, coordinates, isPopular } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      updateData.location = {
        type: 'Point',
        coordinates
      };
    }
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
});

// Delete location
router.delete('/:id', async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete location'
    });
  }
});

// Search nearby locations
router.get('/nearby/:distance', async (req, res) => {
  try {
    const { lng, lat } = req.query;
    const distance = parseInt(req.params.distance) || 5000; // distance in meters, default 5km
    
    if (!lng || !lat) {
      return res.status(400).json({
        success: false,
        message: 'Please provide longitude (lng) and latitude (lat) query parameters'
      });
    }
    
    const locations = await Location.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: distance
        }
      }
    });
    
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error finding nearby locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find nearby locations'
    });
  }
});

module.exports = router;