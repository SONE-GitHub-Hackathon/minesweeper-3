const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'minesweeper-secret-key-change-in-production';

// Generate JWT token
function generateToken(userId, username) {
    return jwt.sign(
        { userId, username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Verify JWT token middleware
function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

// Optional authentication (doesn't fail if no token)
function optionalAuth(req, res, next) {
    const token = req.cookies.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            // Token invalid, but continue anyway
        }
    }
    next();
}

module.exports = {
    generateToken,
    authenticateToken,
    optionalAuth,
    JWT_SECRET
};
