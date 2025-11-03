import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || user.role !== 'customer') return;

      try {
        const res = await axios.get(`http://localhost:5050/api/bookings/customer/${user.id}`);
        console.log("✅Booking fetched: ", res.data);
        setBookings(res.data);
      } catch (err) {
        console.error('❌Error fetching bookings:', err);
      }
    };

    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await axios.delete(`http://localhost:5050/api/bookings/${bookingId}`);
      setBookings(bookings.filter((b) => b._id !== bookingId));
      alert("Booking cancelled.");
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert("Something went wrong. Try again.");
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">My Bookings</h2>

        {bookings.length === 0 ? (
        <div className="text-center mt-5">
            <img
            src="https://cdn.dribbble.com/users/1753953/screenshots/3818675/media/67b2d1be72540b73c3a6baf8f211c0f6.png"
            alt="No bookings"
            style={{ maxWidth: '250px', opacity: 0.6 }}
            />
            <h5 className="mt-3">📭 You have no bookings yet</h5>
            <p>Start exploring services and make your first booking!</p>
        </div>
        
      ) : (
        bookings.map((b) => (
          <div className="card mb-3" key={b._id}>
            <div className="card-body">
                <h5 className="card-title">{b.serviceId.title}</h5>
                <p><strong>Category:</strong> {b.serviceId.category}</p>
                <p><strong>Vendor:</strong> {b.vendorId.fullName}</p>
                <p><strong>Event Date:</strong> {new Date(b.eventDate).toLocaleDateString()}</p>
                <p><strong>Event Time:</strong> {b.eventTime}</p>
                <p><strong>Notes:</strong> {b.notes || 'No notes added'}</p>
                {/**changing status to color coded pill, currently it just shows blue background */}
                <span className={`badge ${b.status === 'accepted' ? 'bg-success': b.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                {b.status}
                </span>
              <button className="btn btn-danger btn-sm mt-2" onClick={() => handleCancel(b._id)}>Cancel Booking</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyBookings;