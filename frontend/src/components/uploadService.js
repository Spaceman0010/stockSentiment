import React, { useState } from "react";
import axios from "axios";

const UploadService = () => {
  const [formData, setFormData] = useState({
    vendorId: '',  // will update this dynamically later
    title: '',
    category: '',
    description: '',
    price: '',
    imageUrl: '',
    vendorName: '',
    whatsIncluded: '',
    duration: '',
    equipment: '',
    extraNotes: '',
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    //Get the logged-in vendor from localStorage
    const user = JSON.parse(localStorage.getItem('user'));

    //making a copy of the form data and adding the logged in vendors ID to it
    const submissionData = {
      ...formData,
      vendorId: user.id, 
    };

    try {
      const response = await axios.post(
        'http://localhost:5050/api/services/upload',
        submissionData
      );
      setMessage("✅ Service uploaded successfully!👌");
      console.log(response.data);
    } catch (error) {
      console.error('Upload error', error);
      setMessage("❌ Upload failed.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Upload a new service</h2>
      <form onSubmit={handleSubmit} className="card p-4 shadow" style={{ maxWidth: '600px' }}>
       {/** <input type="text" name="vendorName" value={formData.vendorName} onChange={handleChange} className="form-control" placeholder="Enter your full name"/> */}
        <input name="title" className="form-control mb-3" placeholder="Service Title" value={formData.title} onChange={handleChange} required />
        <select name="category" className="form-select mb-3" value={formData.category} onChange={handleChange}>
          <option value=""> -- SELECT CATEGORY -- </option>
          <option value="catering">Catering</option>
          <option value="decor">Decor</option>
          <option value="venue">Venue</option>
          <option value="photography">Photography</option>
          <option value="music">Music</option>
          <option value="others">Others</option>
        </select>

        {/** Form is breaking, making some changes.
        <textarea name="description" className="form-control mb-3" placeholder="Service Description" value={formData.description} onChange={handleChange} required />
        */}
        {/**adding a new description form, kinda a standerdised version */}
          <div className="mb-3">
          <label>📝 What’s Included</label>
          <textarea
            name="whatsIncluded"
            className="form-control"
            placeholder="e.g., Buffet with 3 starters and 2 main dishes, DJ services with audio equipment etc."
            value={formData.whatsIncluded}
            onChange={handleChange}
          />
        </div>

        {/** testing tiered packages */}
        <hr />
        <h5>🎖️ Tiered Packages</h5>

        <div className="mb-3">
          <label>🥈 Silver Package</label>
          <textarea
            name="silverPackage"
            className="form-control"
            placeholder="e.g., Basic setup, limited hours, 1 staff member"
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label>🥈 Silver Package Price</label>
            <input
            type="number"
            name="silverPrice"
            className="form-control"
            placeholder="e.g., 40"
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label>🥇 Gold Package</label>
            <textarea
              name="goldPackage"
              className="form-control"
              placeholder="e.g., Extended hours, 2 staff, moderate options"
              onChange={handleChange}
            />
        </div>

        <div className="mb-3">
        <label>🥇 Gold Package Price</label>
          <input
            type="number"
            name="goldPrice"
            className="form-control"
            placeholder="e.g., 60"
            onChange={handleChange}
          />
      </div>

        <div className="mb-3">
          <label>🏆 Premium Package</label>
          <textarea
            name="premiumPackage"
            className="form-control"
            placeholder="e.g., Full-day service, full team, VIP features"
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label>🏆 Premium Package Price</label>
            <input
              type="number"
              name="premiumPrice"
              className="form-control"
              placeholder="e.g., 100"
              onChange={handleChange}
            />
        </div>

        <div className="mb-3">
          <label>⏱️ Duration</label>
          <input
            type="text"
            name="duration"
            className="form-control"
            placeholder="e.g., 4 hours, full day"
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label>🔌 Equipment Provided</label>
          <textarea
            name="equipment"
            className="form-control"
            placeholder="e.g., Tables, microphones, lighting, DJ deck"
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label>🗒️ Extra Notes (optional)</label>
          <textarea
            name="extraNotes"
            className="form-control"
            placeholder="e.g., Setup included, travel charges may apply"
            onChange={handleChange}
          />
        </div>

      
        <input type="number" name="price" className="form-control mb-3" placeholder="Price" value={formData.price} onChange={handleChange} required /> 
        

        <input name="imageUrl" className="form-control mb-3" placeholder="Image URL" value={formData.imageUrl} onChange={handleChange} />

        <button type="submit" className="btn btn-primary">Upload Service</button>

        {message && <div className="alert alert-info mt-3 text-center">{message}</div>}
      </form>
    </div>
  );
};

export default UploadService;