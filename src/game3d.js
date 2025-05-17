export default class Game3D {
    constructor() {
        this.reset();
    }

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
        this.lastAction = null;
    }

    initializeBoard() {
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

    determineWallOrientation(row, col) {
        if (row % 2 === 0 && col % 2 === 1) return "v";
        if (row % 2 === 1 && col % 2 === 0) return "h";
        return false;
    }

    isOutOfBounds(row, col) {
        return row < 0 || row > 16 || col < 0 || col > 16;
    }

    isOccupied(row, col) {
        return this.board[row][col].occupiedBy != null;
    }

    verifyRange(currentPos, destPos) {
        let differenceRow = Math.abs(currentPos[0] - destPos[0]);
        let differenceCol = Math.abs(currentPos[1] - destPos[1]);
        return (
            (differenceRow === 2 && differenceCol === 0) ||
            (differenceRow === 0 && differenceCol === 2)
        );
    }

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

    movePawn(destination) {
        const currentPos = this.turn === "white" ? this.whitePos : this.blackPos;
        
        if (!this.verifyRange(currentPos, destination)) {
            return { success: false, message: "Invalid move range" };
        }

        if (this.isOutOfBounds(destination[0], destination[1])) {
            return { success: false, message: "Destination out of bounds" };
        }

        if (this.isOccupied(destination[0], destination[1])) {
            const jumpResult = this.jumpOverPawn(currentPos, destination);
            if (!jumpResult.success) {
                return jumpResult;
            }
            destination = jumpResult.destination;
        }

        const direction = this.directionOfTravel(currentPos, destination);
        if (this.checkForWall(currentPos, direction)) {
            return { success: false, message: "Blocked by wall" };
        }

        // Update board state
        this.board[currentPos[0]][currentPos[1]].occupiedBy = null;
        this.board[destination[0]][destination[1]].occupiedBy = this.turn;

        // Update pawn position
        if (this.turn === "white") {
            this.whitePos = destination;
        } else {
            this.blackPos = destination;
        }

        // Check for win
        const winCheck = this.gameWon();
        if (winCheck.win) {
            if (winCheck.winner === "white") this.whiteWon = true;
            else this.blackWon = true;
        }

        return { success: true, message: "Move successful" };
    }

    directionOfTravel(currentPos, destPos) {
        let differenceRow = currentPos[0] - destPos[0];
        let differenceCol = currentPos[1] - destPos[1];
        if (differenceRow < 0) return "up";
        if (differenceRow > 0) return "down";
        if (differenceCol > 0) return "left";
        if (differenceCol < 0) return "right";
    }

    checkForWall(pos, direction) {
        const [row, col] = pos;
        switch (direction) {
            case "up":
                return this.board[row + 1][col].occupiedBy === "wall";
            case "down":
                return this.board[row - 1][col].occupiedBy === "wall";
            case "left":
                return this.board[row][col - 1].occupiedBy === "wall";
            case "right":
                return this.board[row][col + 1].occupiedBy === "wall";
        }
    }

    jumpOverPawn(currentPos, destPos) {
        const direction = this.directionOfTravel(currentPos, destPos);
        const otherPos = this.turn === "white" ? this.blackPos : this.whitePos;
        
        if (this.hopsOffBoard(currentPos, direction)) {
            return { success: false, message: "Not enough space for jump" };
        }

        let jumpDest;
        switch (direction) {
            case "up":
                if (this.checkForWall(currentPos, "up") || this.checkForWall([currentPos[0] + 2, currentPos[1]], "up")) {
                    return { success: false, message: "Blocked by wall" };
                }
                jumpDest = [currentPos[0] + 4, currentPos[1]];
                break;
            case "down":
                if (this.checkForWall(currentPos, "down") || this.checkForWall([currentPos[0] - 2, currentPos[1]], "down")) {
                    return { success: false, message: "Blocked by wall" };
                }
                jumpDest = [currentPos[0] - 4, currentPos[1]];
                break;
            case "left":
                if (this.checkForWall(currentPos, "left") || this.checkForWall([currentPos[0], currentPos[1] - 2], "left")) {
                    return { success: false, message: "Blocked by wall" };
                }
                jumpDest = [currentPos[0], currentPos[1] - 4];
                break;
            case "right":
                if (this.checkForWall(currentPos, "right") || this.checkForWall([currentPos[0], currentPos[1] + 2], "right")) {
                    return { success: false, message: "Blocked by wall" };
                }
                jumpDest = [currentPos[0], currentPos[1] + 4];
                break;
        }

        return { success: true, destination: jumpDest };
    }

    hopsOffBoard(pos, direction) {
        const [row, col] = pos;
        switch (direction) {
            case "up": return row > 12;
            case "down": return row < 3;
            case "left": return col < 4;
            case "right": return col > 12;
        }
    }

    placeWall(row, col) {
        const orientation = this.determineWallOrientation(row, col);
        if (!orientation) {
            return { success: false, message: "Invalid wall placement" };
        }

        // BOUNDS CHECK
        if (orientation === 'v' && (row + 2 > 16)) {
            return { success: false, message: "Wall too close to board edge" };
        }
        if (orientation === 'h' && (col + 2 > 16)) {
            return { success: false, message: "Wall too close to board edge" };
        }

        if (this.isOccupied(row, col)) {
            return { success: false, message: "Space already occupied" };
        }

        if ((this.turn === "white" && this.whiteWalls <= 0) || 
            (this.turn === "black" && this.blackWalls <= 0)) {
            return { success: false, message: "No walls remaining" };
        }

        // Check if wall placement would block all paths
        if (!this.isValidWallPlacement(row, col)) {
            return { success: false, message: "Wall would block all paths" };
        }

        // Place the wall
        this.board[row][col].occupiedBy = "wall";
        if (orientation === "v") {
            this.board[row + 2][col].occupiedBy = "wall";
        } else {
            this.board[row][col + 2].occupiedBy = "wall";
        }

        // Update wall count
        if (this.turn === "white") {
            this.whiteWalls--;
        } else {
            this.blackWalls--;
        }

        return { success: true, message: "Wall placed successfully" };
    }

    isValidWallPlacement(row, col) {
        const orientation = this.determineWallOrientation(row, col);
        if (!orientation) return false;

        // BOUNDS CHECK
        if (orientation === 'v' && (row + 2 > 16)) return false;
        if (orientation === 'h' && (col + 2 > 16)) return false;

        // Temporarily place the wall
        this.board[row][col].occupiedBy = "wall";
        if (orientation === "v") {
            this.board[row + 2][col].occupiedBy = "wall";
        } else {
            this.board[row][col + 2].occupiedBy = "wall";
        }

        // Check if both players still have valid paths
        const whiteHasPath = this.hasValidPath(this.whitePos, 0);
        const blackHasPath = this.hasValidPath(this.blackPos, 16);

        // Remove the temporary wall
        this.board[row][col].occupiedBy = null;
        if (orientation === "v") {
            this.board[row + 2][col].occupiedBy = null;
        } else {
            this.board[row][col + 2].occupiedBy = null;
        }

        return whiteHasPath && blackHasPath;
    }

    hasValidPath(startPos, goalRow) {
        const visited = new Set();
        const queue = [startPos];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            const posKey = `${row},${col}`;
            
            if (visited.has(posKey)) continue;
            visited.add(posKey);
            
            if (row === goalRow) return true;
            
            const moves = this.getValidMoves([row, col]);
            for (const move of moves) {
                queue.push(move);
            }
        }
        
        return false;
    }

    getValidMoves(pos) {
        const [row, col] = pos;
        const moves = [];
        
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

    isValidMove(currentPos, destPos) {
        if (this.isOutOfBounds(destPos[0], destPos[1])) return false;
        if (this.isOccupied(destPos[0], destPos[1])) return false;
        
        const [row1, col1] = currentPos;
        const [row2, col2] = destPos;
        
        if (row1 === row2) {
            const wallCol = Math.min(col1, col2) + 1;
            if (this.board[row1][wallCol].occupiedBy === 'wall') return false;
        } else {
            const wallRow = Math.min(row1, row2) + 1;
            if (this.board[wallRow][col1].occupiedBy === 'wall') return false;
        }
        
        return true;
    }

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
                const wallResult = this.placeWall(data.row, data.col);
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

    getWalls() {
        const walls = [];
        for (let row = 0; row < 17; row++) {
            for (let col = 0; col < 17; col++) {
                if (this.board[row][col].occupiedBy === "wall") {
                    const orientation = this.determineWallOrientation(row, col);
                    if (orientation) {
                        walls.push({ x: col, z: row, orientation });
                    }
                }
            }
        }
        return walls;
    }

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