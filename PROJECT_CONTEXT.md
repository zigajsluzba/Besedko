# PROJECT_CONTEXT.md

# Besedko+
Modern open-source Slovenian word game inspired by Wordle and Besedko.

---

# Project Goals
This project is NOT intended to be a clone.

The goal is to create the best Slovenian Wordle-style game with:

- excellent architecture
- maintainable code
- smooth animations
- accessibility
- mobile-first UI
- PWA support
- long-term maintainability

---

# Technology
Use only:

- HTML5
- CSS3
- Vanilla JavaScript (ES Modules)
Do NOT introduce:

- React
- Vue
- Angular
- jQuery
- Bootstrap
- Tailwind
- large third-party libraries
Unless explicitly requested.

---

# Development Philosophy
Prefer:

- readable code
- modularity
- maintainability
- small reusable classes
- composition over large monolithic files
Avoid:

- duplicated code
- huge functions
- global variables
- magic numbers

---

# Architecture
Each class should have ONE responsibility.

Current architecture:

Game

↓

Board

Keyboard

Dictionary

Statistics

Storage

Animations

Future:

Game

↓

WordleEngine

↓

Board

Keyboard

Dictionary

Storage

Animations

Statistics

UI should never contain game logic.

Game logic should never manipulate the DOM directly.

Board should be responsible for rendering.

---

# Coding Style
Use:

const whenever possible

let only when needed

camelCase variables

PascalCase classes

English identifiers

English comments

Slovenian UI

Always use ES Modules.

---

# Folder Structure
/

index.html

README.md

PROJECT_CONTEXT.md

TASKS.md

LICENSE

css/

js/

assets/

words/

---

# Code Quality Rules
Maximum function size:

~40 lines

Maximum file size:

~300 lines

Split files when they become too large.

Never create "utils.js" full of unrelated helper methods.

Keep responsibilities separated.

---

# Wordle Rules
Must implement the official Wordle algorithm.

This includes:

- duplicate letters
- green pass first
- yellow pass second
Never implement the simplified version.

---

# Dictionary
Separate files:

answers.json

Words that may become today's solution.

dictionary.json

Every allowed guess.

Never mix both.

---

# Game Modes
Current:

- Single Player
- Multiplayer (room-based, same-origin via BroadcastChannel)
- Daily mode label

Planned:

- Daily challenge refinement
- True networked multiplayer
- Custom themes / word categories
- Custom length support
- Hard Mode
- Time Attack
- Zen

---

# Performance
Target:

- fast startup
- low DOM churn
- smooth animations
- responsive UI

Current focus:

- keep the game lightweight while adding persistence and multiplayer state sync

---

# Accessibility
Keyboard navigation

ARIA labels

Screen reader support

High contrast mode

Reduced motion support

Current UI improvements:

- multiplayer status messages
- clear mode switching
- hidden multiplayer panel in single-player mode

---

# Mobile
Mobile First.

Everything must work on:

Desktop

Tablet

Phone

Landscape

Portrait

Current implementation notes:

- the app uses a compact single-column layout for the board and keyboard
- multiplayer controls are integrated without blocking the core game UI

---

# Current Implementation Status

Implemented so far:

- core Wordle-style gameplay
- board rendering and keyboard interaction
- answer/dictionary word validation
- basic stats tracking (played/wins)
- hint system with one hint per game
- centered hint popup that appears only when requested
- expanded word lists in answers.json and dictionary.json

Remaining work / next priorities:

- Daily Challenge mode
- richer statistics and history
- improved animations and polish
- accessibility refinements
- PWA support
- harder difficulty modes and custom options
- broader word set and better Slovenian language coverage

---

# Storage
Use localStorage for:

settings

statistics

current game

daily streak

achievements

Never store unnecessary data.

---

# Git Workflow
Small commits.

Descriptive commit messages.

Never mix unrelated features.

---

# Documentation
Every exported class must have JSDoc.

Every public method must have JSDoc.

README should always be updated when functionality changes.

---

# AI Instructions
When generating code:

Think before writing.

Prefer architecture over speed.

Never rewrite unrelated files.

Do not remove comments.

Keep the project modular.

Avoid unnecessary dependencies.

Explain major architectural decisions.

If multiple solutions exist:

Choose the most maintainable one.

Act as a senior software engineer.

Do not optimize prematurely.

Write production-quality code.

Never sacrifice readability for fewer lines of code.

If unsure:

Ask before making architectural changes.

---

# Long-Term Vision
The project should eventually support:

PWA

Offline mode

Themes

Achievements

Statistics

Multiplayer

Leaderboards

Seasonal events

API-driven daily words

Plugin architecture

The project should be suitable for public GitHub release.

---

## Current Progress

- **Implemented:**
	- Basic UI scaffolding: `index.html`, board (`#board`) and keyboard (`#keyboard`) sections, and `css/main.css`.
	- App entry: `js/app.js` initializes the `Game` on DOMContentLoaded.
	- Game core: `js/game.js` implements the main game loop (letter input, delete, submit, row progression).
	- Rendering: `js/board.js` creates the tile grid and provides tile setters/getters and row shake.
	- Input: `js/keyboard.js` creates an on-screen keyboard and keyboard event handling.
	- Engine: `js/wordleEngine.js` implements full Wordle evaluation (correct/present/absent with proper counts).
	- Animations: `js/animations.js` provides `flipTile` and `shakeTiles` helpers used by the `Board`.

- **Stubs / Missing / Next:**
	- `js/dictionary.js` is implemented; it loads `words/answers.json` and `words/dictionary.json`.
	- `js/storage.js` is implemented; simple `localStorage` wrapper and stats helpers added.
	- `js/utils.js` is empty; shared helpers may be added as needed.
	- `words/` directory is empty; wordlists for answers and allowed guesses are required.
	- UI polish: accessibility attributes, ARIA labels, and responsive tweaks to reach mobile-first goals.
	- Features: Daily mode, statistics, settings, PWA support, and additional game modes are planned.

This file will be kept up-to-date as tasks are completed.
