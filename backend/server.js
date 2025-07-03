const path = require('path'); // <-- Make sure 'path' module is imported
require('dotenv').config();
const JWT_SECRET = 'helloeveryone'; 
const { Stringifier } = require('csv-stringify'); // For CSV generation
// const PDFDocument = require('pdfkit'); 
const PDFDocument = require('pdfkit');
const stripe = require('stripe')(); 
// Explicitly tell dotenv where to find the .env file.
// This assumes .env is in the same directory as server.js (i.e., 'backend' folder).
// require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const corsOptions = {
    origin: 'http://localhost:3000', // Your frontend's URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies to be sent (if you use them, otherwise can be false)
    optionsSuccessStatus: 204 // For preflight requests
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./config/db');
const multer = require('multer'); // NEW: Import multer
// const path = require('path');     // NEW: Import path for file paths
const fs = require('fs');         // NEW: Import fs for file system operations (like deleting images)
const { verify } = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
// --- NEW: Debugging for JWT_SECRET ---
// console.log("Backend: JWT_SECRET (from .env):", JWT_SECRET);
// --- END NEW ---

// Middleware
app.use(cors());
app.use(cors(corsOptions)); // Apply CORS with options

// app.use(express.json()); 
app.use(express.json());

// NEW: Serve static files from the 'uploads' directory
// This makes files in backend/uploads accessible via http://localhost:5000/uploads/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// ===============================================
// NEW: Multer Storage Configuration for Image Uploads
// ===============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // Images will be saved in the 'backend/uploads' directory
    },
    filename: (req, file, cb) => {
        // Create a unique filename: fieldname-timestamp.ext
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
    }
});

// ===============================================
// NEW: JWT Authentication Middleware
// ===============================================
// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // --- NEW: Debugging for JWT_SECRET in verification ---
        // console.log("Backend: JWT_SECRET used for verification:",JWT_SECRET);
        // --- END NEW ---
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        // --- NEW: Log the specific error from JWT verification ---
        // console.error("Backend: Token verification failed:", err.message);
        // --- END NEW ---
        res.status(401).json({ message: 'Token is not valid' });
    }
}
// MODIFIED: Middleware to authorize admin access
function authorizeAdmin(req, res, next) {
    // This assumes authenticateToken has already run and populated req.user
    if (!req.user || req.user.user_type !== 'admin') { // <<< MODIFIED CHECK
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    next();
}

// Root route
app.get('/', (req, res) => {
    res.send('Abaya Haven Backend API is running!');
});

// User Signup Endpoint
app.post('/api/signup', async (req, res) => {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
        return res.status(400).json({ message: 'Username, email, phone, and password are required.' });
    }

    try {
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Default user_type will be 'user' due to SQL schema default
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)',
            [username, email, phone, password_hash]
        );

        res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });

    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ message: 'Server error during registration. Please try again later.' });
    }
});

// User Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const [users] = await pool.execute(
            'SELECT id, username, email, password_hash, user_type FROM users WHERE email = ?', // Include user_type
            [email]
        );

        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const payload = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                user_type: user.user_type // Include user_type in JWT payload
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({
                    message: 'Login successful!',
                    token,
                    user: { id: user.id, username: user.username, email: user.email, user_type: user.user_type }
                });
            }
        );

    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Server error during login. Please try again later.' });
    }
});
// backend/server.js

// Token Verification Endpoint (added to match frontend expectation)
app.get('/api/auth/verify-token', authenticateToken, async (req, res) => {
    // If we reach here, the 'auth' middleware has already validated the token.
    // req.user contains the decoded user information from the token (id, username, email, user_type).
    try {
        // Optionally, you can fetch fresh user data from the database here
        // if you need to ensure the user object is completely up-to-date
        // or if there's sensitive data not stored in the JWT payload.
        // For now, we'll send back what's already decoded and attached by the 'auth' middleware.
        res.json({ success: true, message: 'Token is valid', user: req.user });
    } catch (error) {
        console.error('Server error during token verification endpoint:', error);
        res.status(500).json({ message: 'Server error during token verification.' });
    }
});


// ... (your existing code, including imports, middleware, and other routes)

// Contact Us Endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // In a real application, you would send an email here using a service like Nodemailer, SendGrid, Mailgun, etc.
        // For now, we'll just log the contact message to the console.
        console.log('--- NEW CONTACT MESSAGE ---');
        console.log(`Name: ${name}`);
        console.log(`Email: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);
        console.log('---------------------------');

        res.status(200).json({ message: 'Your message has been sent successfully!' });

    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// ===============================================
// Product API Endpoints
// ===============================================
// API Endpoint for fetching all Products
// GET all products or limited products
// backend/server.js - FOR DEBUGGING ONLY! NOT FOR PRODUCTION!

app.get('/api/products', async (req, res) => {
    try {
        let finalQuery;
        let finalParams = []; // Keep this empty

        const rawLimit = req.query.limit;
        const parsedLimit = parseInt(rawLimit, 10);
        const limit = (!isNaN(parsedLimit) && parsedLimit > 0) ? parsedLimit : null;

        if (limit !== null) {
            // FOR DEBUGGING: Directly inject limit into the query string
            finalQuery = `SELECT * FROM products LIMIT ${limit}`;
            finalParams = []; // Important: params array should be empty as no placeholder
        } else {
            finalQuery = 'SELECT * FROM products';
            finalParams = [];
        }

        // console.log('--- Debugging (Direct Inject) /api/products ---');
        // console.log('Final Query being sent (direct inject):', finalQuery);
        // console.log('Final Params being sent (direct inject):', finalParams);
        // console.log('--- End Debugging ---');

        const [rows] = await pool.execute(finalQuery, finalParams); // Use execute even without placeholders
        res.json(rows);

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            message: 'Server error fetching products (Direct Inject Test).',
            details: error.message,
            sql: error.sql || finalQuery
        });
    }
});
 
// ===============================================
// NEW: Shopping Cart API Endpoints (Authenticated)
// ===============================================

// Add product to cart (or update quantity if it exists)
app.post('/api/cart', authenticateToken, async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id; // Get user ID from authenticated token

    if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Product ID and a valid quantity are required.' });
    }

    try {
        // Check if the product already exists in the user's cart
        const [existingCartItem] = await pool.execute(
            'SELECT * FROM carts WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (existingCartItem.length > 0) {
            // Product already in cart, update quantity
            await pool.execute(
                'UPDATE carts SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
                [quantity, userId, productId]
            );
            res.status(200).json({ message: 'Product quantity updated in cart.' });
        } else {
            // Product not in cart, add new item
            await pool.execute(
                'INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, productId, quantity]
            );
            res.status(201).json({ message: 'Product added to cart successfully.' });
        }
    } catch (error) {
        console.error('Error adding/updating product in cart:', error);
        res.status(500).json({ message: 'Server error adding product to cart.' });
    }
});

// Get user's cart contents
app.get('/api/cart', authenticateToken, async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated token

    try {
        // Join carts table with products table to get product details
        const [cartItems] = await pool.execute(
            `SELECT 
                c.id as cart_item_id,
                c.product_id,
                c.quantity,
                p.name,
                p.description,
                p.price,
                p.image_url,
                p.stock_quantity
            FROM carts c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?`,
            [userId]
        );
        res.status(200).json(cartItems);
    } catch (error) {
        console.error('Error fetching cart contents:', error);
        res.status(500).json({ message: 'Server error fetching cart.' });
    }
});
app.put('/api/cart/:productId', authenticateToken, async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body; // New quantity
    const userId = req.user.id;

    if (!quantity || quantity < 0) { // Quantity must be 0 or more (0 means remove)
        return res.status(400).json({ message: 'A valid quantity is required.' });
    }

    try {
        if (quantity === 0) {
            // If quantity is 0, remove the item from the cart
            await pool.execute(
                'DELETE FROM carts WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );
            return res.status(200).json({ message: 'Product removed from cart.' });
        } else {
            // Update quantity
            const [result] = await pool.execute(
                'UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?',
                [quantity, userId, productId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Cart item not found.' });
            }
            res.status(200).json({ message: 'Product quantity updated in cart.' });
        }
    } catch (error) {
        console.error('Error updating product quantity in cart:', error);
        res.status(500).json({ message: 'Server error updating cart item.' });
    }
});

// Remove product from cart
app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    try {
        const [result] = await pool.execute(
            'DELETE FROM carts WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cart item not found.' });
        }
        res.status(200).json({ message: 'Product removed from cart successfully.' });
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).json({ message: 'Server error removing cart item.' });
    }
});


// API Endpoint for fetching a single Product by ID
app.get('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [productId]);
        
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        
        res.status(200).json(products[0]);
    } catch (error) {
        console.error('Error fetching single product:', error);
        res.status(500).json({ message: 'Server error fetching product details.' });
    }
});

// ===============================================
// NEW: Product Management API Endpoints (Authenticated)
// ===============================================

// NEW: Create Product (Authenticated)
app.post('/api/products', authenticateToken, upload.single('image'), async (req, res) => {
    const { name, description, price, category, stock_quantity } = req.body;
    const userId = req.user.id; // Get user ID from authenticated token
    const image_url = req.file ? `uploads/${req.file.filename}` : null; // Path to stored image

    if (!name || !price || !image_url) {
        // If image is missing, ensure to clean up uploaded file if it exists
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Product name, price, and image are required.' });
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO products (name, description, price, image_url, category, stock_quantity, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, price, image_url, category || null, stock_quantity || 0, userId]
        );
        res.status(201).json({ message: 'Product created successfully!', productId: result.insertId });
    } catch (error) {
        console.error('Error creating product:', error);
        // If DB insertion fails, delete the uploaded file
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Server error creating product.' });
    }
});

// NEW: Get Products for Logged-in User (Authenticated)
app.get('/api/user/products', authenticateToken, async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated token
    try {
        const [products] = await pool.execute('SELECT * FROM products WHERE user_id = ?', [userId]);
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching user products:', error);
        res.status(500).json({ message: 'Server error fetching user products.' });
    }
});

// NEW: Update Product (Authenticated and Authorized)
app.put('/api/products/:id', authenticateToken, upload.single('image'), async (req, res) => {
    const productId = req.params.id;
    const { name, description, price, category, stock_quantity } = req.body;
    const userId = req.user.id; // Current user ID
    let new_image_url = req.file ? `uploads/${req.file.filename}` : null;

    try {
        const [existingProducts] = await pool.execute('SELECT user_id, image_url FROM products WHERE id = ?', [productId]);
        const product = existingProducts[0];

        if (!product) {
            if (req.file) fs.unlinkSync(req.file.path); // Clean up new uploaded file
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Authorization: Check if the logged-in user owns this product
        if (product.user_id !== userId) {
            if (req.file) fs.unlinkSync(req.file.path); // Clean up new uploaded file
            return res.status(403).json({ message: 'You are not authorized to update this product.' });
        }

        // Build the update query dynamically
        let updateQuery = 'UPDATE products SET ';
        const updateParams = [];
        const fieldsToUpdate = [];

        if (name) { fieldsToUpdate.push('name = ?'); updateParams.push(name); }
        if (description) { fieldsToUpdate.push('description = ?'); updateParams.push(description); }
        if (price) { fieldsToUpdate.push('price = ?'); updateParams.push(price); }
        if (category) { fieldsToUpdate.push('category = ?'); updateParams.push(category); }
        if (stock_quantity) { fieldsToUpdate.push('stock_quantity = ?'); updateParams.push(stock_quantity); }
        
        if (new_image_url) {
            fieldsToUpdate.push('image_url = ?');
            updateParams.push(new_image_url);
            // Delete old image if a new one is uploaded and old one existed
            if (product.image_url && product.image_url.startsWith('uploads/')) {
                const oldImagePath = path.join(__dirname, product.image_url);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        if (fieldsToUpdate.length === 0) {
            if (req.file) fs.unlinkSync(req.file.path); // Clean up new uploaded file
            return res.status(400).json({ message: 'No fields to update.' });
        }

        updateQuery += fieldsToUpdate.join(', ') + ' WHERE id = ?';
        updateParams.push(productId);

        await pool.execute(updateQuery, updateParams);
        res.status(200).json({ message: 'Product updated successfully!' });

    } catch (error) {
        console.error('Error updating product:', error);
        if (req.file) fs.unlinkSync(req.file.path); // Clean up new uploaded file in case of error
        res.status(500).json({ message: 'Server error updating product.' });
    }
});

// NEW: Delete Product (Authenticated and Authorized)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    const productId = req.params.id;
    const userId = req.user.id; // Current user ID

    try {
        const [existingProducts] = await pool.execute('SELECT user_id, image_url FROM products WHERE id = ?', [productId]);
        const product = existingProducts[0];

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Authorization: Check if the logged-in user owns this product
        if (product.user_id !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this product.' });
        }

        // Delete the product from the database
        await pool.execute('DELETE FROM products WHERE id = ?', [productId]);

        // Delete the associated image file from the server
        if (product.image_url && product.image_url.startsWith('uploads/')) {
            const imagePath = path.join(__dirname, product.image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.status(200).json({ message: 'Product deleted successfully!' });

    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error deleting product.' });
    }
});
// ===============================================
// NEW: Checkout API Endpoint
// ===============================================

// --- Checkout Endpoint (UPDATED) ---
app.post('/api/checkout', authenticateToken, async (req, res) => {
    let connection;
    try {
        const {
            cartItems, // Array of { productId, quantity } from frontend
            newAddressDetails, // Object { fullName, addressLine, city, country, phoneNumber }
            paymentMethod,
            paymentIntentId // Stripe Payment Intent ID or 'COD'
        } = req.body;

        console.log("Backend received checkout request:", req.body); // Useful for debugging

        const userId = req.user.id;

        // Basic validation (more robust validation should be added for production)
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty. Cannot proceed to checkout.' });
        }
        if (!newAddressDetails || !newAddressDetails.fullName || !newAddressDetails.addressLine || !newAddressDetails.city || !newAddressDetails.country) {
            return res.status(400).json({ message: 'Missing required shipping address details.' });
        }
        if (!paymentMethod) {
            return res.status(400).json({ message: 'Payment method is required.' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        let totalAmount = 0;
        const productsInOrder = []; // To store product details for order_items insertion

        // 1. Validate cart items and stock, and prepare productsInOrder array
        for (const item of cartItems) {
            const [productRows] = await connection.execute(
                'SELECT id, price, stock_quantity, name FROM products WHERE id = ?',
                [item.productId]
            );

            if (productRows.length === 0) {
                await connection.rollback();
                return res.status(400).json({ message: `Product with ID ${item.productId} not found.` });
            }

            const product = productRows[0];

            if (product.stock_quantity < item.quantity) {
                await connection.rollback();
                return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}` });
            }

            // Add item to productsInOrder for later insertion into order_items
            productsInOrder.push({
                productId: product.id,
                quantity: item.quantity,
                priceAtPurchase: product.price, // Store price at time of purchase
                productName: product.name,
                currentStock: product.stock_quantity // Store current stock to update later
            });

            totalAmount += product.price * item.quantity;
        }

        // Apply shipping and tax (re-calculate on backend for security)
        const shippingCost = 15.00;
        const taxRate = 0.05;
        const totalTax = totalAmount * taxRate;
        totalAmount = totalAmount + shippingCost + totalTax;

        // 2. Construct Shipping Address String (FIXED: Use template literals correctly)
        const { fullName, addressLine, city, country, phoneNumber } = newAddressDetails;
        const fullShippingAddress = `${fullName}, ${addressLine}, ${city}, ${country}${phoneNumber ? ' (Phone: ' + phoneNumber + ')' : ''}`;
        console.log("Constructed Shipping Address:", fullShippingAddress); // Check if this is correct


        // 3. Process Payment and Prepare for 'payments' table
        let paymentStatusInDB = 'pending';
        let transactionId = null;
        let paymentDetailsJson = null;

        if (paymentMethod === 'Online Payment') {
            if (!paymentIntentId || paymentIntentId === 'COD') { // Ensure it's a valid Stripe ID
                await connection.rollback();
                return res.status(400).json({ message: 'Stripe Payment Intent ID is missing or invalid for online payment.' });
            }

            // Retrieve the Payment Intent from Stripe to verify its status
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            if (!paymentIntent) {
                await connection.rollback();
                return res.status(400).json({ message: 'Stripe Payment Intent not found.' });
            }

            if (paymentIntent.status === 'succeeded') {
                paymentStatusInDB = 'succeeded';
                transactionId = paymentIntent.id; // Use Stripe's Payment Intent ID as transaction ID
                paymentDetailsJson = JSON.stringify({
                    stripe_payment_intent_id: paymentIntent.id,
                    stripe_status: paymentIntent.status,
                    amount_captured: paymentIntent.amount_received / 100, // Amount in your currency
                    currency: paymentIntent.currency,
                    // Add other relevant details from paymentIntent if needed
                });
            } else {
                // Handle cases where paymentIntent is not succeeded (e.g., requires_action, requires_payment_method, canceled)
                paymentStatusInDB = paymentIntent.status; // Store Stripe's status
                transactionId = paymentIntent.id;
                paymentDetailsJson = JSON.stringify({
                    stripe_payment_intent_id: paymentIntent.id,
                    stripe_status: paymentIntent.status,
                    error: paymentIntent.last_payment_error?.message || 'Payment not succeeded or requires action.'
                });
                await connection.rollback();
                // Return a 400 error if payment is not succeeded so frontend can show appropriate message
                return res.status(400).json({ message: `Online payment status: ${paymentIntent.status}. ${paymentIntent.last_payment_error?.message || 'Please try again.'}` });
            }
        } else if (paymentMethod === 'Cash on Delivery') {
            paymentStatusInDB = 'pending';
            transactionId = `COD_TXN_${Date.now()}_${userId}`; // Unique ID for COD
        } else {
            await connection.rollback();
            return res.status(400).json({ message: 'Invalid payment method selected.' });
        }

        // 4. Insert into 'orders' table
        const [orderResult] = await connection.execute(
            `INSERT INTO orders (user_id, total_amount, status, payment_status, shipping_address, tracking_number, created_at, updated_at, payment_id)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
            [userId, totalAmount, 'pending', paymentStatusInDB, fullShippingAddress, null, null] // payment_id is null initially, updated after payment row
        );
        const orderId = orderResult.insertId;

        // 5. Insert into 'payments' table (now referencing the orderId)
        const [paymentResult] = await connection.execute(
            'INSERT INTO payments (order_id, payment_method, transaction_id, amount, currency, status, details, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [orderId, paymentMethod, transactionId, totalAmount, 'PKR', paymentStatusInDB, paymentDetailsJson, (paymentStatusInDB === 'succeeded' ? new Date() : null)]
        );
        const paymentId = paymentResult.insertId;

        // 6. Update the 'orders' table with the payment_id (back-reference)
        await connection.execute(
            'UPDATE orders SET payment_id = ? WHERE id = ?',
            [paymentId, orderId]
        );

        // 7. Insert into 'order_items' table (FIXED: This loop now correctly uses orderId and productsInOrder)
        for (const productItem of productsInOrder) {
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
                [orderId, productItem.productId, productItem.quantity, productItem.priceAtPurchase]
            );

            // 8. Decrease stock quantity in 'products' table (after successful order item insertion)
            await connection.execute(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [productItem.quantity, productItem.productId]
            );
        }

        // 9. Clear User's Cart (after all order and stock updates are successful)
        await connection.execute('DELETE FROM carts WHERE user_id = ?', [userId]);

        await connection.commit(); // Commit the transaction if all operations succeed

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            order_id: orderId,
            total_amount: totalAmount,
            payment_status: paymentStatusInDB
        });

    } catch (error) {
        if (connection) await connection.rollback(); // Rollback on any error
        console.error('Error placing order:', error);

        // Enhance error message for client
        let clientErrorMessage = 'An unexpected error occurred during checkout.';
        if (error.code === 'WARN_DATA_TRUNCATED') {
            clientErrorMessage = "Database error: Payment status or address data too long. Please contact support.";
        } else if (error.message.includes("Insufficient stock")) {
            clientErrorMessage = error.message + " Please adjust quantities in your cart.";
        } else if (error.type && error.type.startsWith('Stripe')) { // Specific Stripe errors
            clientErrorMessage = `Payment error: ${error.message}`;
        } else if (error.sqlMessage) { // Generic MySQL error messages
            clientErrorMessage = `Database error: ${error.sqlMessage}`;
        }

        res.status(500).json({ message: 'Server error while placing order.', error: clientErrorMessage });
    } finally {
        if (connection) connection.release();
    }
});
 
// Create a Payment Intent
app.post('/api/create-payment-intent', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    let connection;
    try {
        connection = await pool.getConnection();

        // Calculate total amount on the backend to prevent tampering
        const [cartItemsData] = await connection.execute(
            `SELECT c.quantity, p.price, p.stock_quantity, p.name AS product_name
             FROM carts c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = ?`,
            [userId]
        );

        if (cartItemsData.length === 0) {
            return res.status(400).json({ message: 'Cart is empty. Cannot create payment intent.' });
        }

        let totalAmount = 0;
        for (const item of cartItemsData) {
            if (item.stock_quantity < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${item.product_name}. Available: ${item.stock_quantity}` });
            }
            totalAmount += item.price * item.quantity;
        }

        // Stripe amount is in cents, so multiply by 100
        const amountInCents = Math.round(totalAmount * 100);

        // Create a Payment Intent with the calculated amount
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'pkr', // Use your desired currency
            payment_method_types: ['card'], // Explicitly specify card as payment method type
            metadata: { userId: userId.toString(), cartTotal: totalAmount.toFixed(2) }, // Useful for Stripe dashboard
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            totalAmount: totalAmount.toFixed(2)
        });

    } catch (error) {
        console.error('Error creating Payment Intent:', error);
        res.status(500).json({ message: 'Error creating Payment Intent.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// ===============================================
// User Order Management (Authenticated) - CORRECTED QUERIES for provided schema
// ===============================================

// Get orders placed by the logged-in user (buyer's purchase history)
app.get('/api/user/orders/placed', authenticateToken, async (req, res) => {
    const userId = req.user.id; // Assuming userId is available in req.user from token

    try {
        // Fetch main order details from the 'orders' table
        // REMOVED 'o.payment_method' and 'o.shipping_address' as per your provided schema
        const [orders] = await pool.execute(
            `   SELECT
                o.id AS order_id,
                o.created_at AS order_date,
                o.total_amount,
                o.payment_status,
                o.status AS shipping_status,
                o.tracking_number,
                o.shipping_address,
                pay.payment_method, -- NEW: Select payment_method from payments table
                pay.transaction_id -- Optional: transaction ID if you want to show it
            FROM orders o
            JOIN payments pay ON o.payment_id = pay.id -- NEW: Join with payments table
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC`,
            [userId]
        );

        // For each order, fetch its individual items
        for (let order of orders) {
            const [items] = await pool.execute(
                `SELECT
                    oi.id AS order_item_id,
                    oi.product_id,
                    oi.quantity,
                    oi.price_at_purchase,
                    p.name AS product_name,
                    p.image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?`,
                [order.order_id]
            );
            order.items = items; // Attach items to the order object
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching user placed orders:', error);
        res.status(500).json({ message: 'Server error fetching your orders.', details: error.message, sql: error.sql });
    }
});
// --- Get orders placed by the logged-in user (buyer's purchase history) ---
// UPDATED to directly select `shipping_address` from `orders` table
app.get('/api/user/orders/placed', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const [orders] = await pool.execute(
            `SELECT
                o.id AS order_id,
                o.created_at AS order_date,
                o.total_amount,
                o.payment_status,
                o.status AS shipping_status,
                o.shipping_address,    -- Now directly select the string address
                o.tracking_number,
                p.payment_method       -- Get payment_method from the joined payments table
            FROM orders o
            JOIN payments p ON o.payment_id = p.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC`,
            [userId]
        );

        for (let order of orders) {
            const [items] = await pool.execute(
                `SELECT
                    oi.id AS order_item_id,
                    oi.product_id,
                    oi.quantity,
                    oi.price_at_purchase,
                    prod.name AS product_name,
                    prod.image_url
                FROM order_items oi
                JOIN products prod ON oi.product_id = prod.id
                WHERE oi.order_id = ?`,
                [order.order_id]
            );
            order.items = items;
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching user placed orders:', error);
        res.status(500).json({ message: 'Server error fetching your orders.', details: error.message, sql: error.sql });
    }
});

// --- Get orders containing products listed by the logged-in user (seller's orders to fulfill) ---
// UPDATED to directly select `shipping_address` from `orders` table
app.get('/api/user/orders/received', authenticateToken, async (req, res) => {
    const sellerId = req.user.id;

    try {
        const [orderItemsForSeller] = await pool.execute(
            `SELECT
                oi.id AS order_item_id,
                oi.order_id,
                oi.product_id,
                oi.quantity,
                oi.price_at_purchase,
                p.name AS product_name,
                p.image_url,
                o.created_at AS order_date,
                o.total_amount,
                o.payment_status,
                o.status AS shipping_status,
                o.shipping_address AS buyer_shipping_address,
                u.username AS buyer_username,
                u.email AS buyer_email,
                pay.payment_method,
                pay.id AS payment_id -- NEW: Include payment_id
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            JOIN users u ON o.user_id = u.id
            JOIN payments pay ON o.payment_id = pay.id
            WHERE p.user_id = ?
            ORDER BY o.created_at DESC`,
            [sellerId]
        );

        const ordersReceivedMap = new Map();
        orderItemsForSeller.forEach(item => {
            if (!ordersReceivedMap.has(item.order_id)) {
                ordersReceivedMap.set(item.order_id, {
                    order_id: item.order_id,
                    order_date: item.order_date,
                    payment_status: item.payment_status,
                    shipping_status: item.shipping_status,
                    buyer_username: item.buyer_username,
                    buyer_email: item.buyer_email,
                    buyer_shipping_address: item.buyer_shipping_address,
                    payment_method: item.payment_method,
                    total_order_amount: item.total_amount,
                    payment_id: item.payment_id, // NEW: Add payment_id to the grouped order object
                    items_from_this_seller: []
                });
            }
            ordersReceivedMap.get(item.order_id).items_from_this_seller.push({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                price_at_purchase: item.price_at_purchase,
                image_url: item.image_url
            });
        });

        const ordersReceived = Array.from(ordersReceivedMap.values());

        res.status(200).json(ordersReceived);
    } catch (error) {
        console.error('Error fetching seller received orders:', error);
        res.status(500).json({ message: 'Server error fetching orders for your products.', details: error.message, sql: error.sql });
    }
});
// ===============================================
// NEW: Order Action Endpoints
// ===============================================

// Mark an order as shipped (for sellers to manage orders for their products)
app.put('/api/orders/:orderId/ship', authenticateToken, async (req, res) => {
    const { orderId } = req.params;
    const sellerId = req.user.id; // User ID from the authenticated token (the seller)
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Verify that the order exists and contains at least one product from this seller
        // This is crucial to ensure sellers can only mark orders shipped for *their* products.
        const [orderCheck] = await connection.execute(
            `SELECT o.id, o.status, o.payment_status
             FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             JOIN products p ON oi.product_id = p.id
             WHERE o.id = ? AND p.user_id = ?
             GROUP BY o.id`, // Group to get distinct order details if multiple items
            [orderId, sellerId]
        );

        if (orderCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Order not found or you do not have permission to ship this order.' });
        }

        const order = orderCheck[0];

        // 2. Check if the order is in a shippable status (e.g., 'pending', 'processing')
        if (order.status === 'shipped' || order.status === 'delivered' || order.status === 'cancelled' || order.status === 'refunded') {
            await connection.rollback();
            return res.status(400).json({ message: `Order is already ${order.status}. Cannot mark as shipped.` });
        }

        // Optional: Check if payment status allows shipping (e.g., must be 'paid' or 'succeeded')
        // For COD, payment_status might be 'pending' but still shippable. Adjust logic as needed.
        // If (order.payment_status === 'pending' && order.payment_method !== 'Cash on Delivery') { ... }

        // 3. Update the order status to 'shipped'
        const [updateResult] = await connection.execute(
            `UPDATE orders
             SET status = 'shipped', updated_at = NOW()
             WHERE id = ?`,
            [orderId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(500).json({ message: 'Failed to update order status.' });
        }

        await connection.commit();
        res.status(200).json({ success: true, message: `Order #${orderId} marked as shipped.` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error marking order as shipped:', error);
        res.status(500).json({ message: 'Server error marking order as shipped.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});


// Cancel an order (for buyers to cancel their own pending orders)
app.put('/api/orders/:orderId/cancel', authenticateToken, async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id; // User ID from the authenticated token (the buyer)
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Verify the order belongs to the user and is in a cancellable state
        const [orders] = await connection.execute(
            `SELECT id, status, payment_status, payment_id
             FROM orders
             WHERE id = ? AND user_id = ?`,
            [orderId, userId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Order not found or you do not have permission to cancel this order.' });
        }

        const order = orders[0];

        // 2. Check current order status: only 'pending' or 'processing' can be cancelled by user
        if (order.status === 'shipped' || order.status === 'delivered' || order.status === 'cancelled' || order.status === 'refunded') {
            await connection.rollback();
            return res.status(400).json({ message: `Order is already ${order.status}. Cannot cancel.` });
        }

        // 3. Determine new payment status based on current payment status
        let newPaymentStatus = 'cancelled';
        if (order.payment_status === 'paid' || order.payment_status === 'succeeded') {
            newPaymentStatus = 'refunded'; // Indicate a refund is necessary/processed
            // In a real app, initiate refund via payment gateway here
            console.log(`INFO: Order #${orderId} was paid. Initiating refund process (simulated).`);
            // You might add logic here to interact with your payment gateway's refund API
        }

        // 4. Update order status and payment status
        const [updateOrderResult] = await connection.execute(
            `UPDATE orders
             SET status = 'cancelled', payment_status = ?, updated_at = NOW()
             WHERE id = ?`,
            [newPaymentStatus, orderId]
        );

        if (updateOrderResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(500).json({ message: 'Failed to update order status.' });
        }

        // 5. Restore product stock quantities
        const [orderItemsToRestore] = await connection.execute(
            `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
            [orderId]
        );

        for (const item of orderItemsToRestore) {
            await connection.execute(
                `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();
        res.status(200).json({ success: true, message: `Order #${orderId} cancelled. Stock restored.`, newPaymentStatus: newPaymentStatus });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Server error cancelling order.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// ===============================================
// NEW: Mark COD Payment as Received Endpoint
// ===============================================

// Mark a Cash on Delivery payment as received/succeeded (for sellers)
app.put('/api/payments/:paymentId/mark-received', authenticateToken, async (req, res) => {
    const { paymentId } = req.params;
    const sellerId = req.user.id; // User ID from the authenticated token (the seller)
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Fetch payment details and associated order/product info
        const [paymentRecords] = await connection.execute(
            `SELECT pmt.id AS payment_id, pmt.order_id, pmt.status AS payment_current_status, pmt.payment_method,
                    o.status AS order_shipping_status, o.total_amount,
                    oi.product_id, prod.user_id AS product_seller_id
             FROM payments pmt
             JOIN orders o ON pmt.order_id = o.id
             JOIN order_items oi ON o.id = oi.order_id
             JOIN products prod ON oi.product_id = prod.id
             WHERE pmt.id = ?`,
            [paymentId]
        );

        if (paymentRecords.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Payment record not found or no associated order/product.' });
        }

        const payment = paymentRecords[0]; // Get the first record to check basic payment info
        const isSellerOfProductsInOrder = paymentRecords.some(rec => rec.product_seller_id === sellerId);

        // 2. Authorization: Ensure the logged-in user is a seller of products within this order
        if (!isSellerOfProductsInOrder) {
            await connection.rollback();
            return res.status(403).json({ message: 'Forbidden: You do not have permission to mark this payment as received.' });
        }

        // 3. Validate payment method and status
        if (payment.payment_method !== 'Cash on Delivery') {
            await connection.rollback();
            return res.status(400).json({ message: 'This payment is not a Cash on Delivery type.' });
        }
        if (payment.payment_current_status === 'succeeded') {
            await connection.rollback();
            return res.status(400).json({ message: 'Payment has already been marked as received.' });
        }
        if (payment.payment_current_status !== 'pending') {
             await connection.rollback();
             return res.status(400).json({ message: `Payment is in '${payment.payment_current_status}' status. Cannot mark as received.` });
        }

        // 4. Update payment status in 'payments' table
        const [updatePaymentResult] = await connection.execute(
            `UPDATE payments
             SET status = 'succeeded', payment_date = NOW()
             WHERE id = ?`,
            [paymentId]
        );

        if (updatePaymentResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(500).json({ message: 'Failed to update payment status.' });
        }

        // 5. Update associated order's payment_status in 'orders' table
        const [updateOrderResult] = await connection.execute(
            `UPDATE orders
             SET payment_status = 'paid', updated_at = NOW()
             WHERE id = ?`,
            [payment.order_id]
        );

        if (updateOrderResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(500).json({ message: 'Failed to update order payment status.' });
        }

        await connection.commit();
        res.status(200).json({ success: true, message: `Payment for Order #${payment.order_id} marked as received.` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error marking COD payment as received:', error);
        res.status(500).json({ message: 'Server error marking COD payment as received.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// ===============================================
// NEW: Sales Reports Endpoints
// ===============================================

// Get monthly sales report for products listed by the logged-in user
app.get('/api/reports/my-monthly-sales', authenticateToken, async (req, res) => {
    const userId = req.user.id; // The seller ID is the logged-in user's ID

    try {
        const [monthlySales] = await pool.execute(
            `SELECT
                DATE_FORMAT(o.created_at, '%Y-%m') AS month_year,
                SUM(oi.quantity * oi.price_at_purchase) AS total_sales_amount,
                COUNT(DISTINCT o.id) AS number_of_orders_with_my_products
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN orders o ON oi.order_id = o.id
             WHERE p.user_id = ? -- Filter by products listed by this user
               AND (o.payment_status = 'paid' OR o.payment_status = 'succeeded') -- Only count paid orders
               AND o.status NOT IN ('cancelled', 'refunded') -- Exclude cancelled/refunded orders
             GROUP BY month_year
             ORDER BY month_year DESC`,
            [userId]
        );

        res.status(200).json(monthlySales);

    } catch (error) {
        console.error('Error fetching monthly sales report:', error);
        res.status(500).json({ message: 'Server error fetching sales report.', details: error.message });
    }
});


// Download sales report as CSV for products listed by the logged-in user
app.get('/api/reports/download-csv', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const [monthlySales] = await pool.execute(
            `SELECT
                DATE_FORMAT(o.created_at, '%Y-%m') AS month_year,
                SUM(oi.quantity * oi.price_at_purchase) AS total_sales_amount,
                COUNT(DISTINCT o.id) AS number_of_orders_with_my_products
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN orders o ON oi.order_id = o.id
             WHERE p.user_id = ?
               AND (o.payment_status = 'paid' OR o.payment_status = 'succeeded')
               AND o.status NOT IN ('cancelled', 'refunded')
             GROUP BY month_year
             ORDER BY month_year DESC`,
            [userId]
        );

        if (monthlySales.length === 0) {
            return res.status(404).send("No sales data available for CSV export.");
        }

        // Create CSV content
        let csvContent = "Month,Total Sales (PKR),Number of Orders\n";
        monthlySales.forEach(row => {
            csvContent += `${row.month_year},${parseFloat(row.total_sales_amount).toFixed(2)},${row.number_of_orders_with_my_products}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('monthly_sales_report.csv');
        res.send(csvContent);

    } catch (error) {
        console.error('Error generating CSV report:', error);
        res.status(500).json({ message: 'Server error generating CSV report.', details: error.message });
    }
});

// Download sales report as PDF for products listed by the logged-in user
app.get('/api/reports/download-pdf', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const [monthlySales] = await pool.execute(
            `SELECT
                DATE_FORMAT(o.created_at, '%Y-%m') AS month_year,
                SUM(oi.quantity * oi.price_at_purchase) AS total_sales_amount,
                COUNT(DISTINCT o.id) AS number_of_orders_with_my_products
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN orders o ON oi.order_id = o.id
             WHERE p.user_id = ?
               AND (o.payment_status = 'paid' OR o.payment_status = 'succeeded')
               AND o.status NOT IN ('cancelled', 'refunded')
             GROUP BY month_year
             ORDER BY month_year DESC`,
            [userId]
        );

        if (monthlySales.length === 0) {
            return res.status(404).send("No sales data available for PDF export.");
        }

        const doc = new PDFDocument();
        const filename = 'monthly_sales_report.pdf';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res); // Pipe the PDF to the response stream

        doc.fontSize(24).fillColor('#00cc99').text('Your Monthly Sales Report', { align: 'center' }).moveDown(1.5);
        doc.fontSize(12).fillColor('#f8f9fa').text(`Report generated: ${new Date().toLocaleDateString()}`, { align: 'right' }).moveDown(1);
        doc.fontSize(14).fillColor('#e0e0e0').text(`Sales for User ID: ${userId}`, { align: 'left' }).moveDown(1);

        // Table headers
        doc.fillColor('#00cc99')
           .text('Month/Year', 50, doc.y, { width: 150, align: 'left' })
           .text('Total Sales (PKR)', 200, doc.y, { width: 150, align: 'right' })
           .text('Number of Orders', 350, doc.y, { width: 150, align: 'right' });
        doc.moveDown(0.5);

        // Table rows
        doc.strokeColor('#2c5364'); // A subtle line color for table
        doc.lineCap('butt')
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke()
           .moveDown(0.5);

        monthlySales.forEach(row => {
            doc.fillColor('#f8f9fa')
               .text(row.month_year, 50, doc.y, { width: 150, align: 'left' })
               .text(parseFloat(row.total_sales_amount).toFixed(2), 200, doc.y, { width: 150, align: 'right' })
               .text(row.number_of_orders_with_my_products, 350, doc.y, { width: 150, align: 'right' });
            doc.moveDown(0.5);
            doc.lineCap('butt')
               .moveTo(50, doc.y)
               .lineTo(550, doc.y)
               .stroke()
               .moveDown(0.5);
        });

        doc.end(); // Finalize the PDF and send it

    } catch (error) {
        console.error('Error generating PDF report:', error);
        res.status(500).json({ message: 'Server error generating PDF report.', details: error.message });
    }
});


// ===============================================
// NEW: Detailed Monthly Orders Report Endpoint
// ===============================================

// Get detailed order list for a specific month/year for products listed by the logged-in user
app.get('/api/reports/monthly-order-details', authenticateToken, async (req, res) => {
    const userId = req.user.id; // The seller ID is the logged-in user's ID
    const { month, year } = req.query; // Expects month (MM) and year (YYYY) as query params

    if (!month || !year || !/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) {
        return res.status(400).json({ message: 'Month (MM) and Year (YYYY) are required query parameters and must be valid format.' });
    }

    // Construct start and end dates for the given month/year
    const startDate = `${year}-${month}-01 00:00:00`;
    const endDate = `${year}-${month}-31 23:59:59`; // Assuming all months have up to 31 days, MySQL will handle invalid dates gracefully to month end, or you can use LAST_DAY function.

    try {
        // Fetch all order items associated with products sold by this seller for the given month
        const [orderItemsForSeller] = await pool.execute(
            `SELECT
                oi.id AS order_item_id,
                oi.order_id,
                oi.product_id,
                oi.quantity,
                oi.price_at_purchase,
                p.name AS product_name,
                p.image_url,
                o.created_at AS order_date,
                o.total_amount,
                o.payment_status,
                o.status AS shipping_status,
                o.shipping_address AS buyer_shipping_address,
                u.username AS buyer_username,
                u.email AS buyer_email,
                pay.payment_method,
                pay.id AS payment_id
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            JOIN users u ON o.user_id = u.id
            JOIN payments pay ON o.payment_id = pay.id
            WHERE p.user_id = ?
              AND o.created_at >= ?
              AND o.created_at <= ?
              AND (o.payment_status = 'paid' OR o.payment_status = 'succeeded') -- Only consider paid orders for reports
              AND o.status NOT IN ('cancelled', 'refunded') -- Exclude cancelled/refunded orders
            ORDER BY o.created_at DESC`,
            [userId, startDate, endDate]
        );

        // Group these items by order_id to form distinct orders
        const detailedOrdersMap = new Map();
        orderItemsForSeller.forEach(item => {
            if (!detailedOrdersMap.has(item.order_id)) {
                detailedOrdersMap.set(item.order_id, {
                    order_id: item.order_id,
                    order_date: item.order_date,
                    total_amount: item.total_amount,
                    payment_status: item.payment_status,
                    shipping_status: item.shipping_status,
                    buyer_username: item.buyer_username,
                    buyer_email: item.buyer_email,
                    buyer_shipping_address: item.buyer_shipping_address,
                    payment_method: item.payment_method,
                    payment_id: item.payment_id,
                    products_from_this_seller: [] // Renamed for clarity
                });
            }
            detailedOrdersMap.get(item.order_id).products_from_this_seller.push({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                price_at_purchase: item.price_at_purchase,
                image_url: item.image_url
            });
        });

        const detailedOrders = Array.from(detailedOrdersMap.values());

        res.status(200).json(detailedOrders);

    } catch (error) {
        console.error('Error fetching detailed monthly orders report:', error);
        res.status(500).json({ message: 'Server error fetching detailed monthly orders report.', details: error.message });
    }
});



// ===============================================
// NEW: Admin Endpoints
// ===============================================

// Get overall dashboard statistics for admin panel
app.get('/api/admin/dashboard-stats', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // Total Sales (only succeeded/paid orders)
        const [totalSalesResult] = await connection.execute(
            `SELECT COALESCE(SUM(total_amount), 0) AS overall_sales
             FROM orders
             WHERE payment_status = 'succeeded' OR payment_status = 'paid'`
        );
        const overallSales = totalSalesResult[0].overall_sales;

        // Total Orders Placed (all orders, regardless of status)
        const [totalOrdersResult] = await connection.execute(
            `SELECT COUNT(id) AS total_orders FROM orders`
        );
        const totalOrders = totalOrdersResult[0].total_orders;

        // Total Products Listed (all active products)
        const [totalProductsResult] = await connection.execute(
            `SELECT COUNT(id) AS total_products FROM products`
        );
        const totalProducts = totalProductsResult[0].total_products;

        // Total Users Registered
        const [totalUsersResult] = await connection.execute(
            `SELECT COUNT(id) AS total_users FROM users`
        );
        const totalUsers = totalUsersResult[0].total_users;

        res.status(200).json({
            overallSales: parseFloat(overallSales).toFixed(2),
            totalOrders: totalOrders,
            totalProducts: totalProducts,
            totalUsers: totalUsers
        });

    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching admin dashboard statistics.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// ===============================================
// NEW: Admin User Management Endpoints
// ===============================================

// GET all users (for Admin)
app.get('/api/admin/users', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        // Include 'phone' in the SELECT statement
        const [users] = await connection.execute(
            `SELECT id, username, email, phone, user_type, created_at, updated_at FROM users ORDER BY created_at DESC`
        );
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users for admin:', error);
        res.status(500).json({ message: 'Server error fetching users.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// PUT update user (for Admin - e.g., change user_type, add phone)
app.put('/api/admin/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const userId = req.params.id;
    // Include 'phone' in the destructured body
    const { username, email, phone, user_type } = req.body; 

    // Basic validation
    if (!user_type || (user_type !== 'admin' && user_type !== 'user')) {
        return res.status(400).json({ message: 'Invalid user_type. Must be "admin" or "user".' });
    }
    if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // Check if the user exists
        const [existingUser] = await connection.execute('SELECT id FROM users WHERE id = ?', [userId]);
        if (existingUser.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update the user - include 'phone' in the UPDATE statement
        const [result] = await connection.execute(
            `UPDATE users SET username = ?, email = ?, phone = ?, user_type = ?, updated_at = NOW() WHERE id = ?`,
            [username, email, phone, user_type, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'Failed to update user or no changes made.' });
        }

        res.status(200).json({ message: 'User updated successfully.' });
    } catch (error) {
        console.error('Error updating user by admin:', error);
        res.status(500).json({ message: 'Server error updating user.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// DELETE a user (for Admin)
app.delete('/api/admin/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const userIdToDelete = req.params.id;
    const adminUserId = req.user.id; // The ID of the admin performing the delete

    // Prevent an admin from deleting themselves (optional but recommended)
    if (parseInt(userIdToDelete) === adminUserId) {
        return res.status(403).json({ message: 'Forbidden: Cannot delete your own admin account.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check if the user exists
        const [existingUser] = await connection.execute('SELECT id FROM users WHERE id = ?', [userIdToDelete]);
        if (existingUser.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'User not found.' });
        }

        // Before deleting a user, you might need to handle related data:
        // 1. Products listed by this user (if they are a seller)
        //    - Option A: Delete them
        //    - Option B: Reassign them to a 'default' admin/user
        //    - Option C: Set their status to 'inactive' or 'orphan'
        // 2. Cart items of this user
        // 3. Orders placed by this user (buyer)
        // 4. Payments made by this user
        // For simplicity, we'll implement CASCADE DELETE in DB or just delete related records here.
        // Assuming your DB schema has ON DELETE CASCADE for foreign keys,
        // deleting the user from 'users' table would automatically delete their cart_items, orders, etc.
        // If not, you need to manually delete related records in correct order:
        // DELETE FROM cart_items WHERE user_id = ?;
        // DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?);
        // DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?);
        // DELETE FROM orders WHERE user_id = ?;
        // DELETE FROM products WHERE user_id = ?; // If user is a seller

        const [result] = await connection.execute(`DELETE FROM users WHERE id = ?`, [userIdToDelete]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Failed to delete user.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'User deleted successfully.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error deleting user by admin:', error);
        res.status(500).json({ message: 'Server error deleting user.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});


// ===============================================
// NEW: Admin Product Management Endpoints
// ===============================================

// GET all products (for Admin) - includes seller info
app.get('/api/admin/products', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [products] = await connection.execute(
            `SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity, p.image_url, p.category,
                p.created_at, p.updated_at, -- Ensure updated_at is selected here
                u.username AS seller_username, u.email AS seller_email
            FROM products p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC`
        );
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching all products for admin:', error);
        res.status(500).json({ message: 'Server error fetching products.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// PUT update product by ID (for Admin) - NOW REMOVE updated_at = NOW()
app.put('/api/admin/products/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const productId = req.params.id;
    const { name, description, price, stock_quantity, category, image_url } = req.body;

    // Basic validation (remains the same)
    if (!name || !description || price === undefined || stock_quantity === undefined) {
        return res.status(400).json({ message: 'Product name, description, price, and stock quantity are required.' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({ message: 'Price must be a positive number.' });
    }
    if (isNaN(parseInt(stock_quantity)) || parseInt(stock_quantity) < 0) {
        return res.status(400).json({ message: 'Stock quantity must be a non-negative integer.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        const [existingProduct] = await connection.execute('SELECT id FROM products WHERE id = ?', [productId]);
        if (existingProduct.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // MODIFIED: Removed `updated_at = NOW()` because DB handles `ON UPDATE CURRENT_TIMESTAMP`
        const [result] = await connection.execute(
            `UPDATE products SET
                name = ?, description = ?, price = ?, stock_quantity = ?,
                category = ?, image_url = ?
            WHERE id = ?`,
            [name, description, parseFloat(price), parseInt(stock_quantity), category, image_url, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'Failed to update product or no changes made.' });
        }

        res.status(200).json({ message: 'Product updated successfully.' });
    } catch (error) {
        console.error('Error updating product by admin:', error);
        res.status(500).json({ message: 'Server error updating product.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});


// DELETE a product by ID (for Admin)
app.delete('/api/admin/products/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const productId = req.params.id;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check if the product exists
        const [existingProduct] = await connection.execute('SELECT id FROM products WHERE id = ?', [productId]);
        if (existingProduct.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Considerations for deleting a product:
        // 1. Remove from any user carts (cart_items table)
        // 2. Remove from any orders (order_items table) if they are still 'pending' or 'cancelled'
        //    For already completed orders, you might want to mark the item as 'deleted' rather than removing the order_item.
        //    For simplicity, if your DB uses ON DELETE CASCADE for order_items and cart_items, deleting product handles it.
        //    If not, you'd manually delete from related tables first.

        // Manually delete associated cart items if no CASCADE is set
        await connection.execute(`DELETE FROM cart_items WHERE product_id = ?`, [productId]);
        // Note: Deleting from order_items for completed orders might not be desired.
        // Consider marking `order_items` as `product_deleted: TRUE` or similar instead if historical integrity is critical.
        // For this example, assuming cascade or that deleting product means it's fully gone.
        // If order_items doesn't cascade, you'd need: DELETE FROM order_items WHERE product_id = ?;

        const [result] = await connection.execute(`DELETE FROM products WHERE id = ?`, [productId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Failed to delete product.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Product deleted successfully.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error deleting product by admin:', error);
        res.status(500).json({ message: 'Server error deleting product.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});


// ===============================================
// NEW: Admin Order Management Endpoints
// ===============================================

// GET all orders with their items and user/product details (for Admin)
app.get('/api/admin/orders', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // Fetch all orders
        const [orders] = await connection.execute(
            `SELECT
                o.id AS order_id,
                o.user_id AS buyer_id,
                u.username AS buyer_username,
                u.email AS buyer_email,
                o.total_amount,
                o.status AS shipping_status,
                o.payment_status,
                o.shipping_address,
                o.tracking_number,
                pay.payment_method,
                pay.transaction_id,
                o.created_at,
                o.updated_at
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN payments pay ON o.payment_id = pay.id
            ORDER BY o.created_at DESC`
        );

        // For each order, fetch its associated items
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [items] = await connection.execute(
                `SELECT
                    oi.id AS order_item_id,
                    oi.product_id,
                    oi.quantity,
                    oi.price_at_purchase,
                    p.name AS product_name,
                    p.image_url,
                    p.user_id AS seller_id, -- Seller of the product
                    seller_user.username AS seller_username, -- Seller username
                    seller_user.email AS seller_email -- Seller email
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 JOIN users seller_user ON p.user_id = seller_user.id
                 WHERE oi.order_id = ?`,
                [order.order_id]
            );
            return { ...order, items: items };
        }));

        res.status(200).json(ordersWithItems);

    } catch (error) {
        console.error('Error fetching all orders for admin:', error);
        res.status(500).json({ message: 'Server error fetching orders.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// PUT update order status and/or payment status (for Admin)
app.put('/api/admin/orders/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const orderId = req.params.id;
    const { shipping_status, payment_status } = req.body;

    // Validate statuses against allowed values (important!)
    const allowedShippingStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const allowedPaymentStatuses = ['pending', 'succeeded', 'failed', 'refunded', 'requires_action']; // Add more as per Stripe statuses

    if (shipping_status && !allowedShippingStatuses.includes(shipping_status)) {
        return res.status(400).json({ message: `Invalid shipping status: ${shipping_status}.` });
    }
    if (payment_status && !allowedPaymentStatuses.includes(payment_status)) {
        return res.status(400).json({ message: `Invalid payment status: ${payment_status}.` });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        const [existingOrder] = await connection.execute('SELECT id, payment_id FROM orders WHERE id = ?', [orderId]);
        if (existingOrder.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        const updates = [];
        const params = [];

        if (shipping_status) {
            updates.push('status = ?');
            params.push(shipping_status);
        }
        if (payment_status) {
            updates.push('payment_status = ?');
            params.push(payment_status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No status provided for update.' });
        }

        params.push(orderId); // Add orderId for the WHERE clause

        // Update the order's shipping status
        const [orderUpdateResult] = await connection.execute(
            `UPDATE orders SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
            params
        );

        // If payment_status was updated, also update the corresponding payment record
        if (payment_status && existingOrder[0].payment_id) {
            await connection.execute(
                `UPDATE payments SET status = ?, payment_date = NOW() WHERE id = ?`,
                [payment_status, existingOrder[0].payment_id]
            );
        }

        if (orderUpdateResult.affectedRows === 0) {
            return res.status(400).json({ message: 'Failed to update order or no changes made.' });
        }

        res.status(200).json({ message: 'Order updated successfully.' });

    } catch (error) {
        console.error('Error updating order by admin:', error);
        res.status(500).json({ message: 'Server error updating order.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// (Optional) DELETE an order by ID (for Admin) - Use with caution!
app.delete('/api/admin/orders/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const orderId = req.params.id;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

//         // Check if order exists
        const [existingOrder] = await connection.execute('SELECT id FROM orders WHERE id = ?', [orderId]);
        if (existingOrder.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Delete associated order items, then payments, then the order itself
        // Ensure your DB has ON DELETE CASCADE on foreign keys for order_items and payments
        // or manually delete in reverse order of foreign key dependencies:
        await connection.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
        await connection.execute('DELETE FROM payments WHERE order_id = ?', [orderId]);
        const [result] = await connection.execute('DELETE FROM orders WHERE id = ?', [orderId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Failed to delete order.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Order deleted successfully.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error deleting order by admin:', error);
        res.status(500).json({ message: 'Server error deleting order.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});
async function getUsersReportData(connection, year, month) {
    let query = `SELECT id, username, email, phone, user_type, created_at, updated_at FROM users`;
    const params = [];

    if (year && month) {
        query += ` WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?`;
        params.push(year, month);
    } else if (year) {
        query += ` WHERE YEAR(created_at) = ?`;
        params.push(year);
    }
    query += ` ORDER BY created_at DESC`;
    const [users] = await connection.execute(query, params);
    return users;
}

async function getStockReportData(connection, year, month) {
    let query = `
        SELECT
            p.id, p.name, p.description, p.price, p.stock_quantity, p.category,
            u.username AS seller_username, u.email AS seller_email,
            p.created_at, p.updated_at
        FROM products p
        JOIN users u ON p.user_id = u.id
    `;
    const params = [];

    if (year && month) {
        query += ` WHERE YEAR(p.created_at) = ? AND MONTH(p.created_at) = ?`;
        params.push(year, month);
    } else if (year) {
        query += ` WHERE YEAR(p.created_at) = ?`;
        params.push(year);
    }
    query += ` ORDER BY p.stock_quantity ASC`;
    const [products] = await connection.execute(query, params);
    return products;
}

async function getOrdersReportData(connection, year, month) {
    let query = `
        SELECT
            o.id AS order_id,
            o.user_id AS buyer_id,
            u.username AS buyer_username,
            u.email AS buyer_email,
            o.total_amount,
            o.status AS shipping_status,
            o.payment_status,
            o.shipping_address,
            o.tracking_number,
            pay.payment_method,
            pay.transaction_id,
            o.created_at,
            o.updated_at
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN payments pay ON o.payment_id = pay.id
    `;
    const params = [];

    if (year && month) {
        query += ` WHERE YEAR(o.created_at) = ? AND MONTH(o.created_at) = ?`;
        params.push(year, month);
    } else if (year) {
        query += ` WHERE YEAR(o.created_at) = ?`;
        params.push(year);
    }
    query += ` ORDER BY o.created_at DESC`;
    const [orders] = await connection.execute(query, params);

    const ordersWithItems = await Promise.all(orders.map(async (order) => {
        const [items] = await connection.execute(
            `SELECT
                oi.id AS order_item_id,
                oi.product_id,
                oi.quantity,
                oi.price_at_purchase,
                p.name AS product_name,
                p.image_url,
                p.user_id AS seller_id,
                seller_user.username AS seller_username,
                seller_user.email AS seller_email
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN users seller_user ON p.user_id = seller_user.id
             WHERE oi.order_id = ?`,
            [order.order_id]
        );
        const itemDetails = items.map(item =>
            `${item.product_name} (Qty: ${item.quantity}, Price: PKR ${parseFloat(item.price_at_purchase).toFixed(2)}, Seller: ${item.seller_username})`
        ).join('; ');
        return { ...order, items: items, item_details_csv: itemDetails };
    }));
    return ordersWithItems;
}

// ===============================================
// NEW: Admin Report Generation Endpoints
// ===============================================

// Generic function to generate CSV
async function generateCsv(data, headers, res, filename) {
    const stringifier = new Stringifier({ header: true, columns: headers });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

    stringifier.pipe(res); // Pipe CSV data directly to response
    data.forEach(row => stringifier.write(row));
    stringifier.end();
}

// Generic function to generate PDF
async function generatePdf(data, title, headers, columns, res, filename) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers = [];

    doc.on('data', chunk => {
        buffers.push(chunk);
        // console.log(`PDF chunk received, total buffer size: ${buffers.reduce((acc, b) => acc + b.length, 0)} bytes`); // Debugging line
    });

    doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        
        // Headers must be set BEFORE res.end() is called
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        // console.log(`PDF generation complete. Sending ${pdfBuffer.length} bytes.`); // Debugging line
        res.end(pdfBuffer);
    });

    // Error handling for PDFKit itself
    doc.on('error', (err) => {
        console.error('PDFKit error during generation:', err);
        // Ensure only one response is sent. If res.end() was already called by 'end' event, this won't fire.
        // But if an error occurs *before* end, this catches it.
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating PDF.', error: err.message });
        }
    });

    // --- PDF Content Generation (remains largely the same) ---
    doc.fontSize(20).text(title, { align: 'center' }).moveDown(0.5);
    doc.fontSize(12).text(`Report Generated: ${new Date().toLocaleString()}`).moveDown(1);

    const tableTop = doc.y;
    const itemHeight = 25;
    const startX = 30;
    const endX = 570;

    const colWidth = (endX - startX) / columns.length;
    let currentY = tableTop;

    doc.font('Helvetica-Bold').fontSize(10);
    columns.forEach((col, i) => {
        doc.text(headers[i], startX + (i * colWidth), currentY, {
            width: colWidth,
            align: 'center'
        });
    });
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(startX, currentY + itemHeight - 5).lineTo(endX, currentY + itemHeight - 5).stroke();
    currentY += itemHeight;

    doc.font('Helvetica').fontSize(9);
    data.forEach((row, rowIndex) => {
        if (currentY + itemHeight > doc.page.height - 30) {
            doc.addPage();
            currentY = 30;

            doc.font('Helvetica-Bold').fontSize(10);
            columns.forEach((col, i) => {
                doc.text(headers[i], startX + (i * colWidth), currentY, {
                    width: colWidth,
                    align: 'center'
                });
            });
            doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(startX, currentY + itemHeight - 5).lineTo(endX, currentY + itemHeight - 5).stroke();
            currentY += itemHeight;
            doc.font('Helvetica').fontSize(9);
        }

        columns.forEach((col, i) => {
            let cellValue = row[col] !== null && row[col] !== undefined ? String(row[col]) : 'N/A';
            if (col.includes('_at') && cellValue !== 'N/A') {
                cellValue = new Date(cellValue).toLocaleDateString();
            } else if (col.includes('price') || col.includes('amount')) {
                cellValue = `PKR ${parseFloat(cellValue).toFixed(2)}`;
            } else if (col === 'item_details_csv' && Array.isArray(row['items'])) {
                cellValue = row['items'].map(item =>
                    `${item.product_name} (x${item.quantity}, PKR ${parseFloat(item.price_at_purchase).toFixed(2)})`
                ).join('; ');
            }

            doc.text(cellValue, startX + (i * colWidth), currentY, {
                width: colWidth,
                align: 'left',
                ellipsis: true
            });
        });
        currentY += itemHeight;

        doc.strokeColor('#eeeeee').lineWidth(0.5).moveTo(startX, currentY - 2).lineTo(endX, currentY - 2).stroke();
    });

    doc.end();
}
// --- User Reports ---
app.get('/api/admin/reports/users', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const year = req.query.year ? parseInt(req.query.year) : null;
        const month = req.query.month ? parseInt(req.query.month) : null;
        const users = await getUsersReportData(connection, year, month);
        res.status(200).json(users);
    } catch (error) {
        console.error('Error getting user report:', error);
        res.status(500).json({ message: 'Error generating user report.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/admin/reports/users/csv', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const year = req.query.year ? parseInt(req.query.year) : null;
        const month = req.query.month ? parseInt(req.query.month) : null;
        const users = await getUsersReportData(connection, year, month);
        const headers = ['id', 'username', 'email', 'phone', 'user_type', 'created_at', 'updated_at'];
        generateCsv(users, headers, res, 'users_report');
    } catch (error) {
        console.error('Error generating users CSV:', error);
        res.status(500).json({ message: 'Error generating users CSV.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/admin/reports/users/pdf', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const year = req.query.year ? parseInt(req.query.year) : null;
        const month = req.query.month ? parseInt(req.query.month) : null;
        const users = await getUsersReportData(connection, year, month);
        const headers = ['ID', 'Username', 'Email', 'Phone', 'Type', 'Created', 'Updated'];
        const columns = ['id', 'username', 'email', 'phone', 'user_type', 'created_at', 'updated_at'];
        // You might want to adjust PDF title to include month/year if selected
        const reportTitle = `User Report ${month && year ? `for ${months.find(m => m.value === String(month))?.label} ${year}` : year ? `for ${year}` : ''}`;
        await generatePdf(users, reportTitle, headers, columns, res, 'users_report');
    } catch (error) {
        console.error('Error generating users PDF:', error);
        res.status(500).json({ message: 'Error generating users PDF.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});


// --- Stock Reports ---
app.get('/api/admin/reports/stock', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const year = req.query.year ? parseInt(req.query.year) : null;
        const month = req.query.month ? parseInt(req.query.month) : null;
        const stock = await getStockReportData(connection, year, month);
        res.status(200).json(stock);
    } catch (error) {
        console.error('Error getting stock report:', error);
        res.status(500).json({ message: 'Error generating stock report.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/admin/reports/stock/csv', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const year = req.query.year ? parseInt(req.query.year) : null;
        const month = req.query.month ? parseInt(req.query.month) : null;
        const stock = await getStockReportData(connection, year, month);
        const headers = ['id', 'name', 'description', 'price', 'stock_quantity', 'category', 'seller_username', 'seller_email', 'created_at', 'updated_at'];
        generateCsv(stock, headers, res, 'stock_report');
    } catch (error) {
        console.error('Error generating stock CSV:', error);
        res.status(500).json({ message: 'Error generating stock CSV.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/admin/reports/stock/pdf', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const year = req.query.year ? parseInt(req.query.year) : null;
        const month = req.query.month ? parseInt(req.query.month) : null;
        const stock = await getStockReportData(connection, year, month);
        const headers = ['ID', 'Product Name', 'Price', 'Stock', 'Category', 'Seller', 'Created', 'Updated'];
        const columns = ['id', 'name', 'price', 'stock_quantity', 'category', 'seller_username', 'created_at', 'updated_at'];
        const reportTitle = `Product Stock Report ${month && year ? `for ${months.find(m => m.value === String(month))?.label} ${year}` : year ? `for ${year}` : ''}`;
        await generatePdf(stock, reportTitle, headers, columns, res, 'stock_report');
    } catch (error) {
        console.error('Error generating stock PDF:', error);
        res.status(500).json({ message: 'Error generating stock PDF.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});


// --- Order Reports ---
app.get('/api/admin/reports/orders', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const year = req.query.year ? parseInt(req.query.year) : null;
        const month = req.query.month ? parseInt(req.query.month) : null;
        const orders = await getOrdersReportData(connection, year, month);
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error getting order report:', error);
        res.status(500).json({ message: 'Error generating order report.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/admin/reports/orders/csv', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const year = req.query.year ? parseInt(req.query.year) : null;
        const month = req.query.month ? parseInt(req.query.month) : null;
        const orders = await getOrdersReportData(connection, year, month);
        const headers = [
            'order_id', 'buyer_username', 'buyer_email', 'total_amount',
            'shipping_status', 'payment_status', 'shipping_address',
            'tracking_number', 'payment_method', 'transaction_id',
            'created_at', 'updated_at', 'item_details_csv'
        ];
        generateCsv(orders, headers, res, 'orders_report');
    } catch (error) {
        console.error('Error generating orders CSV:', error);
        res.status(500).json({ message: 'Error generating orders CSV.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/admin/reports/orders/pdf', authenticateToken, authorizeAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const year = req.query.year ? parseInt(req.query.year) : null;
        const month = req.query.month ? parseInt(req.query.month) : null;
        const orders = await getOrdersReportData(connection, year, month);
        const headers = ['ID', 'Buyer', 'Total', 'Shipping Status', 'Payment Status', 'Payment Method', 'Order Date', 'Items'];
        const columns = ['order_id', 'buyer_username', 'total_amount', 'shipping_status', 'payment_status', 'payment_method', 'created_at', 'item_details_csv'];
        const reportTitle = `Order Report ${month && year ? `for ${months.find(m => m.value === String(month))?.label} ${year}` : year ? `for ${year}` : ''}`;
        await generatePdf(orders, reportTitle, headers, columns, res, 'orders_report');
    } catch (error) {
        console.error('Error generating orders PDF:', error);
        res.status(500).json({ message: 'Error generating orders PDF.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Helper for PDF title: (Define this helper in your backend/server.js)
const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
];
 
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access backend at: http://localhost:${PORT}`);
});