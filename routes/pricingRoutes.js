const express = require('express');
const router = express.Router();
const { calculateSecureFare } = require('../services/pricingService');

// POST /api/pricing/calculate
router.post('/calculate', (req, res) => {
  try {
    const { distance, vehicleType, isRoundTrip } = req.body;
    
    if (!distance || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Distance and vehicle type are required'
      });
    }
    
    const pricing = calculateSecureFare(distance, vehicleType, isRoundTrip || false);
    
    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate pricing'
    });
  }
});

module.exports = router;