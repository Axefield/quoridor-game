import Game from '../quoridor.js';

// --- DOM Setup ---
const boardContainer = document.createElement('div');
boardContainer.id = 'board-container';
const boardDiv = document.createElement('div');
boardDiv.id = 'board';
boardContainer.appendChild(boardDiv);
document.body.appendChild(boardContainer);

const controlsDiv = document.createElement('div');
controlsDiv.id = 'controls';
document.body.appendChild(controlsDiv);

const phaseBanner = document.createElement('div');
phaseBanner.id = 'phase-banner';
document.body.appendChild(phaseBanner);

const reviewModal = document.createElement('div');
reviewModal.id = 'review-modal';
reviewModal.style.display = 'none';
reviewModal.style.position = 'fixed';
reviewModal.style.top = '0';
reviewModal.style.left = '0';
reviewModal.style.width = '100vw';
reviewModal.style.height = '100vh';
reviewModal.style.background = 'rgba(0,0,0,0.6)';
reviewModal.style.zIndex = '2000';
reviewModal.style.display = 'flex';
reviewModal.style.alignItems = 'center';
reviewModal.style.justifyContent = 'center';
reviewModal.innerHTML = `
  <div style="background:#fff; color:#222; padding:2em 3em; border-radius:16px; text-align:center; min-width:300px;">
    <h2>Review Turn</h2>
    <p>Are you ready to end your turn?</p>
    <button id="end-turn-btn">End Turn</button>
    <button id="reset-turn-btn">Reset Turn</button>
  </div>
`;
document.body.appendChild(reviewModal);

// --- Game State ---
const game = new Game();
let wallPreview = null;
let wallStart = null;
let wallEnd = null;
let originalState = null;

// --- Rendering ---
function renderGrid() {
  boardDiv.innerHTML = '';
  for (let row = 0; row < 17; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'board-row flex';
    for (let col = 0; col < 17; col++) {
      const cell = document.createElement('div');
      cell.id = `${row},${col}`;
      cell.className = getCellClass(row, col);
      cell.dataset.row = row;
      cell.dataset.col = col;
      rowDiv.appendChild(cell);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function getCellClass(row, col) {
  if (row % 2 === 0 && col % 2 === 0) return 'cell space bg-gray-600 w-10 h-10 border border-gray-700 flex items-center justify-center';
  if (row % 2 === 0 && col % 2 === 1) return 'cell v-slot bg-gray-700 w-2 h-10';
  if (row % 2 === 1 && col % 2 === 0) return 'cell h-slot bg-gray-700 h-2 w-10';
  return 'cell empty bg-gray-700 h-2 w-2';
}

function renderBoard() {
  renderGrid();
  // Pawns
  const [wr, wc] = game.whitePos;
  const [br, bc] = game.blackPos;
  addPawnToCell(wr, wc, 'white');
  addPawnToCell(br, bc, 'black');
  // Walls
  for (let row = 0; row < 17; row++) {
    for (let col = 0; col < 17; col++) {
      if (game.board[row][col].occupiedBy === 'wall') {
        document.getElementById(`${row},${col}`).classList.add('bg-yellow-800');
      }
    }
  }
  // Highlights
  highlightValidMoves();
  highlightWallPreview();
}

function addPawnToCell(row, col, color) {
  const cell = document.getElementById(`${row},${col}`);
  if (!cell) return;
  cell.innerHTML = `<div class="h-6 w-6 rounded-full ${color === 'white' ? 'bg-white' : 'bg-gray-800'}"></div>`;
}

function highlightValidMoves() {
  if (game.phase !== 'move') return;
  const moves = game.getValidMoves(game.turn === 'white' ? game.whitePos : game.blackPos);
  for (const [r, c] of moves) {
    const cell = document.getElementById(`${r},${c}`);
    if (cell) cell.classList.add('bg-green-300', 'cursor-pointer');
  }
}

function highlightWallPreview() {
  if (wallStart && wallEnd) {
    const [r1, c1] = wallStart, [r2, c2] = wallEnd;
    const type = game.board[r1][c1].type;
    if (type === 'v-slot') {
      document.getElementById(`${r1},${c1}`).classList.add('bg-yellow-400');
      document.getElementById(`${r2},${c2}`).classList.add('bg-yellow-400');
    } else if (type === 'h-slot') {
      document.getElementById(`${r1},${c1}`).classList.add('bg-yellow-400');
      document.getElementById(`${r2},${c2}`).classList.add('bg-yellow-400');
    }
  }
}

// --- Controls ---
function renderControls() {
  controlsDiv.innerHTML = '';
  if (game.phase === 'move') {
    controlsDiv.innerHTML = `<button id="reset-move-btn">Reset Move</button> <button id="confirm-move-btn">Confirm Move</button>`;
  } else if (game.phase === 'wall') {
    controlsDiv.innerHTML = `<button id="reset-wall-btn">Reset Wall</button> <button id="confirm-wall-btn">Confirm Wall</button> <button id="return-move-btn">Return to Move Phase</button> <button id="skip-wall-btn">Skip Wall</button>`;
  }
}

function updatePhaseBanner() {
  phaseBanner.innerText = `Turn: ${game.turn.charAt(0).toUpperCase() + game.turn.slice(1)} | Phase: ${game.phase}`;
}

// --- Event Handlers ---
boardDiv.onclick = (e) => {
  if (!e.target.classList.contains('cell')) return;
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  if (game.phase === 'move') {
    // Only allow move to valid cell
    const moves = game.getValidMoves(game.turn === 'white' ? game.whitePos : game.blackPos);
    if (moves.some(([r, c]) => r === row && c === col)) {
      game.handleTurn('move', { destination: [row, col] });
      renderBoard();
      renderControls();
      updatePhaseBanner();
    }
  } else if (game.phase === 'wall') {
    // Wall placement: two-click preview
    const type = game.board[row][col].type;
    if (type !== 'v-slot' && type !== 'h-slot') return;
    if (!wallStart) {
      wallStart = [row, col];
      wallEnd = null;
      renderBoard();
    } else if (!wallEnd) {
      // Must be adjacent and same type
      if (type !== game.board[wallStart[0]][wallStart[1]].type) return;
      if (type === 'v-slot' && Math.abs(row - wallStart[0]) === 2 && col === wallStart[1]) {
        wallEnd = [row, col];
      } else if (type === 'h-slot' && Math.abs(col - wallStart[1]) === 2 && row === wallStart[0]) {
        wallEnd = [row, col];
      } else {
        wallStart = null;
        wallEnd = null;
      }
      renderBoard();
    }
  }
};

controlsDiv.onclick = (e) => {
  if (e.target.id === 'reset-move-btn') {
    game.reset();
    renderBoard();
    renderControls();
    updatePhaseBanner();
  }
  if (e.target.id === 'confirm-move-btn') {
    // Confirm move: advance to wall phase
    game.phase = 'wall';
    renderBoard();
    renderControls();
    updatePhaseBanner();
  }
  if (e.target.id === 'reset-wall-btn') {
    wallStart = null;
    wallEnd = null;
    renderBoard();
  }
  if (e.target.id === 'confirm-wall-btn') {
    if (wallStart && wallEnd) {
      const result = game.handleTurn('wall', { start: wallStart, end: wallEnd });
      if (result.success) {
        wallStart = null;
        wallEnd = null;
        renderBoard();
        renderControls();
        updatePhaseBanner();
        showReviewModal(true);
      } else {
        alert(result.message);
      }
    }
  }
  if (e.target.id === 'return-move-btn') {
    // Return to move phase
    game.phase = 'move';
    wallStart = null;
    wallEnd = null;
    renderBoard();
    renderControls();
    updatePhaseBanner();
  }
  if (e.target.id === 'skip-wall-btn') {
    game.handleTurn('skip');
    wallStart = null;
    wallEnd = null;
    renderBoard();
    renderControls();
    updatePhaseBanner();
    showReviewModal(true);
  }
};

document.getElementById('end-turn-btn').onclick = () => {
  game.handleTurn('end');
  wallStart = null;
  wallEnd = null;
  renderBoard();
  renderControls();
  updatePhaseBanner();
  showReviewModal(false);
};
document.getElementById('reset-turn-btn').onclick = () => {
  game.handleTurn('reset', { originalState: game.getState() });
  wallStart = null;
  wallEnd = null;
  renderBoard();
  renderControls();
  updatePhaseBanner();
  showReviewModal(false);
};

// --- Initial Render ---
renderBoard();
renderControls();
updatePhaseBanner();

function showReviewModal(show) {
  reviewModal.style.display = show ? 'flex' : 'none';
} 