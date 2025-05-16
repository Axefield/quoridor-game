/**
 * Represents a game of Quoridor.
 */
class Game {
    /**
     * Initializes a new game instance.
     */
    constructor() {
        this.reset();
    }

    /**
     * Resets the game to its initial state.
     */
    reset() {
        this.turn = "white";
        this.phase = "move"; // 'move', 'wall', 'review'
        this.whitePos = [0, 8];
        this.blackPos = [16, 8];
        this.whiteWalls = 10;
        this.blackWalls = 10;
        this.whiteWon = false;
        this.blackWon = false;
        this.board = this.initializeBoard();
        this.lastAction = null; // Track last action for UI feedback
    }

    /**
     * Returns a serializable snapshot of the current game state.
     */
    getState() {
        return {
            turn: this.turn,
            whitePos: [...this.whitePos],
            blackPos: [...this.blackPos],
            whiteWalls: this.whiteWalls,
            blackWalls: this.blackWalls,
            whiteWon: this.whiteWon,
            blackWon: this.blackWon,
            board: this.board.map(row => row.map(cell => ({ ...cell })))
        };
    }

    /**
     * Initializes the 17x17 game board with spaces and wall slots.
     * @returns {Array} The initialized board.
     */
    initializeBoard() {
        /*
            even row even col = space
            even row odd col = v-slot
            odd row even col = h-slot
            odd row odd col = null
        */
        let board = [];
        for (let row = 0; row < 17; row++) {
            let currentRow = [];
            for (let col = 0; col < 17; col++) {
                if (row % 2 === 0 && col % 2 === 0) {
                    currentRow.push({ type: "space", occupiedBy: null });
                }
                if (row % 2 === 0 && col % 2 === 1) {
                    currentRow.push({ type: "v-slot", occupiedBy: null });
                }
                if (row % 2 === 1 && col % 2 === 0) {
                    currentRow.push({ type: "h-slot", occupiedBy: null });
                }
                if (row % 2 === 1 && col % 2 === 1) {
                    currentRow.push({ type: null, occupiedBy: null });
                }
            }
            board.push(currentRow);
        }
        board[this.whitePos[0]][this.whitePos[1]].occupiedBy = "white";
        board[this.blackPos[0]][this.blackPos[1]].occupiedBy = "black";
        return board;
    }

    /**
     * Determines the orientation of a wall based on board coordinates.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     * @returns {string|boolean} 'v' for vertical, 'h' for horizontal, false if invalid.
     */
    determineWallOrientation(row, col) {
        if (row % 2 === 0 && col % 2 === 1) return "v";
        if (row % 2 === 1 && col % 2 === 0) return "h";
        return false;
    }

    /**
     * Checks if a position is outside the bounds of the board.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     * @returns {boolean} True if out of bounds, false otherwise.
     */
    isOutOfBounds(row, col) {
        return row < 0 || row > 16 || col < 0 || col > 16;
    }

    /**
     * Checks if a board cell is empty.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     * @returns {boolean} True if occupied, false if unoccupied
     */
    isOccupied(row, col) {
        if (this.board[row][col].occupiedBy == null) return false;
        return true;
    }

    /**
     * Validates if a move is within two spaces either horizontally or vertically.
     * @param {number[]} currentPos - The current position as [row, col].
     * @param {number[]} destPos - The destination position as [row, col].
     * @returns {boolean} True if move is valid, false otherwise.
     */
    verifyRange(currentPos, destPos) {
        let differenceRow = Math.abs(currentPos[0] - destPos[0]);
        let differenceCol = Math.abs(currentPos[1] - destPos[1]);
        return (
            (differenceRow === 2 && differenceCol === 0) ||
            (differenceRow === 0 && differenceCol === 2)
        );
    }
    /**
     * Looks at the edge rows and determines if a player has won the game
     * by changing the corresponding this.whiteWon/this.blackWon boolean to true;
     * This function should be rewritten soon
     * @returns {object} {win: boolean, winner: string}
     */
    gameWon() {
        let won = { win: false, winner: null };
        if (this.turn === "black") {
            for (let a = 0; a < 17; a++) {
                if (this.board[16][a].occupiedBy === "white")
                    won = { win: true, winner: "white" };
            }
        }
        if (this.turn === "white") {
            for (let a = 0; a < 17; a++) {
                if (this.board[0][a].occupiedBy === "black")
                    won = { win: true, winner: "black" };
            }
        }
        return won;
    }

    /**
     * Attempts to move the current player's pawn to a new destination.
     * @param {number[]} destination - The destination position as [row, col].
     * @returns {Object} Result of the move attempt.
     */
    movePawn(destination) {
        /**
         * Determines the direction of travel from current to destination.
         * @param {number[]} currentPos
         * @param {number[]} destPos
         * @returns {string} One of 'up', 'down', 'left', or 'right'.
         */
        const directionOfTravel = (currentPos, destPos) => {
            let differenceRow = currentPos[0] - destPos[0];
            let differenceCol = currentPos[1] - destPos[1];
            if (differenceRow < 0) return "up";
            if (differenceRow > 0) return "down";
            if (differenceCol > 0) return "left";
            if (differenceCol < 0) return "right";
        };
        /**
         * Inspects a specified cell in the grid for walls
         * @param {number} row row to check for a wall
         * @param {number} col column to check for a wall
         * @returns boolean true if there is a wall there, false if not
         */
        const checkForWall = (row, col) => {
            if (this.board[row][col].occupiedBy == "wall") return true;
            return false;
        };

        /**
         * This function determines if, when a pawn is jumping over another pawn
         * It will end up outside the boundary of the board
         * @param {number} row starting row of the moving pawn
         * @param {number} col starting column of the moving pawn
         * @param {string} direction direction of travel
         * @returns boolean true if pawn jump is out of bounds
         */
        const hopsOffBoard = (row, col, direction) => {
            let currentPos =
                this.turn === "white" ? this.whitePos : this.blackPos;
            if (direction === "up") {
                if (currentPos[0] > 12) return true;
            }
            if (direction === "down") {
                if (currentPos[0] < 3) return true;
            }
            if (direction === "left") {
                if (currentPos[1] < 4) return true;
            }
            if (direction === "right") {
                if (currentPos[1] > 12) return true;
            }
            return false;
        };

        /**
         * Calculates a new destination if jumping over a pawn.
         * @param {number[]} currentPos
         * @param {number[]} destPos
         */
        const jumpOverPawn = (currentPos, destPos) => {
            let correctedDestination = [];
            let direction = directionOfTravel(currentPos, destPos);
            if (hopsOffBoard(currentPos[0], currentPos[1], direction)) {
                return {
                    success: false,
                    message: `not enough space in direction of travel`,
                };
            }
            switch (direction) {
                case "up":
                    if (checkForWall(currentPos[0] + 1, currentPos[1])) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    if (checkForWall(currentPos[0] + 3, currentPos[1])) {
                        return {
                            success: false,
                            message: `Wall on opposite side of enemy pawn`,
                        };
                    }
                    correctedDestination = [currentPos[0] + 4, currentPos[1]];
                    break;
                case "down":
                    if (checkForWall(currentPos[0] - 1, currentPos[1])) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    if (checkForWall(currentPos[0] - 3, currentPos[1])) {
                        return {
                            success: false,
                            message: `Wall on opposite side of enemy pawn`,
                        };
                    }
                    correctedDestination = [currentPos[0] - 4, currentPos[1]];
                    break;
                case "left":
                    if (checkForWall(currentPos[0], currentPos[1] - 1)) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    if (checkForWall(currentPos[0], currentPos[1] - 3)) {
                        return {
                            success: false,
                            message: `Wall on opposite side of enemy pawn`,
                        };
                    }
                    correctedDestination = [currentPos[0], currentPos[1] - 4];
                    break;
                case "right":
                    if (checkForWall(currentPos[0], currentPos[1] + 1)) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    if (checkForWall(currentPos[0], currentPos[1] + 3)) {
                        return {
                            success: false,
                            message: `Wall on opposite side of enemy pawn`,
                        };
                    }
                    correctedDestination = [currentPos[0], currentPos[1] + 4];
                    break;
            }
            return { success: true, destination: correctedDestination };
        };

        let currentPos = this.turn === "white" ? this.whitePos : this.blackPos;

        if (!this.verifyRange(currentPos, destination)) {
            return { success: false, message: `Pawns can only move one space` };
        }
        if (this.isOutOfBounds(destination[0], destination[1])) {
            return { success: false, message: `Destination is out of bounds` };
        }
        if (this.isOccupied(destination[0], destination[1])) {
            /*
             * This block is handling the jumping logic
             * Updating game state
             */
            let jump = jumpOverPawn(currentPos, destination);
            if (jump.success) {
                let lastPlace = [...currentPos];
                if (this.turn === "white") {
                    this.whitePos = jump.destination;
                    this.board[lastPlace[0]][lastPlace[1]].occupiedBy = null;
                    this.board[jump.destination[0]][
                        jump.destination[1]
                    ].occupiedBy = "white";
                    return {
                        success: true,
                        message: `pawn moved from ${lastPlace} to ${jump.destination}`,
                    };
                }
                if (this.turn === "black") {
                    this.blackPos = jump.destination;
                    this.board[lastPlace[0]][lastPlace[1]].occupiedBy = null;
                    this.board[jump.destination[0]][
                        jump.destination[1]
                    ].occupiedBy = "black";
                    return {
                        success: true,
                        message: `pawn moved from ${lastPlace} to ${jump.destination}`,
                    };
                }
            }
            return { success: false, message: `move failed` };
        }
        /**
         * A helper, more refined way of using checkForWall by indicating a direction
         * Looks in the direction of travel for a wall blocking its movement
         * @param {number[]} currentPos - array of numbers indicating the pawns current position
         * @param {string} direction - string indicating direction, one of 'up', 'down', 'left', 'right'.
         * @returns
         */
        const noWallPresent = (currentPos, direction) => {
            switch (direction) {
                case "up":
                    if (checkForWall(currentPos[0] + 1, currentPos[1])) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    break;
                case "down":
                    if (checkForWall(currentPos[0] - 1, currentPos[1])) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    break;
                case "left":
                    if (checkForWall(currentPos[0], currentPos[1] - 1)) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    break;
                case "right":
                    if (checkForWall(currentPos[0], currentPos[1] + 1)) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    break;
            }
            return true;
        };

        const lastPlace = [...currentPos];
        let isBlocked = noWallPresent(
            currentPos,
            directionOfTravel(currentPos, destination)
        );
        if (isBlocked.success === false)
            return { success: false, message: `Blocked by wall` };
        if (this.turn === "white") this.whitePos = destination;
        if (this.turn === "black") this.blackPos = destination;
        this.board[lastPlace[0]][lastPlace[1]].occupiedBy = null;
        this.board[destination[0]][destination[1]].occupiedBy = this.turn;
        let winningMove = this.gameWon();
        if (winningMove.win) {
            winningMove.winner === "white"
                ? (this.whiteWon = true)
                : (this.blackWon = true);
        }
        return {
            success: true,
            message: `pawn moved from ${currentPos} to ${destination}`,
        };
    }

    /**
     * Checks if there's a valid path from a position to the goal row
     * @param {number[]} startPos - Starting position [row, col]
     * @param {number} goalRow - The target row (0 for black, 16 for white)
     * @returns {boolean} True if a path exists
     */
    hasValidPath(startPos, goalRow) {
        const visited = new Set();
        const queue = [startPos];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            const posKey = `${row},${col}`;
            
            if (visited.has(posKey)) continue;
            visited.add(posKey);
            
            // Check if we reached the goal
            if (row === goalRow) return true;
            
            // Check all possible moves
            const moves = this.getValidMoves([row, col]);
            for (const move of moves) {
                queue.push(move);
            }
        }
        
        return false;
    }

    /**
     * Gets all valid moves from a position
     * @param {number[]} pos - Current position [row, col]
     * @returns {Array<number[]>} Array of valid move positions
     */
    getValidMoves(pos) {
        const [row, col] = pos;
        const moves = [];
        
        // Check all four directions
        const directions = [
            [row + 2, col], // up
            [row - 2, col], // down
            [row, col + 2], // right
            [row, col - 2]  // left
        ];
        
        for (const [newRow, newCol] of directions) {
            if (this.isValidMove(pos, [newRow, newCol])) {
                moves.push([newRow, newCol]);
            }
        }
        
        return moves;
    }

    /**
     * Checks if a move is valid
     * @param {number[]} currentPos - Current position [row, col]
     * @param {number[]} destPos - Destination position [row, col]
     * @returns {boolean} True if move is valid
     */
    isValidMove(currentPos, destPos) {
        if (this.isOutOfBounds(destPos[0], destPos[1])) return false;
        if (this.isOccupied(destPos[0], destPos[1])) return false;
        
        const [row1, col1] = currentPos;
        const [row2, col2] = destPos;
        
        // Check for walls between positions
        if (row1 === row2) {
            const wallCol = Math.min(col1, col2) + 1;
            if (this.board[row1][wallCol].occupiedBy === 'wall') return false;
        } else {
            const wallRow = Math.min(row1, row2) + 1;
            if (this.board[wallRow][col1].occupiedBy === 'wall') return false;
        }
        
        return true;
    }

    /**
     * Validates if a wall placement would block any player's path
     * @param {number} row - Wall row position
     * @param {number} col - Wall column position
     * @returns {boolean} True if wall placement is valid
     */
    isValidWallPlacement(row, col) {
        // Temporarily place the wall
        const orientation = this.determineWallOrientation(row, col);
        if (!orientation) return false;
        
        if (orientation === 'v') {
            this.board[row][col].occupiedBy = 'wall';
            this.board[row + 2][col].occupiedBy = 'wall';
        } else {
            this.board[row][col].occupiedBy = 'wall';
            this.board[row][col + 2].occupiedBy = 'wall';
        }
        
        // Check if both players still have valid paths
        const whiteHasPath = this.hasValidPath(this.whitePos, 16);
        const blackHasPath = this.hasValidPath(this.blackPos, 0);
        
        // Remove the temporary wall
        if (orientation === 'v') {
            this.board[row][col].occupiedBy = null;
            this.board[row + 2][col].occupiedBy = null;
        } else {
            this.board[row][col].occupiedBy = null;
            this.board[row][col + 2].occupiedBy = null;
        }
        
        return whiteHasPath && blackHasPath;
    }

    /**
     * Attempts to place a wall at the specified board location.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     * @returns {Object} Result of the wall placement attempt.
     */
    placeWall(row, col) {
        if (this.isOccupied(row, col)) {
            return { success: false, message: `Slot is occupied` };
        }
        if (
            (this.turn === "white" && this.whiteWalls < 1) ||
            (this.turn === "black" && this.blackWalls < 1)
        ) {
            return { success: false, message: "Insufficient walls" };
        }
        if (this.board[row][col].occupiedBy !== null) {
            return {
                success: false,
                message: `row: ${row} and col: ${col} are occupied`,
            };
        }

        let orientation = this.determineWallOrientation(row, col);

        if (orientation === "v") {
            if (16 - col < 2)
                return {
                    success: false,
                    message: `Wall too close to board boundary`,
                };
            if (!this.isValidWallPlacement(row, col)) {
                return {
                    success: false,
                    message: `Wall placement would block a player's path`,
                };
            }
            this.board[row][col].occupiedBy = "wall";
            this.board[row + 2][col].occupiedBy = "wall";
            return { success: true, message: `Vertical wall placed` };
        }
        if (orientation === "h") {
            if (16 - row < 2)
                return {
                    success: false,
                    message: `Wall too close to board boundary`,
                };
            if (!this.isValidWallPlacement(row, col)) {
                return {
                    success: false,
                    message: `Wall placement would block a player's path`,
                };
            }
            this.board[row][col].occupiedBy = "wall";
            this.board[row][col + 2].occupiedBy = "wall";
            return { success: true, message: `Horizontal wall placed` };
        }
        if (orientation === false) {
            return {
                success: false,
                message: `Cannot place wall in a space or intersection`,
            };
        }
    }

    /**
     * Attempts to place a wall using two endpoints (for UI two-step flow).
     * @param {number[]} start - First endpoint [row, col]
     * @param {number[]} end - Second endpoint [row, col]
     * @returns {Object} Result of the wall placement attempt.
     */
    placeWallEndpoints(start, end) {
        // Validate both endpoints are wall slots and adjacent
        const [r1, c1] = start, [r2, c2] = end;
        const type1 = this.board[r1][c1].type;
        const type2 = this.board[r2][c2].type;
        if (type1 !== type2) {
            return { success: false, message: "Wall endpoints must be the same type (vertical or horizontal)" };
        }
        if (type1 === 'v-slot' && !(Math.abs(r1 - r2) === 2 && c1 === c2)) {
            return { success: false, message: "Vertical wall endpoints must be two rows apart in the same column" };
        }
        if (type1 === 'h-slot' && !(Math.abs(c1 - c2) === 2 && r1 === r2)) {
            return { success: false, message: "Horizontal wall endpoints must be two columns apart in the same row" };
        }
        // Place wall at the first endpoint (existing logic)
        const result = this.placeWall(r1, c1);
        if (result.success) {
            // Decrement wall count (but do NOT switch turn here)
            if (this.turn === "white") this.whiteWalls--;
            if (this.turn === "black") this.blackWalls--;
        }
        return result;
    }

    /**
     * Handles the complete turn flow and state transitions
     * @param {string} action - The action taken ('move', 'wall', 'skip', 'end')
     * @param {Object} data - Additional data needed for the action
     * @returns {Object} Result of the action with state update info
     */
    handleTurn(action, data = {}) {
        const result = {
            success: false,
            message: '',
            stateUpdate: {
                phaseChanged: false,
                turnChanged: false,
                wallCountChanged: false,
                gameWon: false
            }
        };

        switch (action) {
            case 'move':
                if (this.phase !== 'move') {
                    result.message = 'Not in move phase';
                    return result;
                }
                const moveResult = this.movePawn(data.destination);
                if (moveResult.success) {
                    this.phase = 'wall';
                    this.lastAction = 'move';
                    result.stateUpdate.phaseChanged = true;
                    result.message = 'Move successful. Wall phase begins.';
                }
                return { ...result, ...moveResult };

            case 'wall':
                if (this.phase !== 'wall') {
                    result.message = 'Not in wall phase';
                    return result;
                }
                const wallResult = this.placeWallEndpoints(data.start, data.end);
                if (wallResult.success) {
                    this.phase = 'review';
                    this.lastAction = 'wall';
                    result.stateUpdate.phaseChanged = true;
                    result.stateUpdate.wallCountChanged = true;
                    result.message = 'Wall placed. Review phase begins.';
                }
                return { ...result, ...wallResult };

            case 'skip':
                if (this.phase === 'move') {
                    this.phase = 'wall';
                    this.lastAction = 'skip_move';
                    result.stateUpdate.phaseChanged = true;
                    result.message = 'Move skipped. Wall phase begins.';
                } else if (this.phase === 'wall') {
                    this.phase = 'review';
                    this.lastAction = 'skip_wall';
                    result.stateUpdate.phaseChanged = true;
                    result.message = 'Wall phase skipped. Review phase begins.';
                }
                result.success = true;
                return result;

            case 'end':
                if (this.phase !== 'review') {
                    result.message = 'Not in review phase';
                    return result;
                }
                this.turn = this.turn === 'white' ? 'black' : 'white';
                this.phase = 'move';
                this.lastAction = 'end_turn';
                result.stateUpdate.phaseChanged = true;
                result.stateUpdate.turnChanged = true;
                result.message = 'Turn ended. Next player\'s move phase begins.';
                result.success = true;
                return result;

            case 'reset':
                if (this.phase !== 'review') {
                    result.message = 'Can only reset during review phase';
                    return result;
                }
                if (data.originalState) {
                    this.restoreState(data.originalState);
                    this.phase = 'move';
                    this.lastAction = 'reset';
                    result.stateUpdate.phaseChanged = true;
                    result.message = 'Turn reset. Move phase begins.';
                    result.success = true;
                }
                return result;

            default:
                result.message = 'Invalid action';
                return result;
        }
    }

    /**
     * Restores game state from a saved state
     * @param {Object} state - The state to restore
     */
    restoreState(state) {
        this.turn = state.turn;
        this.whitePos = [...state.whitePos];
        this.blackPos = [...state.blackPos];
        this.whiteWalls = state.whiteWalls;
        this.blackWalls = state.blackWalls;
        this.whiteWon = state.whiteWon;
        this.blackWon = state.blackWon;
        this.board = state.board.map(row => row.map(cell => ({ ...cell })));
    }
}

if (typeof window !== 'undefined') {
    window.Game = Game;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
