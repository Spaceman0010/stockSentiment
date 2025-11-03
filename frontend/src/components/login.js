import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({onLogin}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'customer'
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent form reload

    try {
      const res = await axios.post('http://localhost:5050/api/login', formData);
      console.log(res.data); // debug in browser console
      setMessage('Login successful!');

      // ✅ Store user in localStorage to persist login session
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin && onLogin(res.data.user); // this sets the use state in app
    

      // redirect to dashboard after login(extra step)
        const role = res.data.user.role;
        console.log('User role is:', role); // making sure correct role is posted

        if (role === 'customer') {
          navigate('/customer');
        } else if (role === 'vendor') {
          navigate('/vendor');
        } else {
          navigate('/'); // default fallback if something goes wrong
        }

    } catch (err) {
      console.error(err);
     // setMessage('Invalid credentials'); 
     //updating the error response to show exactly what role user is registered as, if they try to login as vendor if they are customer it will throw error and show that you are customer
      const serverMsg = err.response?.data?.message || "Invalid Credentials";
      setMessage(serverMsg); //this will show backend's response on login form
     
    }
  };

  return (
    <div className="static-gradient text-dark py-5">
      <div className="container mt-5">
      <div className="container text-center">
        <div className="overlay-box mx-auto" style={{ maxWidth: '500px' }}>
          <h2 className="mb-4">Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <select
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="customer">customer</option>
                <option value="vendor">vendor</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-100">Login</button>
          </form>

          {/* Message area */}
          {message && (
            <div className="alert alert-info mt-3">{message}</div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;