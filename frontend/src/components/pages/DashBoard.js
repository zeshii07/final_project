// // src/components/DashboardPage.js
// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';

// function DashboardPage() {
//   const { isLoggedIn, user, token } = useAuth(); // Get token from AuthContext
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(''); // For success/error messages from actions

//   useEffect(() => {
//     if (!isLoggedIn) {
//       navigate('/login'); // Redirect to login if not authenticated
//       return;
//     }

//     // --- DEBUGGING LOGS ---
//     // console.log('DashboardPage: User logged in:', isLoggedIn);
//     // console.log('DashboardPage: User object:', user);
//     // console.log('DashboardPage: Auth Token:', token); // Check what 'token' is here
//     // --- END DEBUGGING LOGS ---

//     if (token) { // Only attempt to fetch if a token is available
//       fetchUserProducts();
//     } else {
//       setError('Authentication token is missing. Please log in again.');
//       setLoading(false);
//     }
//   }, [isLoggedIn, navigate, token]); // Add token to dependency array

//   const fetchUserProducts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       // --- DEBUGGING LOGS ---
//       // console.log('Attempting to fetch user products...');
//       // console.log('Request Headers - x-auth-token:', token); // Verify token sent in header
//       // --- END DEBUGGING LOGS ---

//       const response = await fetch('http://localhost:5000/api/user/products', {
//         headers: {
//           'x-auth-token': token, // Send the JWT token
//         },
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         // This will now show the exact error message from the backend (e.g., "Token is not valid")
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       setProducts(data);
//     } catch (err) {
//       setError(`Error fetching user products: ${err.message}`);
//       console.error('Error fetching user products:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (productId) => {
//     if (!window.confirm('Are you sure you want to delete this product?')) {
//       return;
//     }

//     try {
//       const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
//         method: 'DELETE',
//         headers: {
//           'x-auth-token': token, // Send the JWT token
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       }

//       setMessage('Product deleted successfully!');
//       fetchUserProducts(); // Refresh the list
//       setTimeout(() => setMessage(''), 2000); // Clear message after 3 seconds
//     } catch (err) {
//       setError(`Error deleting product: ${err.message}`);
//       console.error('Delete error:', err);
//       setTimeout(() => setError(''), 2000); // Clear error after 3 seconds
//     }
//   };

//   if (loading) {
//     return (
//       <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', paddingTop: '70px' }}>
//         <div className="spinner-border text-success" role="status">
//           <span className="visually-hidden">Loading products...</span>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="container mt-5 pt-5 text-center">
//         <div className="alert alert-danger" role="alert">
//           {error}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mt-5 pt-5">
//       <h2 className="text-center text-success mb-4 fw-bold">
//         {user ? `${user.username}'s Dashboard` : 'Dashboard'}
//       </h2>

//       {message && <div className="alert alert-success">{message}</div>}
//       {error && <div className="alert alert-danger">{error}</div>}

//       <div className="d-flex justify-content-end mb-4">
//         <Link to="/dashboard/add-product" className="btn btn-success btn-lg">
//           <i className="bi bi-plus-circle me-2"></i> Add New Product
//         </Link>
//       </div>

//       {products.length === 0 ? (
//         <div className="alert alert-info text-center" role="alert">
//           You haven't uploaded any products yet.
//         </div>
//       ) : (
//         <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
//           {products.map((product) => (
//             <div className="col" key={product.id}>
//               <div className="card h-100 shadow-sm border-0 product-card">
//                 <img
//                   src={`http://localhost:5000/${product.image_url}`}
//                   className="card-img-top"
//                   alt={product.name}
//                   style={{ height: '250px', objectFit: 'cover' }}
//                 />
//                 <div className="card-body d-flex flex-column">
//                   <h5 className="card-title fw-bold text-dark">{product.name}</h5>
//                   <p className="card-text text-muted" style={{ fontSize: '0.9rem' }}>
//                     {product.description.substring(0, 70)}...
//                   </p>
//                   <div className="mt-auto d-flex justify-content-between align-items-center">
//                     <span className="fw-bold text-success fs-5">${parseFloat(product.price).toFixed(2)}</span>
//                     <div className="btn-group" role="group">
//                       <Link to={`/dashboard/edit-product/${product.id}`} className="btn btn-sm btn-outline-primary">
//                         <i className="bi bi-pencil-square"></i> Update
//                       </Link>
//                       <button
//                         className="btn btn-sm btn-outline-danger"
//                         onClick={() => handleDelete(product.id)}
//                       >
//                         <i className="bi bi-trash"></i> Delete
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default DashboardPage;

// src/components/DashboardPage.js
// import React, { useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext'; // Path adjusted
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
// import 'animate.css'; // Ensure animate.css is available globally

// function DashboardPage() {
//   const { isLoggedIn, user } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!isLoggedIn) {
//       navigate('/login'); // Redirect to login if not authenticated
//     }
//   }, [isLoggedIn, navigate]);

//   if (!isLoggedIn) {
//     // Optionally return null or a loading spinner while redirecting
//     return (
//       <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
//         <div className="spinner-border text-success" role="status">
//           <span className="visually-hidden">Redirecting...</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mt-5 pt-5 pb-5 animate__animated animate__fadeIn">
//       <h2 className="text-center text-light mb-5 fw-bold animate__animated animate__fadeInDown">
//         Welcome, <span className="text-success">{user ? user.username : 'User'}</span>! Your Central Hub.
//       </h2>

//       {/* Quick Action Buttons */}
//       <div className="card shadow-lg p-4 p-md-5 mb-5 animate__animated animate__fadeInUp animate__delay-0.2s">
//         <h4 className="text-success mb-4 fw-bold text-center">Quick Actions</h4>
//         <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
//           <div className="col">
//             <Link to="/dashboard/add-product" className="btn btn-app-accent-gradient w-100 py-3 d-flex flex-column align-items-center justify-content-center text-decoration-none">
//               <i className="bi bi-plus-circle-fill mb-2 fs-3"></i>
//               <span>Add New Product</span>
//             </Link>
//           </div>
//           <div className="col">
//             <Link to="/dashboard/products" className="btn btn-outline-light w-100 py-3 d-flex flex-column align-items-center justify-content-center text-app-link-light text-decoration-none">
//               <i className="bi bi-box-seam-fill mb-2 fs-3"></i>
//               <span>Your Listed Products</span>
//             </Link>
//           </div>
//           <div className="col">
//             <Link to="/dashboard/orders/placed" className="btn btn-outline-light w-100 py-3 d-flex flex-column align-items-center justify-content-center text-app-link-light text-decoration-none">
//               <i className="bi bi-receipt-cutoff mb-2 fs-3"></i>
//               <span>Your Purchase History</span>
//             </Link>
//           </div>
//           {user  && ( // Only show if the user is a seller
//             <div className="col">
//               <Link to="/dashboard/orders/received" className="btn btn-outline-light w-100 py-3 d-flex flex-column align-items-center justify-content-center text-app-link-light text-decoration-none">
//                 <i className="bi bi-box-arrow-in-down-right mb-2 fs-3"></i>
//                 <span>Orders For Your Products</span>
//               </Link>
//             </div>
//           )}
//           <div className="col">
//             <Link to="/reports" className="btn btn-outline-light w-100 py-3 d-flex flex-column align-items-center justify-content-center text-app-link-light text-decoration-none">
//               <i className="bi bi-graph-up-arrow mb-2 fs-3"></i>
//               <span>View Reports (Coming Soon)</span>
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default DashboardPage;
// src/components/DashboardPage.js
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Path adjusted
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "animate.css"; // Ensure animate.css is available globally

function DashboardPage() {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login"); // Redirect to login if not authenticated
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    // Optionally return null or a loading spinner while redirecting
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 pt-5 pb-5 animate__animated animate__fadeIn">
      <h2 className="text-center text-dark mb-5 fw-bold animate__animated animate__fadeInDown">
        Welcome,{" "}
        <span className="text-success">{user ? user.username : "User"}</span>!
        Your Central Hub.
      </h2>

      {/* Quick Action Buttons */}
      <div className="card shadow-lg p-4 p-md-5 mb-5 animate__animated animate__fadeInUp animate__delay-0.2s">
        <h4 className="text-success mb-4 fw-bold text-center">Quick Actions</h4>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          <div className="col">
            <Link
              to="/dashboard/add-product"
              className="btn btn-app-accent-gradient w-100 py-3 d-flex flex-column align-items-center justify-content-center text-decoration-none"
            >
              <i className="bi bi-plus-circle-fill mb-2 fs-3"></i>
              <span>Add New Product</span>
            </Link>
          </div>
          {/* <div className="col">
            <Link to="/dashboard/products" className="btn btn-outline-light w-100 py-3 d-flex flex-column align-items-center justify-content-center text-app-link-dark text-decoration-none">
              <i className="bi bi-box-seam-fill mb-2 fs-3"></i>
              <span>Your Listed Products</span>
            </Link>
          </div> */}
          <div className="col">
            <Link
              to="/dashboard/products"
              className="btn btn-outline-dark w-100 py-3 d-flex flex-column align-items-center justify-content-center text-dark text-decoration-none bg-light"
            >
              <i className="bi bi-box-seam-fill mb-2 fs-3"></i>
              <span>Your Listed Products</span>
            </Link>
          </div>

          <div className="col">
            <Link
              to="/dashboard/orders/placed"
              className="btn btn-outline-dark w-100 py-3 d-flex flex-column align-items-center justify-content-center text-dark text-decoration-none bg-light"
            >
              <i className="bi bi-receipt-cutoff mb-2 fs-3"></i>
              <span>Your Purchase History</span>
            </Link>
          </div>
          {/* REMOVED: user && user.user_type === 'seller' condition */}
          <div className="col">
            <Link
              to="/dashboard/orders/received"
              className="btn btn-outline-dark w-100 py-3 d-flex flex-column align-items-center justify-content-center text-dark text-decoration-none bg-light"
            >
              <i className="bi bi-box-arrow-in-down-right mb-2 fs-3"></i>
              <span>Orders For Your Products</span> {/* Now visible to all */}
            </Link>
          </div>
          <div className="col">
            <Link
              to="/reports"
              className="btn btn-outline-dark w-100 py-3 d-flex flex-column align-items-center justify-content-center text-dark text-decoration-none bg-light"
            >
              <i className="bi bi-graph-up-arrow mb-2 fs-3"></i>
              <span>View Reports </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
