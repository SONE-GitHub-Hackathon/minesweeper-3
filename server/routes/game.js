const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

module.exports = (gameModel) => {
    // Save game result
    router.post('/result', authenticateToken, async (req, res) => {
        try {
            const { difficulty, won, timeSeconds, gameMode } = req.body;

            // Validation
            if (!difficulty || won === undefined || !timeSeconds) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const validDifficulties = ['easy', 'medium', 'hard'];
            if (!validDifficulties.includes(difficulty)) {
                return res.status(400).json({ error: 'Invalid difficulty' });
            }

            // Save game
            const result = await gameModel.save(
                req.user.userId,
                difficulty,
                won,
                timeSeconds,
                gameMode || 'single'
            );

            res.json({ success: true, gameId: result.id });
        } catch (err) {
            console.error('Save game error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get user's recent games
    router.get('/history', authenticateToken, async (req, res) => {
        try {
            const games = await gameModel.getUserGames(req.user.userId, 20);
            res.json({ games });
        } catch (err) {
            console.error('Get games error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
