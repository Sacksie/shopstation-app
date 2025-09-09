// In a real application, you would use JWTs and a proper session management library.
// For this MVP, we will simulate it with a simple header check.
const jwt = require('jsonwebtoken');

// A secret key for signing tokens. In a real app, this should be in your .env file.
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-super-secret-key';


// Middleware to protect routes
const requireStoreAuth = (req, res, next) => {
    const { authorization } = req.headers;
    // authorization === 'Bearer <token>'

    if (!authorization) {
        return res.status(401).json({ success: false, error: 'Authorization token required.' });
    }

    const token = authorization.split(' ')[1];

    try {
        // In a real app, the payload would contain user/store ID
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; // Attach user info to the request
        next();

    } catch (err) {
        console.error("JWT Verification Error: ", err.message);
        return res.status(401).json({ success: false, error: 'Request is not authorized.' });
    }
};

// Function to create a token (used in the login route)
const createToken = (storeId) => {
    return jwt.sign({ storeId }, JWT_SECRET, { expiresIn: '1d' });
};


module.exports = { requireStoreAuth, createToken };
