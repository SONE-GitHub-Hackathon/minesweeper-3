// Multiplayer functionality
class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.isHost = false;
        this.gameInstance = null;
        this.init();
    }

    async init() {
        // Get token for socket authentication
        const token = this.getCookie('token');
        
        // Initialize socket connection
        this.socket = io({
            auth: { token }
        });

        this.setupSocketListeners();
        this.setupUIListeners();
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('room-created', (data) => {
            this.currentRoom = data.roomId;
            this.isHost = true;
            this.showGameRoom();
            document.getElementById('start-game-btn').style.display = 'block';
        });

        this.socket.on('player-joined', (data) => {
            this.updatePlayersList(data.players);
            this.addChatMessage('System', `${data.player.username} ist dem Raum beigetreten`);
        });

        this.socket.on('player-left', (data) => {
            this.updatePlayersList(data.players);
            this.addChatMessage('System', `${data.username} hat den Raum verlassen`);
        });

        this.socket.on('rooms-list', (data) => {
            this.displayRooms(data.rooms);
        });

        this.socket.on('rooms-updated', (data) => {
            if (!this.currentRoom) {
                this.displayRooms(data.rooms);
            }
        });

        this.socket.on('game-started', (data) => {
            this.startMultiplayerGame(data.difficulty, data.seed);
        });

        this.socket.on('progress-updated', (data) => {
            this.updatePlayerProgress(data.username, data.progress);
        });

        this.socket.on('player-finished', (data) => {
            this.addChatMessage('System', 
                `${data.username} hat das Spiel ${data.won ? 'gewonnen' : 'verloren'}! Zeit: ${data.time}s`);
        });

        this.socket.on('chat-message', (data) => {
            this.addChatMessage(data.username, data.message);
        });

        this.socket.on('error', (data) => {
            alert(data.message);
        });
    }

    setupUIListeners() {
        // Mode switching
        document.getElementById('singleplayer-btn').addEventListener('click', () => {
            this.switchMode('single');
        });

        document.getElementById('multiplayer-btn').addEventListener('click', () => {
            this.switchMode('multi');
        });

        // Lobby controls
        document.getElementById('create-room-btn').addEventListener('click', () => {
            const name = prompt('Raumname:') || 'Neuer Raum';
            const difficulty = document.getElementById('difficulty').value;
            this.socket.emit('create-room', { name, difficulty });
        });

        document.getElementById('refresh-rooms-btn').addEventListener('click', () => {
            this.socket.emit('get-rooms');
        });

        // Room controls
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.socket.emit('start-game');
        });

        document.getElementById('leave-room-btn').addEventListener('click', () => {
            this.leaveRoom();
        });

        // Chat
        document.getElementById('send-chat-btn').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
    }

    switchMode(mode) {
        const singleBtn = document.getElementById('singleplayer-btn');
        const multiBtn = document.getElementById('multiplayer-btn');
        const singleMode = document.getElementById('singleplayer-mode');
        const multiMode = document.getElementById('multiplayer-mode');

        if (mode === 'single') {
            singleBtn.classList.add('active');
            multiBtn.classList.remove('active');
            singleMode.style.display = 'block';
            multiMode.style.display = 'none';
        } else {
            singleBtn.classList.remove('active');
            multiBtn.classList.add('active');
            singleMode.style.display = 'none';
            multiMode.style.display = 'block';
            this.socket.emit('get-rooms');
        }
    }

    displayRooms(rooms) {
        const roomsList = document.getElementById('rooms-list');
        roomsList.innerHTML = '';

        if (rooms.length === 0) {
            roomsList.innerHTML = '<p>Keine Räume verfügbar. Erstelle einen neuen Raum!</p>';
            return;
        }

        rooms.forEach(room => {
            const roomDiv = document.createElement('div');
            roomDiv.className = 'room-item';
            roomDiv.innerHTML = `
                <div class="room-info">
                    <h3>${room.name}</h3>
                    <p>Spieler: ${room.playerCount}/4 | Schwierigkeit: ${room.difficulty}</p>
                </div>
                <button onclick="multiplayerManager.joinRoom('${room.id}')" 
                    ${room.status !== 'waiting' || room.playerCount >= 4 ? 'disabled' : ''}>
                    ${room.status === 'waiting' ? 'Beitreten' : 'Im Spiel'}
                </button>
            `;
            roomsList.appendChild(roomDiv);
        });
    }

    joinRoom(roomId) {
        this.socket.emit('join-room', { roomId });
        this.currentRoom = roomId;
        this.isHost = false;
        this.showGameRoom();
    }

    leaveRoom() {
        this.socket.emit('leave-room');
        this.currentRoom = null;
        this.isHost = false;
        document.getElementById('multiplayer-lobby').style.display = 'block';
        document.getElementById('game-room').style.display = 'none';
        document.getElementById('multiplayer-game').style.display = 'none';
        this.socket.emit('get-rooms');
    }

    showGameRoom() {
        document.getElementById('multiplayer-lobby').style.display = 'none';
        document.getElementById('game-room').style.display = 'block';
        document.getElementById('room-title').textContent = `Raum: ${this.currentRoom}`;
    }

    updatePlayersList(players) {
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '<h3>Spieler im Raum:</h3>';
        
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.textContent = player.username;
            playersList.appendChild(playerDiv);
        });
    }

    addChatMessage(username, message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `<span class="username">${username}:</span> ${message}`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message) {
            this.socket.emit('chat-message', { message });
            input.value = '';
        }
    }

    startMultiplayerGame(difficulty, seed) {
        document.getElementById('multiplayer-game').style.display = 'block';
        document.getElementById('start-game-btn').style.display = 'none';
        
        // Initialize multiplayer game instance
        this.gameInstance = new MultiplayerMinesweeper(
            difficulty, 
            seed, 
            (progress) => this.socket.emit('update-progress', { progress }),
            (won, time) => this.socket.emit('game-finished', { won, time })
        );
    }

    updatePlayerProgress(username, progress) {
        const progressDiv = document.getElementById('players-progress');
        let playerProgress = progressDiv.querySelector(`[data-player="${username}"]`);
        
        if (!playerProgress) {
            playerProgress = document.createElement('div');
            playerProgress.className = 'progress-item';
            playerProgress.dataset.player = username;
            playerProgress.innerHTML = `
                <div>${username}: <span class="progress-percent">0%</span></div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
            `;
            progressDiv.appendChild(playerProgress);
        }
        
        playerProgress.querySelector('.progress-percent').textContent = `${Math.round(progress)}%`;
        playerProgress.querySelector('.progress-fill').style.width = `${progress}%`;
    }
}

// Multiplayer Minesweeper Game Class
class MultiplayerMinesweeper extends Minesweeper {
    constructor(difficulty, seed, progressCallback, finishCallback) {
        super();
        this.currentDifficulty = difficulty;
        this.seed = seed;
        this.progressCallback = progressCallback;
        this.finishCallback = finishCallback;
        this.boardElement = document.getElementById('mp-game-board');
        this.init();
        this.overrideElements();
    }

    overrideElements() {
        // Override to use multiplayer-specific elements
        this.mineCountElement = document.getElementById('mp-mine-count');
        this.timerElement = document.getElementById('mp-timer');
        this.statusElement = document.getElementById('mp-game-status');
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => this.handleClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(row, col);
                });
                
                this.updateCell(cell, row, col);
                this.boardElement.appendChild(cell);
            }
        }
        
        this.updateProgress();
    }

    updateMineCount() {
        let flaggedCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.flagged[row][col]) {
                    flaggedCount++;
                }
            }
        }
        this.mineCountElement.textContent = this.totalMines - flaggedCount;
    }

    updateTimer() {
        this.timerElement.textContent = this.timer;
    }

    updateGameStatus(message) {
        this.statusElement.textContent = message;
        this.statusElement.className = '';
        
        if (message.includes('Gewonnen')) {
            this.statusElement.classList.add('win');
            this.finishCallback(true, this.timer);
        } else if (message.includes('Verloren')) {
            this.statusElement.classList.add('lose');
            this.finishCallback(false, this.timer);
        }
    }

    updateProgress() {
        let revealedCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.revealed[row][col]) {
                    revealedCount++;
                }
            }
        }
        
        const totalCells = this.rows * this.cols;
        const progress = (revealedCount / (totalCells - this.totalMines)) * 100;
        this.progressCallback(progress);
    }

    handleClick(row, col) {
        super.handleClick(row, col);
        this.updateProgress();
    }

    placeMines(excludeRow, excludeCol) {
        // Use seed for deterministic mine placement
        let minesPlaced = 0;
        const random = this.seededRandom(this.seed);
        
        while (minesPlaced < this.totalMines) {
            const row = Math.floor(random() * this.rows);
            const col = Math.floor(random() * this.cols);
            
            const isExcluded = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
            
            if (this.board[row][col] !== -1 && !isExcluded) {
                this.board[row][col] = -1;
                minesPlaced++;
                
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const newRow = row + dr;
                        const newCol = col + dc;
                        
                        if (this.isValidCell(newRow, newCol) && this.board[newRow][newCol] !== -1) {
                            this.board[newRow][newCol]++;
                        }
                    }
                }
            }
        }
    }

    // Simple Linear Congruential Generator (LCG) for deterministic random numbers
    // This ensures all players get the same mine placement using the same seed
    // Constants: multiplier=9301, increment=49297, modulus=233280
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
}

// Initialize multiplayer manager
let multiplayerManager;
if (document.getElementById('multiplayer-mode')) {
    multiplayerManager = new MultiplayerManager();
}
