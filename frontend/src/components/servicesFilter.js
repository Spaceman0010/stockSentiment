// client/src/components/ServiceFilter.js
import React, { useState } from 'react';

const ServiceFilter = ({ onApply }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSentiment, setMinSentiment] = useState('');
  const [sort, setSort] = useState('');

  const categories = ['music', 'catering', 'decor']; // Available service categories
  const sortOptions = [
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Preference Score: High to Low', value: 'prefscore-desc' },
    { label: 'Preference Score: Low to High', value: 'prefscore-asc' },
  ];

  const handleCheckboxChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleApply = () => {
    const filters = {
      category: selectedCategories.join(','),
      minPrice,
      maxPrice,
      minSentiment,
      sort
    };
    onApply(filters);
  };

  return (
    <div className="filter-bar" style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <h4>Filter Services</h4>

      {/* Category Checkboxes */}
      <div>
        {categories.map(cat => (
          <label key={cat} style={{ marginRight: '10px' }}>
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat)}
              onChange={() => handleCheckboxChange(cat)}
            />
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </label>
        ))}
      </div>

      {/* Price Range */}
      <div style={{ marginTop: '10px' }}>
        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      {/* Sentiment */}
      <div style={{ marginTop: '10px' }}>
        <input
          type="number"
          step="0.1"
          placeholder="Min Sentiment (e.g. 0.6)"
          value={minSentiment}
          onChange={(e) => setMinSentiment(e.target.value)}
        />
      </div>

      {/* Sort Dropdown */}
      <div style={{ marginTop: '10px' }}>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort By</option>
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Apply Button */}
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleApply}>Apply Filters</button>
      </div>
    </div>
  );
};

export default ServiceFilter;