// routes/resorts.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Book a resort endpoint
router.post('/book', async (req, res) => {
  try {
    console.log('Booking request received:', req.body);
    
    // Get data from request
    const { resortId, checkInDate, checkOutDate, guests, totalPrice } = req.body;
    
    // Create a direct document in the resortbookings collection
    const result = await mongoose.connection.collection('resortbookings').insertOne({
      resortId,
      userId: req.body.userId || 'guest',
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      guests,
      totalPrice,
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Booking created with ID:', result.insertedId);
    
    // Return success response
    res.status(201).json({
      success: true,
      data: {
        _id: result.insertedId,
        resortId,
        checkInDate,
        checkOutDate,
        guests,
        totalPrice,
        status: 'confirmed',
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error booking resort:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book resort',
      error: error.message
    });
  }
});

module.exports = router;
