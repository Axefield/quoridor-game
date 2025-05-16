import * as THREE from '/node_modules/three/build/three.module.js';
import Game3D from './game3d.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 30);
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Board grid (9x9)
const gridSize = 9;
const cellSize = 2;
const board = new THREE.Group();
const cellMeshes = [];
for (let x = 0; x < gridSize; x++) {
    cellMeshes[x] = [];
    for (let z = 0; z < gridSize; z++) {
        const geometry = new THREE.BoxGeometry(cellSize * 0.95, 0.3, cellSize * 0.95);
        const material = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        const cell = new THREE.Mesh(geometry, material);
        cell.position.set((x - (gridSize - 1) / 2) * cellSize, 0, (z - (gridSize - 1) / 2) * cellSize);
        cell.userData = { x, z };
        board.add(cell);
        cellMeshes[x][z] = cell;
    }
}
scene.add(board);

// Game logic
const game = new Game3D(gridSize);

// Pawn setup
const pawnRadius = 0.6;
const whitePawnGeo = new THREE.SphereGeometry(pawnRadius, 32, 32);
const blackPawnGeo = new THREE.SphereGeometry(pawnRadius, 32, 32);
const whitePawnMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const blackPawnMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const whitePawn = new THREE.Mesh(whitePawnGeo, whitePawnMat);
const blackPawn = new THREE.Mesh(blackPawnGeo, blackPawnMat);
scene.add(whitePawn);
scene.add(blackPawn);

// Wall rendering
let wallGroup = new THREE.Group();
scene.add(wallGroup);
function renderWalls() {
    // Remove old walls
    scene.remove(wallGroup);
    wallGroup = new THREE.Group();
    for (const wall of game.getWalls()) {
        const wallLength = cellSize * 2;
        const wallThickness = 0.4;
        const wallHeight = 1.2;
        const geometry = wall.orientation === 'h'
            ? new THREE.BoxGeometry(wallLength, wallHeight, wallThickness)
            : new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
        const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const mesh = new THREE.Mesh(geometry, material);
        // Center between the two cells
        if (wall.orientation === 'h') {
            mesh.position.set(
                (wall.x + 0.5 - (gridSize - 1) / 2) * cellSize,
                0.7,
                (wall.z + 1 - (gridSize - 1) / 2) * cellSize
            );
        } else {
            mesh.position.set(
                (wall.x + 1 - (gridSize - 1) / 2) * cellSize,
                0.7,
                (wall.z + 0.5 - (gridSize - 1) / 2) * cellSize
            );
        }
        wallGroup.add(mesh);
    }
    scene.add(wallGroup);
}

function updatePawnPositions() {
    whitePawn.position.set(
        (game.whitePos.x - (gridSize - 1) / 2) * cellSize,
        0.7,
        (game.whitePos.z - (gridSize - 1) / 2) * cellSize
    );
    blackPawn.position.set(
        (game.blackPos.x - (gridSize - 1) / 2) * cellSize,
        0.7,
        (game.blackPos.z - (gridSize - 1) / 2) * cellSize
    );
}
updatePawnPositions();

// Overlay for win message
let winOverlay = document.getElementById('win-overlay');
if (!winOverlay) {
    winOverlay = document.createElement('div');
    winOverlay.id = 'win-overlay';
    winOverlay.style.position = 'fixed';
    winOverlay.style.top = '50%';
    winOverlay.style.left = '50%';
    winOverlay.style.transform = 'translate(-50%, -50%)';
    winOverlay.style.background = 'rgba(0,0,0,0.8)';
    winOverlay.style.color = '#fff';
    winOverlay.style.fontSize = '2rem';
    winOverlay.style.padding = '2rem 3rem';
    winOverlay.style.borderRadius = '16px';
    winOverlay.style.display = 'none';
    winOverlay.style.zIndex = 100;
    document.body.appendChild(winOverlay);
}
function showWinMessage(winner) {
    winOverlay.textContent = `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    winOverlay.style.display = 'block';
}
function hideWinMessage() {
    winOverlay.style.display = 'none';
}

// UI overlays for turn, wall count, phase
let uiOverlay = document.getElementById('ui-overlay');
if (!uiOverlay) {
    uiOverlay = document.createElement('div');
    uiOverlay.id = 'ui-overlay';
    uiOverlay.style.position = 'fixed';
    uiOverlay.style.top = '1em';
    uiOverlay.style.right = '1em';
    uiOverlay.style.background = 'rgba(0,0,0,0.7)';
    uiOverlay.style.color = '#fff';
    uiOverlay.style.fontSize = '1.2rem';
    uiOverlay.style.padding = '1em 2em';
    uiOverlay.style.borderRadius = '12px';
    uiOverlay.style.zIndex = 99;
    document.body.appendChild(uiOverlay);
}
function updateUIOverlay() {
    uiOverlay.innerHTML = `
        <div><b>Turn:</b> ${game.turn.charAt(0).toUpperCase() + game.turn.slice(1)}</div>
        <div><b>Phase:</b> ${game.phase}</div>
        <div><b>White Walls:</b> ${game.whiteWalls} &nbsp; <b>Black Walls:</b> ${game.blackWalls}</div>
    `;
}
updateUIOverlay();

// Wall placement (click two adjacent cells)
let wallStart = null;
let wallPreview = null;

function removeWallPreview() {
    if (wallPreview) {
        scene.remove(wallPreview);
        wallPreview = null;
    }
}

function showWallPreview(x1, z1, x2, z2) {
    removeWallPreview();
    let orientation = null;
    if (Math.abs(x2 - x1) === 1 && z1 === z2) orientation = 'v';
    if (Math.abs(z2 - z1) === 1 && x1 === x2) orientation = 'h';
    if (!orientation) return;
    const wx = Math.min(x1, x2);
    const wz = Math.min(z1, z2);
    // Validate wall placement (simulate)
    let valid = game.placeWall(wx, wz, orientation);
    if (valid) {
        // Remove the wall after checking
        game.walls.pop();
        if (game.turn === 'white') game.whiteWalls++;
        if (game.turn === 'black') game.blackWalls++;
    }
    const wallLength = cellSize * 2;
    const wallThickness = 0.4;
    const wallHeight = 1.2;
    const geometry = orientation === 'h'
        ? new THREE.BoxGeometry(wallLength, wallHeight, wallThickness)
        : new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    const color = valid ? 0x27ae60 : 0xe74c3c;
    const material = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.5 });
    wallPreview = new THREE.Mesh(geometry, material);
    if (orientation === 'h') {
        wallPreview.position.set(
            (wx + 0.5 - (gridSize - 1) / 2) * cellSize,
            0.7,
            (wz + 1 - (gridSize - 1) / 2) * cellSize
        );
    } else {
        wallPreview.position.set(
            (wx + 1 - (gridSize - 1) / 2) * cellSize,
            0.7,
            (wz + 0.5 - (gridSize - 1) / 2) * cellSize
        );
    }
    scene.add(wallPreview);
}

// --- Move Phase Highlighting (Static, Only Adjacent Legal Moves) ---
let moveHighlights = [];
let movePhaseActive = false;
let movePhaseStartPos = null;
let pawnHasMoved = false;
let legalMoveCells = [];

// --- Debug Overlay ---
let debugOverlay = document.getElementById('debug-overlay');
if (!debugOverlay) {
    debugOverlay = document.createElement('div');
    debugOverlay.id = 'debug-overlay';
    debugOverlay.style.position = 'fixed';
    debugOverlay.style.bottom = '1em';
    debugOverlay.style.left = '1em';
    debugOverlay.style.background = 'rgba(0,0,0,0.85)';
    debugOverlay.style.color = '#0f0';
    debugOverlay.style.fontSize = '1.1rem';
    debugOverlay.style.padding = '1em 2em';
    debugOverlay.style.borderRadius = '12px';
    debugOverlay.style.zIndex = 999;
    debugOverlay.style.maxWidth = '40vw';
    debugOverlay.style.whiteSpace = 'pre';
    document.body.appendChild(debugOverlay);
}
function updateDebugOverlay(context = '') {
    const debugText =
        (context ? `[${context}]\n` : '') +
        `Phase: ${game.phase}\n` +
        `Turn: ${game.turn}\n` +
        `White Pos: (${game.whitePos.x}, ${game.whitePos.z})\n` +
        `Black Pos: (${game.blackPos.x}, ${game.blackPos.z})\n` +
        `White Walls: ${game.whiteWalls}\n` +
        `Black Walls: ${game.blackWalls}\n` +
        `Move Phase Active: ${movePhaseActive}\n` +
        `Move Phase Start Pos: ${movePhaseStartPos ? `(${movePhaseStartPos.x},${movePhaseStartPos.z})` : 'null'}\n` +
        `Pawn Has Moved: ${pawnHasMoved}\n` +
        `Legal Move Cells: ${JSON.stringify(legalMoveCells)}\n` +
        `Winner: ${game.winner}\n`;
    debugOverlay.innerText = debugText;
    // Also print to terminal
    console.log('--- DEBUG OVERLAY ---\n' + debugText + '\n---------------------');
}

function logState(context) {
    console.log(`[${context}]`);
    console.log('  Pawn position:', game.whitePos);
    console.log('  Move phase active:', movePhaseActive);
    console.log('  Legal move cells:', legalMoveCells);
    console.log('  Pawn has moved:', pawnHasMoved);
    console.log('  Current phase:', game.phase);
    console.log('  Current turn:', game.turn);
    updateDebugOverlay(context);
}

function getLegalMoveCells(start) {
    const cells = [];
    const dirs = [
        { dx: 0, dz: -1, name: 'up' },
        { dx: 0, dz: 1, name: 'down' },
        { dx: -1, dz: 0, name: 'left' },
        { dx: 1, dz: 0, name: 'right' }
    ];
    for (const { dx, dz, name } of dirs) {
        const valid = game.isValidMove(start, dx, dz);
        console.log(`[getLegalMoveCells] Checking ${name}: (${start.x},${start.z}) + (${dx},${dz}) => valid: ${valid}`);
        if (valid) {
            cells.push({ x: start.x + dx, z: start.z + dz });
        }
    }
    // Always include the starting cell for yellow highlight
    cells.push({ x: start.x, z: start.z });
    if (cells.length === 0) {
        console.error('getLegalMoveCells: No legal moves found! Forcing current cell as only legal cell.');
        cells.push({ x: start.x, z: start.z });
    }
    return cells;
}

function highlightMoveSpacesStaticWithPawn() {
    // Guard against highlight updates outside move phase
    if (game.phase !== 'move' || game.winner || !movePhaseActive) {
        clearMoveHighlights();
        return;
    }
    clearMoveHighlights();
    for (const { x, z } of legalMoveCells) {
        const cell = cellMeshes[x][z];
        // Pawn's current cell will be yellow, others blue
        if (x === game.whitePos.x && z === game.whitePos.z) {
            cell.material.color.set(0xffd700); // yellow
        } else {
            cell.material.color.set(0x4fc3f7); // blue
        }
        moveHighlights.push(cell);
    }
    logState('highlightMoveSpacesStaticWithPawn');
}

function clearMoveHighlights() {
    for (const cell of moveHighlights) {
        cell.material.color.set(0xeeeeee);
    }
    moveHighlights = [];
}

function startMovePhase() {
    movePhaseStartPos = { x: game.whitePos.x, z: game.whitePos.z };
    pawnHasMoved = false;
    movePhaseActive = true;
    legalMoveCells = getLegalMoveCells(movePhaseStartPos);
    if (!legalMoveCells || legalMoveCells.length === 0) {
        console.error('startMovePhase: legalMoveCells is empty! This should not happen.');
    }
    highlightMoveSpacesStaticWithPawn();
    logState('startMovePhase');
}

function undoMovePhase() {
    if (movePhaseStartPos && game.phase === 'move' && game.turn === 'white') {
        game.whitePos.x = movePhaseStartPos.x;
        game.whitePos.z = movePhaseStartPos.z;
        updatePawnPositions();
        pawnHasMoved = false;
        movePhaseActive = true;
        highlightMoveSpacesStaticWithPawn();
        logState('undoMovePhase');
    }
}

function endMovePhase() {
    if (game.phase === 'move' && game.turn === 'white') {
        logState('endMovePhase');
        game.phase = 'wall';
        movePhaseActive = false;
        clearMoveHighlights();
        updateUIOverlay();
    }
}

// --- PHASE CONTROL UI ---
const movePhaseControls = document.getElementById('move-phase-controls');
const wallPhaseControls = document.getElementById('wall-phase-controls');
const endMoveBtn = document.getElementById('end-move-btn'); // legacy, hide
const reviewModal = document.getElementById('review-modal');
const resetMoveBtn = document.getElementById('reset-move-btn');
const confirmMoveBtn = document.getElementById('confirm-move-btn');
const resetWallBtn = document.getElementById('reset-wall-btn');
const confirmWallBtn = document.getElementById('confirm-wall-btn');
const returnMoveBtn = document.getElementById('return-move-btn');
const endTurnBtn = document.getElementById('end-turn-btn');
const resetTurnBtn = document.getElementById('reset-turn-btn');

function showPhaseControls() {
    movePhaseControls.style.display = (game.phase === 'move' && game.turn === 'white') ? 'block' : 'none';
    wallPhaseControls.style.display = (game.phase === 'wall' && game.turn === 'white' && game.whiteWalls > 0) ? 'block' : 'none';
    if (endMoveBtn) endMoveBtn.style.display = 'none'; // always hide legacy
}

function showReviewModal(show) {
    reviewModal.style.display = show ? 'flex' : 'none';
}

// --- BUTTON LOGIC ---
if (resetMoveBtn) {
    resetMoveBtn.onclick = () => { undoMovePhase(); };
}
if (confirmMoveBtn) {
    confirmMoveBtn.onclick = () => {
        if (game.phase === 'move' && game.turn === 'white') {
            game.phase = 'wall';
            movePhaseActive = false;
            clearMoveHighlights();
            updateUIOverlay();
        }
    };
}
if (resetWallBtn) {
    resetWallBtn.onclick = () => {
        resetWallPhase();
        updateUIOverlay();
    };
}
if (confirmWallBtn) {
    confirmWallBtn.onclick = () => {
        if (game.phase === 'wall' && game.turn === 'white' && wallPlacedThisTurn.length === 1) {
            const wall = wallPlacedThisTurn[0];
            if (game.placeWall(wall.x, wall.z, wall.orientation)) {
                renderWalls();
                updateUIOverlay();
                // Immediately advance to review phase after placing a wall
                game.phase = 'review';
                updateUIOverlay();
                showReviewModal(true);
                console.log('Wall placed this phase:', wallPlacedThisTurn);
            } else {
                console.warn('Invalid wall placement on confirm.');
            }
            wallPlacedThisTurn = [];
            removeWallPreview();
        }
    };
}
if (returnMoveBtn) {
    returnMoveBtn.onclick = () => {
        resetWallPhase();
        if (movePhaseStartPos) {
            game.whitePos.x = movePhaseStartPos.x;
            game.whitePos.z = movePhaseStartPos.z;
            updatePawnPositions();
        }
        game.phase = 'move';
        movePhaseActive = true;
        highlightMoveSpacesStaticWithPawn();
        updateUIOverlay();
    };
}
if (endTurnBtn) {
    endTurnBtn.onclick = () => {
        showReviewModal(false);
        // End turn, pass to black
        game.turn = 'black';
        game.phase = 'move';
        movePhaseActive = false;
        movePhaseStartPos = null;
        pawnHasMoved = false;
        legalMoveCells = [];
        updateUIOverlay();
        logState('endTurnBtn: white -> black');
        setTimeout(() => {
            if (game.turn === 'black' && !game.winner) {
                logState('black AI turn start');
                let aiResult = game.aiMove();
                logState(`aiMove: result=${aiResult}`);
                if (aiResult === 'wall') {
                    renderWalls();
                    updateUIOverlay();
                    logState('ai-wall');
                } else if (aiResult === 'move') {
                    updatePawnPositions();
                    updateUIOverlay();
                    const winner = game.checkWin();
                    if (winner) {
                        showWinMessage(winner);
                        game.winner = winner;
                        logState('ai-move-wins');
                        return;
                    }
                    logState('ai-move');
                } else {
                    logState('ai-no-action');
                }
                // Always return to white's turn after AI acts
                setTimeout(() => {
                    if (!game.winner) {
                        game.turn = 'white';
                        game.phase = 'move';
                        movePhaseActive = false;
                        movePhaseStartPos = null;
                        pawnHasMoved = false;
                        legalMoveCells = [];
                        updateUIOverlay();
                        logState('black -> white turn');
                    }
                }, 400);
            }
        }, 400);
    };
}
if (resetTurnBtn) {
    resetTurnBtn.onclick = () => {
        showReviewModal(false);
        resetWallPhase();
        if (movePhaseStartPos) {
            game.whitePos.x = movePhaseStartPos.x;
            game.whitePos.z = movePhaseStartPos.z;
            updatePawnPositions();
        }
        game.phase = 'move';
        movePhaseActive = true;
        highlightMoveSpacesStaticWithPawn();
        updateUIOverlay();
    };
}

// --- PHASE LOGIC HOOK ---
function onPhaseChange() {
    clearMoveHighlights();
    showPhaseControls();
    if (game.phase === 'move' && game.turn === 'white') {
        if (!movePhaseActive) { // Only start move phase if not already active
            startMovePhase();
        }
        showReviewModal(false);
    } else if (game.phase === 'wall' && game.turn === 'white') {
        wallPlacedThisTurn = [];
        if (game.whiteWalls === 0) {
            // Skip wall phase, go straight to review
            game.phase = 'review';
            showReviewModal(true);
            updateUIOverlay();
            return;
        }
        showReviewModal(false);
    } else if (game.phase === 'review' && game.turn === 'white') {
        showReviewModal(true);
    } else {
        movePhaseActive = false;
        clearMoveHighlights();
        showReviewModal(false);
    }
    logState('phaseChange');
}

// Call onPhaseChange after UI overlay update and after moves
const originalUpdateUIOverlay = updateUIOverlay;
updateUIOverlay = function() {
    originalUpdateUIOverlay();
    onPhaseChange();
    updateDebugOverlay('updateUIOverlay');
};

// Initial highlight
highlightMoveSpacesStaticWithPawn();

// Initial debug overlay
updateDebugOverlay('init');

// End Move button logic
if (endMoveBtn) {
    endMoveBtn.addEventListener('click', () => {
        logState('end-move-btn');
        endMovePhase();
    });
} 

updateUIOverlay();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// --- Pawn Movement Controls (WASD/Arrow keys and mouse) ---
window.addEventListener('keydown', (e) => {
    if (game.phase !== 'move' || game.turn !== 'white' || !movePhaseActive) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        undoMovePhase();
        e.preventDefault();
        return;
    }
    let dx = 0, dz = 0;
    if (e.key === 'ArrowUp' || e.key === 'w') dz = -1;
    if (e.key === 'ArrowDown' || e.key === 's') dz = 1;
    if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;
    if (dx !== 0 || dz !== 0) {
        const pos = game.whitePos;
        const nx = pos.x + dx;
        const nz = pos.z + dz;
        if (legalMoveCells.some(cell => cell.x === nx && cell.z === nz)) {
            if (game.isValidMove(pos, dx, dz)) {
                game.whitePos.x = nx;
                game.whitePos.z = nz;
                updatePawnPositions();
                updateUIOverlay();
                pawnHasMoved = true;
                highlightMoveSpacesStaticWithPawn();
                logState('keydown-move');
                const winner = game.checkWin();
                if (winner) {
                    showWinMessage(winner);
                    game.winner = winner;
                    movePhaseActive = false;
                    clearMoveHighlights();
                    return;
                }
            } else {
                console.warn('Illegal move attempted (blocked by wall or pawn)');
                logState('illegal-move-blocked');
            }
        } else {
            console.warn('Illegal move attempted (not in legalMoveCells)');
            logState('illegal-move-not-in-legalMoveCells');
        }
    }
});

window.addEventListener('mousedown', (e) => {
    if (game.phase !== 'move' || game.turn !== 'white' || !movePhaseActive) return;
    const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(board.children);
    if (intersects.length > 0) {
        const { x, z } = intersects[0].object.userData;
        const pos = game.whitePos;
        if (legalMoveCells.some(cell => cell.x === x && cell.z === z)) {
            if (Math.abs(x - pos.x) + Math.abs(z - pos.z) === 1) {
                if (game.isValidMove(pos, x - pos.x, z - pos.z)) {
                    game.whitePos.x = x;
                    game.whitePos.z = z;
                    updatePawnPositions();
                    updateUIOverlay();
                    pawnHasMoved = true;
                    highlightMoveSpacesStaticWithPawn();
                    logState('mousedown-move');
                    const winner = game.checkWin();
                    if (winner) {
                        showWinMessage(winner);
                        game.winner = winner;
                        movePhaseActive = false;
                        clearMoveHighlights();
                        return;
                    }
                } else {
                    console.warn('Illegal move attempted (blocked by wall or pawn)');
                    logState('illegal-move-blocked');
                }
            } else {
                console.warn('Illegal move attempted (not adjacent cell)');
                logState('illegal-move-not-adjacent');
            }
        } else {
            console.warn('Illegal move attempted (not in legalMoveCells)');
            logState('illegal-move-not-in-legalMoveCells');
        }
    }
});

// --- Wall Placement Tracking ---
let wallPlacedThisTurn = [];

// --- Wall Placement Mouse Handler (true preview UX) ---
window.addEventListener('mousedown', (e) => {
    if (game.phase === 'wall' && game.turn === 'white' && !game.winner) {
        // Only allow one wall preview per wall phase and only if walls remain
        if (wallPlacedThisTurn.length > 0) {
            console.warn('Wall already placed this phase. Reset to preview/place a new wall.');
            return;
        }
        if (game.whiteWalls === 0) return;
        const mouse = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(board.children);
        if (intersects.length > 0) {
            const { x, z } = intersects[0].object.userData;
            if (!wallStart) {
                // First click: select cell
                wallStart = { x, z };
                cellMeshes[x][z].material.color.set(0xffd700);
                removeWallPreview();
            } else {
                // Second click: try to preview wall if adjacent
                const dx = x - wallStart.x;
                const dz = z - wallStart.z;
                let orientation = null;
                if (Math.abs(dx) === 1 && dz === 0) orientation = 'v';
                if (Math.abs(dz) === 1 && dx === 0) orientation = 'h';
                if (orientation) {
                    // Show preview only (do NOT place wall yet)
                    showWallPreview(wallStart.x, wallStart.z, x, z);
                    wallPlacedThisTurn = [{ x: Math.min(wallStart.x, x), z: Math.min(wallStart.z, z), orientation }];
                    console.log('Wall previewed this phase:', wallPlacedThisTurn);
                } else {
                    removeWallPreview();
                    wallPlacedThisTurn = [];
                }
                // Reset highlight
                cellMeshes[wallStart.x][wallStart.z].material.color.set(0xeeeeee);
                wallStart = null;
            }
        }
        return;
    }
    // ... existing move phase and other logic ...
});

function resetWallPhase() {
    // Only remove preview, not actual wall, since wall is only placed on confirm
    removeWallPreview();
    if (wallStart) {
        cellMeshes[wallStart.x][wallStart.z].material.color.set(0xeeeeee);
    }
    wallStart = null;
    wallPlacedThisTurn = [];
    logState('resetWallPhase: preview/selection cleared');
    updateUIOverlay();
}
