const mongoose = require('mongoose');

function sanitizeQuery(query) {
  const allowedStatuses = ['pending', 'accepted', 'completed', 'cancelled', 'all'];
  return {
    status: allowedStatuses.includes(query.status) ? query.status : undefined
  };
}

function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

module.exports = { sanitizeQuery, validateObjectId };