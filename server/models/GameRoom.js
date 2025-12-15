class GameRoom {
    constructor(db) {
        this.db = db;
    }

    // Create a new game room
    create(id, name, hostUserId, difficulty, maxPlayers = 4) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO game_rooms (id, name, host_user_id, difficulty, max_players) VALUES (?, ?, ?, ?, ?)',
                [id, name, hostUserId, difficulty, maxPlayers],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id });
                    }
                }
            );
        });
    }

    // Find room by ID
    findById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM game_rooms WHERE id = ?',
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

    // Get all waiting rooms
    getWaitingRooms() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM game_rooms WHERE status = ? ORDER BY created_at DESC',
                ['waiting'],
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

    // Update room status
    updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE game_rooms SET status = ? WHERE id = ?',
                [status, id],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    // Delete room
    delete(id) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM game_rooms WHERE id = ?',
                [id],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }
}

module.exports = GameRoom;
