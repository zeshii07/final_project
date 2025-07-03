// src/components/pages/admin/ProductManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';

function ProductManagementPage() {
    const { isLoggedIn, user, token } = useAuth();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    // Removed categories state as we're not fetching from a separate table
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // For success messages
    const [accessDenied, setAccessDenied] = useState(false);

    // State for editing a product
    const [editingProduct, setEditingProduct] = useState(null); // Product object being edited
    const [editForm, setEditForm] = useState({ // Form state for current edits
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category: '', // MODIFIED: Now a string
        image_url: '',
    });

    // Fetch products on component mount/dependency change
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        if (!user || user.user_type !== 'admin') {
            setAccessDenied(true);
            setLoading(false);
            return;
        }

        fetchProducts(); // Changed to singular fetch
    }, [isLoggedIn, user, token, navigate]);

    // MODIFIED: Simplified fetchProducts function
    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const productsResponse = await axios.get('http://localhost:5000/api/admin/products', {
                headers: { 'x-auth-token': token },
            });
            setProducts(productsResponse.data);
        } catch (err) {
            console.error('Error fetching products:', err);
            if (err.response && err.response.status === 403) {
                setAccessDenied(true);
            } else {
                setError(err.response?.data?.message || 'Failed to fetch products.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handler to open the edit form
    const handleEditClick = (productToEdit) => {
        setEditingProduct(productToEdit);
        setEditForm({
            name: productToEdit.name,
            description: productToEdit.description,
            price: productToEdit.price,
            stock_quantity: productToEdit.stock_quantity,
            category: productToEdit.category || '', // MODIFIED: Initialize category string
            image_url: productToEdit.image_url,
        });
    };

    // Handler for form input changes
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    // Handler to submit updated product data
    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        if (!editingProduct) return;

        try {
            const payload = {
                ...editForm,
                price: parseFloat(editForm.price),
                stock_quantity: parseInt(editForm.stock_quantity),
                // Removed category_id, now sending 'category' string
            };

            const response = await axios.put(`http://localhost:5000/api/admin/products/${editingProduct.id}`, payload, {
                headers: { 'x-auth-token': token },
            });
            setMessage(response.data.message);
            setEditingProduct(null); // Exit editing mode
            await fetchProducts(); // Refresh the product list
        } catch (err) {
            console.error('Error updating product:', err);
            setError(err.response?.data?.message || 'Failed to update product.');
        } finally {
            setTimeout(() => { setMessage(''); setError(''); }, 3000); // Clear messages
        }
    };

    // Helper to re-fetch products after an update or delete (simplified)
    const refreshProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const productsResponse = await axios.get('http://localhost:5000/api/admin/products', {
                headers: { 'x-auth-token': token },
            });
            setProducts(productsResponse.data);
        } catch (err) {
            console.error('Error re-fetching data:', err);
            if (err.response && err.response.status === 403) {
                setAccessDenied(true);
            } else {
                setError(err.response?.data?.message || 'Failed to refresh data.');
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Handler to delete a product
    const handleDeleteProduct = async (productIdToDelete) => {
        if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }
        setError(null);
        setMessage('');

        try {
            const response = await axios.delete(`http://localhost:5000/api/admin/products/${productIdToDelete}`, {
                headers: { 'x-auth-token': token },
            });
            setMessage(response.data.message);
            await refreshProducts(); // Refresh the product list
        } catch (err) {
            console.error('Error deleting product:', err);
            setError(err.response?.data?.message || 'Failed to delete product.');
        } finally {
            setTimeout(() => { setMessage(''); setError(''); }, 3000); // Clear messages
        }
    };

    if (loading) {
        return (
            <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
                <div className="spinner-border text-app-accent" role="status">
                    <span className="visually-hidden">Loading products...</span>
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

    if (error && !accessDenied) {
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
            <h2 className="text-center text-app-accent mb-4 fw-bold animate__animated animate__fadeInDown">
                <i className="bi bi-box-seam-fill me-2"></i>Product Management
            </h2>
            <p className="text-center text-muted mb-5 animate__animated animate__fadeInUp">
                Manage all products listed on the platform.
            </p>

            {message && <div className="alert alert-success text-center animate__animated animate__fadeIn">{message}</div>}
            {error && !accessDenied && <div className="alert alert-danger text-center animate__animated animate__shakeX">{error}</div>}

            <div className="card p-4 shadow-lg animate__animated animate__fadeInUp">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="text-dark mb-0">All Products ({products.length})</h4>
                    {/* Optionally add a link to add a new product via admin */}
                    {/* <Link to="/admin/add-product" className="btn btn-app-accent-gradient"><i className="bi bi-plus-circle me-2"></i> Add New Product</Link> */}
                </div>

                <div className="table-responsive">
                    <table className="table table-hover table-striped">
                        <thead className="bg-app-accent-gradient text-white">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Image</th>
                                <th scope="col">Name</th>
                                <th scope="col">Seller</th>
                                <th scope="col">Price</th>
                                <th scope="col">Stock</th>
                                <th scope="col">Category</th> {/* MODIFIED: Column header */}
                                <th scope="col">Created On</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((productItem) => (
                                <tr key={productItem.id} className="text-dark">
                                    <td>{productItem.id}</td>
                                    <td>
                                        <img
                                            src={`http://localhost:5000/${productItem.image_url}`}
                                            alt={productItem.name}
                                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                                            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/60x60/cccccc/000000?text=No+Image" }}
                                        />
                                    </td>
                                    <td>
                                        {editingProduct && editingProduct.id === productItem.id ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={editForm.name}
                                                onChange={handleEditFormChange}
                                                className="form-control modern-form-control-sm"
                                            />
                                        ) : (
                                            productItem.name
                                        )}
                                    </td>
                                    <td>{productItem.seller_username} ({productItem.seller_email})</td>
                                    <td>
                                        {editingProduct && editingProduct.id === productItem.id ? (
                                            <input
                                                type="number"
                                                name="price"
                                                value={editForm.price}
                                                onChange={handleEditFormChange}
                                                step="0.01"
                                                className="form-control modern-form-control-sm"
                                            />
                                        ) : (
                                            `PKR ${parseFloat(productItem.price).toFixed(2)}`
                                        )}
                                    </td>
                                    <td>
                                        {editingProduct && editingProduct.id === productItem.id ? (
                                            <input
                                                type="number"
                                                name="stock_quantity"
                                                value={editForm.stock_quantity}
                                                onChange={handleEditFormChange}
                                                min="0"
                                                className="form-control modern-form-control-sm"
                                            />
                                        ) : (
                                            <span className={`badge ${productItem.stock_quantity < 10 ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                {productItem.stock_quantity}
                                            </span>
                                        )}
                                    </td>
                                    <td> {/* MODIFIED: Category as text input */}
                                        {editingProduct && editingProduct.id === productItem.id ? (
                                            <input
                                                type="text"
                                                name="category"
                                                value={editForm.category}
                                                onChange={handleEditFormChange}
                                                className="form-control modern-form-control-sm"
                                                placeholder="Enter Category"
                                            />
                                        ) : (
                                            productItem.category || 'N/A' // Display category or 'N/A'
                                        )}
                                    </td>
                                    <td>{new Date(productItem.created_at).toLocaleDateString()}</td>
                                    <td>
                                        {editingProduct && editingProduct.id === productItem.id ? (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-app-accent-gradient me-2"
                                                    onClick={handleUpdateProduct}
                                                    disabled={loading}
                                                >
                                                    <i className="bi bi-check-lg"></i> Save
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => setEditingProduct(null)}
                                                >
                                                    <i className="bi bi-x-lg"></i> Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    onClick={() => handleEditClick(productItem)}
                                                >
                                                    <i className="bi bi-pencil-square"></i> Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteProduct(productItem.id)}
                                                >
                                                    <i className="bi bi-trash"></i> Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ProductManagementPage;