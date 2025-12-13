const express = require('express');
const router = express.Router();
const { calculateSecureFare } = require('../services/pricingService');
const rateLimit = require('express-rate-limit');

const pricingLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many pricing requests, try again later' }
});

// POST /api/pricing/calculate
router.post('/calculate', pricingLimit, (req, res) => {
  try {
    const { distance, vehicleType, vehicleId, isRoundTrip } = req.body;
    
    if (!distance || (!vehicleType && !vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Distance and vehicle type/ID are required'
      });
    }
    
    const vType = vehicleType || 'sedan';
    
    if (distance <= 0 || distance > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Distance must be between 1 and 2000 km'
      });
    }
    
    const pricing = calculateSecureFare(distance, vType, isRoundTrip || false);
    
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