const mongoose = require('mongoose');

// Simple schema to prevent errors
const packageSchema = new mongoose.Schema({
  title: String
}, { timestamps: true });

const Package = mongoose.model('Package', packageSchema);
module.exports = Package;