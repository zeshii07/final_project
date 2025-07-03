// // src/components/ProductListingPage.js
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext'; // <-- NEW: Import useAuth
// import { useCart } from '../../contexts/CartContext'; // <-- NEW: Import useCart
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css'; // For cart icon

// function ProductListingPage() {
//   const { isLoggedIn } = useAuth(); // Get login status
//   const { addToCart, cartError: cartContextError } = useCart(); // Get addToCart function and error from CartContext

//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [statusMessage, setStatusMessage] = useState(''); // For add to cart success/error

//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const response = await fetch('http://localhost:5000/api/products');
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();
//         setProducts(data);
//       } catch (err) {
//         setError(err.message);
//         console.error("Failed to fetch products:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProducts();
//   }, []);

//   // Handler for Add to Cart button
//   const handleAddToCart = async (productId) => {
//     if (!isLoggedIn) {
//       setStatusMessage({ type: 'error', text: 'Please log in to add items to your cart.' });
//       setTimeout(() => setStatusMessage(''), 3000);
//       return;
//     }

//     const success = await addToCart(productId);
//     if (success) {
//       setStatusMessage({ type: 'success', text: 'Product added to cart!' });
//     } else {
//       // The error message is already set in CartContext, but we can show a generic one or pass it through
//       setStatusMessage({ type: 'error', text: cartContextError || 'Failed to add product to cart.' });
//     }
//     setTimeout(() => setStatusMessage(''), 3000); // Clear message after 3 seconds
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
//           Error: {error}
//         </div>
//       </div>
//     );
//   }

//   if (products.length === 0) {
//     return (
//       <div className="container mt-5 pt-5 text-center">
//         <div className="alert alert-info" role="alert">
//           No products found.
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mt-5 pt-5">
//       <h2 className="text-center text-success mb-4 fw-bold">Our Latest Collection</h2>

//       {/* NEW: Status Message for Add to Cart */}
//       {statusMessage && (
//         <div className={`alert ${statusMessage.type === 'success' ? 'alert-success' : 'alert-danger'} text-center mb-4`}>
//           {statusMessage.text}
//         </div>
//       )}

//       <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
//         {products.map((product) => (
//           <div className="col" key={product.id}>
//             <div className="card h-100 shadow-sm border-0 transform-on-hover">
//               <img
//                 src={`http://localhost:5000/${product.image_url}`}
//                 className="card-img-top"
//                 alt={product.name}
//                 style={{ height: '300px', objectFit: 'cover', borderTopLeftRadius: '0.25rem', borderTopRightRadius: '0.25rem' }}
//               />
//               <div className="card-body d-flex flex-column">
//                 <h5 className="card-title text-dark fw-bold">{product.name}</h5>
//                 <p className="card-text text-muted flex-grow-1" style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
//                   {product.description}
//                 </p>
//                 <div className="d-flex justify-content-between align-items-center mt-3">
//                   <span className="fw-bold text-success fs-4">${parseFloat(product.price).toFixed(2)}</span>
//                   <div className="btn-group"> {/* Use btn-group for multiple buttons */}
//                     <Link to={`/products/${product.id}`} className="btn btn-outline-success btn-sm fw-bold">
//                       View Details <i className="bi bi-arrow-right"></i>
//                     </Link>
//                     <button
//                       className="btn btn-success btn-sm fw-bold ms-2" // Added ms-2 for margin
//                       onClick={() => handleAddToCart(product.id)}
//                       disabled={!isLoggedIn || product.stock_quantity === 0} // Disable if not logged in or out of stock
//                     >
//                       {product.stock_quantity === 0 ? 'Out of Stock' : (
//                         <>
//                           <i className="bi bi-cart-plus me-1"></i> Add to Cart
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default ProductListingPage;

// src/components/ProductListingPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Path adjusted to go up one level
import { useCart } from '../../contexts/CartContext'; // Path adjusted to go up one level
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // For cart icon
// No need to import Theme.css here if it's imported in index.js

function ProductListingPage() {
  const { isLoggedIn, user } = useAuth(); // Get user object for welcome message
  const { addToCart, cartError: cartContextError } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null); // Changed to null for clearer checks

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    setStatusMessage(null); // Clear previous messages

    if (!isLoggedIn) {
      setStatusMessage({ type: 'error', text: 'Please log in to add items to your cart.' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const success = await addToCart(productId);
    if (success) {
      setStatusMessage({ type: 'success', text: 'Product added to cart!' });
    } else {
      setStatusMessage({ type: 'error', text: cartContextError || 'Failed to add product to cart.' });
    }
    setTimeout(() => setStatusMessage(null), 3000); // Clear message after 3 seconds
  };

  if (loading) {
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5"> {/* Added min-vh-100 py-5 for centering */}
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
          Error: {error}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mt-5 pt-5 text-center">
        <div className="alert alert-info" role="alert">
          No products found.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 pt-5 pb-5"> {/* Added pb-5 for consistent bottom padding */}
      {isLoggedIn && user && ( // NEW: Conditional Welcome message
        <h2 className="text-center text-dark mb-4 animate__animated animate__fadeInDown">
          Welcome, <span className="text-success">{user.username}</span>!
        </h2>
      )}
      <h2 className="text-center text-success mb-4 fw-bold animate__animated animate__fadeInUp">Our Latest Collection</h2>

      {/* Status message for Add to Cart */}
      {statusMessage && (
        <div className={`alert ${statusMessage.type === 'success' ? 'alert-success' : 'alert-danger'} text-center mb-4 animate__animated animate__fadeIn`}>
          {statusMessage.text}
        </div>
      )}

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 animate__animated animate__fadeInUp animate__delay-0.5s">
        {products.map((product) => (
          <div className="col" key={product.id}>
            {/* The 'card' class will now pick up styles from Theme.css */}
            <div className="card h-100 shadow-sm border-0 rounded-lg overflow-hidden">
              <img
                src={`http://localhost:5000/${product.image_url}`}
                className="card-img-top"
                alt={product.name}
                style={{ height: '300px', objectFit: 'cover' }}
              />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title text-dark fw-bold">{product.name}</h5> {/* Using text-light for title */}
                <p className="card-text text-muted flex-grow-1" style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {product.description}
                </p>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  {/* text-success will use the accent color from Theme.css */}
                  <span className="fw-bold text-success fs-4">PKR {parseFloat(product.price).toFixed(2)}</span>
                  <div className="btn-group">
                    {/* Using btn-outline-light and text-app-link-light for theme consistency */}
                    <Link to={`/products/${product.id}`} className="btn btn-outline-light btn-sm fw-bold text-app-link-light">
                      View Details <i className="bi bi-arrow-right"></i>
                    </Link>
                    {/* Using the new btn-app-accent-gradient class */}
                    <button
                      className="btn btn-app-accent-gradient btn-sm fw-bold ms-2"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={!isLoggedIn || product.stock_quantity === 0}
                    >
                      {product.stock_quantity === 0 ? 'Out of Stock' : (
                        <>
                          <i className="bi bi-cart-plus me-1"></i> Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductListingPage;