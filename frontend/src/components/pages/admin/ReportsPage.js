 // src/components/pages/admin/ReportsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';

function AdminReportsPage() {
    const { isLoggedIn, user, token } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // For download messages
    const [accessDenied, setAccessDenied] = useState(false);
    const [reportType, setReportType] = useState('users'); // Default selected report type

    // NEW STATES for monthly reporting
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-indexed

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(''); // Empty string for "All Months"

    // Generate years for dropdown (e.g., current year and past 2 years)
    const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

    // Month options for dropdown
    const months = [
        { value: '', label: 'All Months' },
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        if (!user || user.user_type !== 'admin') {
            setAccessDenied(true);
            setLoading(false);
            return;
        }

        setLoading(false); // No data fetching on initial load, just UI setup
        setError(null);
    }, [isLoggedIn, user, navigate]);

    const handleDownload = async (format) => {
        setMessage('');
        setError(null);
        setLoading(true);

        try {
            let url = `http://localhost:5000/api/admin/reports/${reportType}/${format}`;
            
            // NEW: Add month and year as query parameters if selected
            const queryParams = new URLSearchParams();
            if (selectedYear) {
                queryParams.append('year', selectedYear);
            }
            if (selectedMonth) { // Only append if a specific month is selected
                queryParams.append('month', selectedMonth);
            }

            const queryString = queryParams.toString();
            if (queryString) {
                url = `${url}?${queryString}`;
            }

            console.log(`Attempting to download ${reportType} report as ${format.toUpperCase()} from: ${url}`);

            const response = await axios.get(url, {
                headers: {
                    'x-auth-token': token,
                },
                responseType: 'blob',
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            console.log('Response data type (Blob):', response.data.type);

            const expectedContentType = format === 'pdf' ? 'application/pdf' : 'text/csv';
            if (!response.data.type.includes(expectedContentType)) {
                console.error('Mismatched Content Type. Expected:', expectedContentType, 'Received:', response.data.type);

                const reader = new FileReader();
                reader.onload = () => {
                    console.error('Raw response content (if text):', reader.result);
                    let detectedError = 'Unexpected file format. Server might have returned an error page or invalid data.';
                    try {
                        const parsedError = JSON.parse(reader.result);
                        detectedError = parsedError.message || JSON.stringify(parsedError, null, 2);
                    } catch (parseErr) {
                        // Not JSON, perhaps raw HTML or plain text error
                    }
                    setError(`Download Failed: ${detectedError}. Please ensure the report type and filters are correct.`);
                };
                reader.readAsText(response.data);
                setLoading(false);
                return;
            }

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            const contentDisposition = response.headers['content-disposition'];
            let filename = `${reportType}_report.${format}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }
            // Enhance filename with month/year if selected
            if (selectedMonth && selectedYear) {
                const monthName = months.find(m => m.value === selectedMonth)?.label;
                filename = `${reportType}_${monthName.toLowerCase()}_${selectedYear}.${format}`;
            } else if (selectedYear) {
                filename = `${reportType}_${selectedYear}.${format}`;
            }

            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            setMessage(`Successfully downloaded ${reportType} report as ${format.toUpperCase()}.`);

        } catch (err) {
            console.error(`Error downloading ${reportType} ${format} report:`, err);
            let userFacingError = `Failed to download ${reportType} report as ${format.toUpperCase()}.`;

            if (axios.isAxiosError(err) && err.response && err.response.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = async () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        userFacingError = errorData.message || JSON.stringify(errorData, null, 2);
                        console.error('Backend Error Response:', errorData);
                    } catch (parseError) {
                        console.error('Could not parse error response as JSON. Raw text:', reader.result);
                        userFacingError += " (Server returned non-JSON error. See console for details.)";
                    } finally {
                        setError(userFacingError);
                        setLoading(false);
                        setTimeout(() => { setMessage(''); setError(''); }, 5000);
                    }
                };
                reader.onerror = () => {
                    setError(userFacingError + " (Failed to read error response).");
                    setLoading(false);
                    setTimeout(() => { setMessage(''); setError(''); }, 5000);
                };
                reader.readAsText(err.response.data);
            } else {
                setError(userFacingError + " Please check console for more details.");
                setLoading(false);
                setTimeout(() => { setMessage(''); setError(''); }, 5000);
            }
        } finally {
            // Handled inside catch or success
        }
    };

    return (
        <div className="container mt-5 pt-5 pb-5 animate__animated animate__fadeIn">
            <h2 className="text-center text-app-accent mb-4 fw-bold animate__animated animate__fadeInDown">
                <i className="bi bi-bar-chart-fill me-2"></i>Platform Reports
            </h2>
            <p className="text-center text-muted mb-5 animate__animated animate__fadeInUp">
                Generate and download various reports for platform analysis.
            </p>

            {message && <div className="alert alert-success text-center animate__animated animate__fadeIn">{message}</div>}
            {error && !accessDenied && <div className="alert alert-danger text-center animate__animated animate__shakeX">{error}</div>}

            <div className="card p-4 shadow-lg animate__animated animate__fadeInUp">
                <div className="mb-4">
                    <h4 className="text-dark mb-3">Select Report Type:</h4>
                    <select
                        className="form-select form-select-lg modern-form-control"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                    >
                        <option value="users">User Report</option>
                        <option value="stock">Product Stock Report</option>
                        <option value="orders">Order Report</option>
                    </select>
                </div>

                {/* NEW: Month and Year Filters */}
                <div className="row mb-5 justify-content-center">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="selectMonth" className="form-label text-dark">Filter by Month:</label>
                        <select
                            id="selectMonth"
                            className="form-select modern-form-control"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="selectYear" className="form-label text-dark">Filter by Year:</label>
                        <select
                            id="selectYear"
                            className="form-select modern-form-control"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="text-center mt-5">
                    <h4 className="text-dark mb-3">Download Report:</h4>
                    <div className="d-flex justify-content-center gap-3">
                        <button
                            className="btn btn-app-accent-gradient btn-lg px-4 py-2"
                            onClick={() => handleDownload('csv')}
                            disabled={loading}
                        >
                            <i className="bi bi-file-earmark-spreadsheet me-2"></i> Download CSV
                        </button>
                        <button
                            className="btn btn-primary btn-lg px-4 py-2"
                            onClick={() => handleDownload('pdf')}
                            disabled={loading}
                        >
                            <i className="bi bi-file-earmark-pdf me-2"></i> Download PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminReportsPage;