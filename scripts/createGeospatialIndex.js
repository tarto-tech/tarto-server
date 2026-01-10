const mongoose = require('mongoose');
const Driver = require('../models/Driver');
require('dotenv').config();

async function createGeospatialIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create 2dsphere index on location field
    await Driver.collection.createIndex({ location: '2dsphere' });
    console.log('✅ Geospatial index created on location field');

    // Verify the index exists
    const indexes = await Driver.collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.key));

    process.exit(0);
  } catch (error) {
    console.error('Error creating geospatial index:', error);
    process.exit(1);
  }
}

createGeospatialIndex();