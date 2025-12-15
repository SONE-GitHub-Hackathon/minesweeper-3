-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Games table for tracking individual game results
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    won BOOLEAN NOT NULL,
    time_seconds INTEGER NOT NULL,
    game_mode TEXT NOT NULL, -- 'single' or 'multiplayer'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Game rooms for multiplayer
CREATE TABLE IF NOT EXISTS game_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    host_user_id INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    max_players INTEGER DEFAULT 4,
    status TEXT DEFAULT 'waiting', -- 'waiting', 'in_progress', 'finished'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
