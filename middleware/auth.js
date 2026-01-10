const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');
const User = require('../models/userModel');
const { AppError } = require('./errorHandler');

// JWT Authentication middleware for drivers
const authenticateDriver = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'driver') {
      return next(new AppError('Access denied. Invalid token type.', 403));
    }

    const driver = await Driver.findById(decoded.driverId);
    if (!driver) {
      return next(new AppError('Driver not found.', 404));
    }

    req.driver = driver;
    req.driverId = decoded.driverId;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired.', 401));
    }
    next(error);
  }
};

// JWT Authentication middleware for users
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle both user and admin tokens
    if (decoded.userId) {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }
      req.user = { id: decoded.userId, isAdmin: false };
    } else if (decoded.type === 'admin') {
      req.user = { id: decoded.adminId, isAdmin: true };
    } else {
      return next(new AppError('Invalid token type.', 403));
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired.', 401));
    }
    next(error);
  }
};

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return next(new AppError('Admin access required.', 403));
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticateDriver, authenticateToken, requireAdmin };