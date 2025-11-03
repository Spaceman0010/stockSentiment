import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ViewServices = () => {
  const [services, setServices] = useState([]);

  // Loading services from backend when the component mounts
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get('http://localhost:5050/api/services');
        setServices(res.data);  // save in state
      } catch (error) {
        console.error('❌ Error fetching services:', error);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Available Vendor Services</h2>
      <div className="row">
        {services.map((service) => (
          <div className="col-md-4 mb-4" key={service._id}>
            <div className="card h-100 shadow-sm">
              <img
                src={service.imageUrl}
                className="card-img-top"
                alt={service.title}
                style={{ height: '200px', objectFit: 'cover' }}
              />
            <div className="card-body">
            <h5 className="card-title">{service.title}</h5>
                <p className="card-text">{service.description}</p>
                <p><strong>Price:</strong> ₹{service.price}</p>
                <p><strong>Category:</strong> {service.category}</p>
                <p><strong>Vendor:</strong> {service.vendorName || 'Not specified'}</p>

            <hr />
                <h6>🎖️ Tiered Packages</h6>
                    <p><strong>🥈 Silver:</strong> {service.silverPackage || 'Not specified'}</p>
                    <p><strong>🥇 Gold:</strong> {service.goldPackage || 'Not specified'}</p>
                    <p><strong>🏆 Premium:</strong> {service.premiumPackage || 'Not specified'}</p>

                <button className="btn btn-primary w-100">View Details</button>
            </div>
            </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ViewServices;