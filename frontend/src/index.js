// import React from 'react';
// import ReactDOM from 'react-dom/client';
// // import { BrowserRouter } from 'react-router-dom';
// import App from './App';
// import 'bootstrap/dist/css/bootstrap.min.css';
// // IMPORTANT: Import Bootstrap's JavaScript bundle
// import 'bootstrap/dist/js/bootstrap.bundle.min';
// // This includes Popper.js, which Bootstrap's JS components often depend on.
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';


// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//       <App />
    
//   </React.StrictMode>
// );


// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import Bootstrap CSS (you probably already have this)
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/Theme.css';

// NEW: Import Bootstrap JavaScript bundle
// This includes Popper.js, which Bootstrap's JS components often depend on.
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();