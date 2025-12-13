const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/send', async (req, res) => {
  try {
    const { identifier } = req.body;
    
    // Ensure phone number is in correct format for MSG91
    const phoneNumber = identifier.startsWith('91') ? identifier : `91${identifier}`;
    
    console.log('Sending OTP to:', phoneNumber);
    
    const response = await axios.post('https://control.msg91.com/api/v5/otp', {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: phoneNumber,
    }, {
      headers: {
        'authkey': process.env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('MSG91 Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('OTP Send Error:', error.response?.data || error.message);
    res.status(500).json({ 
      type: 'error',
      message: error.response?.data?.message || 'Failed to send OTP' 
    });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { reqId, otp } = req.body;
    
    const response = await axios.post('https://control.msg91.com/api/v5/otp/verify', {
      otp,
      reqId
    }, {
      headers: {
        'authkey': process.env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      type: 'error',
      message: 'Failed to verify OTP' 
    });
  }
});

module.exports = router;