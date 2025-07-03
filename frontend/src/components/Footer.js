import React from 'react';

function Footer() {
  return (
    <footer className="bg-dark text-white py-5">
      <div className="container">
        <div className="row">
          {/* Brand Info */}
          <div className="col-md-4 mb-4 text-center text-md-start">
            <h5 className="fw-bolder text-white mb-3 fs-4">Abaya <span className="text-success">Haven</span></h5>
            <p className="text-muted">Your premier online marketplace for exquisite abayas and modest fashion.</p>
          </div>

          {/* Quick Links */}
          <div className="col-md-4 mb-4 text-center">
            <h5 className="fw-bold text-white mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-white text-decoration-none py-1 d-inline-block">Home</a></li>
              <li><a href="/shop" className="text-white text-decoration-none py-1 d-inline-block">Shop Now</a></li>
              <li><a href="/sell" className="text-white text-decoration-none py-1 d-inline-block">Become a Seller</a></li>
              <li><a href="/contact" className="text-white text-decoration-none py-1 d-inline-block">Contact Us</a></li>
            </ul>
          </div>

          {/* Connect With Us */}
          <div className="col-md-4 mb-4 text-center text-md-end">
            <h5 className="fw-bold text-white mb-3">Connect With Us</h5>
            <div className="d-flex justify-content-center justify-content-md-end mb-3">
              <a href="#" className="text-white mx-2 fs-4"><i className="bi bi-facebook"></i></a>
              <a href="#" className="text-white mx-2 fs-4"><i className="bi bi-instagram"></i></a>
              <a href="#" className="text-white mx-2 fs-4"><i className="bi bi-twitter"></i></a>
              <a href="#" className="text-white mx-2 fs-4"><i className="bi bi-pinterest"></i></a>
            </div>
            <p className="text-muted small">Stay updated with our latest collections and offers!</p>
          </div>
        </div>

        <hr className="bg-secondary my-4" /> {/* Divider */}

        {/* Copyright */}
        <div className="text-center text-muted small">
          <p>&copy; {new Date().getFullYear()} Abaya Haven. All rights reserved.</p>
          <ul className="list-inline mb-0">
            <li className="list-inline-item"><a href="/privacy" className="text-white text-decoration-none">Privacy Policy</a></li>
            <li className="list-inline-item"><span className="text-muted mx-1">|</span></li>
            <li className="list-inline-item"><a href="/terms" className="text-white text-decoration-none">Terms of Service</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;