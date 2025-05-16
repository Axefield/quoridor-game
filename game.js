class QuoridorUI {
    constructor() {
        this.game = new Game();
        this.phase = 'move'; // 'move', 'wall', 'review'
        this.wallStart = null;
        this.wallEnd = null;
        this.scores = { white: 0, black: 0 };
        this.moveTarget = null;
        this.moveControls = null;
        this.reviewControls = null;
        this.turnControls = null;
        this.originalPawnPos = null; // Store original pawn position for cancel/reset
        this.originalState = null; // Store full state for reset turn
        this.wallPlacedThisTurn = false; // Track if a wall was placed this turn
        this.initializeElements();
        this.setupEventListeners();
        this.renderBoard();
        this.updateGameInfo();
        this.updateScoreboard();
        this.updatePhaseBanner();
    }

    initializeElements() {
        this.board = document.getElementById('board');
        this.phaseBanner = document.getElementById('phase-banner');
        this.wallModeBtn = document.getElementById('wall-mode');
        this.newGameBtn = document.getElementById('new-game');
        this.messageDiv = document.getElementById('message');
        this.whiteInfo = document.getElementById('white-info');
        this.blackInfo = document.getElementById('black-info');
        this.wallControls = document.getElementById('wall-controls');
        this.confirmWallBtn = document.getElementById('confirm-wall');
        this.cancelWallBtn = document.getElementById('cancel-wall');
        this.skipWallBtn = document.getElementById('skip-wall');
        this.moveControls = document.getElementById('move-controls');
        this.confirmMoveBtn = document.getElementById('confirm-move');
        this.cancelMoveBtn = document.getElementById('cancel-move');
        this.skipMoveBtn = document.getElementById('skip-move');
        this.reviewControls = document.getElementById('review-controls');
        this.endTurnBtn = document.getElementById('end-turn');
        this.resetTurnBtn = document.getElementById('reset-turn');
        this.whiteScore = document.getElementById('white-score');
        this.blackScore = document.getElementById('black-score');
        this.whiteTurnIndicator = document.getElementById('white-turn-indicator');
        this.blackTurnIndicator = document.getElementById('black-turn-indicator');
    }

    setupEventListeners() {
        this.wallModeBtn.addEventListener('click', () => this.enterWallPhase());
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.confirmWallBtn.addEventListener('click', () => this.confirmWallPlacement());
        this.cancelWallBtn.addEventListener('click', () => this.cancelWallPlacement());
        this.skipWallBtn.addEventListener('click', () => this.skipWallPhase());
        this.confirmMoveBtn.addEventListener('click', () => this.confirmMove());
        this.cancelMoveBtn.addEventListener('click', () => this.cancelMove());
        this.skipMoveBtn.addEventListener('click', () => this.skipMovePhase());
        this.endTurnBtn.addEventListener('click', () => this.finishTurn());
        this.resetTurnBtn.addEventListener('click', () => this.resetTurn());
    }

    updatePhaseBanner() {
        this.phaseBanner.style.display = 'block';
        if (this.phase === 'move') {
            this.phaseBanner.textContent = 'Move Phase: Select a space to move your pawn or skip.';
            this.phaseBanner.className = 'phase-banner move';
        } else if (this.phase === 'wall') {
            this.phaseBanner.textContent = 'Wall Phase: Place a wall, skip, or cancel.';
            this.phaseBanner.className = 'phase-banner wall';
        } else if (this.phase === 'review') {
            this.phaseBanner.textContent = 'Review Phase: End turn or reset your actions.';
            this.phaseBanner.className = 'phase-banner move';
        }
    }

    enterWallPhase() {
        if (this.phase !== 'move') return;
        this.phase = 'wall';
        this.wallStart = null;
        this.wallEnd = null;
        this.moveTarget = null;
        this.wallControls.style.display = 'none';
        this.moveControls.style.display = 'none';
        this.reviewControls.style.display = 'none';
        this.turnControls.style.display = 'none';
        this.updatePhaseBanner();
        this.renderBoard();
    }

    startNewGame() {
        this.game.reset();
        this.phase = 'move';
        this.wallStart = null;
        this.wallEnd = null;
        this.moveTarget = null;
        this.originalPawnPos = null;
        this.originalState = null;
        this.wallControls.style.display = 'none';
        this.moveControls.style.display = 'none';
        this.reviewControls.style.display = 'none';
        this.wallModeBtn.textContent = 'Place Wall';
        this.wallModeBtn.style.background = '#8B4513';
        this.renderBoard();
        this.updateGameInfo();
        this.updatePhaseBanner();
        this.showMessage('New game started! Move your pawn to begin.', 'success');
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
        // Show only relevant controls
        this.moveControls.style.display = this.phase === 'move' ? 'block' : 'none';
        this.wallControls.style.display = this.phase === 'wall' ? 'block' : 'none';
        this.reviewControls.style.display = this.phase === 'review' ? 'block' : 'none';
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
            // Check for adjacent walls and add connection classes
            if (orientation === 'v') {
                if (row > 1 && this.game.board[row - 2][col].occupiedBy === 'wall') {
                    wall.classList.add('wall-connected-top');
                }
                if (row < 15 && this.game.board[row + 2][col].occupiedBy === 'wall') {
                    wall.classList.add('wall-connected-bottom');
                }
            } else if (orientation === 'h') {
                if (col > 1 && this.game.board[row][col - 2].occupiedBy === 'wall') {
                    wall.classList.add('wall-connected-left');
                }
                if (col < 15 && this.game.board[row][col + 2].occupiedBy === 'wall') {
                    wall.classList.add('wall-connected-right');
                }
            }
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
        if (this.phase === 'move') {
            this.handleMoveSelection(row, col);
        } else if (this.phase === 'wall') {
            this.handleWallSelection(row, col);
        }
    }

    handleMoveSelection(row, col) {
        // Only allow space selection
        const type = this.game.board[row][col].type;
        if (type !== 'space') return;
        if (this.game.board[row][col].occupiedBy) return;
        const currentPos = this.game.turn === 'white' ? this.game.whitePos : this.game.blackPos;
        const action = this.game.movePawn([row, col]);
        if (!action.success) {
            this.showMessage(action.message, 'error');
            return;
        }
        // Store the original state for reset turn
        if (!this.originalState) this.originalState = this.game.getState();
        this.originalPawnPos = [...currentPos];
        this.moveTarget = [row, col];
        this.renderBoard();
    }

    confirmMove() {
        if (!this.moveTarget) return;
        this.animatePawn(this.moveTarget);
        this.moveTarget = null;
        this.originalPawnPos = null;
        this.phase = 'wall';
        this.updatePhaseBanner();
        this.renderBoard();
        this.updateGameInfo();
        this.showMessage('Now you may place a wall, skip, or cancel.', 'success');
    }

    cancelMove() {
        if (this.originalPawnPos && this.moveTarget) {
            const color = this.game.turn === 'white' ? 'white' : 'black';
            const [oldRow, oldCol] = this.moveTarget;
            const [origRow, origCol] = this.originalPawnPos;
            this.game.board[oldRow][oldCol].occupiedBy = null;
            this.game.board[origRow][origCol].occupiedBy = color;
            if (color === 'white') this.game.whitePos = [origRow, origCol];
            if (color === 'black') this.game.blackPos = [origRow, origCol];
        }
        this.moveTarget = null;
        this.originalPawnPos = null;
        this.renderBoard();
    }

    skipMovePhase() {
        if (!this.originalState) this.originalState = this.game.getState();
        this.moveTarget = null;
        this.originalPawnPos = null;
        this.phase = 'wall';
        this.updatePhaseBanner();
        this.renderBoard();
        this.showMessage('Move skipped. Now you may place a wall, skip, or cancel.', 'success');
    }

    handleWallSelection(row, col) {
        const type = this.game.board[row][col].type;
        if (type !== 'v-slot' && type !== 'h-slot') return;
        if (!this.wallStart) {
            this.wallStart = [row, col];
            this.wallEnd = null;
            this.renderBoard();
        } else if (!this.wallEnd && this.isAdjacentWallSlot(this.wallStart, [row, col])) {
            this.wallEnd = [row, col];
            this.renderBoard();
        } else {
            this.wallStart = [row, col];
            this.wallEnd = null;
            this.renderBoard();
        }
    }

    confirmWallPlacement() {
        if (!this.wallStart || !this.wallEnd) return;
        const result = this.game.placeWallEndpoints(this.wallStart, this.wallEnd);
        if (result.success) {
            this.showMessage(result.message, 'success');
            this.wallStart = null;
            this.wallEnd = null;
            this.phase = 'review';
            this.wallPlacedThisTurn = true;
            this.updatePhaseBanner();
            this.renderBoard();
            this.updateGameInfo();
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
        this.renderBoard();
    }

    skipWallPhase() {
        this.wallStart = null;
        this.wallEnd = null;
        this.phase = 'review';
        this.wallPlacedThisTurn = false;
        this.updatePhaseBanner();
        this.renderBoard();
        this.showMessage('Wall phase skipped. Review your turn or end turn.', 'success');
    }

    finishTurn() {
        this.game.finalizeTurn(this.wallPlacedThisTurn);
        this.phase = 'move';
        this.wallStart = null;
        this.wallEnd = null;
        this.moveTarget = null;
        this.originalPawnPos = null;
        this.originalState = null;
        this.wallPlacedThisTurn = false;
        this.updatePhaseBanner();
        this.renderBoard();
        this.updateGameInfo();
    }

    resetTurn() {
        if (this.originalState) {
            // Restore the full game state
            this.restoreState(this.originalState);
        }
        this.phase = 'move';
        this.wallStart = null;
        this.wallEnd = null;
        this.moveTarget = null;
        this.originalPawnPos = null;
        this.updatePhaseBanner();
        this.renderBoard();
        this.updateGameInfo();
        this.showMessage('Turn reset. Start your move again.', 'success');
    }

    restoreState(state) {
        this.game.turn = state.turn;
        this.game.whitePos = [...state.whitePos];
        this.game.blackPos = [...state.blackPos];
        this.game.whiteWalls = state.whiteWalls;
        this.game.blackWalls = state.blackWalls;
        this.game.whiteWon = state.whiteWon;
        this.game.blackWon = state.blackWon;
        this.game.board = state.board.map(row => row.map(cell => ({ ...cell })));
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
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new QuoridorUI();
}); 