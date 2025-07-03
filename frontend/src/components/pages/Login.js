// // src/components/LoginPage.js
// import React, { useState } from 'react';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext'; // Import useAuth

// function LoginPage() {
//   const navigate = useNavigate();
//   const { login } = useAuth(); // Destructure the login function from useAuth

//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//   });

//   const [errors, setErrors] = useState({});
//   const [submissionMessage, setSubmissionMessage] = useState('');
//   const [showPassword, setShowPassword] = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//     if (errors[name]) {
//       setErrors({ ...errors, [name]: '' });
//     }
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   const validateForm = () => {
//     let newErrors = {};
//     const { email, password } = formData;

//     if (!email.trim()) {
//       newErrors.email = 'Email address is required.';
//     } else if (!/\S+@\S+\.\S+/.test(email)) {
//       newErrors.email = 'Email address is invalid.';
//     }
//     if (!password) {
//       newErrors.password = 'Password is required.';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmissionMessage('');

//     if (validateForm()) {
//       try {
//         // console.log('Sending login data to backend:', formData);

//         const response = await fetch('http://localhost:5000/api/login', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(formData),
//         });

//         const data = await response.json();

//         if (response.ok) {
//           setSubmissionMessage(data.message || 'Login successful! Redirecting...');
          
//           if (data.token) {
//             // Call the login function from AuthContext
//             login(data.token, data.user); // Assuming your backend sends 'user' object in data
//             // console.log('JWT stored and AuthContext updated:', data.token);
//           }

//           setFormData({ email: '', password: '' }); // Clear form

//           setTimeout(() => {
//             navigate('/dashboard'); // Redirect to your protected dashboard/home route
//           }, 1500);
//         } else {
//           setSubmissionMessage(data.message || 'Login failed. Please check your credentials.');
//         }
//       } catch (error) {
//         console.error('Error during login (network or server issue):', error);
//         setSubmissionMessage('An error occurred. Please try again later.');
//       }
//     } else {
//       setSubmissionMessage('Please enter your email and password.');
//     }
//   };

//   return (
//     <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', paddingTop: '70px', paddingBottom: '20px' }}>
//       <div className="card shadow-lg p-4" style={{ maxWidth: '450px', width: '100%' }}>
//         <div className="card-body">
//           <h2 className="card-title text-center text-success mb-4 fw-bold">Login to Abaya Haven</h2>
//           <p className="text-center text-muted mb-4">Welcome back! Please enter your credentials.</p>

//           <form onSubmit={handleSubmit}>
//             <div className="mb-3">
//               <label htmlFor="email" className="form-label">Email address</label>
//               <input
//                 type="email"
//                 className={`form-control ${errors.email ? 'is-invalid' : ''}`}
//                 id="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="name@example.com"
//               />
//               {errors.email && <div className="invalid-feedback">{errors.email}</div>}
//             </div>

//             <div className="mb-4">
//               <label htmlFor="password" className="form-label">Password</label>
//               <div className="input-group">
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   className={`form-control ${errors.password ? 'is-invalid' : ''}`}
//                   id="password"
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   placeholder="Your password"
//                 />
//                 <button
//                   className="btn btn-outline-secondary"
//                   type="button"
//                   onClick={togglePasswordVisibility}
//                   aria-label={showPassword ? 'Hide password' : 'Show password'}
//                 >
//                   <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
//                 </button>
//                 {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
//               </div>
//             </div>

//             <div className="d-flex justify-content-between align-items-center mb-4">
//               <div className="form-check">
//                 <input className="form-check-input" type="checkbox" id="rememberMe" />
//                 <label className="form-check-label text-muted" htmlFor="rememberMe">
//                   Remember me
//                 </label>
//               </div>
//               <a href="/forgot-password" className="text-success text-decoration-none fw-bold small">Forgot Password?</a>
//             </div>

//             {submissionMessage && (
//               <div className={`alert ${submissionMessage.includes('successful') ? 'alert-success' : 'alert-danger'} mt-3`} role="alert">
//                 {submissionMessage}
//               </div>
//             )}

//             <div className="d-grid gap-2">
//               <button type="submit" className="btn btn-success btn-lg fw-bold">Login</button>
//             </div>

//             <p className="text-center mt-4 mb-0 text-muted">
//               Don't have an account? <a href="/signup" className="text-success text-decoration-none fw-bold">Sign Up here</a>
//             </p>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default LoginPage;

// src/components/LoginPage.js
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import '../../styles/LoginPage.css'; // Import your custom CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons'; // Import icons

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // Destructure the login function from useAuth

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    let newErrors = {};
    const { email, password } = formData;

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionMessage('');

    if (validateForm()) {
      try {
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          setSubmissionMessage(data.message || 'Login successful! Redirecting...');
          
          if (data.token) {
            login(data.token, data.user); 
          }

          setFormData({ email: '', password: '' }); 

          setTimeout(() => {
            navigate('/dashboard'); 
          }, 1500);
        } else {
          setSubmissionMessage(data.message || 'Login failed. Please check your credentials.');
        }
      } catch (error) {
        console.error('Error during login (network or server issue):', error);
        setSubmissionMessage('An error occurred. Please try again later.');
      }
    } else {
      setSubmissionMessage('Please enter your email and password.');
    }
  };

  return (
    <div className="login-page-container d-flex justify-content-center align-items-center">
      <div className="login-card shadow-lg p-4">
        <div className="card-body">
          <h2 className="card-title text-center mb-4 fw-bold">Login to Abaya Haven 🌙</h2>
          <p className="text-center text-muted mb-4">Welcome back! Please enter your credentials.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3 form-group">
              <label htmlFor="email" className="form-label">Email address</label>
              <div className="input-group modern-input-group">
                <span className="input-group-text"><FontAwesomeIcon icon={faEnvelope} /></span>
                <input
                  type="email"
                  className={`form-control modern-form-control ${errors.email ? 'is-invalid' : ''}`}
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
            </div>

            <div className="mb-4 form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-group modern-input-group">
                <span className="input-group-text"><FontAwesomeIcon icon={faLock} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control modern-form-control ${errors.password ? 'is-invalid' : ''}`}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Your password"
                />
                <button
                  className="btn btn-outline-secondary toggle-password-btn"
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check modern-checkbox">
                <input className="form-check-input" type="checkbox" id="rememberMe" />
                <label className="form-check-label text-muted" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
              <a href="/forgot-password" className="forgot-password-link text-decoration-none fw-bold small">Forgot Password?</a>
            </div>

            {submissionMessage && (
              <div className={`alert ${submissionMessage.includes('successful') ? 'alert-success' : 'alert-danger'} mt-3`} role="alert">
                {submissionMessage}
              </div>
            )}

            <div className="d-grid gap-2">
              <button type="submit" className="btn login-btn btn-lg fw-bold">Login</button>
            </div>

            <p className="text-center mt-4 mb-0 text-muted">
              Don't have an account? <a href="/signup" className="signup-link text-decoration-none fw-bold">Sign Up here</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;