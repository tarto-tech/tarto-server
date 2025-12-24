const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');

// JWT Authentication middleware
const authenticateDriver = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'driver') {
      return res.status(403).json({ success: false, message: 'Access denied. Invalid token type.' });
    }

    const driver = await Driver.findById(decoded.driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    req.driver = driver;
    req.driverId = decoded.driverId;
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};

module.exports = { authenticateDriver };