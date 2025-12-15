const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { initDatabase, getDatabase } = require('../database/init');
const User = require('./models/User');
const Game = require('./models/Game');
const GameRoom = require('./models/GameRoom');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const gameRoutes = require('./routes/game');
const { JWT_SECRET } = require('./middleware/auth');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// In-memory storage for active game rooms
const activeRooms = new Map();

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Initialize database and models
let db, userModel, gameModel, gameRoomModel;

async function initialize() {
    try {
        db = await initDatabase();
        userModel = new User(db);
        gameModel = new Game(db);
        gameRoomModel = new GameRoom(db);

        // API Routes
        app.use('/api/auth', authRoutes(userModel));
        app.use('/api/profile', profileRoutes(userModel));
        app.use('/api/game', gameRoutes(gameModel));

        // Socket.io authentication middleware
        io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (token) {
                try {
                    const decoded = jwt.verify(token, JWT_SECRET);
                    socket.userId = decoded.userId;
                    socket.username = decoded.username;
                } catch (err) {
                    // Token invalid, continue as guest
                }
            }
            next();
        });

        // Socket.io connection handling
        io.on('connection', (socket) => {
            console.log(`User connected: ${socket.username || 'Guest'} (${socket.id})`);

            // Create room
            socket.on('create-room', async (data) => {
                try {
                    if (!socket.userId) {
                        socket.emit('error', { message: 'Authentication required' });
                        return;
                    }

                    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const roomName = data.name || `${socket.username}'s Raum`;
                    const difficulty = data.difficulty || 'easy';

                    // Save room to database
                    await gameRoomModel.create(roomId, roomName, socket.userId, difficulty);

                    // Create room in memory
                    activeRooms.set(roomId, {
                        id: roomId,
                        name: roomName,
                        host: socket.userId,
                        difficulty: difficulty,
                        players: [{
                            id: socket.userId,
                            username: socket.username,
                            socketId: socket.id,
                            ready: false,
                            progress: 0
                        }],
                        status: 'waiting',
                        gameState: null
                    });

                    socket.join(roomId);
                    socket.currentRoom = roomId;

                    socket.emit('room-created', { roomId });
                    io.emit('rooms-updated', { rooms: Array.from(activeRooms.values()).map(r => ({
                        id: r.id,
                        name: r.name,
                        playerCount: r.players.length,
                        difficulty: r.difficulty,
                        status: r.status
                    }))});
                } catch (err) {
                    console.error('Create room error:', err);
                    socket.emit('error', { message: 'Failed to create room' });
                }
            });

            // Join room
            socket.on('join-room', async (data) => {
                try {
                    if (!socket.userId) {
                        socket.emit('error', { message: 'Authentication required' });
                        return;
                    }

                    const room = activeRooms.get(data.roomId);
                    if (!room) {
                        socket.emit('error', { message: 'Room not found' });
                        return;
                    }

                    if (room.status !== 'waiting') {
                        socket.emit('error', { message: 'Game already in progress' });
                        return;
                    }

                    if (room.players.length >= 4) {
                        socket.emit('error', { message: 'Room is full' });
                        return;
                    }

                    // Add player to room
                    room.players.push({
                        id: socket.userId,
                        username: socket.username,
                        socketId: socket.id,
                        ready: false,
                        progress: 0
                    });

                    socket.join(data.roomId);
                    socket.currentRoom = data.roomId;

                    io.to(data.roomId).emit('player-joined', { 
                        player: { username: socket.username },
                        players: room.players 
                    });
                    
                    io.emit('rooms-updated', { rooms: Array.from(activeRooms.values()).map(r => ({
                        id: r.id,
                        name: r.name,
                        playerCount: r.players.length,
                        difficulty: r.difficulty,
                        status: r.status
                    }))});
                } catch (err) {
                    console.error('Join room error:', err);
                    socket.emit('error', { message: 'Failed to join room' });
                }
            });

            // Leave room
            socket.on('leave-room', () => {
                leaveRoom(socket);
            });

            // Get rooms list
            socket.on('get-rooms', () => {
                const rooms = Array.from(activeRooms.values()).map(r => ({
                    id: r.id,
                    name: r.name,
                    playerCount: r.players.length,
                    difficulty: r.difficulty,
                    status: r.status
                }));
                socket.emit('rooms-list', { rooms });
            });

            // Start game
            socket.on('start-game', async () => {
                try {
                    if (!socket.currentRoom) return;

                    const room = activeRooms.get(socket.currentRoom);
                    if (!room || room.host !== socket.userId) {
                        socket.emit('error', { message: 'Only host can start the game' });
                        return;
                    }

                    room.status = 'in_progress';
                    await gameRoomModel.updateStatus(room.id, 'in_progress');

                    // Generate game board seed for all players
                    const seed = Date.now();
                    room.gameState = { seed, startTime: Date.now() };

                    io.to(socket.currentRoom).emit('game-started', { 
                        seed,
                        difficulty: room.difficulty 
                    });
                } catch (err) {
                    console.error('Start game error:', err);
                    socket.emit('error', { message: 'Failed to start game' });
                }
            });

            // Update progress
            socket.on('update-progress', (data) => {
                if (!socket.currentRoom) return;

                const room = activeRooms.get(socket.currentRoom);
                if (!room) return;

                const player = room.players.find(p => p.id === socket.userId);
                if (player) {
                    player.progress = data.progress;
                    io.to(socket.currentRoom).emit('progress-updated', {
                        username: socket.username,
                        progress: data.progress
                    });
                }
            });

            // Game finished
            socket.on('game-finished', async (data) => {
                try {
                    if (!socket.currentRoom) return;

                    const room = activeRooms.get(socket.currentRoom);
                    if (!room) return;

                    // Save game result
                    await gameModel.save(
                        socket.userId,
                        room.difficulty,
                        data.won,
                        data.time,
                        'multiplayer'
                    );

                    io.to(socket.currentRoom).emit('player-finished', {
                        username: socket.username,
                        won: data.won,
                        time: data.time
                    });
                } catch (err) {
                    console.error('Game finished error:', err);
                }
            });

            // Chat message
            socket.on('chat-message', (data) => {
                if (!socket.currentRoom) return;

                io.to(socket.currentRoom).emit('chat-message', {
                    username: socket.username || 'Guest',
                    message: data.message,
                    timestamp: Date.now()
                });
            });

            // Disconnect
            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.username || 'Guest'} (${socket.id})`);
                leaveRoom(socket);
            });
        });

        // Helper function to handle leaving room
        function leaveRoom(socket) {
            if (!socket.currentRoom) return;

            const room = activeRooms.get(socket.currentRoom);
            if (room) {
                room.players = room.players.filter(p => p.socketId !== socket.id);

                if (room.players.length === 0) {
                    // Delete empty room
                    activeRooms.delete(socket.currentRoom);
                    gameRoomModel.delete(socket.currentRoom).catch(console.error);
                } else {
                    // If host left, assign new host
                    if (room.host === socket.userId && room.players.length > 0) {
                        room.host = room.players[0].id;
                    }

                    io.to(socket.currentRoom).emit('player-left', {
                        username: socket.username,
                        players: room.players
                    });
                }

                io.emit('rooms-updated', { rooms: Array.from(activeRooms.values()).map(r => ({
                    id: r.id,
                    name: r.name,
                    playerCount: r.players.length,
                    difficulty: r.difficulty,
                    status: r.status
                }))});
            }

            socket.leave(socket.currentRoom);
            socket.currentRoom = null;
        }

        // Start server
        server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to initialize server:', err);
        process.exit(1);
    }
}

initialize();
