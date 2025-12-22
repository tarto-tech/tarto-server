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

// POST create new service banner
router.post('/', async (req, res) => {
  try {
    const { title, imageUrl } = req.body;
    
    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Title and imageUrl are required' });
    }
    
    const service = new BannerService({ title, imageUrl });
    const savedService = await service.save();
    
    res.status(201).json({ success: true, data: savedService });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
