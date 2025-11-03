import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Chatbot from './chatBot';
import ServiceFilter from './servicesFilter';

const ServicesList = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get('http://localhost:5050/api/services');
        console.log("📦 All services fetched from backend:", res.data); // ✅ DEBUG
        setServices(res.data);
        setFilteredServices(res.data);
      } catch (err) {
        console.error('❌ Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // ✅ Handle filters sent from UI component
  const handleApplyFilters = async (filters) => {
    try {
      console.log("📤 Filters being applied:", filters); // ✅ DEBUG

      const query = new URLSearchParams();

        if (filters.category) {
        query.append('category', filters.category);
        }
      if (filters.minPrice) query.append('minPrice', filters.minPrice);
      if (filters.maxPrice) query.append('maxPrice', filters.maxPrice);
      if (filters.minSentiment) query.append('minSentiment', filters.minSentiment);
      if (filters.sort) query.append('sort', filters.sort);

      const url = `http://localhost:5050/api/services/filter?${query.toString()}`;
      console.log("🌐 Hitting filter API with URL:", url); // ✅ DEBUG

      const res = await axios.get(url);
      console.log("✅ Filtered results received:", res.data); // ✅ DEBUG

      setFilteredServices(res.data);
    } catch (err) {
      console.error('❌ Failed to apply filters:', err);
    }
  };

  const tabFiltered = filteredServices.filter((service) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Recommended') return service.preferenceScore > 0;
    return service.category.toLowerCase() === activeTab.toLowerCase();
  });

  if (activeTab === 'Recommended') {
    tabFiltered.sort((a, b) => b.preferenceScore - a.preferenceScore);
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Browse Services</h2>

      <div className="tabs-container mb-4 d-flex flex-wrap gap-2">
        {['All', 'Catering', 'Decor', 'Music', 'Recommended'].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ✅ Filter UI */}
      <ServiceFilter onApply={handleApplyFilters} />

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : tabFiltered.length === 0 ? (
        <div className="text-center mt-5">
          <img
            src="https://cdn.dribbble.com/users/2046015/screenshots/4350475/media/69d0a7d823b330663893fbd28be1b7c2.png"
            alt="No services found"
            style={{ maxWidth: '300px', opacity: 0.6 }}
          />
          <h5 className="mt-3">😔 No services found in this category</h5>
          <p>Try selecting a different tab or come back later!</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="row g-3">
              {tabFiltered.map((service) => (
                <motion.div
                  className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex"
                  key={service._id}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="card flex-fill h-100 shadow-sm">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{service.title}</h5>
                      <p><strong>Category:</strong> {service.category}</p>
                      <p><strong>Price:</strong> £{service.price}</p>
                      <p><strong>Description:</strong> {service.description}</p>
                      <p><strong>Times Booked:</strong> {service.bookingsCount || 0}</p>
                      <p><strong>🔥 Preference Score:</strong> {service.preferenceScore || 0}</p>
                      <a href={`/services/${service._id}`} className="btn btn-primary mt-auto">View Details</a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <Chatbot />
    </div>
  );
};

export default ServicesList;