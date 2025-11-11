const express = require('express');
const router = express.Router();
const Airport = require('../models/Airport');

// GET all airports
router.get('/', async (req, res) => {
  try {
    const airports = await Airport.find({ active: true }).sort({ city: 1 });
    
    res.json({
      success: true,
      data: airports
    });
  } catch (error) {
    console.error('Error fetching airports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch airports'
    });
  }
});

// POST create airport (for admin)
router.post('/', async (req, res) => {
  try {
    const airport = new Airport(req.body);
    const savedAirport = await airport.save();
    
    res.status(201).json({
      success: true,
      data: savedAirport
    });
  } catch (error) {
    console.error('Error creating airport:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create airport'
    });
  }
});

// PUT update airport (for admin)
router.put('/:id', async (req, res) => {
  try {
    const airport = await Airport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!airport) {
      return res.status(404).json({
        success: false,
        message: 'Airport not found'
      });
    }
    
    res.json({
      success: true,
      data: airport
    });
  } catch (error) {
    console.error('Error updating airport:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update airport'
    });
  }
});

// DELETE airport (for admin)
router.delete('/:id', async (req, res) => {
  try {
    const airport = await Airport.findByIdAndDelete(req.params.id);
    
    if (!airport) {
      return res.status(404).json({
        success: false,
        message: 'Airport not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Airport deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting airport:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete airport'
    });
  }
});

module.exports = router;