// // src/components/pages/admin/OrderManagementPage.js
// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../../../contexts/AuthContext';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
// import 'animate.css';

// function OrderManagementPage() {
//     const { isLoggedIn, user, token } = useAuth();
//     const navigate = useNavigate();

//     const [orders, setOrders] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [message, setMessage] = useState(''); // For success messages
//     const [accessDenied, setAccessDenied] = useState(false);
//     const [expandedOrderId, setExpandedOrderId] = useState(null); // State for accordion expansion

//     // Allowed statuses for dropdowns
//     const shippingStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
//     const paymentStatuses = ['pending', 'succeeded', 'failed', 'refunded', 'requires_action'];

//     useEffect(() => {
//         if (!isLoggedIn) {
//             navigate('/login');
//             return;
//         }

//         if (!user || user.user_type !== 'admin') {
//             setAccessDenied(true);
//             setLoading(false);
//             return;
//         }

//         fetchOrders();
//     }, [isLoggedIn, user, token, navigate]);

//     const fetchOrders = useCallback(async () => {
//         setLoading(true);
//         setError(null);
//         try {
//             const response = await axios.get('http://localhost:5000/api/admin/orders', {
//                 headers: { 'x-auth-token': token },
//             });
//             setOrders(response.data);
//         } catch (err) {
//             console.error('Error fetching orders:', err);
//             if (err.response && err.response.status === 403) {
//                 setAccessDenied(true);
//             } else {
//                 setError(err.response?.data?.message || 'Failed to fetch orders.');
//             }
//         } finally {
//             setLoading(false);
//         }
//     }, [token]);

//     const handleStatusUpdate = async (orderId, newShippingStatus, newPaymentStatus) => {
//         setError(null);
//         setMessage('');
//         try {
//             const payload = {};
//             if (newShippingStatus) payload.shipping_status = newShippingStatus;
//             if (newPaymentStatus) payload.payment_status = newPaymentStatus;

//             const response = await axios.put(`http://localhost:5000/api/admin/orders/${orderId}`, payload, {
//                 headers: { 'x-auth-token': token },
//             });
//             setMessage(response.data.message);
//             await fetchOrders(); // Re-fetch orders to show updated status
//         } catch (err) {
//             console.error('Error updating order status:', err);
//             setError(err.response?.data?.message || 'Failed to update order status.');
//         } finally {
//             setTimeout(() => { setMessage(''); setError(''); }, 3000);
//         }
//     };

//     const toggleAccordion = (orderId) => {
//         setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
//     };

//     if (loading) {
//         return (
//             <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
//                 <div className="spinner-border text-app-accent" role="status">
//                     <span className="visually-hidden">Loading orders...</span>
//                 </div>
//             </div>
//         );
//     }

//     if (accessDenied) {
//         return (
//             <div className="container mt-5 pt-5 text-center">
//                 <div className="alert alert-danger" role="alert">
//                     <h4 className="alert-heading"><i className="bi bi-shield-fill-x me-2"></i>Access Denied!</h4>
//                     <p>You do not have administrative privileges to view this page.</p>
//                     <hr />
//                     <p className="mb-0">Please log in with an administrator account or contact support.</p>
//                     <Link to="/login" className="btn btn-app-accent-gradient mt-3">Go to Login</Link>
//                 </div>
//             </div>
//         );
//     }

//     if (error && !accessDenied) {
//         return (
//             <div className="container mt-5 pt-5 text-center">
//                 <div className="alert alert-danger" role="alert">
//                     {error}
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="container mt-5 pt-5 pb-5 animate__animated animate__fadeIn">
//             <h2 className="text-center text-app-accent mb-4 fw-bold animate__animated animate__fadeInDown">
//                 <i className="bi bi-clipboard-check-fill me-2"></i>Order Management
//             </h2>
//             <p className="text-center text-muted mb-5 animate__animated animate__fadeInUp">
//                 View and manage all orders placed on the platform.
//             </p>

//             {message && <div className="alert alert-success text-center animate__animated animate__fadeIn">{message}</div>}
//             {error && !accessDenied && <div className="alert alert-danger text-center animate__animated animate__shakeX">{error}</div>}

//             <div className="card p-4 shadow-lg animate__animated animate__fadeInUp">
//                 <div className="d-flex justify-content-between align-items-center mb-4">
//                     <h4 className="text-dark mb-0">All Orders ({orders.length})</h4>
//                 </div>

//                 <div className="accordion accordion-flush" id="orderManagementAccordion">
//                     {orders.length === 0 ? (
//                         <div className="alert alert-info text-center">No orders found.</div>
//                     ) : (
//                         orders.map((order) => (
//                             <div className="accordion-item my-2 rounded-lg shadow-sm" key={order.order_id} style={{ backgroundColor: 'var(--global-secondary-bg)', borderColor: 'var(--card-border-color)' }}>
//                                 <h2 className="accordion-header" id={`heading${order.order_id}`}>
//                                     <button
//                                         className={`accordion-button ${expandedOrderId === order.order_id ? '' : 'collapsed'} text-dark fw-bold rounded-lg`}
//                                         type="button"
//                                         onClick={() => toggleAccordion(order.order_id)}
//                                         style={{ backgroundColor: 'var(--global-secondary-bg)' }}
//                                     >
//                                         <div className="d-flex flex-column flex-md-row justify-content-between w-100 pe-3">
//                                             <span className="mb-1 mb-md-0">Order #{order.order_id} - <span className="text-app-accent">PKR {parseFloat(order.total_amount).toFixed(2)}</span></span>
//                                             <div className="d-flex flex-wrap align-items-center">
//                                                 <span className={`badge me-2 ${order.payment_status === 'succeeded' ? 'bg-success' : 'bg-warning text-dark'}`}>
//                                                     PAYMENT: {order.payment_status.toUpperCase()}
//                                                 </span>
//                                                 <span className={`badge ${order.shipping_status === 'delivered' ? 'bg-info' : 'bg-primary'}`}>
//                                                     SHIPPING: {order.shipping_status.toUpperCase()}
//                                                 </span>
//                                             </div>
//                                         </div>
//                                     </button>
//                                 </h2>
//                                 <div
//                                     id={`collapse${order.order_id}`}
//                                     className={`accordion-collapse collapse ${expandedOrderId === order.order_id ? 'show' : ''}`}
//                                     aria-labelledby={`heading${order.order_id}`}
//                                     data-bs-parent="#orderManagementAccordion"
//                                 >
//                                     <div className="accordion-body" style={{ backgroundColor: 'var(--card-bg)' }}>
//                                         <div className="row mb-3">
//                                             <div className="col-md-6">
//                                                 <p className="mb-1 text-dark"><strong>Buyer:</strong> {order.buyer_username} ({order.buyer_email})</p>
//                                                 <p className="mb-1 text-dark"><strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}</p>
//                                                 <p className="mb-1 text-dark"><strong>Shipping Address:</strong> <span className="text-muted">{order.shipping_address}</span></p>
//                                                 {order.tracking_number && <p className="mb-1 text-dark"><strong>Tracking Number:</strong> <span className="text-muted">{order.tracking_number}</span></p>}
//                                                 <p className="mb-1 text-dark"><strong>Payment Method:</strong> {order.payment_method}</p>
//                                                 {order.transaction_id && <p className="mb-1 text-dark"><strong>Transaction ID:</strong> <span className="text-muted">{order.transaction_id}</span></p>}
//                                             </div>
//                                             <div className="col-md-6">
//                                                 <h6 className="text-dark mt-3 mt-md-0">Update Statuses:</h6>
//                                                 <div className="d-flex flex-wrap gap-2 mb-2">
//                                                     <select
//                                                         className="form-select form-select-sm flex-grow-1 modern-form-control"
//                                                         value={order.shipping_status}
//                                                         onChange={(e) => handleStatusUpdate(order.order_id, e.target.value, null)}
//                                                     >
//                                                         {shippingStatuses.map(s => (
//                                                             <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
//                                                         ))}
//                                                     </select>
//                                                     <select
//                                                         className="form-select form-select-sm flex-grow-1 modern-form-control"
//                                                         value={order.payment_status}
//                                                         onChange={(e) => handleStatusUpdate(order.order_id, null, e.target.value)}
//                                                     >
//                                                         {paymentStatuses.map(s => (
//                                                             <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
//                                                         ))}
//                                                     </select>
//                                                 </div>
//                                                 {/* Optional: Delete Order Button */}
//                                                 {/* <button className="btn btn-sm btn-outline-danger mt-2" onClick={() => handleDeleteOrder(order.order_id)}>
//                                                     <i className="bi bi-trash"></i> Delete Order
//                                                 </button> */}
//                                             </div>
//                                         </div>

//                                         <h6 className="text-dark fw-bold mt-3">Items in this Order:</h6>
//                                         <ul className="list-group list-group-flush">
//                                             {order.items.length === 0 ? (
//                                                 <li className="list-group-item" style={{ backgroundColor: 'transparent', color: 'var(--global-text-dark)' }}>No items found for this order.</li>
//                                             ) : (
//                                                 order.items.map(item => (
//                                                     <li key={item.order_item_id} className="list-group-item d-flex justify-content-between align-items-center" style={{ backgroundColor: 'transparent', color: 'var(--global-text-dark)', borderBottomColor: 'var(--card-border-color)' }}>
//                                                         <div className="d-flex align-items-center">
//                                                             <img src={`http://localhost:5000/${item.image_url}`} alt={item.product_name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px' }}
//                                                                 onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/50x50/cccccc/000000?text=No+Image" }}
//                                                             />
//                                                             <div>
//                                                                 <span className="text-dark">{item.product_name}</span>
//                                                                 <br />
//                                                                 <small className="text-muted">
//                                                                     Seller: {item.seller_username} ({item.seller_email})
//                                                                 </small>
//                                                             </div>
//                                                         </div>
//                                                         <span className="badge bg-app-accent-gradient rounded-pill">
//                                                             Qty: {item.quantity} | PKR {parseFloat(item.price_at_purchase).toFixed(2)}
//                                                         </span>
//                                                     </li>
//                                                 ))
//                                             )}
//                                         </ul>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default OrderManagementPage;

// src/components/pages/admin/OrderManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';

function OrderManagementPage() {
    const { isLoggedIn, user, token } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // For success messages
    const [accessDenied, setAccessDenied] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null); // State for accordion expansion

    // Allowed statuses for dropdowns
    const shippingStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const paymentStatuses = ['pending', 'succeeded', 'failed', 'refunded', 'requires_action'];

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

        fetchOrders();
    }, [isLoggedIn, user, token, navigate]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/admin/orders', {
                headers: { 'x-auth-token': token },
            });
            setOrders(response.data);
        } catch (err) {
            console.error('Error fetching orders:', err);
            if (err.response && err.response.status === 403) {
                setAccessDenied(true);
            } else {
                setError(err.response?.data?.message || 'Failed to fetch orders.');
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    // MODIFIED: Refined handleStatusUpdate function
    const handleStatusUpdate = async (orderId, statusType, newValue) => {
        setError(null);
        setMessage('');
        try {
            const payload = {};
            if (statusType === 'shipping') {
                payload.shipping_status = newValue;
            } else if (statusType === 'payment') {
                payload.payment_status = newValue;
            } else {
                setError('Invalid status type specified for update.');
                return;
            }

            const response = await axios.put(`http://localhost:5000/api/admin/orders/${orderId}`, payload, {
                headers: { 'x-auth-token': token },
            });
            setMessage(response.data.message);
            await fetchOrders(); // Re-fetch orders to show updated status
        } catch (err) {
            console.error('Error updating order status:', err);
            setError(err.response?.data?.message || 'Failed to update order status.');
        } finally {
            setTimeout(() => { setMessage(''); setError(''); }, 3000);
        }
    };

    // Removed handleDeleteOrder (as per your previous decision)

    const toggleAccordion = (orderId) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    if (loading) {
        return (
            <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
                <div className="spinner-border text-app-accent" role="status">
                    <span className="visually-hidden">Loading orders...</span>
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
                <i className="bi bi-clipboard-check-fill me-2"></i>Order Management
            </h2>
            <p className="text-center text-muted mb-5 animate__animated animate__fadeInUp">
                View and manage all orders placed on the platform.
            </p>

            {message && <div className="alert alert-success text-center animate__animated animate__fadeIn">{message}</div>}
            {error && !accessDenied && <div className="alert alert-danger text-center animate__animated animate__shakeX">{error}</div>}

            <div className="card p-4 shadow-lg animate__animated animate__fadeInUp">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="text-dark mb-0">All Orders ({orders.length})</h4>
                </div>

                <div className="accordion accordion-flush" id="orderManagementAccordion">
                    {orders.length === 0 ? (
                        <div className="alert alert-info text-center">No orders found.</div>
                    ) : (
                        orders.map((order) => (
                            <div className="accordion-item my-2 rounded-lg shadow-sm" key={order.order_id} style={{ backgroundColor: 'var(--global-secondary-bg)', borderColor: 'var(--card-border-color)' }}>
                                <h2 className="accordion-header" id={`heading${order.order_id}`}>
                                    <button
                                        className={`accordion-button ${expandedOrderId === order.order_id ? '' : 'collapsed'} text-dark fw-bold rounded-lg`}
                                        type="button"
                                        onClick={() => toggleAccordion(order.order_id)}
                                        style={{ backgroundColor: 'var(--global-secondary-bg)' }}
                                    >
                                        <div className="d-flex flex-column flex-md-row justify-content-between w-100 pe-3">
                                            <span className="mb-1 mb-md-0">Order #{order.order_id} - <span className="text-app-accent">PKR {parseFloat(order.total_amount).toFixed(2)}</span></span>
                                            <div className="d-flex flex-wrap align-items-center">
                                                <span className={`badge me-2 ${order.payment_status === 'succeeded' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                    PAYMENT: {order.payment_status.toUpperCase()}
                                                </span>
                                                <span className={`badge ${order.shipping_status === 'delivered' ? 'bg-info' : 'bg-primary'}`}>
                                                    SHIPPING: {order.shipping_status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                </h2>
                                <div
                                    id={`collapse${order.order_id}`}
                                    className={`accordion-collapse collapse ${expandedOrderId === order.order_id ? 'show' : ''}`}
                                    aria-labelledby={`heading${order.order_id}`}
                                    data-bs-parent="#orderManagementAccordion"
                                >
                                    <div className="accordion-body" style={{ backgroundColor: 'var(--card-bg)' }}>
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <p className="mb-1 text-dark"><strong>Buyer:</strong> {order.buyer_username} ({order.buyer_email})</p>
                                                <p className="mb-1 text-dark"><strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}</p>
                                                <p className="mb-1 text-dark"><strong>Shipping Address:</strong> <span className="text-muted">{order.shipping_address}</span></p>
                                                {order.tracking_number && <p className="mb-1 text-dark"><strong>Tracking Number:</strong> <span className="text-muted">{order.tracking_number}</span></p>}
                                                <p className="mb-1 text-dark"><strong>Payment Method:</strong> {order.payment_method}</p>
                                                {order.transaction_id && <p className="mb-1 text-dark"><strong>Transaction ID:</strong> <span className="text-muted">{order.transaction_id}</span></p>}
                                            </div>
                                            <div className="col-md-6">
                                                <h6 className="text-dark mt-3 mt-md-0">Update Statuses:</h6>
                                                <div className="d-flex flex-wrap gap-2 mb-2">
                                                    <select
                                                        className="form-select form-select-sm flex-grow-1 modern-form-control"
                                                        value={order.shipping_status}
                                                        // MODIFIED: Call handleStatusUpdate with 'shipping' type
                                                        onChange={(e) => handleStatusUpdate(order.order_id, 'shipping', e.target.value)}
                                                    >
                                                        {shippingStatuses.map(s => (
                                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        className="form-select form-select-sm flex-grow-1 modern-form-control"
                                                        value={order.payment_status}
                                                        // MODIFIED: Call handleStatusUpdate with 'payment' type
                                                        onChange={(e) => handleStatusUpdate(order.order_id, 'payment', e.target.value)}
                                                    >
                                                        {paymentStatuses.map(s => (
                                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {/* No delete button here, as per your decision */}
                                            </div>
                                        </div>

                                        <h6 className="text-dark fw-bold mt-3">Items in this Order:</h6>
                                        <ul className="list-group list-group-flush">
                                            {order.items.length === 0 ? (
                                                <li className="list-group-item" style={{ backgroundColor: 'transparent', color: 'var(--global-text-dark)' }}>No items found for this order.</li>
                                            ) : (
                                                order.items.map(item => (
                                                    <li key={item.order_item_id} className="list-group-item d-flex justify-content-between align-items-center" style={{ backgroundColor: 'transparent', color: 'var(--global-text-dark)', borderBottomColor: 'var(--card-border-color)' }}>
                                                        <div className="d-flex align-items-center">
                                                            <img src={`http://localhost:5000/${item.image_url}`} alt={item.product_name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px' }}
                                                                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/50x50/cccccc/000000?text=No+Image" }}
                                                            />
                                                            <div>
                                                                <span className="text-dark">{item.product_name}</span>
                                                                <br />
                                                                <small className="text-muted">
                                                                    Seller: {item.seller_username} ({item.seller_email})
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <span className="badge bg-app-accent-gradient rounded-pill">
                                                            Qty: {item.quantity} | PKR {parseFloat(item.price_at_purchase).toFixed(2)}
                                                        </span>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default OrderManagementPage;