class QuoridorUI {
    constructor() {
        this.game = new Game();
        this.isWallMode = false;
        this.wallStart = null;
        this.wallEnd = null;
        this.scores = { white: 0, black: 0 };
        this.moveTarget = null;
        this.moveControls = null;
        this.turnControls = null;
        this.initializeElements();
        this.setupEventListeners();
        this.renderBoard();
        this.updateGameInfo();
        this.updateScoreboard();
    }

    initializeElements() {
        this.board = document.getElementById('board');
        this.wallModeBtn = document.getElementById('wall-mode');
        this.newGameBtn = document.getElementById('new-game');
        this.messageDiv = document.getElementById('message');
        this.whiteInfo = document.getElementById('white-info');
        this.blackInfo = document.getElementById('black-info');
        this.wallControls = document.getElementById('wall-controls');
        this.confirmWallBtn = document.getElementById('confirm-wall');
        this.cancelWallBtn = document.getElementById('cancel-wall');
        this.whiteScore = document.getElementById('white-score');
        this.blackScore = document.getElementById('black-score');
        this.whiteTurnIndicator = document.getElementById('white-turn-indicator');
        this.blackTurnIndicator = document.getElementById('black-turn-indicator');
        this.moveControls = document.getElementById('move-controls');
        this.confirmMoveBtn = document.getElementById('confirm-move');
        this.cancelMoveBtn = document.getElementById('cancel-move');
        this.turnControls = document.getElementById('turn-controls');
        this.finishTurnBtn = document.getElementById('finish-turn');
    }

    setupEventListeners() {
        this.wallModeBtn.addEventListener('click', () => this.toggleWallMode());
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.confirmWallBtn.addEventListener('click', () => this.confirmWallPlacement());
        this.cancelWallBtn.addEventListener('click', () => this.cancelWallPlacement());
        this.confirmMoveBtn.addEventListener('click', () => this.confirmMove());
        this.cancelMoveBtn.addEventListener('click', () => this.cancelMove());
        this.finishTurnBtn.addEventListener('click', () => this.finishTurn());
    }

    toggleWallMode() {
        this.isWallMode = !this.isWallMode;
        this.wallStart = null;
        this.wallEnd = null;
        this.moveTarget = null;
        this.wallControls.style.display = 'none';
        this.moveControls.style.display = 'none';
        this.turnControls.style.display = 'none';
        this.wallModeBtn.textContent = this.isWallMode ? 'Place Wall' : 'Move Pawn';
        this.wallModeBtn.style.background = this.isWallMode ? '#8B4513' : '#3498db';
        this.showMessage(this.isWallMode ? 'Wall placement mode - Select two adjacent wall slots' : 'Pawn movement mode - Click a space to select your move', 'success');
        this.renderBoard();
    }

    startNewGame() {
        this.game = new Game();
        this.isWallMode = false;
        this.wallStart = null;
        this.wallEnd = null;
        this.moveTarget = null;
        this.wallControls.style.display = 'none';
        this.moveControls.style.display = 'none';
        this.turnControls.style.display = 'none';
        this.wallModeBtn.textContent = 'Move Pawn';
        this.wallModeBtn.style.background = '#3498db';
        this.renderBoard();
        this.updateGameInfo();
        this.showMessage('New game started!', 'success');
    }

    renderBoard() {
        this.board.innerHTML = '';
        for (let row = 0; row < 17; row++) {
            for (let col = 0; col < 17; col++) {
                const cell = this.createCell(row, col);
                this.board.appendChild(cell);
            }
        }
        // Draw wall preview if needed
        if (this.wallStart && this.wallEnd) {
            this.drawWallPreview(this.wallStart, this.wallEnd);
        }
    }

    createCell(row, col) {
        const cell = document.createElement('div');
        cell.className = `cell ${this.game.board[row][col].type}`;
        cell.dataset.row = row;
        cell.dataset.col = col;

        // Highlight selected slots
        if (this.wallStart && this.wallStart[0] === row && this.wallStart[1] === col) {
            cell.classList.add('selected-slot');
        }
        if (this.wallEnd && this.wallEnd[0] === row && this.wallEnd[1] === col) {
            cell.classList.add('selected-slot');
        }
        // Highlight move preview
        if (this.moveTarget && this.moveTarget[0] === row && this.moveTarget[1] === col) {
            cell.classList.add('move-preview');
        }

        if (this.game.board[row][col].occupiedBy === 'wall') {
            const wall = document.createElement('div');
            wall.className = 'wall placed';
            const orientation = this.game.determineWallOrientation(row, col);
            wall.classList.add(orientation === 'v' ? 'vertical' : 'horizontal');
            cell.appendChild(wall);
        } else if (this.game.board[row][col].occupiedBy === 'white') {
            const pawn = document.createElement('div');
            pawn.className = 'pawn white';
            if (this.isWinnerPawn('white')) pawn.classList.add('winner');
            cell.appendChild(pawn);
        } else if (this.game.board[row][col].occupiedBy === 'black') {
            const pawn = document.createElement('div');
            pawn.className = 'pawn black';
            if (this.isWinnerPawn('black')) pawn.classList.add('winner');
            cell.appendChild(pawn);
        }

        cell.addEventListener('click', () => this.handleCellClick(row, col));
        return cell;
    }

    handleCellClick(row, col) {
        if (this.isWallMode) {
            this.handleWallSelection(row, col);
        } else {
            this.handleMoveSelection(row, col);
        }
    }

    handleWallSelection(row, col) {
        // Only allow wall slot selection
        const type = this.game.board[row][col].type;
        if (type !== 'v-slot' && type !== 'h-slot') return;
        if (!this.wallStart) {
            this.wallStart = [row, col];
            this.wallEnd = null;
            this.wallControls.style.display = 'none';
            this.renderBoard();
        } else if (!this.wallEnd && this.isAdjacentWallSlot(this.wallStart, [row, col])) {
            this.wallEnd = [row, col];
            this.wallControls.style.display = 'block';
            this.renderBoard();
        } else {
            // Reset if invalid
            this.wallStart = [row, col];
            this.wallEnd = null;
            this.wallControls.style.display = 'none';
            this.renderBoard();
        }
    }

    isAdjacentWallSlot(a, b) {
        // Must be adjacent and same type
        const [r1, c1] = a, [r2, c2] = b;
        const type1 = this.game.board[r1][c1].type;
        const type2 = this.game.board[r2][c2].type;
        if (type1 !== type2) return false;
        if (type1 === 'v-slot') return Math.abs(r1 - r2) === 2 && c1 === c2;
        if (type1 === 'h-slot') return Math.abs(c1 - c2) === 2 && r1 === r2;
        return false;
    }

    drawWallPreview(start, end) {
        // Draw a preview wall spanning the two slots
        const [r1, c1] = start, [r2, c2] = end;
        const boardRect = this.board.getBoundingClientRect();
        const cell1 = this.board.querySelector(`[data-row='${r1}'][data-col='${c1}']`);
        const cell2 = this.board.querySelector(`[data-row='${r2}'][data-col='${c2}']`);
        if (!cell1 || !cell2) return;
        const rect1 = cell1.getBoundingClientRect();
        const rect2 = cell2.getBoundingClientRect();
        const preview = document.createElement('div');
        preview.className = 'wall-preview';
        if (r1 === r2) {
            // Horizontal
            preview.style.width = Math.abs(rect2.left - rect1.left) + rect1.width + 'px';
            preview.style.height = '12px';
            preview.style.left = (Math.min(rect1.left, rect2.left) - boardRect.left) + 'px';
            preview.style.top = (rect1.top - boardRect.top + rect1.height / 2 - 6) + 'px';
        } else {
            // Vertical
            preview.style.height = Math.abs(rect2.top - rect1.top) + rect1.height + 'px';
            preview.style.width = '12px';
            preview.style.left = (rect1.left - boardRect.left + rect1.width / 2 - 6) + 'px';
            preview.style.top = (Math.min(rect1.top, rect2.top) - boardRect.top) + 'px';
        }
        preview.style.position = 'absolute';
        this.board.appendChild(preview);
    }

    confirmWallPlacement() {
        if (!this.wallStart || !this.wallEnd) return;
        // Place wall at the first slot (game logic expects one coordinate)
        const result = this.game.placeWall(this.wallStart[0], this.wallStart[1]);
        if (result.success) {
            this.showMessage(result.message, 'success');
            this.wallStart = null;
            this.wallEnd = null;
            this.wallControls.style.display = 'none';
            this.renderBoard();
            this.updateGameInfo();
            // Check for win after wall placement
            const gameWon = this.game.gameWon();
            if (gameWon.win) {
                this.scores[gameWon.winner]++;
                this.updateScoreboard();
                this.showMessage(`${gameWon.winner} player wins!`, 'success');
                setTimeout(() => this.startNewGame(), 2000);
            }
        } else {
            this.showMessage(result.message, 'error');
        }
    }

    cancelWallPlacement() {
        this.wallStart = null;
        this.wallEnd = null;
        this.wallControls.style.display = 'none';
        this.renderBoard();
    }

    handleMoveSelection(row, col) {
        // Only allow space selection
        const type = this.game.board[row][col].type;
        if (type !== 'space') return;
        // Only allow if not already occupied
        if (this.game.board[row][col].occupiedBy) return;
        // Only allow if valid move
        const currentPos = this.game.turn === 'white' ? this.game.whitePos : this.game.blackPos;
        const action = this.game.movePawn([row, col]);
        if (!action.success) {
            this.showMessage(action.message, 'error');
            return;
        }
        // Don't actually move yet, just preview
        this.moveTarget = [row, col];
        this.moveControls.style.display = 'block';
        this.wallControls.style.display = 'none';
        this.turnControls.style.display = 'none';
        this.renderBoard();
    }

    confirmMove() {
        if (!this.moveTarget) return;
        // Actually move the pawn
        const action = this.game.movePawn(this.moveTarget);
        if (action.success) {
            this.animatePawn(this.moveTarget);
            this.moveTarget = null;
            this.moveControls.style.display = 'none';
            this.turnControls.style.display = 'block';
            this.renderBoard();
            this.updateGameInfo();
            this.showMessage(action.message, 'success');
            const gameWon = this.game.gameWon();
            if (gameWon.win) {
                this.scores[gameWon.winner]++;
                this.updateScoreboard();
                this.showMessage(`${gameWon.winner} player wins!`, 'success');
                setTimeout(() => this.startNewGame(), 2000);
            }
        } else {
            this.showMessage(action.message, 'error');
        }
    }

    cancelMove() {
        this.moveTarget = null;
        this.moveControls.style.display = 'none';
        this.turnControls.style.display = 'none';
        this.renderBoard();
    }

    finishTurn() {
        this.turnControls.style.display = 'none';
        this.renderBoard();
        this.updateGameInfo();
    }

    animatePawn(target) {
        // Add animation class to pawn at target
        setTimeout(() => {
            this.renderBoard();
        }, 400);
    }

    updateGameInfo() {
        document.getElementById('white-walls').textContent = this.game.whiteWalls;
        document.getElementById('black-walls').textContent = this.game.blackWalls;
        this.whiteInfo.classList.toggle('active', this.game.turn === 'white');
        this.blackInfo.classList.toggle('active', this.game.turn === 'black');
        this.whiteTurnIndicator.style.display = this.game.turn === 'white' ? 'inline-block' : 'none';
        this.blackTurnIndicator.style.display = this.game.turn === 'black' ? 'inline-block' : 'none';
    }

    updateScoreboard() {
        this.whiteScore.textContent = this.scores.white;
        this.blackScore.textContent = this.scores.black;
    }

    showMessage(message, type = '') {
        this.messageDiv.textContent = message;
        this.messageDiv.className = type;
        setTimeout(() => {
            this.messageDiv.textContent = '';
            this.messageDiv.className = '';
        }, 3000);
    }

    isWinnerPawn(color) {
        const won = this.game.gameWon();
        return (won.win && won.winner === color);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new QuoridorUI();
}); 