const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

class IndexManager {
  constructor() {
    this.connection = null;
    this.indexes = [
      {
        collection: 'drivers',
        index: { location: '2dsphere' },
        options: { background: true, name: 'location_2dsphere' }
      },
      {
        collection: 'bookings',
        index: { pickupLocation: '2dsphere' },
        options: { background: true, name: 'pickup_location_2dsphere' }
      },
      {
        collection: 'bookings',
        index: { dropoffLocation: '2dsphere' },
        options: { background: true, name: 'dropoff_location_2dsphere' }
      },
      {
        collection: 'bookings',
        index: { userId: 1, createdAt: -1 },
        options: { background: true, name: 'user_bookings_idx' }
      },
      {
        collection: 'bookings',
        index: { driverId: 1, status: 1 },
        options: { background: true, name: 'driver_status_idx' }
      },
      {
        collection: 'drivers',
        index: { status: 1, isOnline: 1 },
        options: { background: true, name: 'driver_availability_idx' }
      },
      {
        collection: 'users',
        index: { phoneNumber: 1 },
        options: { unique: true, background: true, name: 'phone_unique_idx' }
      }
    ];
  }

  async connect() {
    try {
      this.connection = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ Connected to MongoDB: ${this.connection.connection.host}`);
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async createIndexes() {
    const results = [];
    
    for (const indexConfig of this.indexes) {
      try {
        const collection = this.connection.connection.db.collection(indexConfig.collection);
        
        // Check if index already exists
        const existingIndexes = await collection.indexes();
        const indexExists = existingIndexes.some(idx => idx.name === indexConfig.options.name);
        
        if (indexExists) {
          console.log(`⚠️  Index '${indexConfig.options.name}' already exists on ${indexConfig.collection}`);
          results.push({ collection: indexConfig.collection, status: 'exists', name: indexConfig.options.name });
          continue;
        }

        await collection.createIndex(indexConfig.index, indexConfig.options);
        console.log(`✅ Created index '${indexConfig.options.name}' on ${indexConfig.collection}`);
        results.push({ collection: indexConfig.collection, status: 'created', name: indexConfig.options.name });
        
      } catch (error) {
        console.error(`❌ Failed to create index on ${indexConfig.collection}:`, error.message);
        results.push({ collection: indexConfig.collection, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  async run() {
    const startTime = Date.now();
    console.log('🚀 Starting MongoDB index creation...');
    
    try {
      await this.connect();
      const results = await this.createIndexes();
      
      const summary = {
        total: results.length,
        created: results.filter(r => r.status === 'created').length,
        existing: results.filter(r => r.status === 'exists').length,
        failed: results.filter(r => r.status === 'failed').length
      };
      
      console.log('\n📊 Index Creation Summary:');
      console.log(`   Total indexes: ${summary.total}`);
      console.log(`   Created: ${summary.created}`);
      console.log(`   Already existed: ${summary.existing}`);
      console.log(`   Failed: ${summary.failed}`);
      
      if (summary.failed > 0) {
        console.log('\n❌ Failed indexes:');
        results.filter(r => r.status === 'failed').forEach(r => {
          console.log(`   - ${r.collection}: ${r.error}`);
        });
      }
      
      const duration = Date.now() - startTime;
      console.log(`\n⏱️  Completed in ${duration}ms`);
      
      return summary.failed === 0;
      
    } catch (error) {
      console.error('❌ Index creation process failed:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the index manager
if (require.main === module) {
  const indexManager = new IndexManager();
  
  indexManager.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = IndexManager;