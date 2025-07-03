// src/components/dashboard/PurchaseHistoryPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';
// Ensure Theme.css is imported globally in index.js for consistent styling

function PurchaseHistoryPage() {
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();
  const [ordersPlaced, setOrdersPlaced] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null); // For action success/error

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (token) {
      fetchOrdersPlaced();
    } else {
      setError('Authentication token is missing. Please log in again.');
      setLoading(false);
    }
  }, [isLoggedIn, navigate, token]);

  const fetchOrdersPlaced = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/user/orders/placed', {
        headers: {
          'x-auth-token': token,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOrdersPlaced(data);
    } catch (err) {
      setError(`Error fetching your purchase history: ${err.message}`);
      console.error('Error fetching placed orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}? This action cannot be undone.`)) {
      return;
    }
    setStatusMessage(null); // Clear previous messages
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      setStatusMessage({ type: 'success', text: `Order #${orderId} successfully cancelled. ${data.newPaymentStatus === 'refunded' ? 'Refund initiated.' : ''}` });
      fetchOrdersPlaced(); // Refresh the list to show updated status
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Failed to cancel order: ${err.message}` });
      console.error('Cancel order error:', err);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };


  if (loading) {
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading purchase history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5 pt-5 text-center">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 pt-5 pb-5 animate__animated animate__fadeIn">
      <h2 className="text-center text-dark mb-4 fw-bold animate__animated animate__fadeInDown">
        Your Purchase History ({ordersPlaced.length})
      </h2>

      {statusMessage && (
        <div className={`alert ${statusMessage.type === 'success' ? 'alert-success' : 'alert-danger'} text-center mb-4 animate__animated animate__fadeIn`}>
          {statusMessage.text}
        </div>
      )}

      {ordersPlaced.length === 0 ? (
        <div className="alert alert-info text-center animate__animated animate__fadeIn">
          You haven't placed any orders yet. <Link to="/products" className="alert-link text-app-accent">Start shopping!</Link>
        </div>
      ) : (
        <div className="accordion accordion-flush animate__animated animate__fadeInUp animate__delay-0.2s" id="ordersPlacedAccordion">
          {ordersPlaced.map((order, index) => (
            <div className="accordion-item my-2 rounded-lg shadow-sm" key={order.order_id} style={{ backgroundColor: 'var(--global-secondary-bg)', borderColor: 'var(--card-border-color)' }}>
              <h2 className="accordion-header" id={`headingPlaced${order.order_id}`}>
                <button
                  className="accordion-button collapsed text-dark fw-bold rounded-lg"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#collapsePlaced${order.order_id}`}
                  aria-expanded="false"
                  aria-controls={`collapsePlaced${order.order_id}`}
                  style={{ backgroundColor: 'var(--global-secondary-bg)', color: 'var(--global-text-dark)' }} // Ensure button colors match theme
                >
                  Order #{order.order_id} - Total: PKR {parseFloat(order.total_amount).toFixed(2)}
                  <span className={`badge ms-3 ${order.payment_status === 'paid' || order.payment_status === 'succeeded' ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {order.payment_status.toUpperCase()}
                  </span>
                  <span className={`badge ms-2 ${order.shipping_status === 'delivered' ? 'bg-info' : 'bg-primary'}`}>
                    {order.shipping_status.toUpperCase()}
                  </span>
                </button>
              </h2>
              <div
                id={`collapsePlaced${order.order_id}`}
                className="accordion-collapse collapse"
                aria-labelledby={`headingPlaced${order.order_id}`}
                data-bs-parent="#ordersPlacedAccordion"
              >
                <div className="accordion-body text-muted" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <p className="mb-1 text-app-accent fw-bold">Order Date: {new Date(order.order_date).toLocaleDateString()}</p>
                  <p className="mb-1 text-dark">Shipping Address: <span className="text-muted">{order.shipping_address}</span></p> {/* text-dark, text-muted for visibility */}
                  <p className="mb-3 text-dark">Payment Method: <span className="text-muted">{order.payment_method}</span></p> {/* text-dark, text-muted for visibility */}
                  {order.tracking_number && <p className="mb-1 text-dark">Tracking Number: <span className="text-muted">{order.tracking_number}</span></p>}
                  <h6 className="text-dark fw-bold mt-3">Items:</h6>
                  <ul className="list-group list-group-flush">
                    {order.items.map(item => (
                      <li key={item.order_item_id} className="list-group-item d-flex justify-content-between align-items-center" style={{ backgroundColor: 'transparent', color: 'var(--global-text-dark)', borderBottomColor: 'var(--card-border-color)' }}>
                        <div className="d-flex align-items-center">
                          <img src={`http://localhost:5000/${item.image_url}`} alt={item.product_name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px' }} />
                          <span className="text-dark">{item.product_name}</span> {/* text-dark for visibility */}
                        </div>
                        <span className="badge bg-app-accent-gradient rounded-pill">Qty: {item.quantity} | PKR {parseFloat(item.price_at_purchase).toFixed(2)} each</span>
                      </li>
                    ))}
                  </ul>
                  {/* Cancel Button - Conditional Rendering */}
                  {(order.shipping_status === 'pending' || order.shipping_status === 'processing') && (
                    <div className="text-end mt-3">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleCancelOrder(order.order_id)}
                      >
                        <i className="bi bi-x-circle me-1"></i> Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PurchaseHistoryPage;