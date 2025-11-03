import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

//testing, definiing per-person based categories
const perPersonCategories = ['catering', 'venue'];

const ServiceDetails = () => {
    const { id } = useParams();
    const [service, setService] = useState(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [notes, setNotes] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    
    const [selectedTier, setSelectedTier] = useState('');
    const [finalPrice, setFinalPrice] = useState(0);
    const [numberOfPeople, setNumberOfPeople] = useState(1);
    const [showSummary, setShowSummary] = useState(false);

    // 🔽 For feedback submission
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || '{}'); // to identify if logged-in user is customer

    const navigate = useNavigate();

    useEffect(() => {
        const fetchService = async () => {
            try {
                const res = await axios.get(`http://localhost:5050/api/services/${id}`);
                setService(res.data);
            } catch (err) {
                console.error("Failed to fetch service details:", err);
            }
        };
        fetchService();
    }, [id]);

    //useEffect to recalculate price if number of people or tier changes
    useEffect(() => {
        if (!service) return;

        let price = 0;
        if (selectedTier){
        if (selectedTier === 'silver') price = service.silverPrice;
        if (selectedTier === 'gold') price = service.goldPrice;
        if (selectedTier === 'premium') price = service.premiumPrice;
        } else{
            price = service.price; //for flat rate services
        }

        setFinalPrice(
            perPersonCategories.includes(service.category)
                ? price * numberOfPeople
                : price
        );
    }, [numberOfPeople, selectedTier, service]);

    // This is the function that handles the booking submission
    const handleBooking = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Please log in to book this service.');
                return navigate('/login');
            }

                // Prevent proceeding without selecting a tier
                if (!selectedTier || selectedTier.trim() === "") {
                alert("Please select a package tier before booking.");
                return;
                }
            const finalBookingPrice = finalPrice && finalPrice > 0 ? finalPrice : service.price;
            const bookingData = {
                serviceId: service._id,
                customerId: user.id,
                vendorId: service.vendorId._id || service.vendorId, // handles both populated or raw
                notes,
                eventDate,
                eventTime,
                selectedTier,
                finalPrice: finalBookingPrice,
                numberOfPeople,
            };
            //adding console logs for debugging
            console.log("📊 Number of People Selected:", numberOfPeople);
            console.log("💸 Final Price Calculated:", finalPrice);
            console.log("📦 Tier Selected:", selectedTier);

            /* 
            const res = await axios.post('http://localhost:5050/api/bookings', bookingData);
            console.log('Booking Response:', res.data); //adding this for debugging
            alert('Booking placed successfully!');
            setShowBookingForm(false);
            setNotes('');
             */

            const priceToSend = finalPrice > 0 ? finalPrice : service.price || 0;
            navigate('/checkout', {
            state: {
                serviceTitle: service.title,
                vendorName: service.vendorId?.fullName || 'Vendor',
                selectedTier,
                numberOfPeople,
                finalPrice: priceToSend,
                servicePrice: service.price,
                eventDate,
                eventTime,
                serviceId: service._id,
                customerId: user.id,
                vendorId: service.vendorId._id || service.vendorId,
                notes
            }
            });


        } catch (err) {
            console.error("Booking failed:", err);
            alert('Something went wrong while booking.');
        }
    };

    // 🔽 Function to submit feedback to backend
    const handleFeedbackSubmit = async () => {
    try {
        const feedback = {
        serviceId: service._id,
        userId: user.id,
        rating,
        comment
        };

        await axios.post('http://localhost:5050/api/feedback', feedback);
        alert("✅ Feedback submitted!");
        setRating(0);
        setComment('');
    } catch (err) {
        console.error("❌ Failed to submit feedback:", err);
        alert("Something went wrong while submitting feedback.");
    }
    };

    if (!service) return <p className="text-center mt-5">Loading service details...</p>;

    return (
        <div className="container py-5">
            <div className="card mx-auto" style={{ maxWidth: '700px' }}>
                <img src={service.imageUrl} className="card-img-top" alt={service.title} />
                <div className="card-body">
                    <h2 className="card-title">{service.title}</h2>
                    <p className="card-text">{service.description}</p>
                    <p><strong>Category:</strong> {service.category}</p>
                    <p><strong>Price:</strong> £{service.price}</p>
                    <p><strong>Vendor:</strong> {service.vendorId?.fullName || 'Vendor'}</p>
                    <hr />

                    <h5>📦 What's Included</h5>
                    <p>{service.whatsIncluded || 'Not specified'}</p>

                    <h5>⏱️ Duration</h5>
                    <p>{service.duration || 'Not specified'}</p>

                    <h5>🔌 Equipment Provided</h5>
                    <p>{service.equipment || 'Not specified'}</p>

                    {/** ✅ Package Tier Dropdown */}
                    <div className="mb-3">
                        <label>🎖️ Select Package Tier</label>
                        <select
                            className="form-select"
                            value={selectedTier}
                            onChange={(e) => setSelectedTier(e.target.value)}
                            required
                        >
                            <option value=""> -- SELECT PACKAGE -- </option>
                            {/* Dynamically adding available tiers only */}
                            {service.silverPrice && <option value="silver">Silver</option>}
                            {service.goldPrice && <option value="gold">Gold</option>}
                            {service.premiumPrice && <option value="premium">Premium</option>}

                            {/* If no tiered prices exist, offer a default Standard package */}
                            {!service.silverPrice && !service.goldPrice && !service.premiumPrice && (
                            <option value="standard">Standard</option>
                            )}
                        </select>
                    </div>

                    {/** ✅ Per-person logic */}
                    {perPersonCategories.includes(service.category) && (
                        <div className="mb-3">
                            <label>👥 Number of People</label>
                            <input
                                type="number"
                                className="form-control"
                                value={numberOfPeople}
                                onChange={(e) => setNumberOfPeople(parseInt(e.target.value))}
                                min="1"
                                placeholder="e.g., 50"
                                required
                            />
                        </div>
                    )}

                    {/**testing tiered packages from customer's view */}
                    <h5>🎖️ Tiered Packages</h5>

                    <p><strong>🥈 Silver Package:</strong> {service.silverPackage} – £{service.silverPrice || 'N/A'}</p>
                    <p><strong>🥇 Gold Package:</strong> {service.goldPackage} – £{service.goldPrice || 'N/A'}</p>
                    <p><strong>🏆 Premium Package:</strong> {service.premiumPackage} – £{service.premiumPrice || 'N/A'}</p>

                    {service.extraNotes && (
                        <>
                            <h5>🗒️ Extra Notes</h5>
                            <p>{service.extraNotes}</p>
                        </>
                    )}

                    <button onClick={() => setShowBookingForm(!showBookingForm)} className="btn btn-primary mt-3">
                        {showBookingForm ? 'Cancel' : 'Book Now'}
                    </button>

                    {showBookingForm && (
                        <div className="mt-3">
                            <textarea className="form-control" rows="3" placeholder="Add notes (optional)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            ></textarea>

                            <input type="date"
                                className="form-control mt-2"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                            />
                            <input type="time"
                                className="form-control mt-2"
                                value={eventTime}
                                onChange={(e) => setEventTime(e.target.value)}
                            />
                            {/**<button onClick={handleBooking} className="btn btn-success mt-2">Confirm Booking</button>*/}
                            {!showSummary ? (
                            <button
                                onClick={() => setShowSummary(true)}
                                className="btn btn-success mt-2"
                            >
                                Continue to Summary
                            </button>
                            ) : (
                            <div className="mt-3 border rounded p-3">
                                <h5>📋 Booking Summary</h5>
                                <p><strong>Service:</strong> {service.title}</p>
                                <p><strong>Vendor:</strong> {service.vendorId?.fullName || 'Vendor'}</p>
                                <p><strong>Tier:</strong> {selectedTier}</p>
                                {perPersonCategories.includes(service.category) && (
                                <p><strong>People:</strong> {numberOfPeople}</p>
                                )}
                                <p><strong>Total Price:</strong> £{finalPrice>0?finalPrice:service.price}</p>
                                <p><strong>Date:</strong> {eventDate}</p>
                                <p><strong>Time:</strong> {eventTime}</p>
                                <button onClick={handleBooking} className="btn btn-primary w-100 mt-2">
                                ✅ Confirm & Book
                                </button>
                                <button
                                onClick={() => setShowSummary(false)}
                                className="btn btn-outline-secondary w-100 mt-2"
                                >
                                ⬅️ Go Back
                                </button>
                            </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 🔽 Feedback Form (only visible to customers) */}
            {user?.role === 'customer' && (
            <div className="mt-5 border-top pt-4">
                <h4>💬 Leave Feedback</h4>
                <div className="mb-2">
                <label>Rating (1 to 5):</label>
                <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setRating(isNaN(value) ? 0 : value);
                    }}
                />
                </div>
                <div className="mb-3">
                <label>Your Comments:</label>
                <textarea
                    className="form-control"
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write about your experience..."
                ></textarea>
                </div>
                <button className="btn btn-success" onClick={handleFeedbackSubmit}>Submit Feedback</button>
            </div>
            )}

        </div>
    );
};

export default ServiceDetails;