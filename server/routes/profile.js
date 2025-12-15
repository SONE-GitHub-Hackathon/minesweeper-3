const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

module.exports = (userModel) => {
    // Get user profile with statistics
    router.get('/', authenticateToken, async (req, res) => {
        try {
            const user = await userModel.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const stats = await userModel.getStatistics(req.user.userId);

            res.json({
                user: {
                    id: user.id,
                    username: user.username,
                    createdAt: user.created_at
                },
                stats: {
                    totalGames: stats.total_games || 0,
                    wonGames: stats.won_games || 0,
                    bestTime: stats.best_time,
                    winRate: stats.win_rate || 0
                }
            });
        } catch (err) {
            console.error('Get profile error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get leaderboard
    router.get('/leaderboard', async (req, res) => {
        try {
            const leaderboard = await userModel.getLeaderboard(10);
            res.json({ leaderboard });
        } catch (err) {
            console.error('Get leaderboard error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
