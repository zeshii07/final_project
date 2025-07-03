// src/components/pages/Checkout.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';

// Import loadStripe and Elements, but loadStripe call will be deferred
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
// Correct import path for StripePaymentForm
import StripePaymentForm from './StripePaymentForm'; // Assumes StripePaymentForm is directly under src/components/


function Checkout() {
    const { user, token, isLoggedIn } = useAuth();
    const { cartItems, loadingCart, cartError, fetchCart } = useCart();
    const navigate = useNavigate();

    const [newAddressDetails, setNewAddressDetails] = useState({
        fullName: user?.username || '',
        addressLine: '',
        city: '',
        country: 'Pakistan',
        phoneNumber: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(false); // General order processing loading
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [orderTotalAmount, setOrderTotalAmount] = useState(0);

    // Loading state for fetching client secret from backend
    const [loadingPaymentIntent, setLoadingPaymentIntent] = useState(false);

    // State for Stripe.js loading and instance
    const [stripePromiseInstance, setStripePromiseInstance] = useState(null);
    const [loadingStripeScript, setLoadingStripeScript] = useState(false);
    const [stripeScriptError, setStripeScriptError] = useState(null);

    // Ref to hold the confirmStripePayment function from the child component
    const confirmStripePaymentRef = useRef(null);

    // Callback function to receive the confirmStripePayment function from StripePaymentForm
    const setConfirmStripePaymentFn = useCallback((fn) => {
        confirmStripePaymentRef.current = fn;
    }, []);


    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login?redirect=/checkout');
            return;
        }
        fetchCart();
    }, [isLoggedIn, navigate, fetchCart]);

    // Re-added: Effect to conditionally load Stripe.js script
    useEffect(() => {
        if (paymentMethod === 'Online Payment' && !stripePromiseInstance && !loadingStripeScript) {
            setLoadingStripeScript(true);
            setStripeScriptError(null); // Clear previous script errors

            const loadStripeScript = async () => {
                try {
                    // Only load Stripe.js when online payment is chosen
                    // <<< IMPORTANT: Replace with YOUR ACTUAL Stripe Publishable Key! >>>
                    const stripe = await loadStripe('pk_test_51RZppTC1uH5TpKdXvBzMQ4H5NyXyT1EuYTSAr63puwfmHE3XPql1hngANGXxIqpSssUuFfkLZC7WXQazdQBqWUOr00t0VypC9p');
                    setStripePromiseInstance(stripe);
                } catch (err) {
                    console.error('Failed to load Stripe.js script:', err);
                    setStripeScriptError('Failed to load online payment script. Please check your internet connection and Stripe key.');
                } finally {
                    setLoadingStripeScript(false);
                }
            };
            loadStripeScript();
        } else if (paymentMethod !== 'Online Payment' && stripePromiseInstance) {
            // If method changes away from online, clear stripe instance
            setStripePromiseInstance(null);
            setStripeScriptError(null);
        }
    }, [paymentMethod, stripePromiseInstance, loadingStripeScript]); // Depend on paymentMethod and instance state


    // Effect to create Payment Intent when 'Online Payment' is selected and Stripe.js is loaded
    useEffect(() => {
        const createPaymentIntent = async () => {
            if (paymentMethod === 'Online Payment' && stripePromiseInstance && !loadingCart && cartItems.length > 0 && token) {
                setLoadingPaymentIntent(true);
                setError(null);
                setClientSecret(''); // Clear previous client secret
                try {
                    const response = await axios.post(
                        'http://localhost:5000/api/create-payment-intent',
                        {},
                        { headers: { 'x-auth-token': token } }
                    );
                    setClientSecret(response.data.clientSecret);
                    setOrderTotalAmount(response.data.totalAmount);
                    setSuccessMessage('Stripe payment details initialized.');
                } catch (err) {
                    console.error('Error creating Payment Intent:', err.response?.data || err);
                    setError(err.response?.data?.message || 'Failed to initialize online payment. Please try again.');
                    setClientSecret('');
                } finally {
                    setLoadingPaymentIntent(false);
                }
            } else if (paymentMethod !== 'Online Payment' && clientSecret) {
                setClientSecret('');
                setOrderTotalAmount(0);
            }
        };

        // Trigger payment intent creation only if cart is loaded and conditions met
        if (!loadingCart && cartItems.length > 0) {
            createPaymentIntent();
        }

        // FIX: Removed `clientSecret` from dependency array to prevent infinite loop.
        // It should only re-run if paymentMethod, stripePromiseInstance, loadingCart, cartItems, or token changes.
    }, [paymentMethod, stripePromiseInstance, loadingCart, cartItems, token]);


    const calculateCartTotal = useCallback(() => {
        const subtotal = (cartItems || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const shippingCost = 15.00;
        const taxRate = 0.05;
        const totalTax = subtotal * taxRate;
        return (subtotal + shippingCost + totalTax).toFixed(2);
    }, [cartItems]);

    // Handle address form changes
    const handleNewAddressChange = (e) => {
        const { name, value } = e.target;
        setNewAddressDetails(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const handleSubmitOrder = async (e) => {
        e.preventDefault();

        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        const { fullName, addressLine, city, country } = newAddressDetails;

        if (!fullName || !addressLine || !city || !country) {
            setError('Please fill in all required fields for the shipping address (Full Name, Address, City, Country).');
            setLoading(false);
            return;
        }

        if (!paymentMethod) {
            setError('Please select a payment method.');
            setLoading(false);
            return;
        }

        let paymentIntentIdToSend = null;

        if (paymentMethod === 'Online Payment') {
            if (!confirmStripePaymentRef.current) {
                setError('Payment form not ready. Please wait for the form to load.');
                setLoading(false);
                return;
            }
            const { success, paymentIntentId, message: stripeErrorMessage } = await confirmStripePaymentRef.current();

            if (!success) {
                setError(stripeErrorMessage || 'Stripe payment failed during confirmation.');
                setLoading(false);
                return;
            }
            paymentIntentIdToSend = paymentIntentId;
            setSuccessMessage('Payment successful! Processing order...');

        } else if (paymentMethod === 'Cash on Delivery') {
            paymentIntentIdToSend = 'COD';
        }

        // Proceed to place the order with the backend
        const requestBody = {
            cartItems: cartItems.map(item => ({
                productId: item.product_id,
                quantity: item.quantity
            })),
            newAddressDetails: newAddressDetails,
            paymentMethod: paymentMethod,
            paymentIntentId: paymentIntentIdToSend
        };

        try {
            const config = { headers: { 'x-auth-token': token } };
            const response = await axios.post(
                'http://localhost:5000/api/checkout',
                requestBody,
                config
            );

            if (response.data.success) {
                setSuccessMessage(response.data.message);
                fetchCart();
                setTimeout(() => {
                    navigate(`/order-confirmation/${response.data.order_id}`);
                }, 1500);
            } else {
                setError(response.data.message || 'Order placement failed.');
            }
        } catch (err) {
            console.error('Checkout error:', err.response?.data || err);
            const backendErrorMessage = err.response?.data?.message || 'An unexpected error occurred during checkout.';
            setError(backendErrorMessage);
        } finally {
            setLoading(false);
        }
    };


    if (!isLoggedIn) {
        return null;
    }

    if (loadingCart) {
        return (
            <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading cart...</span>
                </div>
            </div>
        );
    }

    if (cartError) {
        return (
            <div className="container mt-5 pt-5 text-center">
                <div className="alert alert-danger" role="alert">
                    Error loading cart: {cartError}
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="container mt-5 pt-5 text-center">
                <div className="alert alert-info" role="alert">
                    Your cart is empty. <Link to="/products" className="alert-link text-app-accent">Start shopping!</Link>
                </div>
            </div>
        );
    }
    
    const { fullName, addressLine, city, country } = newAddressDetails;

    return (
        <div className="container mt-5 pt-5 mb-5 animate__animated animate__fadeIn">
            <h1 className="mb-4 text-center text-app-accent fw-bold animate__animated animate__fadeInDown">Secure Checkout</h1>

            {error && <div className="alert alert-danger text-center animate__animated animate__shakeX">{error}</div>}
            {successMessage && <div className="alert alert-success text-center animate__animated animate__fadeIn">{successMessage}</div>}

            <div className="row justify-content-center">
                {/* Order Summary */}
                <div className="col-lg-6 mb-4">
                    <div className="card shadow-lg animate__animated animate__fadeInLeft">
                        <div className="card-header bg-app-accent-gradient text-white">
                            <h4 className="mb-0 fw-bold"><i className="bi bi-cart-fill me-2"></i>1. Order Summary</h4>
                        </div>
                        <div className="card-body">
                            {cartItems.map(item => (
                                <div key={item.product_id} className="d-flex justify-content-between align-items-center border-bottom py-2" style={{borderColor: 'var(--card-border-color)'}}>
                                    <div className="d-flex align-items-center">
                                        <img
                                            src={`http://localhost:5000/${item.image_url}`}
                                            alt={item.name}
                                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }}
                                        />
                                        <div>
                                            <p className="mb-0 fw-bold text-dark">{item.name}</p>
                                            <small className="text-muted">Qty: {item.quantity} x PKR {parseFloat(item.price).toFixed(2)}</small>
                                        </div>
                                    </div>
                                    <span className="fw-bold text-dark">PKR {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <hr style={{borderColor: 'var(--card-border-color)'}} />
                            <h5 className="d-flex justify-content-between mt-3 text-dark">
                                <span>Total:</span>
                                <span className="text-app-accent fw-bold">PKR {calculateCartTotal()}</span>
                            </h5>
                        </div>
                    </div>
                </div>

                {/* Shipping Information & Payment */}
                <div className="col-lg-6 mb-4">
                    <div className="card shadow-lg animate__animated animate__fadeInRight">
                        <div className="card-header bg-app-accent-gradient text-white">
                            <h4 className="mb-0 fw-bold"><i className="bi bi-geo-alt-fill me-2"></i>2. Shipping & Payment</h4>
                        </div>
                        <div className="card-body">
                            {/* Shipping Information */}
                            <h5 className="mb-3 text-dark fw-bold">Shipping Address</h5>
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="fullName" className="form-label text-light-emphasis">Full Name <span className="text-danger">*</span></label>
                                    <input type="text" className="form-control modern-form-control" id="fullName" name="fullName" value={newAddressDetails.fullName} onChange={handleNewAddressChange} required />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="addressLine" className="form-label text-light-emphasis">Address Line <span className="text-danger">*</span></label>
                                    <input type="text" className="form-control modern-form-control" id="addressLine" name="addressLine" value={newAddressDetails.addressLine} onChange={handleNewAddressChange} required />
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="city" className="form-label text-light-emphasis">City <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control modern-form-control" id="city" name="city" value={newAddressDetails.city} onChange={handleNewAddressChange} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="country" className="form-label text-light-emphasis">Country <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control modern-form-control" id="country" name="country" value={newAddressDetails.country} onChange={handleNewAddressChange} required />
                                    </div>
                                </div>
                                {/* Phone Number Field */}
                                <div className="mb-3">
                                    <label htmlFor="phoneNumber" className="form-label text-light-emphasis">Phone Number</label>
                                    <input type="text" className="form-control modern-form-control" id="phoneNumber" name="phoneNumber" value={newAddressDetails.phoneNumber} onChange={handleNewAddressChange} placeholder="e.g., +923123456789" />
                                </div>
                            </form>

                            <hr style={{borderColor: 'var(--card-border-color)'}} className="my-4" />

                            {/* Payment Method Section */}
                            <h5 className="mb-3 text-dark fw-bold">Payment Method</h5>
                            <div className="mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="paymentMethod"
                                        id="codPayment"
                                        value="Cash on Delivery"
                                        checked={paymentMethod === 'Cash on Delivery'}
                                        onChange={(e) => {
                                            setPaymentMethod(e.target.value);
                                            setClientSecret('');
                                            setError(null);
                                            setSuccessMessage(null);
                                        }}
                                        required
                                    />
                                    <label className="form-check-label text-dark" htmlFor="codPayment">
                                        <i className="bi bi-cash-stack me-2"></i>Cash on Delivery (COD)
                                    </label>
                                </div>
                                <div className="form-check mt-2">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="paymentMethod"
                                        id="onlinePayment"
                                        value="Online Payment"
                                        checked={paymentMethod === 'Online Payment'}
                                        onChange={(e) => {
                                            setPaymentMethod(e.target.value);
                                            setError(null);
                                            setSuccessMessage(null);
                                        }}
                                        required
                                    />
                                    <label className="form-check-label text-dark" htmlFor="onlinePayment">
                                        <i className="bi bi-credit-card-fill me-2"></i>Online Payment (Stripe)
                                    </label>
                                </div>
                            </div>

                            {paymentMethod === 'Online Payment' && (
                                <div className="mt-3 p-3 border rounded bg-secondary-theme animate__animated animate__fadeIn" style={{borderColor: 'var(--card-border-color)'}}>
                                    <h6 className="text-dark fw-bold mb-3">Pay with Card</h6>
                                    {/* Display loading/error for Stripe.js script itself */}
                                    {loadingStripeScript ? (
                                        <div className="d-flex justify-content-center align-items-center py-4">
                                            <div className="spinner-border text-app-accent" role="status">
                                                <span className="visually-hidden">Loading payment script...</span>
                                            </div>
                                            <p className="ms-3 text-muted">Loading secure payment script...</p>
                                        </div>
                                    ) : stripeScriptError ? (
                                        <div className="alert alert-danger text-center py-2">{stripeScriptError}</div>
                                    ) : (
                                        // Render Elements and StripePaymentForm only if Stripe.js is loaded and clientSecret is ready
                                        stripePromiseInstance && clientSecret ? (
                                            <Elements stripe={stripePromiseInstance} options={{ clientSecret: clientSecret }}>
                                                <StripePaymentForm
                                                    clientSecret={clientSecret}
                                                    onPaymentConfirmed={setConfirmStripePaymentFn}
                                                    setStripeError={setError}
                                                    loadingInitialPaymentIntent={loadingPaymentIntent}
                                                />
                                            </Elements>
                                        ) : (
                                            <div className="d-flex justify-content-center align-items-center py-4">
                                                <i className="bi bi-info-circle text-muted fs-4 me-2"></i>
                                                <p className="ms-3 text-muted">Initializing payment details...</p>
                                            </div>
                                        )
                                    )}
                                    <p className="text-muted small mt-3">Your payment will be securely processed by Stripe. Total amount: <span className="text-app-accent fw-bold">PKR {orderTotalAmount || calculateCartTotal()}</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Place Order Button */}
                <div className="col-12 text-center mt-4">
                    <button
                        className="btn btn-app-accent-gradient btn-lg px-5 py-3 animate__animated animate__pulse animate__infinite"
                        onClick={handleSubmitOrder}
                        disabled={loading || cartItems.length === 0 || !fullName || !addressLine || !city || !country || (paymentMethod === 'Online Payment' && (!clientSecret || loadingPaymentIntent || !stripePromiseInstance || loadingStripeScript || stripeScriptError)) || !paymentMethod}
                    >
                        {loading ? 'Processing Order...' : `Place Order (PKR ${calculateCartTotal()})`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Checkout;