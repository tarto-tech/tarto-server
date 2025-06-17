// routes/resortRoutes.js
const express = require('express');
const router = express.Router();
const Resort = require('../models/ResortModel');

// Get all resorts
router.get('/', async (req, res) => {
  try {
    const resorts = await Resort.find();
    
    res.json({
      success: true,
      data: resorts
    });
  } catch (error) {
    console.error('Error fetching resorts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resorts'
    });
  }
});



// Get resort by ID
router.get('/:id', async (req, res) => {
  try {
    const resort = await Resort.findById(req.params.id);
    
    if (!resort) {
      return res.status(404).json({
        success: false,
        message: 'Resort not found'
      });
    }
    
    res.json({
      success: true,
      data: resort
    });
  } catch (error) {
    console.error('Error fetching resort:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resort'
    });
  }
});

// Create a new resort (admin only)
router.post('/', async (req, res) => {
  try {
    const resort = new Resort(req.body);
    await resort.save();
    
    res.status(201).json({
      success: true,
      data: resort
    });
  } catch (error) {
    console.error('Error creating resort:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create resort',
      error: error.message
    });
  }
});

module.exports = router;
