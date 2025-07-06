const mongoose = require('mongoose');

const appVersionSchema = new mongoose.Schema({
  latestVersion: {
    type: String,
    required: true
  },
  minRequiredVersion: {
    type: String,
    required: true
  },
  forceUpdate: {
    type: Boolean,
    default: false
  },
  updateMessage: {
    type: String,
    required: true
  },
  updateUrl: {
    android: String,
    ios: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.AppVersion || mongoose.model('AppVersion', appVersionSchema, 'appversions');