// // src/components/pages/admin/UserManagementPage.js
// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../../../contexts/AuthContext';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
// import 'animate.css';

// function UserManagementPage() {
//     const { isLoggedIn, user, token } = useAuth();
//     const navigate = useNavigate();

//     const [users, setUsers] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [message, setMessage] = useState(''); // For success messages
//     const [accessDenied, setAccessDenied] = useState(false);

//     // State for editing a user
//     const [editingUser, setEditingUser] = useState(null); // User object being edited
//     const [editForm, setEditForm] = useState({ // Form state for current edits
//         username: '',
//         email: '',
//         user_type: '',
//     });

//     useEffect(() => {
//         if (!isLoggedIn) {
//             navigate('/login');
//             return;
//         }

//         if (!user || user.user_type !== 'admin') {
//             setAccessDenied(true);
//             setLoading(false);
//             return;
//         }

//         fetchUsers();
//     }, [isLoggedIn, user, token, navigate]);

//     const fetchUsers = async () => {
//         setLoading(true);
//         setError(null);
//         try {
//             const response = await axios.get('http://localhost:5000/api/admin/users', {
//                 headers: { 'x-auth-token': token },
//             });
//             setUsers(response.data);
//         } catch (err) {
//             console.error('Error fetching users:', err);
//             if (err.response && err.response.status === 403) {
//                 setAccessDenied(true);
//             } else {
//                 setError(err.response?.data?.message || 'Failed to fetch users.');
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleEditClick = (userToEdit) => {
//         setEditingUser(userToEdit);
//         setEditForm({
//             username: userToEdit.username,
//             email: userToEdit.email,
//             user_type: userToEdit.user_type,
//         });
//     };

//     const handleEditFormChange = (e) => {
//         const { name, value } = e.target;
//         setEditForm(prev => ({ ...prev, [name]: value }));
//     };

//     const handleUpdateUser = async (e) => {
//         e.preventDefault();
//         setError(null);
//         setMessage('');

//         if (!editingUser) return;

//         try {
//             const response = await axios.put(`http://localhost:5000/api/admin/users/${editingUser.id}`, editForm, {
//                 headers: { 'x-auth-token': token },
//             });
//             setMessage(response.data.message);
//             setEditingUser(null); // Exit editing mode
//             await fetchUsers(); // Refresh the user list
//         } catch (err) {
//             console.error('Error updating user:', err);
//             setError(err.response?.data?.message || 'Failed to update user.');
//         } finally {
//             setTimeout(() => { setMessage(''); setError(''); }, 3000); // Clear messages after 3 seconds
//         }
//     };

//     const handleDeleteUser = async (userIdToDelete) => {
//         if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
//             return;
//         }
//         setError(null);
//         setMessage('');

//         // Optional: Prevent admin from deleting themselves
//         if (user && parseInt(userIdToDelete) === user.id) {
//             setError('You cannot delete your own admin account.');
//             setTimeout(() => setError(''), 3000);
//             return;
//         }

//         try {
//             const response = await axios.delete(`http://localhost:5000/api/admin/users/${userIdToDelete}`, {
//                 headers: { 'x-auth-token': token },
//             });
//             setMessage(response.data.message);
//             await fetchUsers(); // Refresh the user list
//         } catch (err) {
//             console.error('Error deleting user:', err);
//             setError(err.response?.data?.message || 'Failed to delete user.');
//         } finally {
//             setTimeout(() => { setMessage(''); setError(''); }, 3000); // Clear messages after 3 seconds
//         }
//     };

//     if (loading) {
//         return (
//             <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
//                 <div className="spinner-border text-app-accent" role="status">
//                     <span className="visually-hidden">Loading users...</span>
//                 </div>
//             </div>
//         );
//     }

//     if (accessDenied) {
//         return (
//             <div className="container mt-5 pt-5 text-center">
//                 <div className="alert alert-danger" role="alert">
//                     <h4 className="alert-heading"><i className="bi bi-shield-fill-x me-2"></i>Access Denied!</h4>
//                     <p>You do not have administrative privileges to view this page.</p>
//                     <hr />
//                     <p className="mb-0">Please log in with an administrator account or contact support.</p>
//                     <Link to="/login" className="btn btn-app-accent-gradient mt-3">Go to Login</Link>
//                 </div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="container mt-5 pt-5 text-center">
//                 <div className="alert alert-danger" role="alert">
//                     {error}
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="container mt-5 pt-5 pb-5 animate__animated animate__fadeIn">
//             <h2 className="text-center text-app-accent mb-4 fw-bold animate__animated animate__fadeInDown">
//                 <i className="bi bi-people-fill me-2"></i>User Management
//             </h2>
//             <p className="text-center text-muted mb-5 animate__animated animate__fadeInUp">
//                 Manage platform users, update their details, and assign roles.
//             </p>

//             {message && <div className="alert alert-success text-center animate__animated animate__fadeIn">{message}</div>}
//             {error && !accessDenied && <div className="alert alert-danger text-center animate__animated animate__shakeX">{error}</div>}

//             <div className="card p-4 shadow-lg animate__animated animate__fadeInUp">
//                 <div className="d-flex justify-content-between align-items-center mb-4">
//                     <h4 className="text-dark mb-0">All Registered Users ({users.length})</h4>
//                     {/* Add User button if you want to allow admin to add users from here */}
//                     {/* <Link to="/admin/add-user" className="btn btn-app-accent-gradient"><i className="bi bi-person-plus-fill me-2"></i>Add New User</Link> */}
//                 </div>

//                 <div className="table-responsive">
//                     <table className="table table-hover table-striped">
//                         <thead className="bg-app-accent-gradient text-white">
//                             <tr>
//                                 <th scope="col">ID</th>
//                                 <th scope="col">Username</th>
//                                 <th scope="col">Email</th>
//                                 <th scope="col">User Type</th>
//                                 <th scope="col">Registered On</th>
//                                 <th scope="col">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {users.map((userItem) => (
//                                 <tr key={userItem.id} className="text-dark">
//                                     <td>{userItem.id}</td>
//                                     <td>
//                                         {editingUser && editingUser.id === userItem.id ? (
//                                             <input
//                                                 type="text"
//                                                 name="username"
//                                                 value={editForm.username}
//                                                 onChange={handleEditFormChange}
//                                                 className="form-control modern-form-control-sm"
//                                             />
//                                         ) : (
//                                             userItem.username
//                                         )}
//                                     </td>
//                                     <td>
//                                         {editingUser && editingUser.id === userItem.id ? (
//                                             <input
//                                                 type="email"
//                                                 name="email"
//                                                 value={editForm.email}
//                                                 onChange={handleEditFormChange}
//                                                 className="form-control modern-form-control-sm"
//                                             />
//                                         ) : (
//                                             userItem.email
//                                         )}
//                                     </td>
//                                     <td>
//                                         {editingUser && editingUser.id === userItem.id ? (
//                                             <select
//                                                 name="user_type"
//                                                 value={editForm.user_type}
//                                                 onChange={handleEditFormChange}
//                                                 className="form-select modern-form-control-sm"
//                                             >
//                                                 <option value="user">User</option>
//                                                 <option value="admin">Admin</option>
//                                             </select>
//                                         ) : (
//                                             <span className={`badge ${userItem.user_type === 'admin' ? 'bg-info' : 'bg-secondary'}`}>
//                                                 {userItem.user_type.toUpperCase()}
//                                             </span>
//                                         )}
//                                     </td>
//                                     <td>{new Date(userItem.created_at).toLocaleDateString()}</td>
//                                     <td>
//                                         {editingUser && editingUser.id === userItem.id ? (
//                                             <>
//                                                 <button
//                                                     className="btn btn-sm btn-app-accent-gradient me-2"
//                                                     onClick={handleUpdateUser}
//                                                     disabled={loading}
//                                                 >
//                                                     <i className="bi bi-check-lg"></i> Save
//                                                 </button>
//                                                 <button
//                                                     className="btn btn-sm btn-outline-secondary"
//                                                     onClick={() => setEditingUser(null)}
//                                                 >
//                                                     <i className="bi bi-x-lg"></i> Cancel
//                                                 </button>
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <button
//                                                     className="btn btn-sm btn-outline-primary me-2"
//                                                     onClick={() => handleEditClick(userItem)}
//                                                 >
//                                                     <i className="bi bi-pencil-square"></i> Edit
//                                                 </button>
//                                                 <button
//                                                     className="btn btn-sm btn-outline-danger"
//                                                     onClick={() => handleDeleteUser(userItem.id)}
//                                                     disabled={user && user.id === userItem.id} 
//                                                 >
//                                                     <i className="bi bi-trash"></i> Delete
//                                                 </button>
//                                             </>
//                                         )}
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default UserManagementPage;

// src/components/pages/admin/UserManagementPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';

function UserManagementPage() {
    const { isLoggedIn, user, token } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // For success messages
    const [accessDenied, setAccessDenied] = useState(false);

    // State for editing a user
    const [editingUser, setEditingUser] = useState(null); // User object being edited
    const [editForm, setEditForm] = useState({ // Form state for current edits
        username: '',
        email: '',
        phone: '', // NEW: Include phone in editForm state
        user_type: '',
    });

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

        fetchUsers();
    }, [isLoggedIn, user, token, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/admin/users', {
                headers: { 'x-auth-token': token },
            });
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            if (err.response && err.response.status === 403) {
                setAccessDenied(true);
            } else {
                setError(err.response?.data?.message || 'Failed to fetch users.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (userToEdit) => {
        setEditingUser(userToEdit);
        setEditForm({
            username: userToEdit.username,
            email: userToEdit.email,
            phone: userToEdit.phone || '', // NEW: Initialize phone, default to empty string if null
            user_type: userToEdit.user_type,
        });
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        if (!editingUser) return;

        try {
            const response = await axios.put(`http://localhost:5000/api/admin/users/${editingUser.id}`, editForm, {
                headers: { 'x-auth-token': token },
            });
            setMessage(response.data.message);
            setEditingUser(null); // Exit editing mode
            await fetchUsers(); // Refresh the user list
        } catch (err) {
            console.error('Error updating user:', err);
            setError(err.response?.data?.message || 'Failed to update user.');
        } finally {
            setTimeout(() => { setMessage(''); setError(''); }, 3000); // Clear messages after 3 seconds
        }
    };

    const handleDeleteUser = async (userIdToDelete) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        setError(null);
        setMessage('');

        // Optional: Prevent admin from deleting themselves
        if (user && parseInt(userIdToDelete) === user.id) {
            setError('You cannot delete your own admin account.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            const response = await axios.delete(`http://localhost:5000/api/admin/users/${userIdToDelete}`, {
                headers: { 'x-auth-token': token },
            });
            setMessage(response.data.message);
            await fetchUsers(); // Refresh the user list
        } catch (err) {
            console.error('Error deleting user:', err);
            setError(err.response?.data?.message || 'Failed to delete user.');
        } finally {
            setTimeout(() => { setMessage(''); setError(''); }, 3000); // Clear messages after 3 seconds
        }
    };

    if (loading) {
        return (
            <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
                <div className="spinner-border text-app-accent" role="status">
                    <span className="visually-hidden">Loading users...</span>
                </div>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="container mt-5 pt-5 text-center">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading"><i className="bi bi-shield-fill-x me-2"></i>Access Denied!</h4>
                    <p>You do not have administrative privileges to view this page.</p>
                    <hr />
                    <p className="mb-0">Please log in with an administrator account or contact support.</p>
                    <Link to="/login" className="btn btn-app-accent-gradient mt-3">Go to Login</Link>
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
                <i className="bi bi-people-fill me-2"></i>User Management
            </h2>
            <p className="text-center text-muted mb-5 animate__animated animate__fadeInUp">
                Manage platform users, update their details, and assign roles.
            </p>

            {message && <div className="alert alert-success text-center animate__animated animate__fadeIn">{message}</div>}
            {error && !accessDenied && <div className="alert alert-danger text-center animate__animated animate__shakeX">{error}</div>}

            <div className="card p-4 shadow-lg animate__animated animate__fadeInUp">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="text-dark mb-0">All Registered Users ({users.length})</h4>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover table-striped">
                        <thead className="bg-app-accent-gradient text-white">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Username</th>
                                <th scope="col">Email</th>
                                <th scope="col">Phone</th> {/* NEW: Phone column header */}
                                <th scope="col">User Type</th>
                                <th scope="col">Registered On</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((userItem) => (
                                <tr key={userItem.id} className="text-dark">
                                    <td>{userItem.id}</td>
                                    <td>
                                        {editingUser && editingUser.id === userItem.id ? (
                                            <input
                                                type="text"
                                                name="username"
                                                value={editForm.username}
                                                onChange={handleEditFormChange}
                                                className="form-control modern-form-control-sm"
                                            />
                                        ) : (
                                            userItem.username
                                        )}
                                    </td>
                                    <td>
                                        {editingUser && editingUser.id === userItem.id ? (
                                            <input
                                                type="email"
                                                name="email"
                                                value={editForm.email}
                                                onChange={handleEditFormChange}
                                                className="form-control modern-form-control-sm"
                                            />
                                        ) : (
                                            userItem.email
                                        )}
                                    </td>
                                    <td> {/* NEW: Phone display/edit */}
                                        {editingUser && editingUser.id === userItem.id ? (
                                            <input
                                                type="text" // Can be 'tel' for better mobile experience
                                                name="phone"
                                                value={editForm.phone}
                                                onChange={handleEditFormChange}
                                                className="form-control modern-form-control-sm"
                                                placeholder="Enter phone"
                                            />
                                        ) : (
                                            userItem.phone || 'N/A' // Display phone or 'N/A' if null/empty
                                        )}
                                    </td>
                                    <td>
                                        {editingUser && editingUser.id === userItem.id ? (
                                            <select
                                                name="user_type"
                                                value={editForm.user_type}
                                                onChange={handleEditFormChange}
                                                className="form-select modern-form-control-sm"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        ) : (
                                            <span className={`badge ${userItem.user_type === 'admin' ? 'bg-info' : 'bg-secondary'}`}>
                                                {userItem.user_type.toUpperCase()}
                                            </span>
                                        )}
                                    </td>
                                    <td>{new Date(userItem.created_at).toLocaleDateString()}</td>
                                    <td>
                                        {editingUser && editingUser.id === userItem.id ? (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-app-accent-gradient me-2"
                                                    onClick={handleUpdateUser}
                                                    disabled={loading}
                                                >
                                                    <i className="bi bi-check-lg"></i> Save
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => setEditingUser(null)}
                                                >
                                                    <i className="bi bi-x-lg"></i> Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    onClick={() => handleEditClick(userItem)}
                                                >
                                                    <i className="bi bi-pencil-square"></i> Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteUser(userItem.id)}
                                                    disabled={user && user.id === userItem.id} 
                                                >
                                                    <i className="bi bi-trash"></i> Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default UserManagementPage;