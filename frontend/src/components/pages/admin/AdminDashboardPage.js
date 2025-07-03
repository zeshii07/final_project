// src/components/pages/admin/AdminDashboardPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';

function AdminDashboardPage() {
    const { isLoggedIn, user, token } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        overallSales: '0.00',
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login'); // Redirect to login if not authenticated
            return;
        }

        // MODIFIED: Check user_type for admin access
        if (!user || user.user_type !== 'admin') {
            setAccessDenied(true);
            setLoading(false);
            return;
        }

        const fetchDashboardStats = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats', {
                    headers: { 'x-auth-token': token },
                });
                setStats(response.data);
            } catch (err) {
                console.error('Error fetching admin dashboard stats:', err);
                if (err.response && err.response.status === 403) {
                    setAccessDenied(true); // Still show access denied if backend explicitly denies
                } else {
                    setError(err.response?.data?.message || 'Failed to fetch dashboard statistics.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, [isLoggedIn, user, token, navigate]); // user is a dependency because its user_type is checked

    if (loading) {
        return (
            <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
                <div className="spinner-border text-app-accent" role="status">
                    <span className="visually-hidden">Loading admin dashboard...</span>
                </div>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="container mt-5 pt-5 text-center">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading"><i className="bi bi-shield-fill-x me-2"></i>Access Denied!</h4>
                    <p>You do not have administrative privileges to view this page.</p>
                    <hr />
                    <p className="mb-0">Please log in with an administrator account or contact support.</p>
                    <Link to="/login" className="btn btn-app-accent-gradient mt-3">Go to Login</Link>
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
            <h2 className="text-center text-app-accent mb-5 fw-bold animate__animated animate__fadeInDown">
                Admin Panel Dashboard
            </h2>
            <p className="text-center text-muted mb-5 animate__animated animate__fadeInUp">
                Overview of platform performance and quick access to management tools.
            </p>

            {/* Statistics Cards */}
            <div className="row justify-content-center g-4 mb-5">
                <div className="col-lg-3 col-md-6 col-sm-12 animate__animated animate__zoomIn animate__delay-0.2s">
                    <div className="card text-center h-100 p-3 shadow-lg">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center">
                             
                            <h5 className="card-title text-dark">Overall Sales</h5>
                            <p className="card-text fs-3 fw-bold text-app-accent">PKR {stats.overallSales}</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 col-sm-12 animate__animated animate__zoomIn animate__delay-0.4s">
                    <div className="card text-center h-100 p-3 shadow-lg">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center">
                            <i className="bi bi-receipt text-app-accent fs-1 mb-3"></i>
                            <h5 className="card-title text-dark">Total Orders</h5>
                            <p className="card-text fs-3 fw-bold text-dark">{stats.totalOrders}</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 col-sm-12 animate__animated animate__zoomIn animate__delay-0.6s">
                    <div className="card text-center h-100 p-3 shadow-lg">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center">
                            <i className="bi bi-box-seam-fill text-info fs-1 mb-3"></i>
                            <h5 className="card-title text-dark">Total Products</h5>
                            <p className="card-text fs-3 fw-bold text-dark">{stats.totalProducts}</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 col-sm-12 animate__animated animate__zoomIn animate__delay-0.8s">
                    <div className="card text-center h-100 p-3 shadow-lg">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center">
                            <i className="bi bi-people-fill text-primary fs-1 mb-3"></i>
                            <h5 className="card-title text-dark">Total Users</h5>
                            <p className="card-text fs-3 fw-bold text-dark">{stats.totalUsers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <h3 className="text-center text-app-accent mb-4 fw-bold animate__animated animate__fadeInUp">
                Management Actions
            </h3>
            <div className="row justify-content-center g-3">
                <div className="col-lg-4 col-md-6 col-sm-12 animate__animated animate__fadeInLeft animate__delay-1s">
                    <Link to="/admin/stock-management" className="btn btn-app-accent-gradient btn-lg w-100 py-3 shadow-sm d-flex align-items-center justify-content-center">
                        <i className="bi bi-box-fill me-3 fs-4"></i>
                        <span className="fw-bold fs-5">Manage Stock</span>
                    </Link>
                </div>
                <div className="col-lg-4 col-md-6 col-sm-12 animate__animated animate__fadeInUp animate__delay-1.2s">
                    <Link to="/admin/user-management" className="btn btn-app-accent-gradient btn-lg w-100 py-3 shadow-sm d-flex align-items-center justify-content-center">
                        <i className="bi bi-person-fill-gear me-3 fs-4"></i>
                        <span className="fw-bold fs-5">Manage Users</span>
                    </Link>
                </div>
                <div className="col-lg-4 col-md-6 col-sm-12 animate__animated animate__fadeInRight animate__delay-1.4s">
                    <Link to="/admin/order-management" className="btn btn-app-accent-gradient btn-lg w-100 py-3 shadow-sm d-flex align-items-center justify-content-center">
                        <i className="bi bi-clipboard-check-fill me-3 fs-4"></i>
                        <span className="fw-bold fs-5">Manage All Orders</span>
                    </Link>
                </div>
                <div className="col-lg-6 col-md-8 col-sm-12 mt-4 animate__animated animate__fadeInUp animate__delay-1.6s">
                    <Link to="/admin/platform-reports" className="btn btn-outline-success btn-lg w-100 py-3 shadow-sm d-flex align-items-center justify-content-center">
                        <i className="bi bi-bar-chart-fill me-3 fs-4"></i>
                        <span className="fw-bold fs-5">Platform Reports</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboardPage;