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

Classic

Planned:

Daily

Infinite

Hard Mode

Time Attack

Zen

Custom Length

---

# Performance
Target:

Lighthouse 100

No unnecessary DOM updates

Avoid layout thrashing

Prefer CSS animations

---

# Accessibility
Keyboard navigation

ARIA labels

Screen reader support

High contrast mode

Reduced motion support

---

# Mobile
Mobile First.

Everything must work on:

Desktop

Tablet

Phone

Landscape

Portrait

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
