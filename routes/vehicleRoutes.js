const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');

// Helper function for handling MongoDB queries
const handleQuery = async (res, query, errorMessage) => {
  try {
    const results = await query;  
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error(errorMessage, error);
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// @desc    Get all vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isAvailable: true });
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles'
    });
  }
});


// @route   POST /api/vehicles
// @desc    Add a new vehicle
router.post('/', [
  check('title').notEmpty().withMessage('Title is required'),
  check('type').isIn(['One Way', 'outstation', 'luxury']).withMessage('Invalid type'),
  check('capacity').notEmpty(),
  check('model').isIn(['HATCHBACK', 'SEDAN', 'SUV', 'INNOVA', 'ERTIGA', 'CRYSTA', 'BUS']).withMessage('Invalid model'),
  check('hasAC').isBoolean().withMessage('AC availability must be boolean'),
  check('description').notEmpty(),
  check('basePrice').isNumeric(),
  check('pricePerKm').isNumeric(),
  check('location.type').equals('Point'),
  check('location.coordinates').isArray().withMessage('Coordinates must be an array'),
  check('location.coordinates.*').isFloat().withMessage('Each coordinate must be a number'),
  check('imageUrl').isURL().withMessage('Invalid image URL'),
  check('driverBata').optional().isNumeric().withMessage('Driver bata must be numeric')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    console.log('Received vehicle data:', req.body);
    
    // Ensure model and hasAC are explicitly set at the top level
    const vehicleData = {
      ...req.body,
      model: req.body.model || 'SEDAN',
      hasAC: req.body.hasAC !== undefined ? req.body.hasAC : true
    };
    
    // Handle legacy driverId field
    if (req.body.driverId !== undefined) {
      vehicleData.driverBata = req.body.driverId || 0;
      delete vehicleData.driverId;
    }
    
    console.log('Creating vehicle with data:', vehicleData);
    
    const newVehicle = new Vehicle(vehicleData);
    const savedVehicle = await newVehicle.save();

    console.log('Saved vehicle:', savedVehicle);

    res.status(201).json({
      success: true,
      data: savedVehicle
    });
  } catch (error) {
    console.error('Error adding new vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add new vehicle',
      error: error.message
    });
  }
});

// @route   GET /api/vehicles/all
// @desc    Get all vehicles including disabled ones
router.get('/all', async (req, res) => {
  try {
    // Create query based on type filter if provided
    const query = {};
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }
    // Don't filter by isAvailable to include all vehicles
    
    const vehicles = await Vehicle.find(query);
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error fetching all vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles'
    });
  }
});


// @route   POST /api/vehicles/:id/update
// @desc    Update vehicle details
router.post('/:id/update', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const updateData = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle'
    });
  }
});

// @route   PUT /api/vehicles/:id
// @desc    Admin: Update vehicle details
router.put('/:id', [
  check('title').optional().notEmpty().withMessage('Title cannot be empty'),
  check('type').optional().isIn(['One Way', 'outstation', 'luxury']).withMessage('Invalid type'),
  check('capacity').optional().isNumeric().withMessage('Capacity must be a number'),
  check('description').optional().notEmpty(),
  check('model').optional().isIn(['HATCHBACK', 'SEDAN', 'SUV', 'INNOVA', 'ERTIGA', 'CRYSTA', 'BUS']).withMessage('Invalid model'),
  check('hasAC').optional().isBoolean().withMessage('AC availability must be boolean'),
  check('basePrice').optional().isNumeric().withMessage('Base price must be numeric'),
  check('pricePerKm').optional().isNumeric().withMessage('Price per km must be numeric'),
  check('location.type').optional().equals('Point'),
  check('location.coordinates').optional().isArray(),
  check('location.coordinates.*').optional().isFloat(),
  check('imageUrl').optional().isURL().withMessage('Invalid image URL'),
  check('isAvailable').optional().isBoolean().withMessage('Availability must be boolean'),
  check('driverBata').optional().isNumeric().withMessage('Driver bata must be numeric')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vehicle ID'
    });
  }

  try {
    const updateData = { ...req.body };
    
    // Handle legacy driverId field
    if (updateData.driverId !== undefined) {
      updateData.driverBata = updateData.driverId || 0;
      delete updateData.driverId;
    }
    
    const vehicle = await Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      error: error.message
    });
  }
});


// @route GET /api/vehicles/nearby
// @desc Get vehicles near location
 router.get('/nearby', [
  check('latitude').isFloat({ min: -90, max: 90 }),
  check('longitude').isFloat({ min: -180, max: 180 }),
  check('radius').isFloat({ min: 0 })
  ], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
  return res.status(400).json({
  success: false,
  errors: errors.array()
  });
  }
  
  const { latitude, longitude, radius, type } = req.query;
  const maxDistance = parseFloat(radius) || 5000; // Default 5km radius
  
  try {
  const query = {
  location: {
  $near: {
  $geometry: {
  type: "Point",
  coordinates: [parseFloat(longitude), parseFloat(latitude)]
  },
  $maxDistance: maxDistance
  }
  },
  isAvailable: true
  };
  
  if (type) {
    query.type = type.toLowerCase();
  }
  
  const vehicles = await Vehicle.find(query);
  res.json({
    success: true,
    data: vehicles
  });
  } catch (error) {
  console.error('Error fetching nearby vehicles:', error);
  res.status(500).json({
  success: false,
  message: 'Failed to fetch nearby vehicles'
  });
  }
  });

// @route   GET /api/vehicles/:id
// @desc    Get single vehicle details
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle details'
    });
  }
});

// @route   GET /api/vehicles/types/:type
// @desc    Get vehicles by type
router.get('/types/:type', async (req, res) => {
  const type = req.params.type.toLowerCase();
  const validTypes = ['One Way', 'outstation', 'luxury'];
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vehicle type'
    });
  }

  await handleQuery(
    res,
    Vehicle.find({ type, isAvailable: true }),
    'Error fetching vehicles by type'
  );
});

// @route   PUT /api/vehicles/:id/availability
// @desc    Update vehicle availability
router.put('/:id/availability', [
  check('isAvailable').isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { isAvailable: req.body.isAvailable },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle availability'
    });
  }
});

module.exports = router;