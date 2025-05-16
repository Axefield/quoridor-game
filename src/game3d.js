export default class Game3D {
    constructor(gridSize = 9) {
        this.gridSize = gridSize;
        this.reset();
    }

    reset() {
        this.board = this.createBoard(); // 2D array for pawn/wall state
        this.whitePos = { x: Math.floor(this.gridSize / 2), z: this.gridSize - 1 };
        this.blackPos = { x: Math.floor(this.gridSize / 2), z: 0 };
        this.whiteWalls = 10;
        this.blackWalls = 10;
        this.turn = 'white'; // 'white' or 'black'
        this.phase = 'move'; // 'move', 'wall', 'review'
        this.winner = null;
        this.walls = []; // {x, z, orientation: 'h'|'v'}
    }

    createBoard() {
        // Each cell: { pawn: null|'white'|'black', wall: null|'h'|'v' }
        const board = [];
        for (let x = 0; x < this.gridSize; x++) {
            board[x] = [];
            for (let z = 0; z < this.gridSize; z++) {
                board[x][z] = { pawn: null, wall: null };
            }
        }
        return board;
    }

    isValidMove(pos, dx, dz) {
        const nx = pos.x + dx;
        const nz = pos.z + dz;
        if (nx < 0 || nx >= this.gridSize || nz < 0 || nz >= this.gridSize) return false;
        // Prevent moving onto the other pawn
        const other = this.turn === 'white' ? this.blackPos : this.whitePos;
        // --- Pawn jump logic ---
        if (nx === other.x && nz === other.z) {
            // Try to jump over the pawn
            const jx = nx + dx;
            const jz = nz + dz;
            if (jx >= 0 && jx < this.gridSize && jz >= 0 && jz < this.gridSize && !this.isBlocked(nx, nz, jx, jz) && !this.isBlocked(pos.x, pos.z, nx, nz)) {
                // Direct jump
                if (!(jx === pos.x && jz === pos.z)) return true;
            } else {
                // Diagonal jump if blocked
                const diagDirs = dx !== 0 ? [ [0, 1], [0, -1] ] : [ [1, 0], [-1, 0] ];
                for (const [ddx, ddz] of diagDirs) {
                    const dx2 = nx + ddx;
                    const dz2 = nz + ddz;
                    if (dx2 >= 0 && dx2 < this.gridSize && dz2 >= 0 && dz2 < this.gridSize && !this.isBlocked(nx, nz, dx2, dz2) && !this.isBlocked(pos.x, pos.z, nx, nz)) {
                        if (!(dx2 === pos.x && dz2 === pos.z) && dx2 === nx + ddx && dz2 === nz + ddz) return true;
                    }
                }
            }
            return false;
        }
        // Normal adjacent move (not onto other pawn)
        if (Math.abs(dx) + Math.abs(dz) !== 1) return false;
        if (this.isBlocked(pos.x, pos.z, nx, nz)) return false;
        return true;
    }

    isBlocked(x1, z1, x2, z2) {
        // Check if a wall blocks movement from (x1,z1) to (x2,z2)
        for (const wall of this.walls) {
            if (wall.orientation === 'h') {
                // Horizontal wall blocks movement between (x, z) <-> (x, z+1) if z == wall.z and x in [wall.x, wall.x+1]
                if ((z1 === wall.z && z2 === wall.z + 1 || z2 === wall.z && z1 === wall.z + 1) && (x1 === wall.x || x1 === wall.x + 1) && (x2 === wall.x || x2 === wall.x + 1)) {
                    return true;
                }
            } else if (wall.orientation === 'v') {
                // Vertical wall blocks movement between (x, z) <-> (x+1, z) if x == wall.x and z in [wall.z, wall.z+1]
                if ((x1 === wall.x && x2 === wall.x + 1 || x2 === wall.x && x1 === wall.x + 1) && (z1 === wall.z || z1 === wall.z + 1) && (z2 === wall.z || z2 === wall.z + 1)) {
                    return true;
                }
            }
        }
        return false;
    }

    movePawn(dx, dz) {
        if (this.winner) return false;
        const pos = this.turn === 'white' ? this.whitePos : this.blackPos;
        if (!this.isValidMove(pos, dx, dz)) {
            console.warn(`[movePawn] Illegal move attempted by ${this.turn}: (${pos.x},${pos.z}) + (${dx},${dz})`);
            return false;
        }
        pos.x += dx;
        pos.z += dz;
        console.log(`[movePawn] ${this.turn} moved to (${pos.x},${pos.z})`);
        if (this.checkWin()) {
            this.winner = this.turn;
        }
        return true;
    }

    checkWin() {
        // White wins if reaches z==0, black wins if reaches z==gridSize-1
        if (this.whitePos.z === 0) return 'white';
        if (this.blackPos.z === this.gridSize - 1) return 'black';
        return null;
    }

    // Place a wall between (x, z) and (x+1, z) or (x, z+1)
    placeWall(x, z, orientation) {
        if (this.winner) return false;
        if (this.turn === 'white' && this.whiteWalls <= 0) return false;
        if (this.turn === 'black' && this.blackWalls <= 0) return false;
        if (orientation === 'h' && (x < 0 || x >= this.gridSize - 1 || z < 0 || z >= this.gridSize - 1)) return false;
        if (orientation === 'v' && (x < 0 || x >= this.gridSize - 1 || z < 0 || z >= this.gridSize - 1)) return false;
        // Prevent overlap
        for (const wall of this.walls) {
            if (wall.x === x && wall.z === z && wall.orientation === orientation) return false;
            // Prevent intersection
            if (orientation === 'h' && wall.orientation === 'h' && wall.z === z && Math.abs(wall.x - x) === 1) return false;
            if (orientation === 'v' && wall.orientation === 'v' && wall.x === x && Math.abs(wall.z - z) === 1) return false;
            // Prevent crossing
            if (orientation !== wall.orientation && wall.x === x && wall.z === z) return false;
        }
        // Simulate wall placement for pathfinding check
        this.walls.push({ x, z, orientation });
        const whiteHasPath = this.hasPath(this.whitePos, 0); // white must reach z==0
        const blackHasPath = this.hasPath(this.blackPos, this.gridSize - 1); // black must reach z==gridSize-1
        if (!whiteHasPath || !blackHasPath) {
            this.walls.pop();
            return false;
        }
        // Actually place wall
        if (this.turn === 'white') this.whiteWalls--;
        if (this.turn === 'black') this.blackWalls--;
        console.log(`[placeWall] ${this.turn} placed ${orientation} wall at (${x},${z})`);
        return true;
    }

    // BFS to check if a pawn has a path to its goal row
    hasPath(start, goalZ) {
        const visited = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(false));
        const queue = [[start.x, start.z]];
        while (queue.length > 0) {
            const [x, z] = queue.shift();
            if (z === goalZ) return true;
            if (visited[x][z]) continue;
            visited[x][z] = true;
            // Try all 4 directions
            const dirs = [
                [0, 1], [0, -1], [1, 0], [-1, 0]
            ];
            for (const [dx, dz] of dirs) {
                const nx = x + dx, nz = z + dz;
                if (nx < 0 || nx >= this.gridSize || nz < 0 || nz >= this.gridSize) continue;
                if (visited[nx][nz]) continue;
                // Check for wall
                if (this.isBlocked(x, z, nx, nz)) continue;
                queue.push([nx, nz]);
            }
        }
        return false;
    }

    getWalls() {
        return this.walls;
    }

    // Helper: Find shortest path length for a pawn to its goal
    shortestPathLength(start, goalZ) {
        const visited = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(false));
        const queue = [[start.x, start.z, 0]];
        while (queue.length > 0) {
            const [x, z, dist] = queue.shift();
            if (z === goalZ) return dist;
            if (visited[x][z]) continue;
            visited[x][z] = true;
            const dirs = [
                [0, 1], [0, -1], [1, 0], [-1, 0]
            ];
            for (const [dx, dz] of dirs) {
                const nx = x + dx, nz = z + dz;
                if (nx < 0 || nx >= this.gridSize || nz < 0 || nz >= this.gridSize) continue;
                if (visited[nx][nz]) continue;
                if (this.isBlocked(x, z, nx, nz)) continue;
                queue.push([nx, nz, dist + 1]);
            }
        }
        return Infinity;
    }

    // Improved AI: block white if white's path is shorter, otherwise move
    aiMove() {
        if (this.turn !== 'black' || this.winner) return false;
        // Calculate shortest paths
        const whitePath = this.shortestPathLength(this.whitePos, 0);
        const blackPath = this.shortestPathLength(this.blackPos, this.gridSize - 1);
        // Try to place a wall if white is ahead and black has walls
        if (this.blackWalls > 0 && whitePath < blackPath) {
            // Try to block white's shortest path
            const path = this.getShortestPath(this.whitePos, 0);
            if (path && path.length > 1) {
                for (let i = 0; i < path.length - 1; i++) {
                    const [x1, z1] = path[i];
                    const [x2, z2] = path[i + 1];
                    // Try horizontal wall between (x1, z1) and (x2, z2)
                    if (z1 !== z2) {
                        const wx = Math.min(x1, x2);
                        const wz = Math.min(z1, z2);
                        if (this.placeWall(wx, wz, 'h')) {
                            console.log(`[aiMove] Placed horizontal wall at (${wx},${wz}) to block white`);
                            return 'wall';
                        } else {
                            console.log(`[aiMove] Failed to place horizontal wall at (${wx},${wz})`);
                        }
                    }
                    // Try vertical wall between (x1, z1) and (x2, z2)
                    if (x1 !== x2) {
                        const wx = Math.min(x1, x2);
                        const wz = Math.min(z1, z2);
                        if (this.placeWall(wx, wz, 'v')) {
                            console.log(`[aiMove] Placed vertical wall at (${wx},${wz}) to block white`);
                            return 'wall';
                        } else {
                            console.log(`[aiMove] Failed to place vertical wall at (${wx},${wz})`);
                        }
                    }
                }
            }
            // Fallback: try near white pawn
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const wx = this.whitePos.x + dx;
                    const wz = this.whitePos.z + dz;
                    if (this.placeWall(wx, wz, 'h')) {
                        console.log(`[aiMove] Fallback placed horizontal wall at (${wx},${wz})`);
                        return 'wall';
                    }
                    if (this.placeWall(wx, wz, 'v')) {
                        console.log(`[aiMove] Fallback placed vertical wall at (${wx},${wz})`);
                        return 'wall';
                    }
                }
            }
        }
        // Otherwise, try to move forward
        let options = [];
        if (this.isValidMove(this.blackPos, 0, 1)) options.push({ dx: 0, dz: 1 });
        if (this.isValidMove(this.blackPos, -1, 0)) options.push({ dx: -1, dz: 0 });
        if (this.isValidMove(this.blackPos, 1, 0)) options.push({ dx: 1, dz: 0 });
        let move = options.find(opt => opt.dz === 1) || options[0];
        if (move) {
            this.movePawn(move.dx, move.dz);
            return 'move';
        }
        return false;
    }

    // Helper: Get the actual shortest path as a list of [x, z] cells
    getShortestPath(start, goalZ) {
        const visited = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(false));
        const prev = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(null));
        const queue = [[start.x, start.z]];
        visited[start.x][start.z] = true;
        while (queue.length > 0) {
            const [x, z] = queue.shift();
            if (z === goalZ) {
                // Reconstruct path
                const path = [];
                let cx = x, cz = z;
                while (prev[cx][cz]) {
                    path.push([cx, cz]);
                    [cx, cz] = prev[cx][cz];
                }
                path.push([start.x, start.z]);
                path.reverse();
                return path;
            }
            const dirs = [ [0, 1], [0, -1], [1, 0], [-1, 0] ];
            for (const [dx, dz] of dirs) {
                const nx = x + dx, nz = z + dz;
                if (nx < 0 || nx >= this.gridSize || nz < 0 || nz >= this.gridSize) continue;
                if (visited[nx][nz]) continue;
                if (this.isBlocked(x, z, nx, nz)) continue;
                visited[nx][nz] = true;
                prev[nx][nz] = [x, z];
                queue.push([nx, nz]);
            }
        }
        return null;
    }
} 