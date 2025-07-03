// src/contexts/CartContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // To get token and user info

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const { token, isLoggedIn } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartError, setCartError] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn || !token) {
      setCartItems([]);
      setLoadingCart(false);
      return;
    }

    setLoadingCart(true);
    setCartError(null);
    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: {
          'x-auth-token': token,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch cart.');
      }

      const data = await response.json();
      setCartItems(data);
    } catch (err) {
      setCartError(err.message);
      console.error('Error fetching cart:', err);
      setCartItems([]);
    } finally {
      setLoadingCart(false);
    }
  }, [isLoggedIn, token]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isLoggedIn) {
      setCartError('Please log in to add items to the cart.');
      return false;
    }
    if (!token) {
        setCartError('Authentication token missing. Please log in again.');
        return false;
    }

    setCartError(null);
    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product to cart.');
      }

      await fetchCart();
      return true;
    } catch (err) {
      setCartError(err.message);
      console.error('Error adding to cart:', err);
      return false;
    }
  };

  // NEW: Update quantity of a product in the cart
  const updateCartQuantity = async (productId, newQuantity) => {
    if (!isLoggedIn || !token) {
      setCartError('Not authenticated.');
      return false;
    }
    setCartError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/cart/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update cart quantity.');
      }

      await fetchCart(); // Re-fetch cart to reflect changes
      return true;
    } catch (err) {
      setCartError(err.message);
      console.error('Error updating cart quantity:', err);
      return false;
    }
  };

  // NEW: Remove a product from the cart
  const removeFromCart = async (productId) => {
    if (!isLoggedIn || !token) {
      setCartError('Not authenticated.');
      return false;
    }
    setCartError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/cart/${productId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove product from cart.');
      }

      await fetchCart(); // Re-fetch cart to reflect changes
      return true;
    } catch (err) {
      setCartError(err.message);
      console.error('Error removing from cart:', err);
      return false;
    }
  };


  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (!isLoggedIn) {
      setCartItems([]);
    }
  }, [isLoggedIn]);

  const value = {
    cartItems,
    loadingCart,
    cartError,
    fetchCart,
    addToCart,
    updateCartQuantity, // NEW: Add to context value
    removeFromCart,     // NEW: Add to context value
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};