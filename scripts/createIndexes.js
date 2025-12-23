const mongoose = require('mongoose');
require('dotenv').config();

async function createIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Driver earnings indexes
    await db.collection('driverearnings').createIndex({ "driverId": 1, "createdAt": -1 });
    console.log('Created index: driverearnings.driverId_1_createdAt_-1');

    // Driver indexes
    await db.collection('drivers').createIndex({ "totalEarnings": -1 });
    console.log('Created index: drivers.totalEarnings_-1');
    
    await db.collection('drivers').createIndex({ "phone": 1 });
    console.log('Created index: drivers.phone_1');

    // Booking indexes
    await db.collection('bookings').createIndex({ "driverId": 1, "completedAt": -1 });
    console.log('Created index: bookings.driverId_1_completedAt_-1');

    console.log('All indexes created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();