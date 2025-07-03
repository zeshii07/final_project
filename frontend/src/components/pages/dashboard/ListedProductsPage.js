// // src/components/dashboard/ListedProductsPage.js
// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../../contexts/AuthContext';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
// import 'animate.css';

// function ListedProductsPage() {
//   const { isLoggedIn, token } = useAuth();
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');

//   useEffect(() => {
//     if (!isLoggedIn) {
//       navigate('/login');
//       return;
//     }
//     if (token) {
//       fetchUserProducts();
//     } else {
//       setError('Authentication token is missing. Please log in again.');
//       setLoading(false);
//     }
//   }, [isLoggedIn, navigate, token]);

//   const fetchUserProducts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await fetch('http://localhost:5000/api/user/products', {
//         headers: {
//           'x-auth-token': token,
//         },
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       setProducts(data);
//     } catch (err) {
//       setError(`Error fetching your listed products: ${err.message}`);
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
//           'x-auth-token': token,
//         },
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       }
//       setMessage('Product deleted successfully!');
//       fetchUserProducts(); // Refresh the list
//       setTimeout(() => setMessage(''), 2000);
//     } catch (err) {
//       setError(`Error deleting product: ${err.message}`);
//       console.error('Delete error:', err);
//       setTimeout(() => setError(''), 2000);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
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
//     <div className="container mt-5 pt-5 pb-5 animate__animated animate__fadeIn">
//       <h2 className="text-center text-light mb-4 fw-bold animate__animated animate__fadeInDown">
//         Your Listed Products ({products.length})
//       </h2>

//       {message && <div className="alert alert-success text-center animate__animated animate__fadeIn">{message}</div>}

//       <div className="d-flex justify-content-end mb-4 animate__animated animate__fadeInUp">
//         <Link to="/dashboard/add-product" className="btn btn-app-accent-gradient btn-lg">
//           <i className="bi bi-plus-circle me-2"></i> Add New Product
//         </Link>
//       </div>

//       {products.length === 0 ? (
//         <div className="alert alert-info text-center animate__animated animate__fadeIn">
//           You haven't uploaded any products yet.
//           <Link to="/dashboard/add-product" className="alert-link text-app-accent ms-2">Add your first product!</Link>
//         </div>
//       ) : (
//         <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 animate__animated animate__fadeInUp animate__delay-0.2s">
//           {products.map((product) => (
//             <div className="col" key={product.id}>
//               <div className="card h-100 shadow-sm rounded-lg overflow-hidden">
//                 <img
//                   src={`http://localhost:5000/${product.image_url}`}
//                   className="card-img-top"
//                   alt={product.name}
//                   style={{ height: '250px', objectFit: 'cover' }}
//                 />
//                 <div className="card-body d-flex flex-column">
//                   <h5 className="card-title fw-bold text-dark mb-2">{product.name}</h5>
//                   <p className="card-text text-muted" style={{ fontSize: '0.9rem', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                     {product.description.substring(0, 70)}{product.description.length > 70 ? '...' : ''}
//                   </p>
//                   <div className="mt-auto d-flex justify-content-between align-items-center pt-3 border-top border-secondary-subtle">
//                     <span className="fw-bold text-success fs-5">${parseFloat(product.price).toFixed(2)}</span>
//                     <div className="btn-group" role="group">
//                       <Link to={`/dashboard/edit-product/${product.id}`} className="btn btn-sm btn-outline-light text-app-link-light">
//                         <i className="bi bi-pencil-square me-1"></i> Update
//                       </Link>
//                       <button
//                         className="btn btn-sm btn-outline-danger ms-2"
//                         onClick={() => handleDelete(product.id)}
//                       >
//                         <i className="bi bi-trash me-1"></i> Delete
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

// export default ListedProductsPage;


// src/components/dashboard/ListedProductsPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';

function ListedProductsPage() {
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [showLowStockNotification, setShowLowStockNotification] = useState(false); // NEW: State for global notification

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (token) {
      fetchUserProducts();
    } else {
      setError('Authentication token is missing. Please log in again.');
      setLoading(false);
    }
  }, [isLoggedIn, navigate, token]);

  const fetchUserProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/user/products', {
        headers: {
          'x-auth-token': token,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);

      // NEW: Check for low stock products after fetching
      const lowStockExists = data.some(product => product.stock_quantity < 10);
      setShowLowStockNotification(lowStockExists);

    } catch (err) {
      setError(`Error fetching your listed products: ${err.message}`);
      console.error('Error fetching user products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setMessage('Product deleted successfully!');
      fetchUserProducts(); // Refresh the list
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setError(`Error deleting product: ${err.message}`);
      console.error('Delete error:', err);
      setTimeout(() => setError(''), 2000);
    }
  };

  if (loading) {
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading products...</span>
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
        Your Listed Products ({products.length})
      </h2>

      {message && <div className="alert alert-success text-center animate__animated animate__fadeIn">{message}</div>}

      {/* NEW: Low Stock Global Notification */}
      {showLowStockNotification && (
        <div className="alert alert-warning text-center animate__animated animate__shakeX animate__delay-0.2s mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <span className="text-dark fw-bold">Some of your products are running low on stock! Please replenish them soon.</span>
        </div>
      )}

      <div className="d-flex justify-content-end mb-4 animate__animated animate__fadeInUp">
        <Link to="/dashboard/add-product" className="btn btn-app-accent-gradient btn-lg">
          <i className="bi bi-plus-circle me-2"></i> Add New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="alert alert-info text-center animate__animated animate__fadeIn">
          You haven't uploaded any products yet.
          <Link to="/dashboard/add-product" className="alert-link text-app-accent ms-2">Add your first product!</Link>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 animate__animated animate__fadeInUp animate__delay-0.2s">
          {products.map((product) => (
            <div className="col" key={product.id}>
              <div className="card h-100 shadow-sm rounded-lg overflow-hidden">
                <img
                  src={`http://localhost:5000/${product.image_url}`}
                  className="card-img-top"
                  alt={product.name}
                  style={{ height: '250px', objectFit: 'cover' }}
                />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title fw-bold text-dark mb-2">{product.name}</h5>
                  <p className="card-text text-muted" style={{ fontSize: '0.9rem', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.description.substring(0, 70)}{product.description.length > 70 ? '...' : ''}
                  </p>
                  <div className="mt-auto d-flex justify-content-between align-items-center pt-3 border-top border-secondary-subtle">
                    <span className="fw-bold text-success fs-5">PKR {parseFloat(product.price).toFixed(2)}</span>
                    
                    {/* NEW: Stock Quantity and Low Stock Badge */}
                    <div className="d-flex align-items-center">
                        <span className="me-2 text-muted">Stock: <span className="fw-bold text-dark">{product.stock_quantity}</span></span>
                        {product.stock_quantity < 10 && (
                            <span className="badge bg-warning text-dark fw-bold animate__animated animate__flash animate__infinite">
                                Low Stock!
                            </span>
                        )}
                    </div>

                    <div className="btn-group" role="group">
                      <Link to={`/dashboard/edit-product/${product.id}`} className="btn btn-sm btn-outline-dark text-app-link-dark">
                        <i className="bi bi-pencil-square me-1"></i> Update
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger ms-2"
                        onClick={() => handleDelete(product.id)}
                      >
                        <i className="bi bi-trash me-1"></i> Delete
                      </button>
                    </div>
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

export default ListedProductsPage;