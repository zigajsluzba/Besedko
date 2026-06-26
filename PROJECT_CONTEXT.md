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

Game → Board (local player)
     → Board (opponent, multiplayer only)
     → Keyboard
     → WordleEngine
     → Animations

Dictionary — loads answers.json, dictionary.json, topics.json

Storage — localStorage wrapper

Multiplayer — BroadcastChannel room protocol

UI — DOM wiring, mode switching, stats, multiplayer panel

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

Words that may become today's solution (5-letter default).

dictionary.json

Every allowed guess (5-letter default).

topics.json

Themed word lists per topic and word length (4/5/6 letters).
Structure: { "topicKey": { "label": "...", "4": [...], "5": [...], "6": [...] } }

Never mix both answer/dictionary lists.

---

# Game Modes
Current:

- Single Player (daily answer, 5 letters)
- Multiplayer (room-based, same-origin via BroadcastChannel, two boards side-by-side)
- Daily mode label

Planned:

- Daily challenge refinement
- True networked multiplayer (WebSocket/WebRTC)
- Hard Mode
- Time Attack
- Zen

---

# Multiplayer Protocol (BroadcastChannel)
Message types:

- join-request  : guest → channel (after joinRoom(), retried up to 5× at 1.5s intervals)
- game-config   : host → channel (sends answer + topic on join-request, clears retry timer)
- board-update  : both → channel (color-only snapshot after each guess)
- player-finished: both → channel (win/loss + guess count)
- leave-room    : both → channel (on leaveRoom())

Flow:
1. Host creates room, picks topic + word length → restarts game with chosen word.
2. Guest joins with room code → sends join-request (retried up to 5× at 1.5s intervals).
3. Host receives join-request → sends game-config.
4. Guest calls game.receiveGameConfig() → restarts with same word, clears retry timer.
5. After each guess, sender broadcasts board-update (colors only, no letters).
6. Receiver renders colors on opponent board via applySnapshotBlind().
7. On game-over, sends player-finished.

IMPORTANT: BroadcastChannel only works within the same browser on the same origin.
Both tabs must be open in the same browser window/instance on the same URL.
If join fails after all retries, status message tells user this.

Session restore: roomId, isHost, nickname stored in localStorage under "besedko-mp".
On reload in multiplayer mode, restoreSession() is called automatically.

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
- opponent board hidden in single-player mode
- aria-live regions for status and messages

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

- compact single-column layout for board and keyboard
- multiplayer: two boards side-by-side on desktop, stacked vertically on mobile (<600px)
- opponent board uses smaller tiles (38px vs 62px) and shows only colors
- touch-action: manipulation on keys prevents 300ms tap delay
- -webkit-tap-highlight-color: transparent removes tap highlight on iOS

---

# Current Implementation Status

## Implemented:

- core Wordle-style gameplay (full algorithm: green pass first, yellow with counts)
- board rendering via Board class (dynamic cols, tile array, no global IDs)
- keyboard interaction (on-screen + physical, supports Č and Š)
- answer/dictionary word validation
- basic stats tracking (played/wins)
- hint system with one hint per game
- expanded word lists in answers.json and dictionary.json
- multiplayer (BroadcastChannel, room-based):
  - host creates room → picks topic + word length → picks word
  - guest joins → receives game-config → restarts with same word
  - both boards displayed side-by-side (opponent board: colors only)
  - live sync after each guess via board-update messages
  - player-finished notification (win/loss + guess count)
- topic/theme selection in multiplayer: Mešano, Narava, Živali, Hrana, Dom
- word length selection in multiplayer: 4, 5, or 6 letters
- topics.json with thematic word lists per length
- Dictionary.getTopics(), getAnswersByTopic(), getRandomByTopic()
- mobile-first responsive layout (stacked boards on <600px)

## Keyboard:
- Slovenian layout with Č, Š, Ž (all three diacritics present)
- Key coloring: correct (green) > present (yellow) > absent (gray), priority-based
- resetKeys() on new game/round clears all key colors

## CSS design:
- Dark theme with CSS custom properties (--bg, --correct, --present, --absent, etc.)
- Board labels ("Jaz" / "Nasprotnik") hidden in single player via .board-label { display:none }
- Shown only in multiplayer: main.mp-active .board-label { display:block }
- Multiplayer panel is a card with mp-settings (hidden when room is active via hidden attribute)
- Sticky glass-morphism header with backdrop-filter blur
- Responsive: ≤640px stacks boards vertically; ≤380px hides minor header items

## Remaining work / next priorities:

- Custom modal instead of window.prompt() for nickname/room code entry
- Daily Challenge mode (deterministic seed per day)
- Richer statistics and history (win streaks, guess distribution)
- Improved flip animations on opponent board  
- Accessibility refinements (full keyboard nav in multiplayer panel)
- PWA support (service worker, manifest)
- Harder difficulty modes (hard mode: must use known letters)
- Broader word sets and better Slovenian language coverage
- Networked multiplayer (WebSocket/WebRTC for cross-device play)

---

# Storage
Use localStorage for:

settings

statistics

current game

daily streak

achievements

multiplayer session (room, host/guest, nickname)

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

Always update PROJECT_CONTEXT.md when features are added or changed.

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
