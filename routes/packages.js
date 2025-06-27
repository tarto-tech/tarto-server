/ routes/packages.js
const express = require('express');
const router = express.Router();
const Package = require('../models/package');
const auth = require('../middleware/auth');
// At the top of routes/packages.js
const PackageBooking = require('../models/packageBooking');

// Get all packages or filter by address
router.get('/', async (req, res) => {
try {
const { lat, lng } = req.query;

let packages = [];

if (lat && lng) {
  // Convert lat/lng to numbers
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  // Search for packages within 30km radius
  packages = await Package.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude] // MongoDB uses [lng, lat] order
        },
        $maxDistance: 30000 // 30km in meters
      }
    }
  });
} else {
  // If no lat/lng provided, return all packages
  packages = await Package.find();
}

res.status(200).json({
  success: true,
  data: packages
});

} catch (error) {
console.error('Error fetching packages:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch packages',
error: error.message
});
}
});

// Get package by ID
router.get('/:id', async (req, res) => {
try {
const package = await Package.findById(req.params.id);

if (!package) {
  return res.status(404).json({
    success: false,
    message: 'Package not found'
  });
}

res.status(200).json({
  success: true,
  data: package
});
} catch (error) {
console.error('Error fetching package:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch package',
error: error.message
});
}
});

// Create a new package
router.post('/', async (req, res) => {
try {
const package = new Package(req.body);
await package.save();

res.status(201).json({
  success: true,
  data: package
});
} catch (error) {
console.error('Error creating package:', error);
res.status(400).json({
success: false,
message: 'Failed to create package',
error: error.message
});
}
});
// In routes/packages.js
// Get package bookings by user ID
router.get('/user/:userId', async (req, res) => {
try {
const { userId } = req.params;

const bookings = await PackageBooking.find({ userId })
  .sort({ createdAt: -1 });

res.status(200).json({
  success: true,
  data: bookings
});
} catch (error) {
console.error('Error fetching user package bookings:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch package bookings',
error: error.message
});
}
});

router.post('/book', async (req, res) => {
try {
console.log('Request body:', req.body);

const { packageId, userId, userName, userPhone, pickupAddress, seats = 1 } = req.body;

// Check if package exists
const package = await Package.findById(packageId);
if (!package) {
  return res.status(404).json({
    success: false,
    message: 'Package not found'
  });
}

// Check if enough seats are available
if (package.availableSeats != null && package.availableSeats < seats) {
  return res.status(400).json({
    success: false,
    message: `Only ${package.availableSeats} seats available`
  });
}

// Calculate total amount
const totalAmount = package.price * seats;

// Create booking
const booking = new PackageBooking({
  packageId,
  userId,
  userName,
  userPhone,
  pickupAddress,
  seats,
  totalAmount,
  status: 'confirmed'
});

await booking.save();

// Update available seats
if (package.availableSeats != null) {
  package.availableSeats -= seats;
  await package.save();
}

res.status(201).json({
  success: true,
  data: booking
});

}
catch (error) {
console.error('Error booking package:', error);
res.status(500).json({
success: false,
message: 'Failed to book package',
error: error.message
});
}
});
// Add these routes to your existing routes/packages.js file

// Update package
// Add this route to routes/packages.js before module.exports = router;

// Update package
router.put('/:id', async (req, res) => {
try {
console.log('Updating package ID:', req.params.id);
console.log('Update data:', req.body);

const updatedPackage = await Package.findByIdAndUpdate(
  req.params.id,
  req.body,
  { new: true, runValidators: true }
);

if (!updatedPackage) {
  return res.status(404).json({
    success: false,
    message: 'Package not found'
  });
}

res.status(200).json({
  success: true,
  data: updatedPackage
});
} catch (error) {
console.error('Error updating package:', error);
res.status(500).json({
success: false,
message: 'Failed to update package',
error: error.message
});
}
});

// Delete package
router.delete('/:id', async (req, res) => {
try {
const deletedPackage = await Package.findByIdAndDelete(req.params.id);

if (!deletedPackage) {
  return res.status(404).json({
    success: false,
    message: 'Package not found'
  });
}

res.status(200).json({
  success: true,
  message: 'Package deleted successfully'
});
} catch (error) {
console.error('Error deleting package:', error);
res.status(500).json({
success: false,
message: 'Failed to delete package',
error: error.message
});
}
});

module.exports = router;