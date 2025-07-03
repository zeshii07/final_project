// src/components/pages/OrderConfirmationPage.js
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css'; // Ensure animate.css is imported

function OrderConfirmationPage() {
    const { orderId } = useParams(); // Get orderId from the URL

    useEffect(() => {
        // Optional: Any side effects you want to run once on confirmation page load
        // For example, sending analytics data for a successful conversion
        window.scrollTo(0, 0); // Scroll to top on page load
    }, []);

    return (
        <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100 py-5 animate__animated animate__fadeIn">
            <div className="card shadow-lg p-4 p-md-5 text-center" style={{ maxWidth: '600px', width: '90%' }}>
                <div className="card-body">
                    {/* Success Icon */}
                    <div className="mb-4">
                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i>
                    </div>

                    {/* Confirmation Message */}
                    <h2 className="mb-3 text-app-accent fw-bold animate__animated animate__zoomIn">
                        Order Confirmed!
                    </h2>
                    <p className="lead text-dark mb-4 animate__animated animate__fadeInUp animate__delay-0.5s">
                        Thank you for your purchase! Your order has been placed successfully.
                    </p>

                    {/* Order ID */}
                    <div className="alert alert-info py-3 mb-4 animate__animated animate__fadeIn animate__delay-1s" role="alert">
                        <h5 className="mb-0 text-dark">
                            Your Order ID: <span className="fw-bold text-app-accent-gradient">{orderId}</span>
                        </h5>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex flex-column flex-md-row justify-content-center gap-3 animate__animated animate__fadeInUp animate__delay-1.5s">
                        <Link to="/products" className="btn btn-app-accent-gradient btn-lg">
                            <i className="bi bi-shop me-2"></i> Continue Shopping
                        </Link>
                        <Link to="/dashboard/orders/placed" className="btn btn-outline-success btn-lg">
                            <i className="bi bi-clock-history me-2"></i> View My Orders
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderConfirmationPage;