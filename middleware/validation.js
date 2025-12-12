const validator = require('validator');

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
};

const validatePaymentData = (req, res, next) => {
  const { amount, paymentId, paymentMethod } = req.body;
  
  if (!amount || !paymentId || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Missing payment details' });
  }
  
  if (!validator.isNumeric(amount.toString()) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }
  
  if (!validator.isAlphanumeric(paymentId.replace(/[-_]/g, ''))) {
    return res.status(400).json({ success: false, message: 'Invalid payment ID' });
  }
  
  if (!['upi', 'card', 'cash'].includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  }
  
  next();
};

const validateBookingData = (req, res, next) => {
  const { userId, source, stops, vehicleId } = req.body;
  
  if (!userId || !source || !stops || !vehicleId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  if (!validator.isMongoId(userId) || !validator.isMongoId(vehicleId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  
  if (!Array.isArray(stops) || stops.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid stops data' });
  }
  
  // Sanitize string inputs
  req.body.source = sanitizeInput(source);
  if (req.body.userName) req.body.userName = sanitizeInput(req.body.userName);
  if (req.body.vehicleName) req.body.vehicleName = sanitizeInput(req.body.vehicleName);
  
  next();
};

const handleValidationError = (error, req, res, next) => {
  console.error('Validation error:', error.message);
  res.status(400).json({ 
    success: false, 
    message: 'Invalid request data' 
  });
};

module.exports = {
  validatePaymentData,
  validateBookingData,
  handleValidationError,
  sanitizeInput
};