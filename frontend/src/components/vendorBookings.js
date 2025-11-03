import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VendorBookings = () => {
  const [bookings, setBookings] = useState([]);

  //This runs once when the component loads
  useEffect(() => {
    const fetchVendorBookings = async () => {
      const user = JSON.parse(localStorage.getItem('user')); // getting the logged in vendor
      if (!user || user.role !== 'vendor') return; // if the user is not vendor, do nothing

      try {
        // Fetching all bookings where vendorId === this vendor's ID
        const res = await axios.get(`http://localhost:5050/api/bookings/vendor/${user.id}`);
        setBookings(res.data); // Saving it in state
      } catch (err) {
        console.error('Error fetching vendor bookings:', err);
      }
    };
    fetchVendorBookings(); 
  }, []);

  // This will handle when the vendor clicks accept or reject 
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      // using PUT request to update status of current booking
      await axios.put(`http://localhost:5050/api/bookings/${bookingId}/status`, {
        status: newStatus,
      });

      // Updating the UI to reflect new status immediately
      setBookings(bookings.map((b) =>
        b._id === bookingId ? { ...b, status: newStatus } : b
      ));
    } catch (err) {
      console.error('Error updating booking status:', err);
      alert('Could not update status. Try again.');
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">Vendor Bookings</h2>

      {/* If no bookings yet */}
      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        // this Display all bookings
        bookings.map((b) => (
          <div className="card mb-3" key={b._id}>
            <div className="card-body">
              <h5 className="card-title">{b.serviceId?.title}</h5>
              <p><strong>Customer:</strong> {b.customerId?.fullName}</p>
              <p><strong>Date:</strong> {new Date(b.eventDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {b.eventTime}</p>
              <p><strong>Notes:</strong> {b.notes || 'None'}</p>
              <p><strong>Status:</strong> <span className="badge bg-info">{b.status}</span></p>

              {/* Showing the accept/reject buttons only if booking is still pending */}
              {b.status === 'pending' && (
                <div className="mt-3">
                  <button
                    className="btn btn-success me-2"
                    onClick={() => handleStatusUpdate(b._id, 'accepted')}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleStatusUpdate(b._id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default VendorBookings;