
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import axios from "axios";
import Login from './components/login';

//import ViewServices from "./components/viewServices";

import UploadService from './components/uploadService';
import ServicesList from "./components/servicesList";
import ServiceDetails from "./components/serviceDetails";
import MyBookings from './components/myBookings';
import VendorBookings from './components/vendorBookings';
import CustomerDashboard from "./components/customerDashboard";
import VendorDashboard from "./components/vendorDashboard";
import CheckoutPage from "./components/checkoutPage";

const Home = () => (
  <div className="static-gradient text-dark py-5">
    <div className="container text-center">
      <div className="overlay-box mx-auto" style={{ maxWidth: '600px' }}>
        <h1 className="mb-4">EventNestAI</h1>
        <p className="mb-4">Effortless event planning powered by AI : book vendors, compare services, and manage bookings in one place.</p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/login"><button className="btn btn-primary">Login</button></Link>
          <Link to="/register"><button className="btn btn-outline-secondary">Register</button></Link>
        </div>
      </div>
    </div>
  </div>
);



//export default Login;

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'customer',
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5050/api/register', formData);
      setMessage(res.data.message);
    } catch (err) {
      console.error("registration error:", err);
      setMessage("Something went wrong.");
    }
  };

  return (
    <div className="static-gradient text-dark py-5">
    <div className="container mt-5">
      <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
        <h2 className="mb-3 text-center">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              name="fullName"
               value={formData.fullName}  // fixed reference
              onChange={handleChange}
              placeholder="Full Name"
              className="form-control"
            />
          </div>
          <div className="mb-3">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="form-control"
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="form-control"
            />
          </div>
          <div className="mb-3">
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select"
            >
              <option>customer</option>
              <option>vendor</option>
            </select>
          </div>
          <button type="submit" className="btn btn-success w-100">Register</button>
        </form>

        {message && (
          <div className="alert alert-info mt-3 text-center">{message}</div>
        )}
      </div>
    </div>
    </div>
  );
};

/*
const CustomerDashboard = () => {
  const navigate = useNavigate(); // change pages

  const handleLogout = () => {
    localStorage.removeItem('user'); // pretend "user" is their login session
    navigate('/'); // send user back to homepage
  };

  return (
    <div className="container mt-5">
      <div className="alert alert-info">
        <h4>Customer Dashboard</h4>
        <p>View and manage your bookings here.</p>
        <button onClick={handleLogout} className="btn btn-danger mt-3">
          Logout
        </button>
      </div>
    </div>
  );
};
*/

/*
const VendorDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user'); // clear vendor "session"
    navigate('/'); // send vendor back to homepage
  };

  return (
    <div className="container mt-5">
      <div className="alert alert-warning">
        <h4>Vendor Dashboard</h4>
        <p>Manage your services, availability, and received bookings.</p>
        <button onClick={handleLogout} className="btn btn-danger mt-3">
          Logout
        </button>
      </div>
    </div>
  );
};
*/

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);  // get currently logged in user
  return (
    <Router>
      <div>
        <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm sticky-navbar">
          <div className="container">
            <Link className="navbar-brand fw-bold" to="/">EventNest</Link>
            <div className="collapse navbar-collapse">
              <ul className="navbar-nav ms-auto">
                {!user && (
                  <>
                    <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/register">Register</Link></li>
                  </>
                )}

                {user?.role === 'customer' && (
                  <>
                    <li className="nav-item"><Link className="nav-link" to="/services">Browse Services</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/my-bookings">My Bookings</Link></li>
                    <li className="nav-item">
                      <button className="btn btn-link nav-link" onClick={() => {
                        localStorage.removeItem('user');
                        window.location.href = '/';
                      }}>Logout</button>
                    </li>
                  </>
                )}

                {user?.role === 'vendor' && (
                  <>
                    <li className="nav-item"><Link className="nav-link" to="/upload">Upload Service</Link></li>
                    {
                      //<li className="nav-item"><Link className="nav-link" to="/services">Browse Services</Link></li>
                    }
                    <li className="nav-item"><Link className="nav-link" to="/vendor-bookings">My Bookings</Link></li>
                    <li className="nav-item">
                      <button className="btn btn-link nav-link" onClick={() => {
                        localStorage.removeItem('user');
                        window.location.href = '/';
                      }}>Logout</button>
                    </li>
                  </>
                )}

              </ul>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/register" element={<Register />} />

          {/**checks whether the logged in user is customer or vendor and
           * redirects/routes them to their particular dashboard
           */}
          <Route path="/customer" element=
          {user?.role === 'customer' ? (<CustomerDashboard />) : (
          <Navigate to="/login" replace />)}/>

          <Route path="/vendor" element=
          {user?.role === 'vendor' ? (<VendorDashboard />) : (
          <Navigate to="/login" replace />)}/>

          <Route path="/upload" element={<UploadService />} />
          {
          //<Route path="/services" element={<ViewServices />} />//
      }     
          <Route path="/services" element={<ServicesList />} />
          <Route path="/services/:id" element={<ServiceDetails/>} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/vendor-bookings" element={<VendorBookings />} />
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/checkout" element={<CheckoutPage/>} />
        </Routes>
      </div>
    </Router>
  );
}