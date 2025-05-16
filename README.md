# Quoridor Game

A fullstack implementation of the board game **Quoridor**, built to deepen knowledge and practice in both backend and frontend web development.

## Features

- **Modern, Animated UI**: Responsive, mobile-friendly design with smooth animations for pawn movement, wall placement, and winning.
- **Interactive Board**: Click to preview moves and wall placements before confirming. Walls are placed by selecting two endpoints and confirming.
- **User-Friendly Controls**: Move and wall placement require confirmation. "Finish Turn" button for clarity. All controls are context-aware.
- **Scoreboard**: Tracks the number of games won by each player.
- **Current Player Indicator**: Prominent highlight and pulsing badge for the active player.
- **Instructions Card**: Built-in rules and tips for new players.
- **Pathfinding Logic**: Ensures no player can be completely blocked by walls.
- **Validation & Feedback**: All actions are validated and provide clear user feedback.

## Project Goals

This project was created as a learning tool to develop and demonstrate the following:

- **Test-Driven Development (TDD)**: Emphasis on writing reliable unit tests before implementation.
- **Continuous Integration & Deployment (CI/CD)**: Structured for scalable and testable builds.
- **Version Control with Git & GitHub**: Clean commit history and collaborative workflows.
- **Advanced Logic Programming**: Implementation of move validation, board state tracking, and pawn pathfinding.
- **State Management**: Managing complex, dynamic game state on the client and server.
- **Fullstack Development**: Building the game across the stack with custom APIs and client interaction.
- **Real-Time Features**: Real-time multiplayer using WebSockets and JWT-based authentication. *(Planned)*

## Repository Structure

- `/client` – Frontend application (UI, state handling, event-driven gameplay)
- `/server` – Game logic, API routes, websocket integration
- `/__tests__` – Unit and integration tests for core mechanics
- `quoridor.js` – Main game logic module

## Status

The game is fully playable locally with a modern, animated UI and robust logic. Core mechanics, user experience, and validation are complete. Real-time multiplayer and advanced features are planned for future updates.
