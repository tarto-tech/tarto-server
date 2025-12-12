const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET not configured');
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const verifyOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.bookingId || req.params.id;
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }

      if (resource.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
};

const verifyUserAccess = (req, res, next) => {
  const requestedUserId = req.params.userId;
  
  if (requestedUserId !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  
  next();
};

module.exports = { authenticateToken, requireAdmin, verifyOwnership, verifyUserAccess };