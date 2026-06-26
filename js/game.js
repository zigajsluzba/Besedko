import { Board } from "./board.js?v=20260626-2";
import { Keyboard } from "./keyboard.js?v=20260626-2";
import { WordleEngine } from "./wordleEngine.js?v=20260626-2";
import { Animations } from "./animations.js?v=20260626-2";
export class Game {
  /**
   * @param {string} answer - initial answer for the game (5-letter)
   * @param {Dictionary} dictionary - dictionary instance for validation
   * @param {Storage} storage - storage instance for stats persistence
   * @param {UI} ui - UI instance for messages and stats display
   */
  constructor(answers, dictionary = null, storage = null, ui = null, mode = "single") {
    this.rows = 6;
    this.cols = 5;
    this.currentRow = 0;
    this.currentCol = 0;
    this.gameOver = false;
    this.animations = new Animations();
    this.board = new Board(this.rows, this.cols, this.animations);
    this.keyboard = new Keyboard((k) => this.handleKey(k));
    this.answers = this.normalizeAnswers(answers);
    if (this.answers.length === 0) throw new Error("Game requires at least one answer");
    this.roundIndex = 0;
    this.answer = this.answers[0];
    this.engine = new WordleEngine(this.answer);
    this.dictionary = dictionary;
    this.storage = storage;
    this.ui = ui;
    this.mode = mode;
    this.roundGuesses = [];
    this.hintUsed = false;
    this.multiplayer = null;
    this.persistKey = "game-state";
    window.addEventListener("beforeunload", () => this.persistState());
    window.addEventListener("pagehide", () => this.persistState());
    // Expose for debugging in browser console
    try { window.game = this; } catch (e) {}
    this.restoreState();
    this.updateHeaderStats();
    this.updateRound();
  }
  handleKey(k) {
    if (this.gameOver) return;
    console.debug("handleKey:", k);
    if (k === "ENTER") return this.submitGuess();
    if (k === "←") return this.deleteLetter();
    this.addLetter(k);
  }
  addLetter(l) {
    if (this.currentCol >= this.cols || this.gameOver) return;
    console.debug("addLetter:", l, "at", this.currentRow, this.currentCol);
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
    console.debug("submitGuess: currentCol", this.currentCol, "cols", this.cols);
    if (this.currentCol !== this.cols) {
      this.board.shakeRow(this.currentRow);
      this.ui && this.ui.showMessage("Vnesite 5 črk.", "error", 1800);
      return;
    }
    const guess = this.board.getRow(this.currentRow);
    console.debug("submitGuess: guess", guess);
    const guessStr = guess.join("").toUpperCase();
    if (this.dictionary && !this.dictionary.isValid(guessStr)) {
      console.debug("submitGuess: invalid word", guessStr);
      this.board.shakeRow(this.currentRow);
      this.ui && this.ui.showMessage("Beseda ni v slovarju.", "error", 1800);
      return;
    }
    this.roundGuesses.push(guessStr);
    this.evaluateGuess(guess);
    if (this.mode === "multiplayer" && this.multiplayer) {
      this.multiplayer.broadcastState(this.getMultiplayerState());
    }
  }
  evaluateGuess(guess) {
    const states = this.engine.evaluate(guess);
    console.debug("evaluateGuess: states", states);
    states.forEach((state, index) => {
      this.board.setTileState(this.currentRow, index, state);
    });

    const isWin = states.every((s) => s === "correct");
    if (isWin) {
      this.storage && this.storage.incrementStat("wins");
      this.storage && this.storage.incrementStat("played");
      this.updateHeaderStats();
      if (this.roundIndex + 1 < this.answers.length) {
        this.ui && this.ui.showMessage(`Beseda rešena! Naslednja beseda ${this.roundIndex + 2}/${this.answers.length}.`, "info", 2800);
        this.nextRound();
        return;
      }
      this.ui && this.ui.showMessage("Čestitke! Zmaga.", "info", 3500);
      this.gameOver = true;
      this.persistState();
      return;
    }

    this.currentRow++;
    this.currentCol = 0;
    if (this.currentRow >= this.rows) {
      this.storage && this.storage.incrementStat("played");
      if (this.roundIndex + 1 < this.answers.length) {
        const finishedAnswer = this.answer;
        this.ui && this.ui.showMessage(`Beseda je bila ${finishedAnswer}. Naslednja beseda ${this.roundIndex + 2}/${this.answers.length}.`, "error", 4200);
        this.nextRound();
        return;
      }
      this.updateHeaderStats();
      this.ui && this.ui.showMessage(`Igra končana. Pravilna beseda je ${this.answer}.`, "error", 4200);
      this.gameOver = true;
      this.persistState();
      return;
    }
    this.persistState();
  }

  restart(answers) {
    const normalized = this.normalizeAnswers(answers);
    if (normalized.length === 0) return;
    this.answers = normalized;
    this.roundIndex = 0;
    this.answer = this.answers[0];
    this.engine.setAnswer(this.answer);
    this.currentRow = 0;
    this.currentCol = 0;
    this.gameOver = false;
    this.roundGuesses = [];
    this.hintUsed = false;
    this.board.create();
    this.updateHeaderStats();
    this.updateRound();
    this.persistState();
    this.ui && this.ui.showMessage(`Nova serija: 1/${this.answers.length}.`, "info", 2200);
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

  nextRound() {
    this.roundIndex += 1;
    if (this.roundIndex >= this.answers.length) {
      this.gameOver = true;
      return;
    }
    this.answer = this.answers[this.roundIndex];
    this.engine.setAnswer(this.answer);
    this.roundGuesses = [];
    this.currentRow = 0;
    this.currentCol = 0;
    this.board.create();
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
    const hint = this.dictionary ? this.dictionary.getGuessHint(this.answer, this.roundGuesses) : `Namig: beseda se začne z ${this.answer[0]}.`;
    this.ui && this.ui.showHint(hint);
    this.persistState();
  }

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
      hintUsed: this.hintUsed,
      roundGuesses: this.roundGuesses,
      boardState: typeof this.board?.getSnapshot === "function" ? this.board.getSnapshot() : [],
    };
    if (typeof window !== "undefined") {
      window.localStorage.setItem("besedko-mode", this.mode || "single");
    }
    this.storage.set(this.persistKey, state);
  }

  restoreState() {
    if (!this.storage) return false;
    const state = this.storage.get(this.persistKey, null);
    if (!state) return false;
    this.mode = state.mode || this.mode;
    this.answers = this.normalizeAnswers(state.answers || this.answers);
    this.answer = (state.answer || this.answer || "").toUpperCase();
    if (!this.answers.includes(this.answer)) {
      this.answers = this.normalizeAnswers(this.answers.length ? this.answers : [this.answer]);
    }
    this.roundIndex = Number.isInteger(state.roundIndex) ? state.roundIndex : this.roundIndex;
    this.currentRow = Number.isInteger(state.currentRow) ? state.currentRow : this.currentRow;
    this.currentCol = Number.isInteger(state.currentCol) ? state.currentCol : this.currentCol;
    this.gameOver = Boolean(state.gameOver);
    this.hintUsed = Boolean(state.hintUsed);
    this.roundGuesses = this.normalizeAnswers(state.roundGuesses || []);
    this.engine.setAnswer(this.answer);
    this.board.create();
    if (typeof this.board?.applySnapshot === "function") {
      this.board.applySnapshot(state.boardState || []);
    }
    this.updateRound();
    this.ui && this.ui.updateHintButton();
    return true;
  }

  getMultiplayerState() {
    return {
      answer: this.answer,
      roundGuesses: this.roundGuesses,
      currentRow: this.currentRow,
      currentCol: this.currentCol,
      gameOver: this.gameOver,
      hintUsed: this.hintUsed,
      roundIndex: this.roundIndex,
      answers: this.answers,
      boardState: typeof this.board?.getSnapshot === "function" ? this.board.getSnapshot() : [],
    };
  }

  applyMultiplayerState(state) {
    if (!state) return;
    this.answer = state.answer || this.answer;
    this.roundGuesses = state.roundGuesses || [];
    this.currentRow = state.currentRow || 0;
    this.currentCol = state.currentCol || 0;
    this.gameOver = Boolean(state.gameOver);
    this.hintUsed = Boolean(state.hintUsed);
    this.roundIndex = Number.isInteger(state.roundIndex) ? state.roundIndex : 0;
    this.answers = this.normalizeAnswers(state.answers || this.answers);
    this.board.create();
    if (typeof this.board?.applySnapshot === "function") {
      this.board.applySnapshot(state.boardState || []);
    }
    this.roundGuesses.forEach((guess, rowIndex) => {
      if (!guess) return;
      guess.split("").forEach((letter, colIndex) => {
        this.board.setTile(rowIndex, colIndex, letter);
      });
    });
    this.updateRound();
    this.updateHeaderStats();
    this.ui && this.ui.updateHintButton();
    this.persistState();
  }

  normalizeAnswers(answers) {
    if (!answers) return [];
    const list = Array.isArray(answers) ? answers : [answers];
    return list
      .filter((v) => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim().toUpperCase());
  }
}
