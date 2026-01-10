const { execSync } = require('child_process');

console.log('Creating MongoDB geospatial index...');

try {
  // Run the index creation script
  execSync('node scripts/createGeospatialIndex.js', { stdio: 'inherit' });
  console.log('✅ Index creation completed successfully');
} catch (error) {
  console.error('❌ Index creation failed:', error.message);
  process.exit(1);
}