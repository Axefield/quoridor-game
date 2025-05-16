# Quoridor 3D: Real-Time Arena Design Doc

## Overview
Quoridor 3D Arena is a real-time, action-strategy reimagining of the classic Quoridor board game. Players control pawns on a 3D grid, dashing between cells and "shooting" walls to block or trap their opponent. The game is rendered in 3D using [three.js](https://threejs.org/), with fast-paced movement, wall placement, and tactical play.

---

## Core Concepts
- **3D Grid Arena:** The board is a 3D grid (e.g., 9x9x1 or 9x9x3 for multi-layered play).
- **Pawns:** Each player controls a pawn that can dash to adjacent cells.
- **Walls:** Players can "shoot" (place) walls in real time to block paths. Walls appear as 3D blocks between cells.
- **Real-Time Play:** Both players can move and place walls simultaneously, with possible cooldowns or limits.
- **Objective:** Reach the opponent's starting edge before they reach yours, or trap them so they cannot move.

---

## Game Rules & Mechanics
- **Movement:**
  - Players move their pawn by dashing to adjacent grid cells (orthogonally or with special moves).
  - Movement is restricted by walls and the grid boundaries.
- **Wall Shooting:**
  - Players can place a wall between two cells by aiming and "shooting" it.
  - Each player has a limited number of walls (e.g., 10).
  - Walls cannot fully block all paths to the goal (pathfinding check required).
  - Wall placement may have a cooldown or energy cost in real-time mode.
- **Win Condition:**
  - First player to reach the opposite edge wins.
  - Optionally, a player wins if the opponent is completely blocked.
- **Game Modes:**
  - Real-time (default): Both players act simultaneously.
  - Turn-based (optional): Classic Quoridor rules in 3D.

---

## Visual & Technical Design
- **Engine:** [three.js](https://threejs.org/) for 3D rendering.
- **Grid:** Rendered as a floating 3D board with clear cell boundaries.
- **Pawns:** 3D models or stylized shapes, with dash and idle animations.
- **Walls:** 3D blocks that animate into place when shot.
- **Camera:** Adjustable 3D camera (orbit, pan, zoom) for full board visibility.
- **UI:** Overlay for wall count, player status, cooldowns, and win notifications.
- **Effects:** Particle effects for dashing, wall placement, and win/loss.

---

## Controls
- **Movement:** WASD or arrow keys to move/dash.
- **Wall Placement:** Mouse to aim, click or key to shoot a wall.
- **Camera:** Mouse drag to orbit, scroll to zoom.
- **UI:** On-screen buttons for reset, new game, etc.

---

## Multiplayer (Optional)
- **Networking:** WebSockets (e.g., Socket.io) for real-time sync.
- **Matchmaking:** Lobby or direct invite.
- **Spectator Mode:** Watch ongoing games.

---

## Stretch Features
- Power-ups (e.g., temporary wall immunity, speed boost)
- Multiple levels/layers (3D mazes)
- Customizable pawns and arenas
- AI opponents
- Mobile/touch controls

---

## Project Structure (Proposed)
- `/src/` — Main JS/TS code (three.js setup, game logic, UI)
- `/public/` — Static assets (models, textures, sounds)
- `/server/` — (Optional) Multiplayer server code
- `README.md` — This design doc

---

## Getting Started (Planned)
1. Set up a three.js project and render a 3D grid.
2. Add pawn models and implement movement.
3. Implement wall shooting and placement logic.
4. Add UI overlays and effects.
5. (Optional) Add multiplayer support.

---

## Credits
Inspired by the classic board game Quoridor. 3D version and real-time mechanics by [Your Name/Team].
