/**
 * Represents a game of Quoridor.
 */
class Game {
    /**
     * Initializes a new game instance.
     */
    constructor() {
        this.turn = "white";
        this.whitePos = [0, 8];
        this.blackPos = [16, 8];
        this.whiteWalls = 10;
        this.blackWalls = 10;
        this.whiteWon = false;
        this.blackWon = false;
        this.board = this.initializeBoard();
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
     * Updates the turn and decreases the wall count for the current player.
     */
    manageTurnWalls() {
        if (this.turn === "white") this.whiteWalls--;
        if (this.turn === "black") this.blackWalls--;
        this.turn = this.turn === "white" ? "black" : "white";
    }

    /**
     * Updates whose turn it is
     */
    manageTurnMove() {
        this.turn = this.turn === "white" ? "black" : "white";
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

    gameWon(){
        let won = {win: false, winner: null};
        if (this.turn === 'black') {
            for(let a = 0; a < 17; a++){
                if (this.board[16][a].occupiedBy === 'white') won = {win: true, winner: 'white'};
            }
        }
        if(this.turn === 'white') {
            for(let a = 0; a < 17; a++){
                if (this.board[0][a].occupiedBy === 'black') won = {win: true, winner: 'black'};
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
                    this.manageTurnMove();
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
                    this.manageTurnMove();
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
            switch(direction){
                case 'up':
                    if (checkForWall(currentPos[0] + 1, currentPos[1])) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    break;
                case 'down':
                    if (checkForWall(currentPos[0] - 1, currentPos[1])) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    break;
                case 'left':
                    if (checkForWall(currentPos[0], currentPos[1] - 1)) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    break;
                case 'right':
                    if (checkForWall(currentPos[0], currentPos[1] + 1)) {
                        return { success: false, message: `Blocked by wall` };
                    }
                    break;
            }
            return true;
        }

        const lastPlace = [...currentPos];
        let isBlocked = noWallPresent(currentPos, directionOfTravel(currentPos, destination));
        if(isBlocked.success === false) return {success: false, message: `Blocked by wall`};
        if (this.turn === "white") this.whitePos = destination;
        if (this.turn === "black") this.blackPos = destination;
        this.board[lastPlace[0]][lastPlace[1]].occupiedBy = null;
        this.board[destination[0]][destination[1]].occupiedBy = this.turn;
        this.manageTurnMove();
        let winningMove = this.gameWon();
        if (winningMove.win) {
            winningMove.winner === 'white' ? this.whiteWon = true : this.blackWon = true;
        }
        return {
            success: true,
            message: `pawn moved from ${currentPos} to ${destination}`,
        };
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
            this.board[row][col].occupiedBy = "wall";
            this.board[row + 2][col].occupiedBy = "wall";
            this.manageTurnWalls();
            return { success: true, message: `Vertical wall placed` };
        }
        if (orientation === "h") {
            if (16 - row < 2)
                return {
                    success: false,
                    message: `Wall too close to board boundary`,
                };
            this.board[row][col].occupiedBy = "wall";
            this.board[row][col + 2].occupiedBy = "wall";
            this.manageTurnWalls();
            return { success: true, message: `Horizontal wall placed` };
        }
        if (orientation === false) {
            return {
                success: false,
                message: `Cannot place wall in a space or intersection`,
            };
        }
    }
}
module.exports = Game;
