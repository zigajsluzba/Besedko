import { Board } from "./board.js?v=20260627-03";
import { Keyboard } from "./keyboard.js?v=20260627-03";
import { WordleEngine } from "./wordleEngine.js?v=20260627-03";
import { Animations } from "./animations.js?v=20260627-03";
import { sounds } from "./sounds.js?v=20260627-12";

export class Game {
  /**
   * @param {string|string[]} answers
   * @param {Dictionary} dictionary
   * @param {Storage} storage
   * @param {UI} ui
   * @param {string} mode
   */
  constructor(answers, dictionary = null, storage = null, ui = null, mode = "single", gameMode = "classic") {
    this.gameMode = gameMode;
    this.rows = gameMode === "zen" ? 9 : 6;
    this.animations = new Animations();
    this.keyboard = new Keyboard((k) => this.handleKey(k));
    this.answers = this.normalizeAnswers(answers);
    if (this.answers.length === 0) throw new Error("Game requires at least one answer");
    this.roundIndex = 0;
    this.answer = this.answers[0];
    this.cols = this.answer.length || 5;
    this.board = new Board(this.rows, this.cols, this.animations, "board");
    this.engine = new WordleEngine(this.answer);
    this.dictionary = dictionary;
    this.storage = storage;
    this.ui = ui;
    this.mode = mode;
    this.topic = "mešano";
    this.currentRow = 0;
    this.currentCol = 0;
    this.gameOver = false;
    this._persistedWon = null;
    this._persistedGuessCount = 0;
    this.roundGuesses = [];
    this.hintUsed = false;
    this.boardStates = [];
    this.hardConstraints = { greens: {}, yellows: new Set() };
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.timeAttackScore = 0;
    this.multiplayer = null;
    this.opponentBoards = {};
    this.persistKey = "game-state";
    this.gameStartTime = Date.now();
    this.currentRiddle = null;
    this.bestGreenCount = 0;
    this._revealInterval = null;
    this._revealedPositions = new Set();
    window.addEventListener("beforeunload", () => this.persistState());
    window.addEventListener("pagehide", () => this.persistState());
    try { window.game = this; } catch (e) {}
    this.restoreState();
    this.updateHeaderStats();
    this.updateRound();
  }

  handleKey(k) {
    if (this.gameOver) return;
    if (k === "ENTER") return this.submitGuess();
    if (k === "←") return this.deleteLetter();
    this.addLetter(k);
  }

  addLetter(l) {
    if (this.currentCol >= this.cols || this.gameOver) return;
    this.board.setTile(this.currentRow, this.currentCol, l);
    this.currentCol++;
    this.persistState();
  }

  deleteLetter() {
    if (this.currentCol === 0 || this.gameOver) return;
    this.currentCol--;
    this.board.setTile(this.currentRow, this.currentCol, "");
    this.persistState();
  }

  submitGuess() {
    if (this.gameOver) return;
    if (this.currentCol !== this.cols) {
      this.board.shakeRow(this.currentRow);
      this.ui && this.ui.showMessage(`Vnesite ${this.cols} črk.`, "error", 1800);
      return;
    }
    const guess = this.board.getRow(this.currentRow);
    const guessStr = guess.join("").toUpperCase();
    if (this.dictionary && !this.dictionary.isValid(guessStr)) {
      this.board.shakeRow(this.currentRow);
      sounds.invalidWord();
      this.ui && this.ui.showMessage("Beseda ni v slovarju.", "error", 1800);
      return;
    }
    if (this.gameMode === "hard" && this.currentRow > 0) {
      const violation = this._checkHardConstraints(guessStr);
      if (violation) {
        this.board.shakeRow(this.currentRow);
        this.ui?.showMessage(violation, "error", 2200);
        return;
      }
    }
    this.roundGuesses.push(guessStr);
    this.evaluateGuess(guess);
  }

  evaluateGuess(guess) {
    const states = this.engine.evaluate(guess);
    const row = this.currentRow;

    states.forEach((state, index) => {
      this.board.setTileState(row, index, state);
      this.keyboard.setKeyState(guess[index].toUpperCase(), state);
    });

    // Play sound for the best result in this row
    if (states.some(s => s === "correct"))       sounds.tileCorrect();
    else if (states.some(s => s === "present"))  sounds.tilePresent();
    else                                          sounds.tileAbsent();

    // Update hard mode constraints
    if (this.gameMode === "hard") {
      states.forEach((state, i) => {
        if (state === "correct") this.hardConstraints.greens[i] = guess[i].toUpperCase();
        if (state === "present") this.hardConstraints.yellows.add(guess[i].toUpperCase());
      });
    }

    // Track logical board state for multiplayer broadcast
    this.boardStates[row] = states.map((s) => ({ state: s }));
    const rowGreens = states.filter(s => s === "correct").length;
    if (rowGreens > this.bestGreenCount) this.bestGreenCount = rowGreens;
    if (this.mode === "multiplayer" && this.multiplayer) {
      this.multiplayer.sendBoardUpdate(this.boardStates.slice());
    }

    const isWin = states.every((s) => s === "correct");

    // Time attack: auto-next word on win, don't end game
    if (isWin && this.gameMode === "timeattack") {
      this.timeAttackScore++;
      this.timerSeconds = Math.min(this.timerSeconds + 10, 180);
      this.ui?.updateTimer(this.timerSeconds, this.timeAttackScore);
      this.storage?.recordGame({ mode: "timeattack", won: true, taScore: this.timeAttackScore });
      this.updateHeaderStats();
      this.ui?.showMessage(`+10s — beseda rešena! (${this.timeAttackScore})`, "info", 1400);
      setTimeout(() => {
        const next = this._randomLengthAnswer();
        this._softRestart([next]);
      }, 1500);
      return;
    }

    if (isWin) {
      this.storage?.recordGame({ mode: this.gameMode, wordLength: this.cols, won: true, guessCount: row + 1, isMultiplayer: this.mode === "multiplayer" });
      this.updateHeaderStats();
      if (this.roundIndex + 1 < this.answers.length) {
        this.ui && this.ui.showMessage(
          `Beseda rešena! Naslednja beseda ${this.roundIndex + 2}/${this.answers.length}.`,
          "info",
          2800
        );
        this.nextRound();
        return;
      }
      sounds.win();
      this.ui && this.ui.showMessage(`Čestitke! Zmaga. ⏱ ${this.getElapsed()} · ${row + 1} ugibanj`, "info", 3500);
      this.ui?._stopLiveStats();
      this._stopReveal();
      this.gameOver = true;
      this._persistedWon = true;
      this._persistedGuessCount = row + 1;
      if (this.mode === "multiplayer" && this.multiplayer) {
        this.multiplayer.sendPlayerFinished(true, row + 1, this.bestGreenCount);
      }
      if (this.isDaily) {
        this.ui?.submitDailyResult({ guessCount: row + 1, elapsedMs: Date.now() - this.gameStartTime, won: true });
      }
      if (this.mode === "single") this.ui?._recordDailyPlay();
      this.ui?._animateWinRow(row);
      this.ui?._launchConfetti();
      setTimeout(() => {
        this.ui?.showEndScreen({ won: true, guessCount: row + 1, elapsed: this.getElapsed(), mpWaiting: this.mode === "multiplayer" });
      }, 1800);
      this.persistState();
      return;
    }

    this.currentRow++;
    this.currentCol = 0;
    if (this.currentRow >= this.rows) {
      // Zen: auto-next word, no game over
      if (this.gameMode === "zen") {
        this.storage?.recordGame({ mode: "zen", won: false });
        this.ui?.showMessage(`Beseda je bila ${this.answer}. Naslednja...`, "error", 2600);
        setTimeout(() => {
          const next = this._randomLengthAnswer();
          this._softRestart([next]);
        }, 2800);
        return;
      }
      this.storage?.recordGame({ mode: this.gameMode, wordLength: this.cols, won: false, guessCount: this.rows, isMultiplayer: this.mode === "multiplayer" });
      if (this.roundIndex + 1 < this.answers.length) {
        const finishedAnswer = this.answer;
        this.ui && this.ui.showMessage(
          `Beseda je bila ${finishedAnswer}. Naslednja beseda ${this.roundIndex + 2}/${this.answers.length}.`,
          "error",
          4200
        );
        this.nextRound();
        return;
      }
      this.updateHeaderStats();
      sounds.lose();
      this.ui && this.ui.showMessage(
        `Igra končana. Beseda: ${this.answer}. ⏱ ${this.getElapsed()}`,
        "error",
        4200
      );
      this.ui?._stopLiveStats();
      this._stopReveal();
      this.gameOver = true;
      this._persistedWon = false;
      if (this.mode === "multiplayer" && this.multiplayer) {
        this.multiplayer.sendPlayerFinished(false, this.rows, this.bestGreenCount);
        // showMpRematch is now called from _checkBothFinished in multiplayer.js
      }
      if (this.mode === "single") this.ui?._recordDailyPlay();
      this.ui?._animateLoseBoard();
      setTimeout(() => {
        this.ui?.showEndScreen({ won: false, word: this.answer, elapsed: this.getElapsed(), mpWaiting: this.mode === "multiplayer" });
      }, 1200);
      this.persistState();
      return;
    }
    this.persistState();
  }

  /** Restart for next word mid-session (time attack / zen) without resetting timer or score. */
  _softRestart(answers) {
    const normalized = this.normalizeAnswers(answers);
    if (!normalized.length) return;
    this.answers = normalized;
    this.roundIndex = 0;
    this.answer = normalized[0];
    this.cols = this.answer.length;
    this.engine.setAnswer(this.answer);
    this.currentRow = 0;
    this.currentCol = 0;
    this.gameOver = false;
    this.roundGuesses = [];
    this.hintUsed = false;
    this.boardStates = [];
    this.hardConstraints = { greens: {}, yellows: new Set() };
    this.board.rows = this.rows;
    this.board.cols = this.cols;
    this.board.create();
    this.keyboard.resetKeys();
    this.updateRound();
    this.ui?.updateHintButton();
    this.persistState();
  }

  getElapsed() {
    const s = Math.floor((Date.now() - (this.gameStartTime || Date.now())) / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  restart(answers) {
    const normalized = this.normalizeAnswers(answers);
    if (normalized.length === 0) return;
    this.answers = normalized;
    this.roundIndex = 0;
    this.answer = this.answers[0];
    this.cols = this.answer.length;
    this.engine.setAnswer(this.answer);
    this.currentRow = 0;
    this.currentCol = 0;
    this.gameOver = false;
    this._persistedWon = null;
    this._persistedGuessCount = 0;
    this.roundGuesses = [];
    this.hintUsed = false;
    this.boardStates = [];
    this.gameStartTime = Date.now();
    this.bestGreenCount = 0;
    this._revealedPositions = new Set();
    for (const b of Object.values(this.opponentBoards)) {
      b.rows = this.rows; b.cols = this.cols; b.create();
    }
    this.board.rows = this.rows;
    this.board.cols = this.cols;
    this.board.create();
    this.keyboard.resetKeys();
    if (this.opponentBoard) {
      this.opponentBoard.rows = this.rows;
      this.opponentBoard.cols = this.cols;
      this.opponentBoard.create();
    }
    this.updateHeaderStats();
    this.updateRound();
    this.persistState();
    this.ui && this.ui.showMessage(`Nova serija: 1/${this.answers.length}.`, "info", 2200);
  }

  nextRound() {
    this.roundIndex += 1;
    if (this.roundIndex >= this.answers.length) {
      this.gameOver = true;
      return;
    }
    this.answer = this.answers[this.roundIndex];
    this.cols = this.answer.length;
    this.engine.setAnswer(this.answer);
    this.roundGuesses = [];
    this.currentRow = 0;
    this.currentCol = 0;
    this.boardStates = [];
    this.board.cols = this.cols;
    this.board.create();
    this.keyboard.resetKeys();
    if (this.opponentBoard) {
      this.opponentBoard.cols = this.cols;
      this.opponentBoard.create();
    }
    this.updateRound();
    this.updateHeaderStats();
    this.hintUsed = false;
    this.ui && this.ui.updateHintButton();
    this.persistState();
  }

  requestHint() {
    if (this.gameOver || this.hintUsed) return;
    this.hintUsed = true;
    this.ui && this.ui.updateHintButton();
    const hint = this.dictionary
      ? this.dictionary.getGuessHint(this.answer, this.roundGuesses)
      : `Namig: beseda se začne z ${this.answer[0]}.`;
    this.ui && this.ui.showHint(hint);
    this.persistState();
  }

  // --- Game modes ---

  _randomLengthAnswer() {
    const len = [4, 5, 6][Math.floor(Math.random() * 3)];
    return this.dictionary?.getRandomByTopic("mešano", len) ||
      this.dictionary?.getRandomAnswer() || this.answer;
  }

  setGameMode(mode) {
    if (this.gameMode === mode && !this.gameOver) return;
    this.stopTimer();
    this._stopReveal();
    this.gameMode = mode;
    this.hardConstraints = { greens: {}, yellows: new Set() };
    this.timeAttackScore = 0;
    this.rows = mode === "zen" ? 9 : 6;
    localStorage.setItem("besedko-gamemode", mode);
    if (mode !== "riddle") {
      const answer = (mode === "random" || mode === "reveal")
        ? this._randomLengthAnswer()
        : (this.dictionary?.getDailyAnswer() || this.dictionary?.getRandomAnswer() || this.answer);
      this.restart([answer]);
    }
    this.ui?.setGameMode(mode);
    this.ui?.showModeToast(mode);
  }

  // Called by UI after user clicks "Začni" on the ready overlay (or immediately in MP).
  startModeGame() {
    if (this.gameMode === "timeattack") this.startTimer();
    else if (this.gameMode === "reveal") this._startReveal();
  }

  _startReveal() {
    this._stopReveal();
    this._revealedPositions = new Set();
    this._revealNextAt = Date.now() + 5000;
    this.ui?._updateRevealBar();
    this._revealInterval = setInterval(() => {
      if (this.gameOver) { this._stopReveal(); return; }
      const all = [...Array(this.cols).keys()];
      const unrevealed = all.filter(i => !this._revealedPositions.has(i));
      if (unrevealed.length === 0) { this._stopReveal(); return; }
      const pos = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      this._revealedPositions.add(pos);
      this._revealNextAt = Date.now() + 5000;
      this.ui?._updateRevealBar();
    }, 5000);
  }

  _stopReveal() {
    if (this._revealInterval) { clearInterval(this._revealInterval); this._revealInterval = null; }
    this._revealNextAt = null;
    this._revealedPositions = new Set();
  }

  startTimer() {
    this.stopTimer();
    this.timerSeconds = 180;
    this.timeAttackScore = 0;
    this.ui?.updateTimer(this.timerSeconds, 0);
    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      this.ui?.updateTimer(this.timerSeconds, this.timeAttackScore);
      if (this.timerSeconds <= 0) {
        this.stopTimer();
        this._handleTimerEnd();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  _handleTimerEnd() {
    this.gameOver = true;
    this.ui?.updateTimer(0, this.timeAttackScore);
    this.storage?.recordGame({ mode: "timeattack", won: false, taScore: this.timeAttackScore });
    this.updateHeaderStats();
    this.ui?.showMessage(
      `Čas je potekel! Rešil si ${this.timeAttackScore} ${this.timeAttackScore === 1 ? "besedo" : "besed"}.`,
      "info",
      7000
    );
  }

  _checkHardConstraints(guessStr) {
    for (const [pos, letter] of Object.entries(this.hardConstraints.greens)) {
      if (guessStr[pos] !== letter) {
        return `Pozicija ${+pos + 1} mora biti ${letter}.`;
      }
    }
    for (const letter of this.hardConstraints.yellows) {
      if (!guessStr.includes(letter)) {
        return `Beseda mora vsebovati ${letter}.`;
      }
    }
    return null;
  }

  updateHeaderStats() {
    if (!this.ui || !this.storage) return;
    const stats = this.storage.getStats();
    this.ui.updateHeaderStats(stats.played || 0, stats.wins || 0);
  }

  updateRound() {
    if (!this.ui || !this.answers.length) return;
    this.ui.updateRound(this.roundIndex + 1, this.answers.length);
  }

  // --- Multiplayer ---

  /** Initialize an opponent board element by sessionId and DOM element ID. */
  initOpponentBoard(sessionId, boardId) {
    if (this.opponentBoards[sessionId]) {
      const b = this.opponentBoards[sessionId];
      if (b.rows !== this.rows || b.cols !== this.cols) {
        b.rows = this.rows; b.cols = this.cols; b.create();
      }
      return;
    }
    if (!document.getElementById(boardId)) return;
    this.opponentBoards[sessionId] = new Board(this.rows, this.cols, null, boardId);
  }

  /** Config sent by host to guest when guest joins. */
  getGameConfig() {
    return {
      answers: this.answers,
      answer: this.answer,
      wordLength: this.cols,
      rows: this.rows,
      topic: this.topic,
      gameMode: this.gameMode,
      riddleData: this.currentRiddle || null,
    };
  }

  /** Guest calls this when receiving game-config from host. */
  receiveGameConfig(config) {
    if (!config) return;
    if (config.topic) this.topic = config.topic;
    if (config.gameMode) {
      this.gameMode = config.gameMode;
      this.hardConstraints = { greens: {}, yellows: new Set() };
      if (config.gameMode === "zen") this.rows = 9;
    }
    if (Number.isInteger(config.rows) && config.rows >= 1) {
      this.rows = config.rows;
    }
    const answers = this.normalizeAnswers(
      config.answers || (config.answer ? [config.answer] : [])
    );
    if (answers.length > 0) this.restart(answers);
    if (this.gameMode === "timeattack") this.startTimer();
    if (this.gameMode === "reveal") this._startReveal();
    this.ui?.setGameMode(this.gameMode);
    if (config.riddleData && this.gameMode === "riddle" && this.ui?.riddleGame) {
      this.ui.riddleGame.start(config.riddleData);
      this.ui._renderRiddleClues();
      this.ui._updateRiddleNextBtn();
    }
  }

  /** Apply opponent's board update (colors only) to the matching opponent board. */
  applyOpponentBoardUpdate(snapshot, sessionId) {
    const board = this.opponentBoards[sessionId];
    if (!board || !snapshot) return;
    board.applySnapshotBlind(snapshot);
  }

  /** Return a random confirmed green {letter, position} from the current game. */
  getRandomGreenHint() {
    const greens = new Map();
    for (const row of this.boardStates) {
      if (!row) continue;
      row.forEach((cell, i) => {
        if (cell?.state === "correct" && !greens.has(i)) greens.set(i, this.answer[i]);
      });
    }
    if (greens.size === 0) return null;
    const entries = [...greens.entries()];
    const [position, letter] = entries[Math.floor(Math.random() * entries.length)];
    return { position, letter };
  }

  // --- State persistence ---

  persistState() {
    if (!this.storage) return;
    const state = {
      mode: this.mode,
      answer: this.answer,
      answers: this.answers,
      roundIndex: this.roundIndex,
      currentRow: this.currentRow,
      currentCol: this.currentCol,
      gameOver: this.gameOver,
      won: this._persistedWon,
      guessCount: this._persistedGuessCount,
      hintUsed: this.hintUsed,
      roundGuesses: this.roundGuesses,
      boardState: this.board?.getSnapshot() || [],
    };
    window.localStorage.setItem("besedko-mode", this.mode || "single");
    this.storage.set(this.persistKey, state);
  }

  restoreState() {
    if (!this.storage) return false;
    const state = this.storage.get(this.persistKey, null);
    if (!state) return false;
    // Don't restore a multiplayer game into single player or vice versa.
    if (state.mode && state.mode !== this.mode) return false;
    this.mode = state.mode || this.mode;
    this.answers = this.normalizeAnswers(state.answers || this.answers);
    this.answer = (state.answer || this.answer || "").toUpperCase();
    if (!this.answers.includes(this.answer)) {
      this.answers = this.normalizeAnswers(
        this.answers.length ? this.answers : [this.answer]
      );
    }
    this.roundIndex = Number.isInteger(state.roundIndex) ? state.roundIndex : this.roundIndex;
    this.currentRow = Number.isInteger(state.currentRow) ? state.currentRow : this.currentRow;
    this.currentCol = Number.isInteger(state.currentCol) ? state.currentCol : this.currentCol;
    this.gameOver = Boolean(state.gameOver);
    this._persistedWon = state.won ?? null;
    this._persistedGuessCount = state.guessCount || 0;
    this.hintUsed = Boolean(state.hintUsed);
    this.roundGuesses = this.normalizeAnswers(state.roundGuesses || []);
    const newCols = this.answer.length || 5;
    if (newCols !== this.cols) {
      this.cols = newCols;
      this.board.cols = this.cols;
    }
    this.engine.setAnswer(this.answer);
    this.board.create();
    this.board.applySnapshot(state.boardState || []);
    this.updateRound();
    this.ui && this.ui.updateHintButton();
    return true;
  }

  normalizeAnswers(answers) {
    if (!answers) return [];
    const list = Array.isArray(answers) ? answers : [answers];
    return list
      .filter((v) => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim().toUpperCase());
  }
}
