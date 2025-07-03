// // // src/contexts/AuthContext.js
// // import React, { createContext, useContext, useState, useEffect } from 'react';
// // import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirects

// // const AuthContext = createContext(null);

// // export const AuthProvider = ({ children }) => {
// //   const [isLoggedIn, setIsLoggedIn] = useState(false);
// //   const [user, setUser] = useState(null);
// //   const [token, setToken] = useState(null);

// //   const navigate = useNavigate(); // Initialize useNavigate hook

// //   // Helper function to safely get and parse JSON from localStorage
// //   const getParsedLocalStorageItem = (key) => {
// //     const item = localStorage.getItem(key);
// //     // If item is null (key doesn't exist) or the string "undefined", return null
// //     if (item === null || item === "undefined") {
// //       return null;
// //     }
// //     try {
// //       return JSON.parse(item);
// //     } catch (e) {
// //       console.error(`Error parsing localStorage item '${key}':`, e);
// //       // If parsing fails, it means the stored data is corrupt. Remove it.
// //       localStorage.removeItem(key);
// //       return null;
// //     }
// //   };

// //   useEffect(() => {
// //     const storedToken = localStorage.getItem('token'); // Token is usually just a string, no JSON.parse needed
// //     const storedUser = getParsedLocalStorageItem('user'); // Use the safe helper for user object

// //     if (storedToken && storedUser) {
// //       setIsLoggedIn(true);
// //       setToken(storedToken);
// //       setUser(storedUser);
// //     } else {
// //       // If either token or user data is missing or invalid, ensure logged out state
// //       setIsLoggedIn(false);
// //       setToken(null);
// //       setUser(null);
// //       localStorage.removeItem('token'); // Clean up any potentially bad token
// //       localStorage.removeItem('user');  // Clean up any potentially bad user data
// //     }
// //   }, []); // Empty dependency array means this runs once on mount

// //   const login = async (token, userData) => {
// //     // Ensure user data is stringified before storing
// //     localStorage.setItem('token', token);
// //     localStorage.setItem('user', JSON.stringify(userData));
// //     setIsLoggedIn(true);
// //     setToken(token);
// //     setUser(userData);
// //   };

// //   const logout = () => {
// //     localStorage.removeItem('token');
// //     localStorage.removeItem('user');
// //     setIsLoggedIn(false);
// //     setToken(null);
// //     setUser(null);
// //     navigate('/login'); // Redirect to login page after logout
// //   };

// //   // The value provided by the AuthContext to its consumers
// //   const authContextValue = {
// //     isLoggedIn,
// //     user,
// //     token,
// //     login,
// //     logout,
// //   };

// //   return (
// //     <AuthContext.Provider value={authContextValue}>
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // };

// // export const useAuth = () => useContext(AuthContext);

// // src/contexts/AuthContext.js
// import React, { createContext, useContext, useState, useEffect } from 'react';

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   // Initialize state directly from localStorage or default to null/false
//   const [token, setToken] = useState(() => localStorage.getItem('token') || null);
//   const [user, setUser] = useState(() => {
//     const storedUser = localStorage.getItem('user');
//     return storedUser ? JSON.parse(storedUser) : null;
//   });
//   const [isLoggedIn, setIsLoggedIn] = useState(!!token); // Derive isLoggedIn from token presence

//   // useEffect to handle initial loading and re-check on mount
//   useEffect(() => {
//     const storedToken = localStorage.getItem('token');
//     const storedUser = localStorage.getItem('user');

//     if (storedToken && storedUser) {
//       try {
//         const parsedUser = JSON.parse(storedUser);
//         // Optional: Add token validation here (e.g., check expiry if it's a JWT)
//         // For now, simply setting them is enough to persist login state
//         setToken(storedToken);
//         setUser(parsedUser);
//         setIsLoggedIn(true);
//       } catch (e) {
//         console.error("Failed to parse user from localStorage or token invalid:", e);
//         // If data is corrupt or invalid, clear it
//         logout(); // Use the logout function to clear everything
//       }
//     } else {
//       // If no token or user is found in localStorage, ensure we are logged out
//       if (isLoggedIn) { // Only force logout if current state says logged in (e.g., after a manual clear)
//         logout();
//       }
//     }
//   }, []); // Empty dependency array ensures this runs only once on mount

//   const login = (newToken, newUser) => {
//     localStorage.setItem('token', newToken);
//     localStorage.setItem('user', JSON.stringify(newUser));
//     setToken(newToken);
//     setUser(newUser);
//     setIsLoggedIn(true);
//     console.log('User logged in:', newUser.username);
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setToken(null);
//     setUser(null);
//     setIsLoggedIn(false);
//     console.log('User logged out.');
//   };

//   // The context value
//   const authContextValue = {
//     isLoggedIn,
//     token,
//     user,
//     login,
//     logout
//   };

//   return (
//     <AuthContext.Provider value={authContextValue}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom hook to use the AuthContext
// export const useAuth = () => {
//   return useContext(AuthContext);
// };
 // src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the Context
const AuthContext = createContext(null); // Initialize with null as a default, will be overwritten by Provider

// 2. AuthProvider Component
export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage on component mount
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage on AuthProvider init:", e);
      localStorage.removeItem('user'); // Clear potentially corrupt data
      return null;
    }
  });
  // isLoggedIn is derived directly from token presence
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);

  // useEffect to re-sync state with localStorage on initial mount/updates
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Basic validation: ensure parsedUser exists and has user_type
        if (parsedUser && typeof parsedUser.user_type === 'string') {
            // Only update if current state differs to avoid unnecessary re-renders
            if (token !== storedToken) setToken(storedToken);
            if (JSON.stringify(user) !== JSON.stringify(parsedUser)) setUser(parsedUser);
            if (!isLoggedIn) setIsLoggedIn(true);
        } else {
            console.error("Stored user data missing user_type or invalid. Clearing authentication data.");
            logout(); // Invalidate if stored user data is malformed
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage in useEffect:", e);
        logout(); // Clear authentication if parsing fails (corrupt data)
      }
    } else {
      // If no token or user is found in localStorage, ensure we are logged out
      if (isLoggedIn || token || user) { // Only call logout if state indicates logged in
        logout();
      }
    }
  }, [token, user, isLoggedIn]); // Dependencies to re-run effect if these change

  // Login function: stores data and updates state
  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsLoggedIn(true);
    console.log('User logged in:', newUser.username, 'Type:', newUser.user_type);
  };

  // Logout function: clears data and updates state
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    console.log('User logged out.');
  };

  // The value provided by the context provider
  const authContextValue = {
    isLoggedIn,
    token,
    user,
    login,
    logout,
  };

  // NEW: Debugging log to confirm provider is rendering its value
  console.log('AuthProvider is rendering. Context value:', authContextValue);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom Hook to Consume the Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  // This check is good practice to provide clear errors
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};