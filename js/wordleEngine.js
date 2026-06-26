export class WordleEngine {
  /**
   * @param {string} answer Five-letter answer (any characters allowed)
   */
  constructor(answer) {
    if (!answer || answer.length === 0) throw new Error("Answer required");
    this.setAnswer(answer);
  }

  setAnswer(answer) {
    this.answer = answer.toUpperCase().split("");
  }

  /**
   * Evaluate a guess array of letters against the answer.
   * Returns an array of states: 'correct' | 'present' | 'absent'
   * Implements Wordle rules: green (correct) pass first, then yellow (present) with counts.
   * @param {string[]} guessArr
   */
  evaluate(guessArr) {
    const guess = guessArr.map((g) => (g || "").toUpperCase());
    const answer = this.answer.slice();

    const result = new Array(guess.length).fill("absent");
    const matched = new Array(guess.length).fill(false);

    // First pass: correct (green)
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === answer[i]) {
        result[i] = "correct";
        matched[i] = true;
        answer[i] = null; // consume
      }
    }

    // Build frequency map for remaining answer letters
    const freq = {};
    for (let i = 0; i < answer.length; i++) {
      const a = answer[i];
      if (!a) continue;
      freq[a] = (freq[a] || 0) + 1;
    }

    // Second pass: present (yellow) or absent
    for (let i = 0; i < guess.length; i++) {
      if (result[i] === "correct") continue;
      const g = guess[i];
      if (freq[g] > 0) {
        result[i] = "present";
        freq[g]--;
      } else {
        result[i] = "absent";
      }
    }

    return result;
  }
}
