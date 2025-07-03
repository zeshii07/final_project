// src/components/ProductDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // NEW: Import useAuth
import { useCart } from '../../contexts/CartContext'; // NEW: Import useCart
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Ensure icons are available

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isLoggedIn } = useAuth(); // NEW: Get isLoggedIn status
  const { addToCart, cartError: cartContextError } = useCart(); // NEW: Get addToCart function and error

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null); // NEW: For add to cart success/error

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch product details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  // NEW: Handler for Add to Cart button
  const handleAddToCart = async () => {
    // Clear any previous status messages
    setStatusMessage(null);

    if (!isLoggedIn) {
      setStatusMessage({ type: 'error', text: 'Please log in to add items to your cart.' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    if (!product || product.stock_quantity === 0) {
        setStatusMessage({ type: 'error', text: 'Product is out of stock.' });
        setTimeout(() => setStatusMessage(null), 3000);
        return;
    }

    // Call addToCart from CartContext, default quantity is 1
    const success = await addToCart(product.id, 1); // Assuming quantity 1 for single product add
    if (success) {
      setStatusMessage({ type: 'success', text: 'Product added to cart!' });
    } else {
      // The error message is already set in CartContext, but we can show a generic one or pass it through
      setStatusMessage({ type: 'error', text: cartContextError || 'Failed to add product to cart.' });
    }
    setTimeout(() => setStatusMessage(null), 3000); // Clear message after 3 seconds
  };


  if (loading) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', paddingTop: '70px' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading product details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5 pt-5 text-center">
        <div className="alert alert-danger" role="alert">
          Error: {error}
          <button className="btn btn-link mt-2" onClick={() => navigate('/products')}>Go back to products</button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mt-5 pt-5 text-center">
        <div className="alert alert-info" role="alert">
          Product data is not available. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 pt-5 mb-5"> {/* Added mb-5 for consistency */}
      <div className="row mt-4">
        <div className="col-md-6 mb-4">
          <img
            src={`http://localhost:5000/${product.image_url}`}
            className="img-fluid rounded shadow-sm"
            alt={product.name}
            style={{ maxWidth: '100%', height: 'auto', objectFit: 'cover' }}
          />
        </div>
        <div className="col-md-6 mb-4">
          <h2 className="text-success fw-bold">{product.name}</h2>
          <p className="text-muted mb-2">Category: <span className="badge bg-secondary">{product.category}</span></p>

          <h3 className="text-dark fw-bold my-3">
            PKR {
              product.price != null
                ? parseFloat(product.price).toFixed(2)
                : 'N/A'
            }
          </h3>

          <p className="lead">{product.description}</p>

          <div className="d-flex align-items-center mb-3">
            <span className="me-2 text-dark fw-bold">Availability:</span>
            {product.stock_quantity > 0 ? (
              <span className="badge bg-success fs-6">In Stock ({product.stock_quantity})</span>
            ) : (
              <span className="badge bg-danger fs-6">Out of Stock</span>
            )}
          </div>

          {/* NEW: Status Message for Add to Cart */}
          {statusMessage && (
            <div className={`alert ${statusMessage.type === 'success' ? 'alert-success' : 'alert-danger'} text-center mt-3`}>
              {statusMessage.text}
            </div>
          )}

          <div className="d-grid gap-2 d-md-block mt-4">
            {product.stock_quantity > 0 ? (
              <button
                className="btn btn-success btn-lg me-md-2"
                onClick={handleAddToCart} // Call the new handler
                disabled={!isLoggedIn} // Disable if not logged in
              >
                <i className="bi bi-cart-plus-fill me-2"></i>
                {isLoggedIn ? 'Add to Cart' : 'Log In to Add to Cart'} {/* Dynamic button text */}
              </button>
            ) : (
              <button className="btn btn-secondary btn-lg me-md-2" type="button" disabled>
                <i className="bi bi-cart-plus-fill me-2"></i> Out of Stock
              </button>
            )}
            <button className="btn btn-outline-secondary btn-lg" type="button" onClick={() => navigate('/products')}>
              <i className="bi bi-arrow-left me-2"></i> Back to Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;