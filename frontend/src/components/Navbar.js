
// src/components/Navbar.js
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Navbar() {
    const { isLoggedIn, logout, user } = useAuth();
    const { cartItems } = useCart();
    const userType = user ? user.user_type : null; // Assuming user.user_type exists

    return (
        // 1. `fixed-top` for sticking
        // 2. `bg-dark` for dark background
        // 3. `shadow-lg` for a more prominent shadow (attractive)
        // 4. `py-3` for vertical padding (attractive)
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top shadow-lg py-3">
            <div className="container">
                {/* Brand Name on the Left */}
                <Link className="navbar-brand fs-3 fw-bold text-success" to="/">
                    <i className="bi bi-shop me-2"></i>Abaya Haven
                </Link>

                {/* Toggler for Mobile (remains on the right, as is standard) */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navbar links and action buttons */}
                <div className="collapse navbar-collapse" id="navbarNav">
                    {/* Primary navigation links (Home, Products, Contact) on the left of the collapsed menu */}
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <NavLink className="nav-link fs-5" to="/" end>
                                <i className="bi bi-house-door-fill me-1"></i> Home
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link fs-5" to="/products">
                                <i className="bi bi-box-seam-fill me-1"></i> Products
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link fs-5" to="/contact">
                                <i className="bi bi-chat-dots-fill me-1"></i> Contact Us
                            </NavLink>
                        </li>
                    </ul>

                    {/* Action buttons (Dashboard, Cart, Login/Logout) on the right */}
                    {/* Using `ms-auto` here pushes this ul to the right in desktop view */}
                    <ul className="navbar-nav ms-lg-auto mb-2 mb-lg-0">
                        {isLoggedIn ? (
                            <>
                                <li className="nav-item">
                                    <NavLink className="nav-link fs-5" to="/dashboard">
                                        <i className="bi bi-grid-1x2-fill me-1"></i> Dashboard
                                    </NavLink>
                                </li>
                                {userType === 'admin' && (
                                    <li className="nav-item">
                                        <NavLink className="nav-link fs-5" to="/admin-panel">
                                            <i className="bi bi-shield-fill me-1"></i> Admin Panel
                                        </NavLink>
                                    </li>
                                )}
                                <li className="nav-item">
                                    <NavLink className="nav-link fs-5" to="/cart">
                                        <i className="bi bi-cart-fill me-1"></i> Cart
                                        {cartItems.length > 0 && (
                                            <span className="badge bg-danger ms-1 rounded-pill">
                                                {cartItems.length}
                                            </span>
                                        )}
                                    </NavLink>
                                </li>
                                <li className="nav-item d-flex align-items-center"> {/* Use d-flex to align button if necessary */}
                                    <button className="btn btn-outline-danger ms-2 fs-5" onClick={logout}>
                                        <i className="bi bi-box-arrow-right me-1"></i> Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <NavLink className="nav-link fs-5" to="/login">
                                        <i className="bi bi-box-arrow-in-right me-1"></i> Login
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink className="nav-link fs-5" to="/signup">
                                        <i className="bi bi-person-plus-fill me-1"></i> Signup
                                    </NavLink>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;