export class Dictionary {
	constructor() {
		this.answers = [];
		this.dictionary = [];
		this.loaded = false;
	}

	async load() {
		const loadJson = async (path) => {
			try {
				const res = await fetch(path);
				if (!res.ok) return [];
				const data = await res.json();
				return data.map((w) => (w || "").toUpperCase());
			} catch (e) {
				return [];
			}
		};

		this.answers = await loadJson("/words/answers.json");
		this.dictionary = await loadJson("/words/dictionary.json");
		this.loaded = true;
	}

	getRandomAnswer() {
		if (!this.loaded || this.answers.length === 0) return null;
		const i = Math.floor(Math.random() * this.answers.length);
		return this.answers[i];
	}

  getDailyAnswers(count = 3) {
    if (!this.loaded || this.answers.length === 0) return [];
    const available = [...this.answers];
    const selected = [];
    while (selected.length < count && available.length > 0) {
      const index = Math.floor(Math.random() * available.length);
      selected.push(available.splice(index, 1)[0]);
    }
    return selected;
  }

  getDailyAnswer() {
    if (!this.loaded || this.answers.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    let seed = 0;
    for (const char of today) {
      seed += char.charCodeAt(0);
    }
    return this.answers[seed % this.answers.length];
  }

  isValid(word) {
    if (!word) return false;
    if (!this.loaded) return false;
    return this.dictionary.includes(word.toUpperCase());
  }

  getGuessHint(answer, previousGuesses = []) {
    if (!answer || answer.length === 0) return "Ni namiga za prazno besedo.";
    const upper = answer.toUpperCase();
    const letters = [...new Set(upper.split(""))];
    const vowels = [...upper].filter((c) => "AEIOU".includes(c)).length;
    const repeated = letters.length < upper.length;
    const hintOptions = [];

    if (vowels > 0) {
      hintOptions.push(`Beseda vsebuje ${vowels} samoglasnik${vowels === 1 ? "a" : "ov"}.`);
    }
    if (repeated) {
      hintOptions.push("Beseda vsebuje ponovljeno črko.");
    }
    if (letters.length >= 2) {
      const someLetters = letters.slice(0, Math.min(3, letters.length)).join(", ");
      hintOptions.push(`Beseda vsebuje eno od teh črk: ${someLetters}.`);
    }
    hintOptions.push(`Beseda se začne z ${upper[0]}.`);
    hintOptions.push(`Beseda se konča z ${upper[upper.length - 1]}.`);

    const choice = hintOptions[Math.floor(Math.random() * hintOptions.length)];
    return `AI namig: ${choice}`;
  }

}

export default Dictionary;
