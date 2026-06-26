export class RiddleGame {
  constructor(riddles) {
    this.riddles = riddles || [];
    this.current = null;
    this.revealedCount = 0;
    this.solved = false;
    this.failed = false;
    this._usedIndices = new Set();
  }

  start(riddle) {
    this.current = riddle || this._pickRandom();
    this.revealedCount = 1;
    this.solved = false;
    this.failed = false;
    return this.current;
  }

  _pickRandom() {
    const available = this.riddles
      .map((r, i) => i)
      .filter((i) => !this._usedIndices.has(i));
    if (!available.length) {
      this._usedIndices.clear();
      return this.riddles[Math.floor(Math.random() * this.riddles.length)];
    }
    const idx = available[Math.floor(Math.random() * available.length)];
    this._usedIndices.add(idx);
    return this.riddles[idx];
  }

  revealNext() {
    if (!this.current || this.solved || this.failed) return false;
    if (this.revealedCount < this.current.clues.length) {
      this.revealedCount++;
      return true;
    }
    return false;
  }

  get canRevealMore() {
    return this.current && !this.solved && !this.failed &&
      this.revealedCount < this.current.clues.length;
  }

  get visibleClues() {
    return this.current?.clues.slice(0, this.revealedCount) || [];
  }

  get totalClues() {
    return this.current?.clues.length || 5;
  }

  check(guess) {
    if (!this.current || this.solved || this.failed) return null;
    const clean = guess.trim().toUpperCase().replace(/\s+/g, " ");
    const correct = clean === this.current.answer.toUpperCase();
    if (correct) {
      this.solved = true;
    } else if (!this.canRevealMore) {
      this.failed = true;
    }
    return { correct, score: correct ? this.totalClues - this.revealedCount + 1 : 0 };
  }
}
