const express = require('express');
const router = express.Router();
const BannerService = require('../models/BannermodelService');

// GET all service banners
router.get('/', async (req, res) => {
  try {
    const services = await BannerService.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
