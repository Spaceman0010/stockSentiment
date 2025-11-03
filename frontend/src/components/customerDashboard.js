import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CustomerDashboard = () => {
  // Local state to store stats 
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const user = JSON.parse(localStorage.getItem('user')); // this grabs the current logged-in user from localStorage

      if (!user || user.role !== 'customer') return; //checking the user role if its a customer or not if not then it stops right here

      try {
        const res = await axios.get(`http://localhost:5050/api/bookings/stats/customer/${user.id}`); // Making the api call to fetch booking stats for this current customer
        setStats(res.data); // Storing the stats in the state
      } catch (err) {
        console.error('Error fetching customer stats:', err); 
      }
    };
    fetchStats(); 
  }, []);

  // adding this extra while the customer stats are loading in
  if (!stats) return <div className="container py-5">Loading your dashboard...</div>;

  return (
    <div className="container py-5">
      <h2 className="mb-4">Customer Dashboard</h2>
      <div className="row">
        <div className="col-md-3">
          <div className="card bg-primary text-white text-center">
            <div className="card-body">
              <h5 className="card-title">Total Bookings</h5>
              <p className="card-stat-number">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-success mb-3 text-center">
            <div className="card-body">
              <h5 className="card-title">Accepted</h5>
              <p className="card-stat-number">{stats.accepted}</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-warning mb-3 text-center">
            <div className="card-body">
              <h5 className="card-title">Pending</h5>
              <p className="card-stat-number">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-danger mb-3 text-center">
            <div className="card-body">
              <h5 className="card-title">Rejected</h5>
              <p className="card-stat-number">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;