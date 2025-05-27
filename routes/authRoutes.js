const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');


// In your config file or directly in your auth routes
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Use environment variable in production
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days


// Public routes
router.post('/profile', authController.createProfile);
router.get('/check-registration/:phone', authController.checkRegistration);

// Protected routes
router.get('/user', auth, authController.getUserData);
router.put('/login-status', auth, authController.updateLoginStatus);
router.post('/logout', auth, authController.logout);

module.exports = router;
