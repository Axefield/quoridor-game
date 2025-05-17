import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Game3D from './game3d.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { AxesHelper } from 'three';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let zoomLevel = 40;
let targetZoom = zoomLevel;
const ZOOM_SPEED = 0.02;

// Camera mode logic
let cameraMode = 2; // 1: first-person, 2: isometric, 3: player side top-down, 4: full top-down
let cameraTargetPos = new THREE.Vector3();
let cameraTargetLook = new THREE.Vector3();

function getCameraTargetsForMode(mode) {
    // Board center
    const center = new THREE.Vector3(0, 0, 0);
    const boardHalf = (boardSize / 2) * cellSize;
    const player = game.turn === 'white' ? game.whitePos : game.blackPos;
    const playerCoords = getPawnCoords(player);
    // Platform height
    const platformY = 0.18;
    const pawnY = platformY + 0.7;
    const pawnX = (playerCoords.x - 8) * cellSize;
    const pawnZ = (playerCoords.z - 8) * cellSize;
    switch (mode) {
        case 1: // First person: right behind pawn, looking at goal row
            if (game.turn === 'white') {
                // White starts at row 16, goal is row 0 (negative Z)
                return {
                    pos: new THREE.Vector3(pawnX, pawnY, pawnZ + 1.5), // behind pawn
                    look: new THREE.Vector3(pawnX, platformY + 0.3, -(boardHalf)) // look at center of goal row
                };
            } else {
                // Black starts at row 0, goal is row 16 (positive Z)
                return {
                    pos: new THREE.Vector3(pawnX, pawnY, pawnZ - 1.5),
                    look: new THREE.Vector3(pawnX, platformY + 0.3, boardHalf)
                };
            }
        case 2: // Isometric: classic angle from corner
            return {
                pos: new THREE.Vector3(boardHalf * 1.1, boardSize, boardHalf * 1.1),
                look: center
            };
        case 3: // Player's side top-down
            if (game.turn === 'white') {
                // Above white's side, looking at center
                return {
                    pos: new THREE.Vector3(0, boardSize * 1.1, boardHalf + 2),
                    look: center
                };
            } else {
                // Above black's side, looking at center
                return {
                    pos: new THREE.Vector3(0, boardSize * 1.1, -boardHalf - 2),
                    look: center
                };
            }
        case 4: // Full top-down
            return {
                pos: new THREE.Vector3(0, boardSize * 1.3, 0),
                look: center
            };
        default:
            return {
                pos: new THREE.Vector3(boardHalf * 1.1, boardSize, boardHalf * 1.1),
                look: center
            };
    }
}

function updateCameraTargets() {
    const targets = getCameraTargetsForMode(cameraMode);
    cameraTargetPos.copy(targets.pos);
    cameraTargetLook.copy(targets.look);
}

function updateCameraPosition() {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const boardSize = 17;
    const padding = 2;
    const distance = Math.max(boardSize, boardSize / aspectRatio) + padding;
    
    // Only update zoomLevel if it hasn't been set yet
    if (zoomLevel === 40) {
        zoomLevel = distance;
        targetZoom = zoomLevel;
    }
    
    camera.position.set(0, zoomLevel, zoomLevel);
    camera.lookAt(0, 0, 0);
}

updateCameraPosition();

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = zoomLevel * 0.5;
controls.maxDistance = zoomLevel * 1.5;
controls.maxPolarAngle = Math.PI;

let userIsControllingCamera = false;
controls.addEventListener('start', () => { userIsControllingCamera = true; });
controls.addEventListener('end', () => {
    userIsControllingCamera = false;
    // After user finishes free look, set camera targets to current position/look
    cameraTargetPos.copy(camera.position);
    // Calculate lookAt point from camera direction
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    cameraTargetLook.copy(camera.position.clone().add(dir));
});

// Game board setup
const cellSize = 1;
const boardSize = 17;
const boardGeometry = new THREE.PlaneGeometry(boardSize, boardSize);
const boardMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.8,
    metalness: 0.2
});
const board = new THREE.Mesh(boardGeometry, boardMaterial);
board.rotation.x = -Math.PI / 2;
scene.add(board);

// Grid lines
const gridHelper = new THREE.GridHelper(boardSize, boardSize, 0x000000, 0x000000);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Game state
const game = new Game3D();
let wallStartPoint = null;
let lastAction = null;

// White Pawn Avatar (chibi, big pompadour, facial features, hands/feet)
const whitePawn = new THREE.Group();
// Head
const headGeo = new THREE.SphereGeometry(cellSize * 0.28, 16, 16);
const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0b0 });
const head = new THREE.Mesh(headGeo, skinMat);
head.position.set(0, cellSize * 0.8, 0);
whitePawn.add(head);
// Big Pompadour
const pompadourGeo = new THREE.SphereGeometry(cellSize * 0.28, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.7);
const pompadourMat = new THREE.MeshStandardMaterial({ color: 0xffe066 });
const pompadour = new THREE.Mesh(pompadourGeo, pompadourMat);
pompadour.position.set(0, cellSize * 1.05, cellSize * 0.18);
pompadour.scale.set(1.3, 1.1, 1.2);
pompadour.rotation.x = -Math.PI / 5;
whitePawn.add(pompadour);
// Sideburns
const burnGeo = new THREE.CylinderGeometry(cellSize * 0.045, cellSize * 0.06, cellSize * 0.13, 8);
const burnMat = new THREE.MeshStandardMaterial({ color: 0xffe066 });
const leftBurn = new THREE.Mesh(burnGeo, burnMat);
leftBurn.position.set(-cellSize * 0.17, cellSize * 0.74, cellSize * 0.13);
leftBurn.rotation.z = Math.PI / 2.2;
const rightBurn = new THREE.Mesh(burnGeo, burnMat);
rightBurn.position.set(cellSize * 0.17, cellSize * 0.74, cellSize * 0.13);
rightBurn.rotation.z = -Math.PI / 2.2;
whitePawn.add(leftBurn);
whitePawn.add(rightBurn);
// Back hair
const backHairGeo = new THREE.SphereGeometry(cellSize * 0.13, 12, 8, 0, Math.PI * 2, Math.PI * 0.7, Math.PI * 0.3);
const backHair = new THREE.Mesh(backHairGeo, pompadourMat);
backHair.position.set(0, cellSize * 0.7, -cellSize * 0.13);
whitePawn.add(backHair);
// Eyes
const eyeGeo = new THREE.SphereGeometry(cellSize * 0.035, 8, 8);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
leftEye.position.set(-cellSize * 0.08, cellSize * 0.85, cellSize * 0.23);
const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
rightEye.position.set(cellSize * 0.08, cellSize * 0.85, cellSize * 0.23);
whitePawn.add(leftEye);
whitePawn.add(rightEye);
// Smile
const smileGeo = new THREE.TorusGeometry(cellSize * 0.06, cellSize * 0.012, 8, 16, Math.PI);
const smileMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const smile = new THREE.Mesh(smileGeo, smileMat);
smile.position.set(0, cellSize * 0.78, cellSize * 0.23);
smile.rotation.x = Math.PI / 2;
whitePawn.add(smile);
// Body
const bodyGeo = new THREE.BoxGeometry(cellSize * 0.38, cellSize * 0.38, cellSize * 0.22);
const suitMat = new THREE.MeshStandardMaterial({ color: 0x2a4a7b });
const body = new THREE.Mesh(bodyGeo, suitMat);
body.position.set(0, cellSize * 0.55, 0);
whitePawn.add(body);
// Legs
const legGeo = new THREE.BoxGeometry(cellSize * 0.12, cellSize * 0.22, cellSize * 0.12);
const leftLeg = new THREE.Mesh(legGeo, suitMat);
leftLeg.position.set(-cellSize * 0.09, cellSize * 0.34, 0);
const rightLeg = new THREE.Mesh(legGeo, suitMat);
rightLeg.position.set(cellSize * 0.09, cellSize * 0.34, 0);
whitePawn.add(leftLeg);
whitePawn.add(rightLeg);
// Arms
const armGeo = new THREE.CylinderGeometry(cellSize * 0.05, cellSize * 0.05, cellSize * 0.28, 12);
const leftArm = new THREE.Mesh(armGeo, skinMat);
leftArm.position.set(-cellSize * 0.23, cellSize * 0.62, 0);
leftArm.rotation.z = Math.PI / 2.5;
const rightArm = new THREE.Mesh(armGeo, skinMat);
rightArm.position.set(cellSize * 0.23, cellSize * 0.62, 0);
rightArm.rotation.z = -Math.PI / 2.5;
whitePawn.add(leftArm);
whitePawn.add(rightArm);
// Hands
const handGeo = new THREE.SphereGeometry(cellSize * 0.055, 8, 8);
const leftHand = new THREE.Mesh(handGeo, skinMat);
leftHand.position.set(-cellSize * 0.32, cellSize * 0.62, 0);
const rightHand = new THREE.Mesh(handGeo, skinMat);
rightHand.position.set(cellSize * 0.32, cellSize * 0.62, 0);
whitePawn.add(leftHand);
whitePawn.add(rightHand);
// Feet
const footGeo = new THREE.SphereGeometry(cellSize * 0.055, 8, 8);
const leftFoot = new THREE.Mesh(footGeo, suitMat);
leftFoot.position.set(-cellSize * 0.09, cellSize * 0.23, 0);
const rightFoot = new THREE.Mesh(footGeo, suitMat);
rightFoot.position.set(cellSize * 0.09, cellSize * 0.23, 0);
whitePawn.add(leftFoot);
whitePawn.add(rightFoot);
// Tie
const tieGeo = new THREE.BoxGeometry(cellSize * 0.06, cellSize * 0.18, cellSize * 0.02);
const tieMat = new THREE.MeshStandardMaterial({ color: 0xc0392b });
const tie = new THREE.Mesh(tieGeo, tieMat);
tie.position.set(0, cellSize * 0.55, cellSize * 0.12);
whitePawn.add(tie);
scene.add(whitePawn);

// Black Pawn Avatar (sombrero, mustache, poncho, facial features)
const blackPawn = new THREE.Group();
// Head
const bHead = new THREE.Mesh(headGeo, skinMat);
bHead.position.set(0, cellSize * 0.8, 0);
blackPawn.add(bHead);
// Eyes
const bLeftEye = new THREE.Mesh(eyeGeo, eyeMat);
bLeftEye.position.set(-cellSize * 0.08, cellSize * 0.85, cellSize * 0.23);
const bRightEye = new THREE.Mesh(eyeGeo, eyeMat);
bRightEye.position.set(cellSize * 0.08, cellSize * 0.85, cellSize * 0.23);
blackPawn.add(bLeftEye);
blackPawn.add(bRightEye);
// Smile
const bSmile = new THREE.Mesh(smileGeo, smileMat);
bSmile.position.set(0, cellSize * 0.78, cellSize * 0.23);
bSmile.rotation.x = Math.PI / 2;
blackPawn.add(bSmile);
// Mustache
const mustacheGeo = new THREE.TorusGeometry(cellSize * 0.07, cellSize * 0.012, 8, 16, Math.PI);
const mustacheMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const mustache = new THREE.Mesh(mustacheGeo, mustacheMat);
mustache.position.set(0, cellSize * 0.81, cellSize * 0.23);
mustache.rotation.x = Math.PI / 2;
blackPawn.add(mustache);
// Body (black)
const bBodyGeo = new THREE.BoxGeometry(cellSize * 0.38, cellSize * 0.38, cellSize * 0.22);
const bBodyMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const bBody = new THREE.Mesh(bBodyGeo, bBodyMat);
bBody.position.set(0, cellSize * 0.55, 0);
blackPawn.add(bBody);
// Poncho (red, green, white stripes)
const ponchoGeo = new THREE.ConeGeometry(cellSize * 0.28, cellSize * 0.22, 4, 1, true);
const ponchoMat = new THREE.MeshStandardMaterial({ color: 0xc0392b });
const poncho = new THREE.Mesh(ponchoGeo, ponchoMat);
poncho.position.set(0, cellSize * 0.62, 0);
poncho.rotation.y = Math.PI / 4;
blackPawn.add(poncho);
// Neckerchief
const neckGeo = new THREE.TorusGeometry(cellSize * 0.09, cellSize * 0.012, 8, 16);
const neckMat = new THREE.MeshStandardMaterial({ color: 0x43a047 });
const neck = new THREE.Mesh(neckGeo, neckMat);
neck.position.set(0, cellSize * 0.68, 0);
neck.rotation.x = Math.PI / 2;
blackPawn.add(neck);
// Legs
const bLeftLeg = new THREE.Mesh(legGeo, bBodyMat);
bLeftLeg.position.set(-cellSize * 0.09, cellSize * 0.34, 0);
const bRightLeg = new THREE.Mesh(legGeo, bBodyMat);
bRightLeg.position.set(cellSize * 0.09, cellSize * 0.34, 0);
blackPawn.add(bLeftLeg);
blackPawn.add(bRightLeg);
// Arms
const bLeftArm = new THREE.Mesh(armGeo, skinMat);
bLeftArm.position.set(-cellSize * 0.23, cellSize * 0.62, 0);
bLeftArm.rotation.z = Math.PI / 2.5;
const bRightArm = new THREE.Mesh(armGeo, skinMat);
bRightArm.position.set(cellSize * 0.23, cellSize * 0.62, 0);
bRightArm.rotation.z = -Math.PI / 2.5;
blackPawn.add(bLeftArm);
blackPawn.add(bRightArm);
// Hands
const bLeftHand = new THREE.Mesh(handGeo, skinMat);
bLeftHand.position.set(-cellSize * 0.32, cellSize * 0.62, 0);
const bRightHand = new THREE.Mesh(handGeo, skinMat);
bRightHand.position.set(cellSize * 0.32, cellSize * 0.62, 0);
blackPawn.add(bLeftHand);
blackPawn.add(bRightHand);
// Feet
const bLeftFoot = new THREE.Mesh(footGeo, bBodyMat);
bLeftFoot.position.set(-cellSize * 0.09, cellSize * 0.23, 0);
const bRightFoot = new THREE.Mesh(footGeo, bBodyMat);
bRightFoot.position.set(cellSize * 0.09, cellSize * 0.23, 0);
blackPawn.add(bLeftFoot);
blackPawn.add(bRightFoot);
// Sombrero (brim)
const brimGeo = new THREE.CylinderGeometry(cellSize * 0.32, cellSize * 0.32, cellSize * 0.06, 24);
const brimMat = new THREE.MeshStandardMaterial({ color: 0xf4d06f });
const brim = new THREE.Mesh(brimGeo, brimMat);
brim.position.set(0, cellSize * 0.97, 0);
blackPawn.add(brim);
// Sombrero (top)
const topGeo = new THREE.CylinderGeometry(cellSize * 0.13, cellSize * 0.13, cellSize * 0.18, 16);
const topMat = new THREE.MeshStandardMaterial({ color: 0xf4d06f });
const top = new THREE.Mesh(topGeo, topMat);
top.position.set(0, cellSize * 1.07, 0);
blackPawn.add(top);
scene.add(blackPawn);

// --- Wall and Pawn Height Setup ---
const pawnHeight = cellSize * 1.3;
const wallHeight = pawnHeight * 1.3;

// Wall material setup
let wallMaterial;
const textureLoader = new THREE.TextureLoader();
textureLoader.load('textures/fence_mat_diffuse.png', (texture) => {
    wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        map: texture,
        roughness: 0.85,
        metalness: 0.1
    });
}, undefined, () => {
    // On error, fallback to solid grey
    wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.85, metalness: 0.1 });
});
if (!wallMaterial) {
    wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.85, metalness: 0.1 });
}

// Walls
const walls = new THREE.Group();
scene.add(walls);

// Highlight groups
const moveHighlights = new THREE.Group();
const wallHighlights = new THREE.Group();
let wallPreview = null;
scene.add(moveHighlights);
scene.add(wallHighlights);

// Board rendering groups
const boardTiles = new THREE.Group();
const pathRects = new THREE.Group();
const gridLabels = new THREE.Group();
const boardBase = new THREE.Group();
scene.add(boardBase);
scene.add(boardTiles);
scene.add(pathRects);
scene.add(gridLabels);

const cementColor = 0xbbb7b2;
const bridgeColor = 0x8ea6b4;
const cementWallColor = 0x888888;
const baseColor = 0x222222;
const platformY = 0.35;
const bridgeY = platformY + 0.09;
const wallY = bridgeY + 0.13;
const baseHeight = 0.5;
const baseY = -0.3;

// --- FBXLoader for Wall Mesh ---
let wallFBXMesh = null;
const fbxLoader = new FBXLoader();
fbxLoader.load('source/fence.fbx', (fbx) => {
    console.log('FBX loaded successfully:', fbx);
    
    // Find the first mesh in the FBX scene
    fbx.traverse(child => {
        if (child.isMesh) {
            console.log('Mesh found:', child.name, child.geometry);
            if (!wallFBXMesh && child.geometry && child.geometry.attributes.position && child.geometry.attributes.position.count > 0) {
                wallFBXMesh = child;
                console.log('Found mesh:', wallFBXMesh);
                
                // Center the mesh
                const bbox = new THREE.Box3().setFromObject(wallFBXMesh);
                const center = bbox.getCenter(new THREE.Vector3());
                wallFBXMesh.position.sub(center);
                
                // Reset transformations
                wallFBXMesh.scale.set(1, 1, 1);
                wallFBXMesh.rotation.set(0, 0, 0);
                
                // Update matrices
                wallFBXMesh.updateMatrix();
                wallFBXMesh.updateMatrixWorld(true);
                
                // Log geometry details
                if (wallFBXMesh.geometry) {
                    console.log('Geometry attributes:', wallFBXMesh.geometry.attributes);
                    console.log('Geometry vertices:', wallFBXMesh.geometry.attributes.position?.count || 0);
                }
                
                // Compute and log bounding box
                const size = bbox.getSize(new THREE.Vector3());
                console.log('Wall FBX bounding box size:', size);
            }
        }
    });
}, 
// Progress callback
(xhr) => {
    console.log('Loading progress:', (xhr.loaded / xhr.total * 100) + '%');
},
// Error callback
(err) => {
    console.error('Failed to load fence.fbx:', err);
    wallFBXMesh = null;
});

// --- Wall mesh positioning helper ---
function getWallMeshPosition(row, col) {
    return {
        x: (col - 8) * cellSize,
        y: wallHeight / 2,
        z: (row - 8) * cellSize
    };
}

function renderBoard() {
    // Clear previous
    while (boardTiles.children.length > 0) boardTiles.remove(boardTiles.children[0]);
    while (pathRects.children.length > 0) pathRects.remove(pathRects.children[0]);
    while (gridLabels.children.length > 0) gridLabels.remove(gridLabels.children[0]);
    while (boardBase.children.length > 0) boardBase.remove(boardBase.children[0]);

    // Board base
    const baseGeo = new THREE.BoxGeometry(boardSize + 2, 0.5, boardSize + 2);
    const baseMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.7 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, baseY, 0);
    boardBase.add(baseMesh);

    // Grid labels (A-I, 1-9)
    const labelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const loader = new THREE.TextureLoader();
    const fontSize = 0.25;
    for (let i = 0; i < 9; i++) {
        // Letters (A-I) along X axis
        const letter = String.fromCharCode(65 + i);
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, 32, 32);
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        const geo = new THREE.PlaneGeometry(fontSize, fontSize);
        // Bottom
        const meshB = new THREE.Mesh(geo, mat);
        meshB.position.set((i * 2 - 8) * cellSize, baseY + baseHeight / 2 + 0.01, (boardSize / 2) * cellSize + 0.7);
        meshB.rotation.x = -Math.PI / 2;
        gridLabels.add(meshB);
        // Top
        const meshT = new THREE.Mesh(geo, mat);
        meshT.position.set((i * 2 - 8) * cellSize, baseY + baseHeight / 2 + 0.01, -(boardSize / 2) * cellSize - 0.7);
        meshT.rotation.x = -Math.PI / 2;
        gridLabels.add(meshT);
        // Numbers (1-9) along Z axis
        const numCanvas = document.createElement('canvas');
        numCanvas.width = 64; numCanvas.height = 64;
        const numCtx = numCanvas.getContext('2d');
        numCtx.fillStyle = '#fff';
        numCtx.font = 'bold 48px Arial';
        numCtx.textAlign = 'center';
        numCtx.textBaseline = 'middle';
        numCtx.fillText((i + 1).toString(), 32, 32);
        const numTex = new THREE.CanvasTexture(numCanvas);
        const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true });
        const numGeo = new THREE.PlaneGeometry(fontSize, fontSize);
        // Left
        const meshL = new THREE.Mesh(numGeo, numMat);
        meshL.position.set(-(boardSize / 2) * cellSize - 0.7, baseY + baseHeight / 2 + 0.01, (i * 2 - 8) * cellSize);
        meshL.rotation.x = -Math.PI / 2;
        gridLabels.add(meshL);
        // Right
        const meshR = new THREE.Mesh(numGeo, numMat);
        meshR.position.set((boardSize / 2) * cellSize + 0.7, baseY + baseHeight / 2 + 0.01, (i * 2 - 8) * cellSize);
        meshR.rotation.x = -Math.PI / 2;
        gridLabels.add(meshR);
    }

    // Cement cubes and bridges
    for (let row = 0; row < 17; row++) {
        for (let col = 0; col < 17; col++) {
            const cell = game.board[row][col];
            let mesh = null;
            if (cell.type === 'space') {
                // Cement cube
                const geo = new THREE.BoxGeometry(cellSize * 0.95, platformY, cellSize * 0.95);
                const mat = new THREE.MeshStandardMaterial({ color: cementColor, roughness: 0.95 });
                mesh = new THREE.Mesh(geo, mat);
                mesh.position.set((col - 8) * cellSize, platformY / 2, (row - 8) * cellSize);
                boardTiles.add(mesh);
                // Metal bridge platform (rotated 90 degrees)
                const bridgeGeo = new THREE.BoxGeometry(cellSize * 0.7, 0.13, cellSize * 0.7);
                const bridgeMat = new THREE.MeshStandardMaterial({ color: bridgeColor, metalness: 0.7, roughness: 0.3 });
                const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
                bridge.position.set((col - 8) * cellSize, bridgeY, (row - 8) * cellSize);
                bridge.rotation.y = Math.PI / 2;
                boardTiles.add(bridge);
                // Draw possible paths to adjacent platforms
                const adj = [
                    [row + 2, col],
                    [row - 2, col],
                    [row, col + 2],
                    [row, col - 2]
                ];
                adj.forEach(([r2, c2]) => {
                    if (r2 >= 0 && r2 < 17 && c2 >= 0 && c2 < 17 && game.board[r2][c2].type === 'space') {
                        if (game.isValidMove([row, col], [r2, c2])) {
                            // Draw a path rectangle between (row,col) and (r2,c2)
                            const midX = ((col + c2) / 2 - 8) * cellSize;
                            const midZ = ((row + r2) / 2 - 8) * cellSize;
                            const isVertical = row !== r2;
                            const geo = isVertical
                                ? new THREE.BoxGeometry(cellSize * 0.25, 0.04, cellSize * 2)
                                : new THREE.BoxGeometry(cellSize * 2, 0.04, cellSize * 0.25);
                            const mat = new THREE.MeshBasicMaterial({ color: 0x4a90e2, opacity: 0.18, transparent: true });
                            const pathMesh = new THREE.Mesh(geo, mat);
                            pathMesh.position.set(midX, bridgeY + 0.07, midZ);
                            pathRects.add(pathMesh);
                        }
                    }
                });
            } else if (cell.type === 'v-slot') {
                // Vertical corridor: rotated 90 degrees
                const geo = new THREE.BoxGeometry(cellSize * 0.95, 0.13, cellSize * 0.2);
                const mat = new THREE.MeshStandardMaterial({ color: bridgeColor, metalness: 0.7, roughness: 0.3 });
                mesh = new THREE.Mesh(geo, mat);
                mesh.position.set((col - 8) * cellSize, bridgeY, (row - 8) * cellSize);
                mesh.rotation.y = Math.PI / 2;
                boardTiles.add(mesh);
            } else if (cell.type === 'h-slot') {
                // Horizontal corridor: rotated 90 degrees
                const geo = new THREE.BoxGeometry(cellSize * 0.2, 0.13, cellSize * 0.95);
                const mat = new THREE.MeshStandardMaterial({ color: bridgeColor, metalness: 0.7, roughness: 0.3 });
                mesh = new THREE.Mesh(geo, mat);
                mesh.position.set((col - 8) * cellSize, bridgeY, (row - 8) * cellSize);
                mesh.rotation.y = Math.PI / 2;
                boardTiles.add(mesh);
            } else if (cell.type === null) {
                // Intersection: small dot
                const geo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12);
                const mat = new THREE.MeshStandardMaterial({ color: 0x333333 });
                mesh = new THREE.Mesh(geo, mat);
                mesh.position.set((col - 8) * cellSize, bridgeY + 0.07, (row - 8) * cellSize);
                boardTiles.add(mesh);
            }
        }
    }
}

function getPawnCoords(pos) {
    // Support both [row, col] and {x, z}
    if (Array.isArray(pos)) {
        return { x: pos[1], z: pos[0] };
    }
    return { x: pos.x, z: pos.z };
}

// Pawn animation state
let whitePawnAnim = { from: null, to: null, t: 1 };
let blackPawnAnim = { from: null, to: null, t: 1 };
const PAWN_ANIM_DURATION = 0.3; // seconds
let lastUpdateTime = performance.now();

function getPlatformY() {
    // Platform height is 0.09 (see renderBoard)
    return 0.09;
}

function setPawnPosition(pawn, coords) {
    const avatarFootY = 0.34; // matches leg position
    pawn.position.set(
        (coords.x - 8) * cellSize,
        getPlatformY() + avatarFootY,
        (coords.z - 8) * cellSize
    );
}

function updatePawnPositions() {
    // If animating, interpolate
    if (whitePawnAnim.t < 1 && whitePawnAnim.isHop) {
        const t = whitePawnAnim.t;
        const from = whitePawnAnim.from, to = whitePawnAnim.to;
        // Parabolic arc for Y
        const arcY = Math.sin(Math.PI * t) * 0.5;
        whitePawn.position.set(
            from.x * (1 - t) + to.x * t,
            from.y * (1 - t) + to.y * t + arcY,
            from.z * (1 - t) + to.z * t
        );
    } else if (whitePawnAnim.t < 1) {
        setPawnPosition(whitePawn, getPawnCoords(game.whitePos));
    } else {
        setPawnPosition(whitePawn, getPawnCoords(game.whitePos));
    }
    if (blackPawnAnim.t < 1 && blackPawnAnim.isHop) {
        const t = blackPawnAnim.t;
        const from = blackPawnAnim.from, to = blackPawnAnim.to;
        const arcY = Math.sin(Math.PI * t) * 0.5;
        blackPawn.position.set(
            from.x * (1 - t) + to.x * t,
            from.y * (1 - t) + to.y * t + arcY,
            from.z * (1 - t) + to.z * t
        );
    } else if (blackPawnAnim.t < 1) {
        setPawnPosition(blackPawn, getPawnCoords(game.blackPos));
    } else {
        setPawnPosition(blackPawn, getPawnCoords(game.blackPos));
    }
}

function setPawnFacing(pawn, from, to) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    if (dx === 0 && dz === 0) return;
    pawn.rotation.y = Math.atan2(dx, dz);
}

function animatePawnMove(pawnAnim, fromPos, toPos, pawnGroup) {
    pawnAnim.from = { ...fromPos };
    pawnAnim.to = { ...toPos };
    pawnAnim.t = 0;
    setPawnFacing(pawnGroup, fromPos, toPos);
}

function updateWalls() {
    while (walls.children.length > 0) {
        walls.remove(walls.children[0]);
    }
    const wallList = game.getWalls();
    wallList.forEach(wall => {
        let mesh;
        if (wallFBXMesh) {
            mesh = wallFBXMesh.clone();
            const bbox = new THREE.Box3().setFromObject(mesh);
            const size = bbox.getSize(new THREE.Vector3());
            const targetLength = cellSize * 2;
            const targetHeight = wallHeight;
            const targetThickness = cellSize * 0.2;
            let scaleX, scaleY, scaleZ;
            if (wall.orientation === 'v') {
                // Vertical wall: rotate 90° around Y, length along Z
                scaleX = targetThickness / size.x;
                scaleY = targetHeight / size.y;
                scaleZ = targetLength / size.z;
                mesh.rotation.set(0, Math.PI / 2, 0);
            } else {
                // Horizontal wall: no rotation, length along X
                scaleX = targetLength / size.x;
                scaleY = targetHeight / size.y;
                scaleZ = targetThickness / size.z;
                mesh.rotation.set(0, 0, 0);
            }
            mesh.scale.set(scaleX, scaleY, scaleZ);
            mesh.material = mesh.material.clone();
        } else {
            const geometry = wall.orientation === 'v' 
                ? new THREE.BoxGeometry(cellSize * 0.2, wallHeight, cellSize * 2)
                : new THREE.BoxGeometry(cellSize * 2, wallHeight, cellSize * 0.2);
            mesh = new THREE.Mesh(geometry, wallMaterial);
        }
        const pos = getWallMeshPosition(wall.z, wall.x);
        mesh.position.set(pos.x, pos.y, pos.z);
        walls.add(mesh);
    });
}

function setGameMessage(msg) {
    document.getElementById('game-message').textContent = msg || '';
}

function updateWallCounts() {
    const wallCounts = document.getElementById('wall-counts');
    let whiteBars = '';
    let blackBars = '';
    for (let i = 0; i < (game.whiteWalls || 0); i++) whiteBars += '<span class="wall-bar white" style="width:16px"></span>';
    for (let i = 0; i < (game.blackWalls || 0); i++) blackBars += '<span class="wall-bar black" style="width:16px"></span>';
    wallCounts.innerHTML = `
        <span>White: ${whiteBars}</span>
        <span>Black: ${blackBars}</span>
    `;
}

function updateUI() {
    const gameStatus = document.getElementById('game-status');
    const controlsDiv = document.getElementById('controls');
    let statusText = `Current Turn: ${game.turn.toUpperCase()}`;
    statusText += ` | Phase: ${game.phase.toUpperCase()}`;
    statusText += ` | Walls Remaining - White: ${game.whiteWalls}, Black: ${game.blackWalls}`;
    if (game.whiteWon) {
        statusText = 'WHITE WINS!';
    } else if (game.blackWon) {
        statusText = 'BLACK WINS!';
    }
    if (lastAction) {
        statusText += ` | Last Action: ${lastAction}`;
    }
    gameStatus.textContent = statusText;
    let buttons = '<button onclick="resetGame()">Reset Game</button>';
    buttons += '<button onclick="resetCamera()">Reset Camera</button>';
    switch (game.phase) {
        case 'move':
            buttons += '<button onclick="endMovePhase()">End Move</button>';
            break;
        case 'wall':
            buttons += '<button onclick="skipWall()">Skip Wall</button>';
            break;
        case 'review':
            buttons += '<button onclick="endTurn()">End Turn</button>';
            break;
    }
    controlsDiv.innerHTML = buttons;
}

function updateMoveHighlights() {
    // Remove old highlights
    while (moveHighlights.children.length > 0) moveHighlights.remove(moveHighlights.children[0]);
    if (game.phase !== 'move') return;
    const current = game.turn === 'white' ? game.whitePos : game.blackPos;
    const moves = game.getValidMoves(current);
    // Store valid move positions for hover detection
    window._quoridorValidMoveMeshes = [];
    moves.forEach(([row, col]) => {
        const highlightGeo = new THREE.PlaneGeometry(cellSize * 0.95, cellSize * 0.95);
        const highlightMat = new THREE.MeshBasicMaterial({ color: 0x2ecc40, opacity: 0.35, transparent: true }); // green
        const mesh = new THREE.Mesh(highlightGeo, highlightMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set((col - 8) * cellSize, 0.03, (row - 8) * cellSize);
        mesh.userData = { row, col, isValidMove: true };
        moveHighlights.add(mesh);
        window._quoridorValidMoveMeshes.push(mesh);
    });
}

// Track the active wall preview slot
let activeWallPreview = null;

// Update mouse click handler for wall placement
window.addEventListener('click', (event) => {
    if (game.phase !== 'wall' || !wallFBXMesh) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(wallHighlights.children);
    if (intersects.length > 0) {
        const hovered = intersects[0].object;
        const { row, col } = hovered.userData;
        if (!activeWallPreview || activeWallPreview.row !== row || activeWallPreview.col !== col) {
            // Set new preview
            activeWallPreview = { row, col };
            showWallPreview(row, col, true);
        } else {
            // Place wall at this slot
            const wallResult = game.handleTurn('wall', { row, col });
            if (wallResult.success) {
                activeWallPreview = null;
                removeWallPreview();
                updateGameState(wallResult.message);
            } else {
                // Show invalid preview (red)
                showWallPreview(row, col, false);
                setGameMessage(wallResult.message);
            }
        }
    } else {
        // Clicked outside: cancel preview
        activeWallPreview = null;
        removeWallPreview();
    }
});

// Update ESC key handler to also reset active preview
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        activeWallPreview = null;
        removeWallPreview();
    }
});

// Update mousemove handler to only show preview if no active preview
window.addEventListener('mousemove', (event) => {
    if (game.phase !== 'wall' || !wallFBXMesh) return;
    if (activeWallPreview) return; // Don't update preview if one is active
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(wallHighlights.children);
    if (intersects.length > 0) {
        const hovered = intersects[0].object;
        showWallPreview(hovered.userData.row, hovered.userData.col, true);
    } else {
        removeWallPreview();
    }
});

function updateWallHighlights() {
    while (wallHighlights.children.length > 0) wallHighlights.remove(wallHighlights.children[0]);
    if (game.phase !== 'wall' || !wallFBXMesh) return;
    for (let row = 0; row < 17; row++) {
        for (let col = 0; col < 17; col++) {
            const orientation = game.determineWallOrientation(row, col);
            if (!orientation) continue;
            if (!game.isValidWallPlacement(row, col)) continue;
            const mesh = wallFBXMesh.clone();
            const bbox = new THREE.Box3().setFromObject(mesh);
            const size = bbox.getSize(new THREE.Vector3());
            const targetLength = cellSize * 2;
            const targetHeight = wallHeight;
            const targetThickness = cellSize * 0.2;
            let scaleX, scaleY, scaleZ;
            if (orientation === 'v') {
                // Vertical wall: rotate 90° around Y, length along Z
                scaleX = targetThickness / size.x;
                scaleY = targetHeight / size.y;
                scaleZ = targetLength / size.z;
                mesh.rotation.set(0, Math.PI / 2, 0);
            } else {
                // Horizontal wall: no rotation, length along X
                scaleX = targetLength / size.x;
                scaleY = targetHeight / size.y;
                scaleZ = targetThickness / size.z;
                mesh.rotation.set(0, 0, 0);
            }
            mesh.scale.set(scaleX, scaleY, scaleZ);
            mesh.material = mesh.material.clone();
            mesh.material.color.set(0x4a90e2);
            mesh.material.opacity = 0.25;
            mesh.material.transparent = true;
            const pos = getWallMeshPosition(row, col);
            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.userData = { row, col, orientation, isWallHighlight: true };
            wallHighlights.add(mesh);
        }
    }
}

function showWallPreview(row, col, isValid = true) {
    removeWallPreview();
    const orientation = game.determineWallOrientation(row, col);
    if (!orientation) return;
    let mesh;
    if (wallFBXMesh) {
        mesh = wallFBXMesh.clone();
        const bbox = new THREE.Box3().setFromObject(mesh);
        const size = bbox.getSize(new THREE.Vector3());
        const targetLength = cellSize * 2;
        const targetHeight = wallHeight;
        const targetThickness = cellSize * 0.2;
        let scaleX, scaleY, scaleZ;
        if (orientation === 'v') {
            // Vertical wall: rotate 90° around Y, length along Z
            scaleX = targetThickness / size.x;
            scaleY = targetHeight / size.y;
            scaleZ = targetLength / size.z;
            mesh.rotation.set(0, Math.PI / 2, 0);
        } else {
            // Horizontal wall: no rotation, length along X
            scaleX = targetLength / size.x;
            scaleY = targetHeight / size.y;
            scaleZ = targetThickness / size.z;
            mesh.rotation.set(0, 0, 0);
        }
        mesh.scale.set(scaleX, scaleY, scaleZ);
        mesh.material = mesh.material.clone();
        if (isValid) {
            mesh.material.color.set(0x00ff66);
            mesh.material.opacity = 0.45;
        } else {
            mesh.material.color.set(0xff3333);
            mesh.material.opacity = 0.45;
        }
        mesh.material.transparent = true;
    } else {
        const geometry = orientation === 'v'
            ? new THREE.BoxGeometry(cellSize * 0.2, wallHeight, cellSize * 2)
            : new THREE.BoxGeometry(cellSize * 2, wallHeight, cellSize * 0.2);
        const mat = wallMaterial.clone();
        mat.color.set(isValid ? 0x00ff66 : 0xff3333);
        mat.opacity = 0.45;
        mat.transparent = true;
        mesh = new THREE.Mesh(geometry, mat);
    }
    const pos = getWallMeshPosition(row, col);
    mesh.position.set(pos.x, pos.y, pos.z);
    wallPreview = mesh;
    scene.add(wallPreview);
}

function removeWallPreview() {
    if (wallPreview) {
        scene.remove(wallPreview);
        wallPreview = null;
    }
}

// --- Move Phase: Freely Hop Between Available Moves ---
let movePhaseActive = false;

function startMovePhase() {
    movePhaseActive = true;
    updateMoveHighlights();
}

function endMovePhase() {
    movePhaseActive = false;
    // Advance to next phase (handled by confirm/end button)
    game.phase = 'wall';
    updateGameState();
}


function updateGameState(message) {
    renderBoard();
    updatePawnPositions();
    updateWalls();
    updateUI();
    updateWallCounts();
    setGameMessage(message || '');
    updateMoveHighlights();
    updateWallHighlights();
    removeWallPreview();
    if (game.phase === 'move') {
        startMovePhase();
    } else {
        movePhaseActive = false;
    }
}

// Initial render
renderBoard();

function resetGame() {
    game.reset();
    wallStartPoint = null;
    lastAction = null;
    updateGameState('');
}

function skipMove() {
    const result = game.handleTurn('skip');
    if (result.success) {
        lastAction = result.message;
        updateGameState(result.message);
    } else {
        setGameMessage(result.message);
    }
}

function skipWall() {
    const result = game.handleTurn('skip');
    if (result.success) {
        lastAction = result.message;
        updateGameState(result.message);
    } else {
        setGameMessage(result.message);
    }
}

function endTurn() {
    const result = game.handleTurn('end');
    if (result.success) {
        lastAction = result.message;
        updateGameState(result.message);
    } else {
        setGameMessage(result.message);
    }
}

function resetCamera() {
    cameraMode = 2;
    updateCameraTargets();
    userIsControllingCamera = false;
}

// Raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    if (game.whiteWon || game.blackWon) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(board);
    if (intersects.length > 0) {
        const point = intersects[0].point;
        const col = Math.round(point.x / cellSize + 8);
        const row = Math.round(point.z / cellSize + 8);
        switch (game.phase) {
            case 'move': {
                const current = game.turn === 'white' ? game.whitePos : game.blackPos;
                const currentCoords = getPawnCoords(current);
                const result = game.handleTurn('move', { destination: [row, col] });
                if (result.success) {
                    const newCoords = getPawnCoords(game.turn === 'white' ? game.blackPos : game.whitePos);
                    if (game.turn === 'black') {
                        animatePawnMove(whitePawnAnim, currentCoords, newCoords, whitePawn);
                    } else {
                        animatePawnMove(blackPawnAnim, currentCoords, newCoords, blackPawn);
                    }
                    lastAction = result.message;
                    // updateGameState will be called after animation completes
                } else {
                    setGameMessage(result.message);
                }
                break;
            }
            case 'wall':
                if (!wallStartPoint) {
                    wallStartPoint = { row, col };
                } else {
                    const wallResult = game.handleTurn('wall', { 
                        row: wallStartPoint.row, col: wallStartPoint.col
                    });
                    if (wallResult.success) {
                        lastAction = wallResult.message;
                        updateGameState(wallResult.message);
                    } else {
                        setGameMessage(wallResult.message);
                    }
                    wallStartPoint = null;
                }
                break;
        }
    }
}

// Keyboard controls
window.addEventListener('keydown', (event) => {
    if (game.whiteWon || game.blackWon) return;
    
    // Camera modes (already handled)
    if (['1', '2', '3', '4'].includes(event.key)) {
        cameraMode = parseInt(event.key);
        updateCameraTargets();
        userIsControllingCamera = false;
        return;
    }
    // Game system controls
    if (game.phase === 'move') {
        let dir = null;
        switch (event.key.toLowerCase()) {
            case 'arrowup': case 'w': dir = [2, 0]; break;    // up
            case 'arrowdown': case 's': dir = [-2, 0]; break; // down
            case 'arrowleft': case 'a': dir = [0, -2]; break; // left
            case 'arrowright': case 'd': dir = [0, 2]; break; // right
        }
        if (dir) {
            const current = game.turn === 'white' ? game.whitePos : game.blackPos;
            const validMoves = game.getValidMoves(current);
            const dest = [current[0] + dir[0], current[1] + dir[1]];
            // Only move if dest is in validMoves
            if (validMoves.some(([r, c]) => r === dest[0] && c === dest[1])) {
                const currentCoords = getPawnCoords(current);
                const result = game.handleTurn('move', { destination: dest });
                if (result.success) {
                    const newCoords = getPawnCoords(game.turn === 'white' ? game.blackPos : game.whitePos);
                    if (game.turn === 'black') {
                        animatePawnMove(whitePawnAnim, currentCoords, newCoords, whitePawn);
                    } else {
                        animatePawnMove(blackPawnAnim, currentCoords, newCoords, blackPawn);
                    }
                    lastAction = result.message;
                    // updateGameState will be called after animation completes
                } else {
                    setGameMessage(result.message);
                }
            }
        }
    }
    // ... rest of key handling ...
});

// Event listeners
window.addEventListener('click', onMouseClick);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Don't call updateCameraPosition here as it resets zoom
});

let zoomTarget = null;
let minZoom = 8;
let maxZoom = 40;

// window.addEventListener('wheel', (event) => {
//     event.preventDefault();
//     // Calculate zoom direction (positive = zoom out, negative = zoom in)
//     const delta = Math.sign(event.deltaY);
//     // Get camera direction
//     const dir = new THREE.Vector3();
//     camera.getWorldDirection(dir);
//     // Move camera along its direction
//     if (!zoomTarget) zoomTarget = camera.position.clone();
//     const zoomStep = 2.0;
//     zoomTarget.addScaledVector(dir, delta * zoomStep);
//     // Clamp distance from board center
//     const dist = zoomTarget.length();
//     if (dist < minZoom) zoomTarget.setLength(minZoom);
//     if (dist > maxZoom) zoomTarget.setLength(maxZoom);
// }, { passive: false });

// Animation loop with pawn walk animation and smooth zoom
function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = (now - lastUpdateTime) / 1000;
    lastUpdateTime = now;
    let animating = false;
    if (whitePawnAnim.t < 1) {
        whitePawnAnim.t += dt / PAWN_ANIM_DURATION;
        if (whitePawnAnim.t >= 1) {
            whitePawnAnim.t = 1;
            updateGameState(); // update highlights/UI after move
        }
        animating = true;
    }
    if (blackPawnAnim.t < 1) {
        blackPawnAnim.t += dt / PAWN_ANIM_DURATION;
        if (blackPawnAnim.t >= 1) {
            blackPawnAnim.t = 1;
            updateGameState();
        }
        animating = true;
    }
    updatePawnPositions();
    // Only animate camera if user is not controlling and a mode was selected
    if (!userIsControllingCamera && (zoomTarget || ['1','2','3','4'].includes(String(cameraMode)))) {
        camera.position.lerp(cameraTargetPos, 0.08);
        if (zoomTarget) {
            camera.position.lerp(zoomTarget, 0.15);
            if (camera.position.distanceTo(zoomTarget) < 0.1) zoomTarget = null;
        }
        const currentLook = new THREE.Vector3();
        camera.getWorldDirection(currentLook);
        currentLook.add(camera.position);
        cameraTargetLook.y = Math.max(cameraTargetLook.y, 0); // don't look below board
        const lerpedLook = camera.getWorldDirection(new THREE.Vector3()).lerp(
            cameraTargetLook.clone().sub(camera.position), 0.08
        ).add(camera.position);
        camera.lookAt(lerpedLook);
    }
    controls.update();
    renderer.render(scene, camera);
}

// Initial setup
resetGame();
updateCameraTargets();
animate();
// At the end of the file, add:
window.skipWall = skipWall;
window.skipMove = skipMove;
window.resetGame = resetGame;
window.endTurn = endTurn;
window.resetCamera = resetCamera;


// Modify updateGameState to start move phase if appropriate
const originalUpdateGameState = updateGameState;
updateGameState = function(message) {
    originalUpdateGameState(message);
    if (game.phase === 'move') {
        startMovePhase();
    } else {
        movePhaseActive = false;
    }
};
