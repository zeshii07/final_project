// src/components/CartPage.js
import React, { useEffect, useState } from 'react'; // Added useState for local status messages
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function CartPage() {
  const { cartItems, loadingCart, cartError, fetchCart, updateCartQuantity, removeFromCart } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [localStatus, setLocalStatus] = useState(null); // For local success/error messages

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [isLoggedIn, navigate, fetchCart]);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleUpdateQuantity = async (productId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    setLocalStatus(null); // Clear previous status

    // Optional: Prevent increasing beyond stock (assuming stock_quantity is available from cartItems)
    const product = cartItems.find(item => item.product_id === productId);
    if (product && newQuantity > product.stock_quantity) {
        setLocalStatus({ type: 'error', message: `Cannot add more than ${product.stock_quantity} in stock.` });
        setTimeout(() => setLocalStatus(null), 3000);
        return;
    }

    const success = await updateCartQuantity(productId, newQuantity);
    if (success) {
      setLocalStatus({ type: 'success', message: 'Cart updated successfully!' });
    } else {
      setLocalStatus({ type: 'error', message: cartError || 'Failed to update quantity.' });
    }
    setTimeout(() => setLocalStatus(null), 3000);
  };

  const handleRemoveItem = async (productId) => {
    setLocalStatus(null); // Clear previous status
    const success = await removeFromCart(productId);
    if (success) {
      setLocalStatus({ type: 'success', message: 'Item removed from cart!' });
    } else {
      setLocalStatus({ type: 'error', message: cartError || 'Failed to remove item.' });
    }
    setTimeout(() => setLocalStatus(null), 3000);
  };


  if (!isLoggedIn) {
    return null; // Redirect handled by useEffect
  }

  if (loadingCart) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', paddingTop: '70px' }}>
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
          Your cart is empty. <Link to="/products" className="alert-link">Start shopping!</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 pt-5 mb-5">
      <h2 className="text-center text-success mb-4 fw-bold">Your Shopping Cart</h2>

      {localStatus && (
        <div className={`alert ${localStatus.type === 'success' ? 'alert-success' : 'alert-danger'} text-center mb-4`}>
          {localStatus.message}
        </div>
      )}

      <div className="row">
        <div className="col-lg-9">
          {cartItems.map((item) => (
            <div key={item.cart_item_id} className="card mb-3 shadow-sm">
              <div className="row g-0 align-items-center">
                <div className="col-md-3">
                  <img
                    src={`http://localhost:5000/${item.image_url}`}
                    className="img-fluid rounded-start"
                    alt={item.name}
                    style={{ height: '120px', width: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className="col-md-5"> {/* Adjusted column size */}
                  <div className="card-body">
                    <h5 className="card-title fw-bold text-dark">{item.name}</h5>
                    <p className="card-text text-muted mb-1" style={{ fontSize: '0.9rem' }}>
                      Price: ${parseFloat(item.price).toFixed(2)}
                    </p>
                    {/* Quantity controls */}
                    <div className="d-flex align-items-center mt-2">
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity, -1)}
                            disabled={item.quantity <= 1} // Disable if quantity is 1
                        >
                            <i className="bi bi-dash"></i>
                        </button>
                        <span className="mx-2 fw-bold">{item.quantity}</span>
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity, 1)}
                            disabled={item.quantity >= item.stock_quantity} // Disable if at max stock
                        >
                            <i className="bi bi-plus"></i>
                        </button>
                        {item.stock_quantity < item.quantity + 1 && ( // Show stock warning if at limit
                            <small className="ms-2 text-danger">Max stock reached</small>
                        )}
                    </div>
                  </div>
                </div>
                <div className="col-md-4 d-flex flex-column align-items-center justify-content-center"> {/* Adjusted column size */}
                  <h4 className="text-success fw-bold">${(parseFloat(item.price) * item.quantity).toFixed(2)}</h4>
                  <button
                    className="btn btn-outline-danger btn-sm mt-2"
                    onClick={() => handleRemoveItem(item.product_id)}
                  >
                    <i className="bi bi-trash"></i> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-lg-3">
          <div className="card shadow-sm p-3 sticky-top" style={{ top: '80px' }}> {/* sticky-top for summary */}
            <h4 className="mb-3 text-center text-success">Order Summary</h4>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                Total Items
                <span className="badge bg-primary rounded-pill">{cartItems.length}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center fw-bold fs-5">
                Cart Total
                <span>${calculateTotal()}</span>
              </li>
            </ul>
            <Link to="/checkout" className="btn btn-success btn-lg mt-3">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;