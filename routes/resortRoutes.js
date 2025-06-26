//routes//resortRoutes.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResortBookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, []);

  const fetchBookingDetails = async () => {
    try {
      const response = await axios.get(`/api/resorts/bookings/${id}`);
      setBooking(response.data.data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      await axios.patch(`/api/resorts/bookings/${id}/status`, { status });
      setBooking({ ...booking, status });
      alert(`Status updated to ${status.toUpperCase()}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!booking) return <div>Booking not found</div>;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <h1>Resort Booking Details</h1>
      <div>
        <h2>Booking #{booking._id.substring(0, 8)}</h2>
        <p>Status: {booking.status.toUpperCase()}</p>
        <p>Resort: {booking.resortId?.name}</p>
        <p>Check-in: {formatDate(booking.checkInDate)}</p>
        <p>Check-out: {formatDate(booking.checkOutDate)}</p>
        <p>Guests: {booking.guests}</p>
        <p>Total: ₹{booking.totalPrice}</p>
        
        <div>
          <h3>Update Status</h3>
          <button onClick={() => updateStatus('pending')} disabled={booking.status === 'pending'}>
            Pending
          </button>
          <button onClick={() => updateStatus('confirmed')} disabled={booking.status === 'confirmed'}>
            Confirm
          </button>
          <button onClick={() => updateStatus('completed')} disabled={booking.status === 'completed'}>
            Complete
          </button>
          <button onClick={() => updateStatus('cancelled')} disabled={booking.status === 'cancelled'}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResortBookingDetails;
