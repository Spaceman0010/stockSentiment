
import React from 'react';

const SmartFilters = ({ filters, setFilters }) => {
  // Update the filter state when user changes input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card p-3 mb-4">
      <h5 className="mb-3">🧠 Smart Filters</h5>

      {/* Minimum Preference Score Filter */}
      <div className="mb-2">
        <label className="form-label">🔥 Min Preference Score</label>
        <input
          type="number"
          name="minPrefScore"
          className="form-control"
          placeholder="e.g. 10"
          value={filters.minPrefScore}
          onChange={handleChange}
        />
      </div>

      {/*  Price Range Filter */}
      <div className="mb-2">
        <label className="form-label">💸 Max Price</label>
        <input
          type="number"
          name="maxPrice"
          className="form-control"
          placeholder="e.g. 500"
          value={filters.maxPrice}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default SmartFilters;