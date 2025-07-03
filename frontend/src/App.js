// src/App.js
import React from "react";
import "./styles/Theme.css";
import "./index.css"; //  global style
// NEW: Import Bootstrap JavaScript bundle here instead of index.js
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; // Make sure this path is correct
import Footer from "./components/Footer"; // Make sure this path is correct
import SignupPage from "./components/pages/Signup";
import LoginPage from "./components/pages/Login";
import LandingPage from "./components/pages/Landing";
import OrderConfirmationPage from "./components/pages/OrderConfirmationPage";
// NEW: Import the dedicated pages for dashboard actions
import ListedProductsPage from "./components/pages/dashboard/ListedProductsPage"; // Assuming dashboard subfolder
import PurchaseHistoryPage from "./components/pages/dashboard/PurchaseHistoryPage";
import OrdersReceivedPage from "./components/pages/dashboard/OrdersReceivedPage";
import AdminDashboardPage from "./components/pages/admin/AdminDashboardPage";
import PrivateRoute from "./contexts/PrivateRoute";
import ReportsPage from "./components/pages/dashboard/ReportsPage"; // Placeholder
import UserManagementPage from "./components/pages/admin/UserManagementPage"; 
import ProductManagementPage from "./components/pages/admin/ProductManagementPage";
import OrderManagementPage from "./components/pages/admin/OrderManagementPage";
import AdminReportsPage from "./components/pages/admin/ReportsPage";
// NEW: Stripe Imports 
  //  import {loadStripe} from '@stripe/stripe-js';
  //  import {Elements} from '@stripe/react-stripe-js';
           
import Checkout from "./components/pages/Checkout";
import DashboardPage from "./components/pages/DashBoard";
import ProductListingPage from "./components/pages/ListingPage"; // NEW
import ProductDetailPage from "./components/pages/ProductdetailsPage";
import ProductUploadPage from "./components/pages/ProductUploadPage";
import ContactUsPage from "./components/pages/ContactUsPage";
import CartPage from "./components/pages/CartPage";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
//  const stripePromise = loadStripe('pk_test_51RZppTC1uH5TpKdXvBzMQ4H5NyXyT1EuYTSAr63puwfmHE3XPql1hngANGXxIqpSssUuFfkLZC7WXQazdQBqWUOr00t0VypC9p');  // Import AuthProvider from correct path
function App() {
  return (
    <Router>
      <AuthProvider>
        {" "}
        {/* THIS IS CRUCIAL: AuthProvider must wrap all components that use AuthContext */}
        <CartProvider>
          {" "}
          {/* <-- NEW: CartProvider wraps the routes */}
          <Navbar /> {/* Navbar is inside AuthProvider */}
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
             <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route
              path="/dashboard/add-product"
              element={<ProductUploadPage />}
            />{" "}
            {/* NEW: Add Product Route */}
            <Route
              path="/dashboard/edit-product/:id"
              element={<ProductUploadPage />}
            />
            <Route path="/products" element={<ProductListingPage />} />{" "}
            {/* NEW: Product Listing */}
            <Route path="/products/:id" element={<ProductDetailPage />} />{" "}
            {/* NEW: Product Detail */}
            <Route path="/contact" element={<ContactUsPage />} />
             <Route path="/admin-panel" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
              {/* Update this line: */}
            <Route path="/admin/user-management" element={<PrivateRoute><UserManagementPage /></PrivateRoute>} /> {/* <<< UPDATED ROUTE */}
            
            {/* Placeholder routes for other admin sub-pages */}
            <Route path="/admin/stock-management" element={<PrivateRoute><ProductManagementPage /></PrivateRoute>} />
             <Route path="/admin/order-management" element={<PrivateRoute><OrderManagementPage /></PrivateRoute>} />
           <Route path="/admin/platform-reports" element={<PrivateRoute><AdminReportsPage /></PrivateRoute>} />

            {/* ... Your other protected routes ... */}
            <Route path="/checkout" element={<Checkout />} />
{/*             
            
            
            {/* NEW: Dedicated Dashboard Functionality Pages */}
            <Route
              path="/dashboard/products"
              element={<ListedProductsPage />}
            />
            <Route
              path="/dashboard/orders/placed"
              element={<PurchaseHistoryPage />}
            />
            <Route
              path="/dashboard/orders/received"
              element={<OrdersReceivedPage />}
            />
            <Route path="/reports" element={<ReportsPage />} />{" "}
            {/* General reports page */}
            <Route path="/cart" element={<CartPage />} />{" "}
            {/* <-- NEW: Cart Page Route */}
            {/* Add other routes here */}
          </Routes>
          <Footer />
        </CartProvider>{" "}
        {/* <-- NEW: Close CartProvider */}
      </AuthProvider>
    </Router>
  );
}

export default App;
