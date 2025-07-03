// src/components/ProductUploadPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Assuming useAuth for token
import 'bootstrap/dist/css/bootstrap.min.css';

function ProductUploadPage() {
  const { id } = useParams(); // Get product ID from URL if editing
  const navigate = useNavigate();
  const { token, isLoggedIn } = useAuth(); // Get token from AuthContext

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(''); // For displaying existing image during edit

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formMessage, setFormMessage] = useState(''); // For success/error messages after submission

  const isEditing = !!id; // True if 'id' parameter exists in URL

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login'); // Redirect to login if not authenticated
      return;
    }

    if (isEditing) {
      // Fetch existing product data if in edit mode
      const fetchProduct = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/products/${id}`);
          if (!response.ok) {
            if (response.status === 404) throw new Error('Product not found.');
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          // Populate form fields with fetched data
          setProductName(data.name || '');
          setDescription(data.description || '');
          setPrice(data.price != null ? parseFloat(data.price).toFixed(2) : ''); // Use parseFloat for consistency
          setCategory(data.category || '');
          setStockQuantity(data.stock_quantity || '');
          setCurrentImageUrl(data.image_url ? `http://localhost:5000/${data.image_url}` : '');
        } catch (err) {
          setError(`Failed to load product: ${err.message}`);
          console.error('Error fetching product for edit:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    } else {
      setLoading(false); // No loading needed for new product form
    }
  }, [id, isEditing, isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage('');
    setError(null);

    if (!token) {
      setFormMessage('You must be logged in to perform this action.');
      return;
    }

    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('stock_quantity', stockQuantity);
    if (imageFile) {
      formData.append('image', imageFile); // 'image' must match the field name in upload.single('image')
    }

    const url = isEditing ? `http://localhost:5000/api/products/${id}` : 'http://localhost:5000/api/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'x-auth-token': token, // Send the JWT token for authentication
        },
        body: formData, // FormData handles 'Content-Type: multipart/form-data' automatically
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setFormMessage(`Product ${isEditing ? 'updated' : 'added'} successfully!`);
      // Optionally reset form for new product or redirect
      if (!isEditing) {
        setProductName('');
        setDescription('');
        setPrice('');
        setCategory('');
        setStockQuantity('');
        setImageFile(null);
        document.getElementById('imageUpload').value = ''; // Clear file input
      }
      setTimeout(() => navigate('/dashboard'), 2000); // Redirect to dashboard after 2 seconds
    } catch (err) {
      setError(`Error ${isEditing ? 'updating' : 'adding'} product: ${err.message}`);
      console.error('Submission error:', err);
    }
  };

  if (loading) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', paddingTop: '70px' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading form...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 pt-5">
      <h2 className="text-center text-success mb-4 fw-bold">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg p-4">
            {formMessage && <div className="alert alert-success">{formMessage}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="productName" className="form-label fw-bold">Product Name:</label>
                <input
                  type="text"
                  className="form-control"
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label fw-bold">Description:</label>
                <textarea
                  className="form-control"
                  id="description"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="price" className="form-label fw-bold">Price:</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="category" className="form-label fw-bold">Category:</label>
                <input
                  type="text"
                  className="form-control"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="stockQuantity" className="form-label fw-bold">Stock Quantity:</label>
                <input
                  type="number"
                  className="form-control"
                  id="stockQuantity"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="imageUpload" className="form-label fw-bold">Product Image:</label>
                <input
                  type="file"
                  className="form-control"
                  id="imageUpload"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  required={!isEditing} // Image is required only for new product
                />
                {isEditing && currentImageUrl && (
                  <div className="mt-2">
                    <p className="mb-1 text-muted">Current Image:</p>
                    <img src={currentImageUrl} alt="Current Product" className="img-thumbnail" style={{ maxWidth: '150px', height: 'auto' }} />
                  </div>
                )}
              </div>
              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <button type="submit" className="btn btn-success me-md-2">
                  {isEditing ? 'Update Product' : 'Add Product'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/dashboard')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductUploadPage;