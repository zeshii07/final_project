// src/components/Landing.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // NEW: Import useNavigate
import { useAuth } from '../../contexts/AuthContext'; // NEW: Import useAuth
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Ensure Bootstrap Icons are imported

// Images
import HeroImage from '../assets/hero-abaya.jpeg';
// Removed specific category images as we'll use dynamic product images

function Landing() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth(); // Get login status and user info from AuthContext

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        // Fetch up to 8 products from your backend
        const response = await fetch('http://localhost:5000/api/products?limit=8');
        if (!response.ok) {
          throw new Error('Failed to fetch featured products.');
        }
        const data = await response.json();
        setFeaturedProducts(data);
      } catch (err) {
        setProductsError(err.message);
        console.error("Error fetching featured products:", err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchFeaturedProducts();
  }, []); // Empty dependency array means this runs once on mount

  const handleShopNowClick = () => {
    navigate('/products'); // Navigate to the product listing page
  };

  const handleDynamicButtonClick = () => {
    if (isLoggedIn) {
      navigate('/dashboard'); // Go to dashboard if logged in
    } else {
      // Direct to signup page, potentially with a 'seller' role hint
      navigate('/signup?role=seller');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <header className="jumbotron jumbotron-fluid bg-dark text-white text-center py-5 mt-4 position-relative overflow-hidden" style={{
        backgroundImage: `url(${HeroImage})`, // Correct syntax for background image
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '80vh', // Increased height for more impact
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Overlay for better text readability */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
        <div className="container position-relative" style={{ zIndex: 1 }}> {/* Content above overlay */}
          <h1 className="display-4 fw-bold mb-4 animate__animated animate__fadeInDown">Abaya Haven: Your Destination for Timeless Modesty</h1>
          <p className="lead mb-4 animate__animated animate__fadeInUp animate__delay-0.5s">Discover exquisite abayas and modest wear online. Connect directly with talented designers and sellers.</p>
          <div className="mt-4 animate__animated animate__fadeInUp animate__delay-1s">
            <button
              className="btn btn-success btn-lg px-4 me-3"
              onClick={handleShopNowClick}
            >
              <i className="bi bi-bag-fill me-2"></i> Shop Now
            </button>
            <button
              className="btn btn-outline-light btn-lg px-4"
              onClick={handleDynamicButtonClick}
            >
              {isLoggedIn ? (
                <>
                  <i className="bi bi-speedometer2 me-2"></i> Go to Dashboard
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus-fill me-2"></i> Become a Seller
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Featured Products Section */}
      <section className="container my-5">
        <h2 className="text-center mb-4 text-success fw-bold">Discover Our Latest Arrivals</h2>
        {loadingProducts ? (
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading products...</span>
            </div>
          </div>
        ) : productsError ? (
          <div className="alert alert-danger text-center">
            Error loading products: {productsError}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="alert alert-info text-center">
            No products available yet.
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
            {featuredProducts.map((product) => (
              <div className="col" key={product.id}>
                <div className="card h-100 shadow-sm border-0 rounded-lg overflow-hidden">
                  <img
                    src={`http://localhost:5000/${product.image_url}`}
                    className="card-img-top"
                    alt={product.name}
                    style={{ height: '200px', objectFit: 'cover' }} // Fixed height for consistency
                  />
                  <div className="card-body d-flex flex-column text-center">
                    <h5 className="card-title text-success fw-bold mb-1">{product.name}</h5>
                    <p className="card-text text-muted mb-2 flex-grow-1" style={{ fontSize: '0.9rem' }}>
                      {product.description.substring(0, 50)}... {/* Truncate description */}
                    </p>
                    <h6 className="fw-bold text-dark mb-3">${parseFloat(product.price).toFixed(2)}</h6>
                    <button
                      className="btn btn-sm btn-outline-success mt-auto"
                      onClick={() => navigate(`/products/${product.id}`)} // Link to product detail page
                    >
                      View Details <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Why Choose Abaya Haven? Section */}
      <section className="bg-light py-5">
        <div className="container text-dark">
          <h2 className="text-center mb-5 text-success fw-bold">Why Choose Abaya Haven?</h2>
          <div className="row text-center">
            <div className="col-md-4 mb-4">
              <i className="bi bi-palette-fill text-success display-4 mb-3"></i>
              <h4 className="fw-bold">Diverse Selection</h4>
              <p>Explore a wide range of abaya styles, fabrics, and designs from talented sellers.</p>
            </div>
            <div className="col-md-4 mb-4">
              <i className="bi bi-shop-window text-success display-4 mb-3"></i>
              <h4 className="fw-bold">Support Local Businesses</h4>
              <p>Connect directly with and support independent designers and artisans.</p>
            </div>
            <div className="col-md-4 mb-4">
              <i className="bi bi-shield-lock-fill text-success display-4 mb-3"></i>
              <h4 className="fw-bold">Secure Transactions</h4>
              <p>Enjoy a safe and secure online shopping experience with trusted payment methods.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section (Bottom) */}
      <section className="bg-success text-white text-center py-5">
        <div className="container">
          <h2 className="mb-4">Ready to find your perfect abaya?</h2>
          <button className="btn btn-light btn-lg mx-2" onClick={handleShopNowClick}>
            <i className="bi bi-search me-2"></i> Explore Products
          </button>
          <p className="mt-4">
            Or, are you a designer?{' '}
            <a
              href="#"
              className="text-white fw-bold text-decoration-none"
              onClick={handleDynamicButtonClick}
            >
              {isLoggedIn ? 'Go to Dashboard' : 'Become a Seller'}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Landing;