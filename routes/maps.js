const express = require('express');
const axios = require('axios');
const router = express.Router();

// Google Maps Directions API proxy
router.post('/directions', async (req, res) => {
  try {
    const { origin, destination, waypoints } = req.body;
    
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}`;
    
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    
    url += `&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get directions' });
  }
});

module.exports = router;