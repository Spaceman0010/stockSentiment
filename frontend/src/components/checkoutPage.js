
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'; 

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  //Extracting data passed via location.state from ServiceDetails
  const {
    serviceTitle,
    vendorName,
    selectedTier,
    numberOfPeople,
    finalPrice,
    eventDate,
    eventTime,
    serviceId,
    customerId,
    vendorId,
    notes,
    servicePrice,
  } = location.state || {};

  const calculatedFinalPrice = finalPrice || servicePrice || 0;

  //This function sends booking to backend
  const handleConfirmBooking = async () => {
    try {
        const bookingData = {
        serviceId,
        customerId,
        vendorId,
        notes,
        eventDate,
        eventTime,
        selectedTier: selectedTier?.trim() || "standard",
        numberOfPeople: numberOfPeople || 1,
        finalPrice: calculatedFinalPrice || 0,
        };
    

      const res = await axios.post('http://localhost:5050/api/bookings', bookingData);
      console.log('✅ Booking Confirmed:', res.data);

      alert('Booking confirmed!');
      navigate('/mybookings');
    } catch (error) {
      console.error('❌ Booking failed:', error);
      alert('Something went wrong during confirmation.');
    }
  };

  return (
    <div className="container py-5">
      <div className="card mx-auto" style={{ maxWidth: '600px' }}>
        <div className="card-body">
          <h3>🧾 Checkout Page</h3>

          <h5 className="mt-4">📋 Booking Summary</h5>
          <p><strong>Service:</strong> {serviceTitle}</p>
          <p><strong>Vendor:</strong> {vendorName}</p>
          <p><strong>Tier:</strong> {selectedTier}</p>
          {numberOfPeople > 1 && (
            <p><strong>People:</strong> {numberOfPeople}</p>
          )}
          <p><strong>Total Price:</strong> £{calculatedFinalPrice}</p>
          <p><strong>Date:</strong> {eventDate}</p>
          <p><strong>Time:</strong> {eventTime}</p>

          <hr />

          <h5>💳 Payment Method</h5>
          <div className="form-check">
            <input className="form-check-input" type="radio" disabled />
            <label className="form-check-label">Credit/Debit Card (Coming Soon 🔒)</label>
          </div>
          <div className="form-check">
            <input className="form-check-input" type="radio" disabled />
            <label className="form-check-label">UPI / PayPal (Coming Soon 🔒)</label>
          </div>


          {/*Actual Booking Submission Button */}
          <button
            className="btn btn-success mt-2 w-100"
            onClick={handleConfirmBooking}
          >
            ✅ Confirm Payment 💰
          </button>

          <button
            className="btn btn-outline-secondary mt-2 w-100"
            onClick={() => navigate(-1)}
          >
            🔙 Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;