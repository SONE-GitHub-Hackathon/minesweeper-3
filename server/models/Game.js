class Game {
    constructor(db) {
        this.db = db;
    }

    // Save game result
    save(userId, difficulty, won, timeSeconds, gameMode = 'single') {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO games (user_id, difficulty, won, time_seconds, game_mode) VALUES (?, ?, ?, ?, ?)',
                [userId, difficulty, won ? 1 : 0, timeSeconds, gameMode],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID });
                    }
                }
            );
        });
    }

    // Get user's recent games
    getUserGames(userId, limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM games WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
                [userId, limit],
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

module.exports = Game;
