// homeVehicleRoutes.js

const express = require('express');
const router = express.Router();
const HomeVehicle = require('../models/HomeVehicle');
const mongoose = require('mongoose');

// @desc    Get all home vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await HomeVehicle.find({ isAvailable: true });
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error fetching home vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home vehicles'
    });
  }
});

// @desc    Get home vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const vehicle = await HomeVehicle.findById(req.params.id);
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
    console.error('Error fetching home vehicle details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home vehicle details'
    });
  }
});

// @desc    Add a new home vehicle (admin only)
router.post('/', async (req, res) => {
  try {
    const newVehicle = new HomeVehicle(req.body);
    const savedVehicle = await newVehicle.save();

    res.status(201).json({
      success: true,
      data: savedVehicle
    });
  } catch (error) {
    console.error('Error adding new home vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add new home vehicle'
    });
  }
});

module.exports = router;
