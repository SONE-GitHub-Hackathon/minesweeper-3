class Minesweeper {
    constructor() {
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;
        
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        
        this.currentDifficulty = 'easy';
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;
        
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.timer = 0;
        
        this.stopTimer();
        this.updateMineCount();
        this.updateTimer();
        this.renderBoard();
        this.updateGameStatus('');
    }
    
    setupEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.init();
        });
        
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.currentDifficulty = e.target.value;
            this.init();
        });
    }
    
    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.totalMines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Don't place mine on first click or adjacent cells
            const isExcluded = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
            
            if (this.board[row][col] !== -1 && !isExcluded) {
                this.board[row][col] = -1;
                minesPlaced++;
                
                // Update adjacent cells
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
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    renderBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;
        
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
                boardElement.appendChild(cell);
            }
        }
    }
    
    updateCell(cell, row, col) {
        cell.className = 'cell';
        cell.textContent = '';
        
        if (this.flagged[row][col]) {
            cell.classList.add('flagged');
        } else if (this.revealed[row][col]) {
            cell.classList.add('revealed');
            
            if (this.board[row][col] === -1) {
                cell.classList.add('mine');
            } else if (this.board[row][col] > 0) {
                cell.textContent = this.board[row][col];
                cell.classList.add(`cell-${this.board[row][col]}`);
            }
        }
    }
    
    handleClick(row, col) {
        if (this.gameOver || this.gameWon || this.flagged[row][col] || this.revealed[row][col]) {
            return;
        }
        
        if (this.firstClick) {
            this.placeMines(row, col);
            this.firstClick = false;
            this.startTimer();
        }
        
        if (this.board[row][col] === -1) {
            this.revealCell(row, col);
            this.gameOver = true;
            this.stopTimer();
            this.revealAllMines();
            this.updateGameStatus('Verloren! 💥');
        } else {
            this.revealCell(row, col);
            
            if (this.board[row][col] === 0) {
                this.revealAdjacentCells(row, col);
            }
            
            this.checkWin();
        }
        
        this.renderBoard();
    }
    
    handleRightClick(row, col) {
        if (this.gameOver || this.gameWon || this.revealed[row][col]) {
            return;
        }
        
        this.flagged[row][col] = !this.flagged[row][col];
        this.updateMineCount();
        this.renderBoard();
    }
    
    revealCell(row, col) {
        if (!this.isValidCell(row, col) || this.revealed[row][col]) {
            return;
        }
        
        this.revealed[row][col] = true;
    }
    
    revealAdjacentCells(row, col) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (this.isValidCell(newRow, newCol) && 
                    !this.revealed[newRow][newCol] && 
                    !this.flagged[newRow][newCol]) {
                    
                    this.revealCell(newRow, newCol);
                    
                    if (this.board[newRow][newCol] === 0) {
                        this.revealAdjacentCells(newRow, newCol);
                    }
                }
            }
        }
    }
    
    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === -1) {
                    this.revealed[row][col] = true;
                }
            }
        }
    }
    
    checkWin() {
        let revealedCount = 0;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.revealed[row][col]) {
                    revealedCount++;
                }
            }
        }
        
        const totalCells = this.rows * this.cols;
        if (revealedCount === totalCells - this.totalMines) {
            this.gameWon = true;
            this.stopTimer();
            this.updateGameStatus('Gewonnen! 🎉');
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimer() {
        document.getElementById('timer').textContent = this.timer;
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
        document.getElementById('mine-count').textContent = this.totalMines - flaggedCount;
    }
    
    updateGameStatus(message) {
        const statusElement = document.getElementById('game-status');
        statusElement.textContent = message;
        statusElement.className = '';
        
        if (message.includes('Gewonnen')) {
            statusElement.classList.add('win');
            this.saveGameResult(true);
        } else if (message.includes('Verloren')) {
            statusElement.classList.add('lose');
            this.saveGameResult(false);
        }
    }
    
    // Save game result to backend (if user is logged in)
    async saveGameResult(won) {
        try {
            await fetch('/api/game/result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    difficulty: this.currentDifficulty,
                    won: won,
                    timeSeconds: this.timer,
                    gameMode: 'single'
                }),
                credentials: 'include'
            });
        } catch (err) {
            // Silently fail if user is not logged in or error occurs
            console.log('Could not save game result:', err);
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
