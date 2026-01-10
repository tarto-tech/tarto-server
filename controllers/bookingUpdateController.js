const Booking = require('../models/BookingModel');
const { catchAsync } = require('../middleware/errorHandler');

// Utility function to recursively remove _id fields
const removeIds = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => removeIds(item));
  } else if (obj && typeof obj === 'object') {
    const { _id, ...objWithoutId } = obj;
    const cleaned = {};
    for (const [key, value] of Object.entries(objWithoutId)) {
      cleaned[key] = removeIds(value);
    }
    return cleaned;
  }
  return obj;
};

// PUT /api/bookings/:bookingId/stops - Update booking stops
exports.updateBookingStops = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const { stops } = req.body;
  
  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { stops, updatedAt: new Date() },
    { new: true }
  );
  
  if (!updatedBooking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }
  
  res.json({ success: true, data: updatedBooking });
});

// PUT /api/bookings/:bookingId/schedule - Update booking schedule
exports.updateBookingSchedule = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const { pickupDate, pickupTime, returnDate } = req.body;
  
  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { pickupDate, pickupTime, returnDate, updatedAt: new Date() },
    { new: true }
  );
  
  if (!updatedBooking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }
  
  res.json({ success: true, data: updatedBooking });
});

// PUT /api/bookings/:bookingId - General booking update
exports.updateBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  let updateData = { ...req.body, updatedAt: new Date() };
  
  // Remove _id fields to prevent conflicts
  updateData = removeIds(updateData);
  
  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    updateData,
    { new: true }
  );
  
  if (!updatedBooking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }
  
  res.json({ success: true, data: updatedBooking });
});