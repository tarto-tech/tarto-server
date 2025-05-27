const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
