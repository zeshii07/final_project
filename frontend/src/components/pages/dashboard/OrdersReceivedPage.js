 // export default OrdersReceivedPage;
// src/components/dashboard/OrdersReceivedPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';
// Ensure Theme.css is imported globally in index.js for consistent styling

function OrdersReceivedPage() {
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();
  const [ordersReceived, setOrdersReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null); // For action success/error

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (token) {
      fetchOrdersReceived();
    } else {
      setError('Authentication token is missing. Please log in again.');
      setLoading(false);
    }
  }, [isLoggedIn, navigate, token]);

  const fetchOrdersReceived = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/user/orders/received', {
        headers: {
          'x-auth-token': token,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOrdersReceived(data);
    } catch (err) {
      setError(`Error fetching orders for your products: ${err.message}`);
      console.error('Error fetching seller received orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsShipped = async (orderId) => {
    if (!window.confirm(`Are you sure you want to mark Order #${orderId} as SHIPPED?`)) {
      return;
    }
    setStatusMessage(null);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/ship`, {
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

      setStatusMessage({ type: 'success', text: `Order #${orderId} successfully marked as SHIPPED!` });
      fetchOrdersReceived(); // Refresh the list
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Failed to mark order as shipped: ${err.message}` });
      console.error('Mark as shipped error:', err);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleMarkPaymentReceived = async (orderId, paymentId) => {
    if (!window.confirm(`Confirm: Mark payment for Order #${orderId} as RECEIVED?`)) {
        return;
    }
    setStatusMessage(null);
    try {
        const response = await fetch(`http://localhost:5000/api/payments/${paymentId}/mark-received`, {
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

        setStatusMessage({ type: 'success', text: `Payment for Order #${orderId} successfully marked as RECEIVED!` });
        fetchOrdersReceived(); // Refresh the list
        setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
        setStatusMessage({ type: 'error', text: `Failed to mark payment as received: ${err.message}` });
        console.error('Mark payment received error:', err);
        setTimeout(() => setStatusMessage(null), 3000);
    }
};


  if (loading) {
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading orders...</span>
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
        Orders for Your Products ({ordersReceived.length})
      </h2>

      {statusMessage && (
        <div className={`alert ${statusMessage.type === 'success' ? 'alert-success' : 'alert-danger'} text-center mb-4 animate__animated animate__fadeIn`}>
          {statusMessage.text}
        </div>
      )}

      {ordersReceived.length === 0 ? (
        <div className="alert alert-info text-center animate__animated animate__fadeIn">
          No orders have been placed for your products yet.
        </div>
      ) : (
        <div className="accordion accordion-flush animate__animated animate__fadeInUp animate__delay-0.2s" id="ordersReceivedAccordion">
          {ordersReceived.map((order, index) => (
            <div className="accordion-item my-2 rounded-lg shadow-sm" key={order.order_id} style={{ backgroundColor: 'var(--global-secondary-bg)', borderColor: 'var(--card-border-color)' }}>
              <h2 className="accordion-header" id={`headingReceived${order.order_id}`}>
                <button
                  className="accordion-button collapsed text-dark fw-bold rounded-lg"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#collapseReceived${order.order_id}`}
                  aria-expanded="false"
                  aria-controls={`collapseReceived${order.order_id}`}
                  style={{ backgroundColor: 'var(--global-secondary-bg)', color: 'var(--global-text-dark)' }}
                >
                  Order #{order.order_id} - Buyer: {order.buyer_username}
                  <span className={`badge ms-3 ${order.payment_status === 'paid' || order.payment_status === 'succeeded' ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {order.payment_status.toUpperCase()}
                  </span>
                  <span className={`badge ms-2 ${order.shipping_status === 'delivered' ? 'bg-info' : 'bg-primary'}`}>
                    {order.shipping_status.toUpperCase()}
                  </span>
                </button>
              </h2>
              <div
                id={`collapseReceived${order.order_id}`}
                className="accordion-collapse collapse"
                aria-labelledby={`headingReceived${order.order_id}`}
                data-bs-parent="#ordersReceivedAccordion"
              >
                <div className="accordion-body text-muted" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <p className="mb-1 text-app-accent fw-bold">Order Date: {new Date(order.order_date).toLocaleDateString()}</p>
                  <p className="mb-1 text-dark">Buyer Email: <span className="text-muted">{order.buyer_email}</span></p>
                  <p className="mb-3 text-dark">Shipping To: <span className="text-muted">{order.buyer_shipping_address}</span></p>
                  <p className="mb-3 text-dark">Payment Method: <span className="text-muted">{order.payment_method}</span></p>
                  <h6 className="text-dark fw-bold mt-3">Your Products in this Order:</h6>
                  <ul className="list-group list-group-flush">
                    {order.items_from_this_seller.map(item => (
                      <li key={item.product_id} className="list-group-item d-flex justify-content-between align-items-center" style={{ backgroundColor: 'transparent', color: 'var(--global-text-dark)', borderBottomColor: 'var(--card-border-color)' }}>
                        <div className="d-flex align-items-center">
                          <img src={`http://localhost:5000/${item.image_url}`} alt={item.product_name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px' }} />
                          <span className="text-dark">{item.product_name}</span>
                        </div>
                        <span className="badge bg-app-accent-gradient rounded-pill">Qty: {item.quantity} | Sold at: PKR {parseFloat(item.price_at_purchase).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="d-flex justify-content-end mt-3 gap-2">
                    {/* Mark as Shipped Button - Conditional Rendering */}
                    {(order.shipping_status === 'pending' || order.shipping_status === 'processing') && (
                      <button
                        className="btn btn-app-accent-gradient btn-sm"
                        onClick={() => handleMarkAsShipped(order.order_id)}
                      >
                        <i className="bi bi-truck me-1"></i> Mark as Shipped
                      </button>
                    )}
                    {/* NEW: Mark Payment Received Button - Conditional Rendering */}
                    {order.payment_method === 'Cash on Delivery' && order.payment_status === 'pending' && (
                        <button
                            className="btn btn-success btn-sm" // Using btn-success for a positive action
                            onClick={() => handleMarkPaymentReceived(order.order_id, order.payment_id)}
                        >
                            <i className="bi bi-cash me-1"></i> Mark Payment Received
                        </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersReceivedPage;