const express = require('express');
const axios = require('axios');
const router = express.Router();

// POST /proxy/directions - Google Directions API proxy
router.post('/directions', async (req, res) => {
  try {
    const { origin, destination, waypoints } = req.body;
    
    const params = {
      origin,
      destination,
      key: process.env.GOOGLE_MAPS_API_KEY,
      units: 'metric'
    };
    
    if (waypoints) params.waypoints = waypoints;
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', { params });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Directions API failed' });
  }
});

// POST /proxy/places - Google Places API proxy
router.post('/places', async (req, res) => {
  try {
    const { input, location, radius } = req.body;
    
    const params = {
      input,
      key: process.env.GOOGLE_MAPS_API_KEY,
      types: 'establishment'
    };
    
    if (location) params.location = location;
    if (radius) params.radius = radius;
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', { params });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Places API failed' });
  }
});

// POST /proxy/geocoding - Google Geocoding API proxy
router.post('/geocoding', async (req, res) => {
  try {
    const { address, latlng } = req.body;
    
    const params = {
      key: process.env.GOOGLE_MAPS_API_KEY
    };
    
    if (address) params.address = address;
    if (latlng) params.latlng = latlng;
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', { params });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Geocoding API failed' });
  }
});

// POST /proxy/sms - MSG91 SMS API proxy
router.post('/sms', async (req, res) => {
  try {
    const { mobile, message, otp } = req.body;
    
    const response = await axios.post('https://api.msg91.com/api/v5/otp', {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile,
      authkey: process.env.MSG91_AUTH_KEY,
      otp
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'SMS API failed' });
  }
});

module.exports = router;