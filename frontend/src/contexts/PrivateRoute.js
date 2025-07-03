// src/components/auth/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // for authentication

/**
 * A PrivateRoute component that checks if the user is authenticated.
 * If the user is not logged in, it redirects them to the login page.
 * Otherwise, it renders the child components.
 *
 * This component acts as a wrapper for routes that require authentication.
 */
function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth(); // Assuming useAuth provides isLoggedIn and maybe loading state

  // You might have a loading state in your AuthContext during initial auth check
  // If so, you could display a loading spinner here.
  // For now, we'll assume isLoggedIn is quickly available.
  // If your AuthContext has a 'loading' state, you might uncomment this:
  // if (loading) {
  //   return (
  //     <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
  //       <div className="spinner-border text-primary" role="status">
  //         <span className="visually-hidden">Loading authentication...</span>
  //       </div>
  //     </div>
  //   );
  // }

  // If the user is logged in, render the children (the protected component)
  if (isLoggedIn) {
    return children;
  }

  // If the user is not logged in, redirect them to the login page
  // `replace` prop ensures that navigating back won't bring them to the protected page
  return <Navigate to="/login" replace />;
}

export default PrivateRoute;