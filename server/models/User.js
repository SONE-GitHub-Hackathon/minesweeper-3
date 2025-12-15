const bcrypt = require('bcrypt');

class User {
    constructor(db) {
        this.db = db;
    }

    // Create a new user
    async create(username, password) {
        const passwordHash = await bcrypt.hash(password, 10);
        
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO users (username, password_hash) VALUES (?, ?)',
                [username, passwordHash],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, username });
                    }
                }
            );
        });
    }

    // Find user by username
    findByUsername(username) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    // Find user by ID
    findById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT id, username, created_at FROM users WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    // Verify password
    async verifyPassword(password, passwordHash) {
        return await bcrypt.compare(password, passwordHash);
    }

    // Get user statistics
    getStatistics(userId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT 
                    COUNT(*) as total_games,
                    SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) as won_games,
                    MIN(CASE WHEN won = 1 THEN time_seconds ELSE NULL END) as best_time,
                    ROUND(AVG(CASE WHEN won = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate
                FROM games 
                WHERE user_id = ?`,
                [userId],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row || {
                            total_games: 0,
                            won_games: 0,
                            best_time: null,
                            win_rate: 0
                        });
                    }
                }
            );
        });
    }

    // Get leaderboard
    getLeaderboard(limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT 
                    u.username,
                    COUNT(*) as total_games,
                    SUM(CASE WHEN g.won = 1 THEN 1 ELSE 0 END) as won_games,
                    ROUND(AVG(CASE WHEN g.won = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate
                FROM users u
                LEFT JOIN games g ON u.id = g.user_id
                GROUP BY u.id
                HAVING total_games > 0
                ORDER BY won_games DESC, win_rate DESC
                LIMIT ?`,
                [limit],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }
}

module.exports = User;
