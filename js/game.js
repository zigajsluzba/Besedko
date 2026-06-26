import { Board } from "./board.js";
import { Keyboard } from "./keyboard.js";
import { WordleEngine } from "./wordleEngine.js";
import { Animations } from "./animations.js";
export class Game {
  constructor() {
    this.rows = 6;
    this.cols = 5;
    this.currentRow = 0;
    this.currentCol = 0;
    this.animations = new Animations();
    this.board = new Board(this.rows, this.cols, this.animations);
    this.keyboard = new Keyboard((k) => this.handleKey(k));
    // Temporary hard-coded answer until Dictionary/answers.json integration
    this.engine = new WordleEngine("ČEBEL");
  }
  handleKey(k) {
    if (k === "ENTER") return this.submitGuess();
    if (k === "←") return this.deleteLetter();
    this.addLetter(k);
  }
  addLetter(l) {
    if (this.currentCol >= this.cols) return;
    this.board.setTile(this.currentRow, this.currentCol, l);
    this.currentCol++;
  }
  deleteLetter() {
    if (this.currentCol === 0) return;
    this.currentCol--;
    this.board.setTile(this.currentRow, this.currentCol, "");
  }
    submitGuess() {

        if (this.currentCol !== this.cols) {

            this.board.shakeRow(this.currentRow);

            return;

        }

        const guess = this.board.getRow(this.currentRow);
        this.evaluateGuess(guess);

    }
    evaluateGuess(guess){

        const states = this.engine.evaluate(guess);
        states.forEach((state, index) => {
          this.board.setTileState(this.currentRow, index, state);
        });

        this.currentRow++;
        this.currentCol = 0;

    }
}
