// src/components/dashboard/ReportsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';
// Ensure Theme.css is imported globally in index.js for consistent styling

function ReportsPage() {
  const { isLoggedIn, token, user } = useAuth();
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]); // For aggregated monthly data
  const [detailedOrders, setDetailedOrders] = useState([]); // For individual orders for a selected month
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(''); // Selected month for detailed report (e.g., '01')
  const [currentYear, setCurrentYear] = useState('');   // Selected year for detailed report (e.g., '2024')
  const [showDetailedSection, setShowDetailedSection] = useState(false); // Controls visibility of detailed orders

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchSalesData();
    // Initialize month/year selectors to current month/year
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear());
    setCurrentMonth(month);
    setCurrentYear(year);
  }, [isLoggedIn, navigate, token]);

  const fetchSalesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/reports/my-monthly-sales', {
        headers: { 'x-auth-token': token },
      });
      setSalesData(response.data);
    } catch (err) {
      console.error('Error fetching aggregated sales data:', err);
      setError(err.response?.data?.message || 'Failed to fetch aggregated sales data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedOrders = async () => {
    if (!currentMonth || !currentYear) {
      setError('Please select both month and year to view detailed orders.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/reports/monthly-order-details?month=${currentMonth}&year=${currentYear}`, {
        headers: { 'x-auth-token': token },
      });
      setDetailedOrders(response.data);
      setShowDetailedSection(true); // Show the detailed section after fetching
    } catch (err) {
      console.error('Error fetching detailed orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch detailed orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    if (!token) {
      setError('You must be logged in to download reports.');
      return;
    }
    // Only set downloading true for the specific download request
    const buttonId = `download-${format}`;
    const originalButtonText = document.getElementById(buttonId).innerHTML;
    document.getElementById(buttonId).innerHTML = `Preparing ${format.toUpperCase()}...`;
    document.getElementById(buttonId).disabled = true;

    try {
      const downloadUrl = `http://localhost:5000/api/reports/download-${format}`;
      
      const response = await axios.get(downloadUrl, {
        headers: { 'x-auth-token': token },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `monthly_sales_report.${format}`);

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error downloading report:', err);
      if (err.response && err.response.status === 403) {
          setError('Authorization failed. Please log in again.');
      } else if (err.response && err.response.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
              try {
                  const errorJson = JSON.parse(reader.result);
                  setError(errorJson.message || `Failed to download report: ${format.toUpperCase()}.`);
              } catch (parseError) {
                  setError(`Failed to download report: ${format.toUpperCase()}. Error: ${err.message}`);
              }
          };
          reader.readAsText(err.response.data);
      } else {
          setError(`Failed to download report: ${format.toUpperCase()}. Error: ${err.message}`);
      }
    } finally {
        document.getElementById(buttonId).innerHTML = originalButtonText;
        document.getElementById(buttonId).disabled = false;
    }
  };

  const calculateOverallSalesSummary = () => {
    if (salesData.length === 0) {
      return { totalSales: 0, averageMonthlySales: 0, totalOrders: 0 };
    }
    const totalSales = salesData.reduce((sum, item) => sum + parseFloat(item.total_sales_amount), 0);
    const totalOrders = salesData.reduce((sum, item) => sum + parseInt(item.number_of_orders_with_my_products), 0);
    const averageMonthlySales = totalSales / salesData.length;
    return {
      totalSales: totalSales.toFixed(2),
      averageMonthlySales: averageMonthlySales.toFixed(2),
      totalOrders: totalOrders
    };
  };

  const { totalSales, averageMonthlySales, totalOrders } = calculateOverallSalesSummary();

  const months = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];
  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)); // Last 5 years


  if (loading) {
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading reports...</span>
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
      <h2 className="text-center text-app-accent mb-4 fw-bold animate__animated animate__fadeInDown">
        Your Sales Reports
      </h2>
      <p className="text-center text-light-emphasis mb-5 animate__animated animate__fadeInUp">
        Insights into the sales generated by your listed products.
      </p>

      {salesData.length === 0 ? (
        <div className="alert alert-info text-center animate__animated animate__fadeIn">
          No sales data available to generate reports. List products and make sales to see your reports here!
          <Link to="/dashboard/add-product" className="alert-link text-app-accent ms-2">Add a product</Link>
        </div>
      ) : (
        <div className="row justify-content-center">
          {/* Sales Summary Cards */}
          <div className="col-md-4 mb-4 animate__animated animate__zoomIn animate__delay-0.2s">
            <div className="card text-center p-3 h-100">
              <div className="card-body">
                 
                <h5 className="card-title text-dark">Total Sales</h5>
                <p className="card-text fs-4 fw-bold text-app-accent">PKR {totalSales}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4 animate__animated animate__zoomIn animate__delay-0.4s">
            <div className="card text-center p-3 h-100">
              <div className="card-body">
                <i className="bi bi-graph-up text-success fs-2 mb-3"></i>
                <h5 className="card-title text-dark">Avg. Monthly Sales</h5>
                <p className="card-text fs-4 fw-bold text-app-accent">PKR {averageMonthlySales}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4 animate__animated animate__zoomIn animate__delay-0.6s">
            <div className="card text-center p-3 h-100">
              <div className="card-body">
                <i className="bi bi-box-seam-fill text-success fs-2 mb-3"></i>
                <h5 className="card-title text-dark">Total Orders</h5>
                <p className="card-text fs-4 fw-bold text-app-accent">{totalOrders}</p>
              </div>
            </div>
          </div>

          {/* Monthly Sales Table */}
          <div className="col-12 mt-4 animate__animated animate__fadeInUp animate__delay-0.8s">
            <div className="card p-4 shadow-lg">
              <h4 className="text-dark mb-4 fw-bold"><i className="bi bi-table me-2"></i>Monthly Breakdown (All Time)</h4>
              <div className="table-responsive">
                <table className="table table-dark table-striped table-hover rounded-lg overflow-hidden">
                  <thead className="bg-app-accent-gradient">
                    <tr>
                      <th scope="col" className="text-light">Month/Year</th>
                      <th scope="col" className="text-light text-end">Total Sales (PKR)</th>
                      <th scope="col" className="text-light text-end">Number of Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.map((data, index) => (
                      <tr key={index}>
                        <td><span className="text-light">{data.month_year}</span></td>
                        <td className="text-end"><span className="text-app-accent fw-bold">{parseFloat(data.total_sales_amount).toFixed(2)}</span></td>
                        <td className="text-end"><span className="text-light">{data.number_of_orders_with_my_products}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Download Buttons */}
              <div className="d-flex justify-content-center gap-3 mt-4">
                <button
                  id="download-csv"
                  className="btn btn-outline-success btn-lg"
                  onClick={() => handleDownload('csv')}
                  disabled={salesData.length === 0}
                >
                  <i className="bi bi-file-earmark-spreadsheet me-2"></i> Download CSV
                </button>
                <button
                  id="download-pdf"
                  className="btn btn-outline-danger btn-lg"
                  onClick={() => handleDownload('pdf')}
                  disabled={salesData.length === 0}
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i> Download PDF
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Monthly Orders Section */}
          <div className="col-12 mt-5 animate__animated animate__fadeInUp animate__delay-1s">
            <div className="card p-4 shadow-lg">
              <h4 className="text-dark mb-4 fw-bold"><i className="bi bi-list-columns-reverse me-2"></i>Detailed Orders by Month</h4>
              <div className="row g-3 mb-4 align-items-end">
                <div className="col-md-5">
                  <label htmlFor="monthSelect" className="form-label text-dark-emphasis">Select Month</label>
                  <select
                    id="monthSelect"
                    className="form-select modern-form-control"
                    value={currentMonth}
                    onChange={(e) => { setCurrentMonth(e.target.value); setShowDetailedSection(false); setDetailedOrders([]); }}
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5">
                  <label htmlFor="yearSelect" className="form-label text-light-emphasis">Select Year</label>
                  <select
                    id="yearSelect"
                    className="form-select modern-form-control"
                    value={currentYear}
                    onChange={(e) => { setCurrentYear(e.target.value); setShowDetailedSection(false); setDetailedOrders([]); }}
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-app-accent-gradient w-100"
                    onClick={fetchDetailedOrders}
                    disabled={!currentMonth || !currentYear || loading}
                  >
                    <i className="bi bi-search me-1"></i> View Orders
                  </button>
                </div>
              </div>

              {showDetailedSection && detailedOrders.length > 0 && (
                <div className="mt-4 animate__animated animate__fadeIn">
                  <h5 className="text-dark fw-bold mb-3">Orders for {months.find(m => m.value === currentMonth)?.label} {currentYear}</h5>
                  <div className="accordion accordion-flush" id="detailedOrdersAccordion">
                    {detailedOrders.map((order, index) => (
                      <div className="accordion-item my-2 rounded-lg shadow-sm" key={order.order_id} style={{ backgroundColor: 'var(--global-secondary-bg)', borderColor: 'var(--card-border-color)' }}>
                        <h2 className="accordion-header" id={`headingDetailedOrder${order.order_id}`}>
                          <button
                            className="accordion-button collapsed text-dark fw-bold rounded-lg"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#collapseDetailedOrder${order.order_id}`}
                            aria-expanded="false"
                            aria-controls={`collapseDetailedOrder${order.order_id}`}
                            style={{ backgroundColor: 'var(--global-secondary-bg)', color: 'var(--global-text-dark)' }}
                          >
                            Order #{order.order_id} - Buyer: {order.buyer_username} - Total: PKR {parseFloat(order.total_amount).toFixed(2)}
                            <span className={`badge ms-3 ${order.payment_status === 'paid' || order.payment_status === 'succeeded' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                {order.payment_status.toUpperCase()}
                            </span>
                            <span className={`badge ms-2 ${order.shipping_status === 'delivered' ? 'bg-info' : 'bg-primary'}`}>
                                {order.shipping_status.toUpperCase()}
                            </span>
                          </button>
                        </h2>
                        <div
                          id={`collapseDetailedOrder${order.order_id}`}
                          className="accordion-collapse collapse"
                          aria-labelledby={`headingDetailedOrder${order.order_id}`}
                          data-bs-parent="#detailedOrdersAccordion"
                        >
                          <div className="accordion-body text-muted" style={{ backgroundColor: 'var(--card-bg)' }}>
                            <p className="mb-1 text-app-accent fw-bold">Order Date: {new Date(order.order_date).toLocaleDateString()}</p>
                            <p className="mb-1 text-dark">Buyer Email: <span className="text-muted">{order.buyer_email}</span></p>
                            <p className="mb-3 text-dark">Shipping To: <span className="text-muted">{order.buyer_shipping_address}</span></p>
                            <p className="mb-3 text-dark">Payment Method: <span className="text-muted">{order.payment_method}</span></p>
                            <h6 className="text-dark fw-bold mt-3">Products from Your Store in this Order:</h6>
                            <ul className="list-group list-group-flush">
                              {order.products_from_this_seller.map(item => (
                                <li key={item.product_id} className="list-group-item d-flex justify-content-between align-items-center" style={{ backgroundColor: 'transparent', color: 'var(--global-text-light)', borderBottomColor: 'var(--card-border-color)' }}>
                                  <div className="d-flex align-items-center">
                                    <img src={`http://localhost:5000/${item.image_url}`} alt={item.product_name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px' }} />
                                    <span className="text-light">{item.product_name}</span>
                                  </div>
                                  <span className="badge bg-app-accent-gradient rounded-pill">Qty: {item.quantity} | Sold at: PKR {parseFloat(item.price_at_purchase).toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showDetailedSection && detailedOrders.length === 0 && (
                <div className="alert alert-info text-center mt-4 animate__animated animate__fadeIn">
                  No orders found for {months.find(m => m.value === currentMonth)?.label} {currentYear} where your products were sold.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;