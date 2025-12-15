const express = require('express');
const router = express.Router();
const { generateToken, authenticateToken } = require('../middleware/auth');

module.exports = (userModel) => {
    // Register
    router.post('/register', async (req, res) => {
        try {
            const { username, password } = req.body;

            // Validation
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            if (username.length < 3 || username.length > 20) {
                return res.status(400).json({ error: 'Username must be 3-20 characters' });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }

            // Check if user exists
            const existingUser = await userModel.findByUsername(username);
            if (existingUser) {
                return res.status(409).json({ error: 'Username already exists' });
            }

            // Create user
            const user = await userModel.create(username, password);
            
            // Generate token
            const token = generateToken(user.id, user.username);
            
            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: 'strict'
            });

            res.json({ 
                success: true, 
                user: { id: user.id, username: user.username } 
            });
        } catch (err) {
            console.error('Registration error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Login
    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;

            // Validation
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            // Find user
            const user = await userModel.findByUsername(username);
            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Verify password
            const validPassword = await userModel.verifyPassword(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Generate token
            const token = generateToken(user.id, user.username);
            
            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: 'strict'
            });

            res.json({ 
                success: true, 
                user: { id: user.id, username: user.username } 
            });
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Logout
    router.post('/logout', (req, res) => {
        res.clearCookie('token');
        res.json({ success: true });
    });

    // Get current user
    router.get('/me', authenticateToken, async (req, res) => {
        try {
            const user = await userModel.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ 
                user: { 
                    id: user.id, 
                    username: user.username,
                    createdAt: user.created_at
                } 
            });
        } catch (err) {
            console.error('Get user error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
