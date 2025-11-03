import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VendorDashboard = () => {
  // State to store the stats we get from the backend
  const [stats, setStats] = useState({
    totalServices: 0,
    totalBookings: 0,
    accepted: 0,
    rejected: 0,
    pending: 0,
  });

  useEffect(() => {
    const fetchVendorStats = async () => {
      // Get the currently logged in user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      console.log("LOGGED IN USER:", user); //adding for debugging
      if (!user || user.role !== 'vendor') return; // If not a vendor, exit

      try {
        const res = await axios.get(`http://localhost:5050/api/bookings/vendors/${user.id}/dashboard`)
        setStats(res.data); // Store stats in state
      } catch (err) {
        console.error('❌ Error fetching vendor stats:', err);
      }
    };
    fetchVendorStats(); 
  }, []);

  return (
    <div className="container py-5">
      <h2 className="mb-4">Vendor Dashboard</h2>
      <div className="row g-4">

        <div className="col-md-3">
          <div className="p-4 bg-primary text-white rounded text-center">
            <h5>Total Services</h5>
            <p className="card-stat-number">{stats.totalServices}</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="p-4 bg-secondary text-white rounded text-center">
            <h5>Total Bookings</h5>
            <p className="card-stat-number">{stats.totalBookings}</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="p-4 bg-success text-white rounded text-center">
            <h5>Accepted</h5>
            <p className="card-stat-number">{stats.accepted}</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="p-4 bg-danger text-white rounded text-center">
            <h5>Rejected</h5>
            <p className="card-stat-number">{stats.rejected}</p>
          </div>
        </div>

        <div className="col-md-3">
            <div className="p-4 bg-warning text-dark rounded text-center">
                <h5>Pending</h5>
                <p className="card-stat-number">{stats.pending}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;