const express = require('express');
const axios = require('axios');
const router = express.Router();

// MSG91 OTP proxy
router.post('/send', async (req, res) => {
  try {
    const { identifier } = req.body;

    const response = await axios.post('https://api.msg91.com/api/v5/otp', {
      identifier,
      template_id: process.env.MSG91_TEMPLATE_ID
    }, {
      headers: {
        'authkey': process.env.MSG91_AUTH_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { reqId, otp } = req.body;

    const response = await axios.post('https://api.msg91.com/api/v5/otp/verify', {
      otp,
      reqId
    }, {
      headers: {
        'authkey': process.env.MSG91_AUTH_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

module.exports = router;