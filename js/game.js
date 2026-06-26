import { Board } from "./board.js?v=20260626-7";
import { Keyboard } from "./keyboard.js?v=20260626-16";
import { WordleEngine } from "./wordleEngine.js?v=20260626-7";
import { Animations } from "./animations.js?v=20260626-7";

export class Game {
  /**
   * @param {string|string[]} answers
   * @param {Dictionary} dictionary
   * @param {Storage} storage
   * @param {UI} ui
   * @param {string} mode
   */
  constructor(answers, dictionary = null, storage = null, ui = null, mode = "single") {
    this.rows = 6;
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
    this.roundGuesses = [];
    this.hintUsed = false;
    this.boardStates = [];
    this.multiplayer = null;
    this.opponentBoard = null;
    this.persistKey = "game-state";
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
      this.ui && this.ui.showMessage("Beseda ni v slovarju.", "error", 1800);
      return;
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

    // Track logical board state for multiplayer broadcast (no animation wait needed).
    this.boardStates[row] = states.map((s) => ({ state: s }));

    if (this.mode === "multiplayer" && this.multiplayer) {
      this.multiplayer.sendBoardUpdate(this.boardStates.slice());
    }

    const isWin = states.every((s) => s === "correct");
    if (isWin) {
      this.storage && this.storage.incrementStat("wins");
      this.storage && this.storage.incrementStat("played");
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
      this.ui && this.ui.showMessage("Čestitke! Zmaga.", "info", 3500);
      this.gameOver = true;
      if (this.mode === "multiplayer" && this.multiplayer) {
        this.multiplayer.sendPlayerFinished(true, row + 1);
      }
      this.persistState();
      return;
    }

    this.currentRow++;
    this.currentCol = 0;
    if (this.currentRow >= this.rows) {
      this.storage && this.storage.incrementStat("played");
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
      this.ui && this.ui.showMessage(
        `Igra končana. Pravilna beseda je ${this.answer}.`,
        "error",
        4200
      );
      this.gameOver = true;
      if (this.mode === "multiplayer" && this.multiplayer) {
        this.multiplayer.sendPlayerFinished(false, this.rows);
      }
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
    this.cols = this.answer.length;
    this.engine.setAnswer(this.answer);
    this.currentRow = 0;
    this.currentCol = 0;
    this.gameOver = false;
    this.roundGuesses = [];
    this.hintUsed = false;
    this.boardStates = [];
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

  /** Initialize the opponent board element (called when peer connects). */
  initOpponentBoard() {
    const el = document.getElementById("opponent-board");
    if (!el) return;
    if (this.opponentBoard) {
      if (this.opponentBoard.cols !== this.cols) {
        this.opponentBoard.cols = this.cols;
        this.opponentBoard.create();
      }
      return;
    }
    this.opponentBoard = new Board(this.rows, this.cols, null, "opponent-board");
  }

  /** Config sent by host to guest when guest joins. */
  getGameConfig() {
    return {
      answers: this.answers,
      answer: this.answer,
      wordLength: this.cols,
      rows: this.rows,
      topic: this.topic,
    };
  }

  /** Guest calls this when receiving game-config from host. */
  receiveGameConfig(config) {
    if (!config) return;
    if (config.topic) this.topic = config.topic;
    if (Number.isInteger(config.rows) && config.rows >= 1) {
      this.rows = config.rows;
    }
    const answers = this.normalizeAnswers(
      config.answers || (config.answer ? [config.answer] : [])
    );
    if (answers.length > 0) this.restart(answers);
  }

  /** Apply opponent's board update (colors only) to the opponent board element. */
  applyOpponentBoardUpdate(snapshot) {
    if (!this.opponentBoard || !snapshot) return;
    this.opponentBoard.applySnapshotBlind(snapshot);
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
