const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const mongoose = require('mongoose');

// Get all packages
router.get('/', async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages'
    });
  }
});

// Get package by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID'
      });
    }

    const package = await Package.findById(req.params.id);
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.json({
      success: true,
      data: package
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch package'
    });
  }
});

// Create new package
router.post('/', async (req, res) => {
  try {
    console.log('Creating package with data:', req.body);
    const newPackage = new Package(req.body);
    const savedPackage = await newPackage.save();

    res.status(201).json({
      success: true,
      data: savedPackage
    });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create package',
      error: error.message
    });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Package routes are working!' });
});

// Update package
router.put('/:id', async (req, res) => {
  try {
    console.log('=== PACKAGE UPDATE START ===');
    console.log('Package ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ObjectId format');
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID format'
      });
    }

    // Check if package exists first
    console.log('Checking if package exists...');
    const existingPackage = await Package.findById(req.params.id);
    console.log('Existing package:', existingPackage ? 'Found' : 'Not found');
    
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    console.log('Attempting to update package...');
    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    console.log('Package updated successfully');
    console.log('=== PACKAGE UPDATE END ===');

    res.json({
      success: true,
      data: updatedPackage
    });
  } catch (error) {
    console.error('=== PACKAGE UPDATE ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('=== ERROR END ===');
    
    res.status(500).json({
      success: false,
      message: 'Failed to update package',
      error: error.message,
      errorType: error.name
    });
  }
});

// Delete package
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID'
      });
    }

    const deletedPackage = await Package.findByIdAndDelete(req.params.id);

    if (!deletedPackage) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete package'
    });
  }
});

module.exports = router;