class QuoridorUI {
    constructor() {
        this.game = new Game();
        this.wallStart = null;
        this.wallEnd = null;
        this.scores = { white: 0, black: 0 };
        this.moveTarget = null;
        this.moveControls = null;
        this.reviewControls = null;
        this.turnControls = null;
        this.originalState = null; // Store full state for reset turn
        this.gameOver = false;
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
        this.newGameBtn = document.getElementById('new-game');
        this.messageDiv = document.getElementById('message');
        this.messageLive = document.getElementById('message-live');
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
        this.gameEndModal = document.getElementById('game-end-modal');
        this.gameEndMessage = document.getElementById('game-end-message');
        this.modalNewGameBtn = document.getElementById('modal-new-game');
    }

    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.confirmWallBtn.addEventListener('click', () => this.confirmWallPlacement());
        this.cancelWallBtn.addEventListener('click', () => this.cancelWallPlacement());
        this.skipWallBtn.addEventListener('click', () => this.skipWallPhase());
        this.confirmMoveBtn.addEventListener('click', () => this.confirmMove());
        this.cancelMoveBtn.addEventListener('click', () => this.cancelMove());
        this.skipMoveBtn.addEventListener('click', () => this.skipMovePhase());
        this.endTurnBtn.addEventListener('click', () => this.finishTurn());
        this.resetTurnBtn.addEventListener('click', () => this.resetTurn());
        if (this.modalNewGameBtn) {
            this.modalNewGameBtn.addEventListener('click', () => this.startNewGame());
        }
    }

    updatePhaseBanner() {
        this.phaseBanner.style.display = 'block';
        if (this.game.phase === 'move') {
            this.phaseBanner.textContent = 'Move Phase: Select a space to move your pawn or skip.';
            this.phaseBanner.className = 'phase-banner move';
        } else if (this.game.phase === 'wall') {
            this.phaseBanner.textContent = 'Wall Phase: Place a wall, skip, or cancel.';
            this.phaseBanner.className = 'phase-banner wall';
        } else if (this.game.phase === 'review') {
            this.phaseBanner.textContent = 'Review Phase: End turn or reset your actions.';
            this.phaseBanner.className = 'phase-banner move';
        }
    }

    startNewGame() {
        this.game.reset();
        this.wallStart = null;
        this.wallEnd = null;
        this.moveTarget = null;
        this.originalState = null;
        this.gameOver = false;
        if (this.gameEndModal) this.gameEndModal.style.display = 'none';
        this.wallControls.style.display = 'none';
        this.moveControls.style.display = 'none';
        this.reviewControls.style.display = 'none';
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
        // Draw wall overlays for all placed walls (only once per wall)
        for (let row = 0; row < 17; row++) {
            for (let col = 0; col < 17; col++) {
                const cell = this.game.board[row][col];
                if (cell.occupiedBy === 'wall') {
                    const orientation = this.game.determineWallOrientation(row, col);
                    // Only draw overlay for the wall's starting endpoint
                    if (orientation === 'v') {
                        // Only draw if the slot below is also a wall (vertical wall start)
                        if (row % 2 === 0 && row < 16 && this.game.board[row + 2][col].occupiedBy === 'wall') {
                            // Avoid drawing twice: only draw if above is not a wall
                            if (row === 0 || this.game.board[row - 2][col].occupiedBy !== 'wall') {
                                this.drawWallOverlay([row, col], [row + 2, col], 'vertical');
                            }
                        }
                    } else if (orientation === 'h') {
                        // Only draw if the slot to the right is also a wall (horizontal wall start)
                        if (col % 2 === 0 && col < 16 && this.game.board[row][col + 2].occupiedBy === 'wall') {
                            // Avoid drawing twice: only draw if left is not a wall
                            if (col === 0 || this.game.board[row][col - 2].occupiedBy !== 'wall') {
                                this.drawWallOverlay([row, col], [row, col + 2], 'horizontal');
                            }
                        }
                    }
                }
            }
        }
        // Draw wall preview if needed
        if (this.wallStart && this.wallEnd) {
            this.drawWallPreview(this.wallStart, this.wallEnd);
        }
        // Show only relevant controls
        this.moveControls.style.display = this.game.phase === 'move' ? 'block' : 'none';
        this.wallControls.style.display = this.game.phase === 'wall' ? 'block' : 'none';
        this.reviewControls.style.display = this.game.phase === 'review' ? 'block' : 'none';
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
        // Highlight valid adjacent slots for second endpoint
        if (this.wallStart && !this.wallEnd && this.isAdjacentWallSlot(this.wallStart, [row, col])) {
            cell.classList.add('valid-slot');
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
        if (this.gameOver) return;
        if (this.game.phase === 'move') {
            this.handleMoveSelection(row, col);
        } else if (this.game.phase === 'wall') {
            this.handleWallSelection(row, col);
        }
    }

    handleMoveSelection(row, col) {
        if (this.gameOver) return;
        if (this.game.phase !== 'move') {
            this.showMessage('You can only move during the Move phase.', 'error');
            return;
        }
        const type = this.game.board[row][col].type;
        if (type !== 'space') {
            this.showMessage('You must select an empty space to move.', 'error');
            return;
        }
        if (this.game.board[row][col].occupiedBy) {
            this.showMessage('That space is already occupied.', 'error');
            return;
        }
        if (!this.originalState) this.originalState = this.game.getState();
        const result = this.game.handleTurn('move', { destination: [row, col] });
        if (!result.success) {
            this.showMessage(result.message, 'error');
            return;
        }
        this.moveTarget = [row, col];
        this.renderBoard();
        this.updatePhaseBanner();
        this.updateGameInfo();
        this.showMessage('Move successful! Now you may place a wall, skip, or cancel.', 'success');
    }

    confirmMove() {
        if (this.gameOver) return;
        if (!this.moveTarget) return;
        // Animate pawn if needed
        this.moveTarget = null;
        this.renderBoard();
        this.updatePhaseBanner();
        this.updateGameInfo();
    }

    skipMovePhase() {
        if (this.gameOver) return;
        if (this.game.phase !== 'move') {
            this.showMessage('You can only skip during the Move phase.', 'error');
            return;
        }
        if (!this.originalState) this.originalState = this.game.getState();
        const result = this.game.handleTurn('skip');
        this.moveTarget = null;
        this.renderBoard();
        this.updatePhaseBanner();
        this.updateGameInfo();
        this.showMessage(result.success ? 'Move skipped. Now you may place a wall, skip, or cancel.' : result.message, result.success ? 'info' : 'error');
    }

    handleWallSelection(row, col) {
        if (this.gameOver) return;
        if (this.game.phase !== 'wall') {
            this.showMessage('You can only select wall slots during the Wall phase.', 'error');
            return;
        }
        const type = this.game.board[row][col].type;
        if (type !== 'v-slot' && type !== 'h-slot') {
            this.showMessage('Select a valid wall slot.', 'error');
            return;
        }
        if (!this.wallStart) {
            this.wallStart = [row, col];
            this.wallEnd = null;
            this.renderBoard();
            this.showMessage('Now select an adjacent slot to complete the wall.', 'info');
        } else if (!this.wallEnd && this.isAdjacentWallSlot(this.wallStart, [row, col])) {
            this.wallEnd = [row, col];
            this.renderBoard();
            this.showMessage('Click Confirm to place the wall.', 'info');
        } else {
            this.showMessage('Invalid wall endpoint. Please select an adjacent slot.', 'error');
        }
    }

    confirmWallPlacement() {
        if (this.gameOver) return;
        if (this.game.phase !== 'wall') {
            this.showMessage('You can only place a wall during the Wall phase.', 'error');
            return;
        }
        if (!this.wallStart || !this.wallEnd) {
            this.showMessage('Select two adjacent wall slots to place a wall.', 'error');
            return;
        }
        const result = this.game.handleTurn('wall', { start: this.wallStart, end: this.wallEnd });
        if (result.success) {
            this.showMessage('Wall placed! Review your turn or end turn.', 'success');
            this.wallStart = null;
            this.wallEnd = null;
            this.updatePhaseBanner();
            this.renderBoard();
            this.updateGameInfo();
            const gameWon = this.game.gameWon();
            if (gameWon.win) {
                this.scores[gameWon.winner]++;
                this.updateScoreboard();
                this.showGameEndModal(`${gameWon.winner.charAt(0).toUpperCase() + gameWon.winner.slice(1)} wins! 🎉`);
                this.gameOver = true;
                return;
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
        if (this.gameOver) return;
        if (this.game.phase !== 'wall') {
            this.showMessage('You can only skip during the Wall phase.', 'error');
            return;
        }
        const result = this.game.handleTurn('skip');
        this.wallStart = null;
        this.wallEnd = null;
        this.renderBoard();
        this.updatePhaseBanner();
        this.updateGameInfo();
        this.showMessage(result.success ? 'Wall phase skipped. Review your turn or end turn.' : result.message, result.success ? 'info' : 'error');
    }

    finishTurn() {
        if (this.gameOver) return;
        if (this.game.phase !== 'review') {
            this.showMessage('You can only end your turn during the Review phase.', 'error');
            return;
        }
        const result = this.game.handleTurn('end');
        this.wallStart = null;
        this.wallEnd = null;
        this.moveTarget = null;
        this.originalState = null;
        this.renderBoard();
        this.updatePhaseBanner();
        this.updateGameInfo();
        this.showMessage(result.success ? "Turn ended. Next player's move phase begins." : result.message, result.success ? 'success' : 'error');
    }

    resetTurn() {
        if (this.gameOver) return;
        if (this.game.phase !== 'review') {
            this.showMessage('You can only reset your turn during the Review phase.', 'error');
            return;
        }
        if (!this.originalState) {
            this.showMessage('No actions to reset this turn.', 'error');
            return;
        }
        this.game.restoreState(this.originalState);
        this.game.phase = 'move';
        this.wallStart = null;
        this.wallEnd = null;
        this.moveTarget = null;
        this.renderBoard();
        this.updatePhaseBanner();
        this.updateGameInfo();
        this.showMessage('Turn reset. Start your move again.', 'info');
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
        this.messageLive.textContent = message;
        clearTimeout(this._msgTimeout);
        this._msgTimeout = setTimeout(() => {
            this.messageDiv.textContent = '';
            this.messageDiv.className = '';
            this.messageLive.textContent = '';
        }, type === 'error' ? 4000 : 2500);
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

    drawWallOverlay(start, end, orientation) {
        // Draw a single overlay spanning from start to end
        const [r1, c1] = start, [r2, c2] = end;
        const boardRect = this.board.getBoundingClientRect();
        const cell1 = this.board.querySelector(`[data-row='${r1}'][data-col='${c1}']`);
        const cell2 = this.board.querySelector(`[data-row='${r2}'][data-col='${c2}']`);
        if (!cell1 || !cell2) return;
        const rect1 = cell1.getBoundingClientRect();
        const rect2 = cell2.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.className = `wall-overlay ${orientation}`;
        if (orientation === 'vertical') {
            overlay.style.width = '18px';
            overlay.style.height = Math.abs(rect2.top - rect1.top) + rect1.height + 'px';
            overlay.style.left = (rect1.left - boardRect.left + rect1.width / 2 - 9) + 'px';
            overlay.style.top = (Math.min(rect1.top, rect2.top) - boardRect.top) + 'px';
        } else {
            overlay.style.height = '18px';
            overlay.style.width = Math.abs(rect2.left - rect1.left) + rect1.width + 'px';
            overlay.style.top = (rect1.top - boardRect.top + rect1.height / 2 - 9) + 'px';
            overlay.style.left = (Math.min(rect1.left, rect2.left) - boardRect.left) + 'px';
        }
        overlay.style.position = 'absolute';
        this.board.appendChild(overlay);
    }

    showGameEndModal(message) {
        if (this.gameEndModal && this.gameEndMessage) {
            this.gameEndMessage.textContent = message;
            this.gameEndModal.style.display = 'flex';
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new QuoridorUI();
}); 