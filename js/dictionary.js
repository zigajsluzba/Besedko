export class Dictionary {
  constructor() {
    this.answers = [];
    this.dictionary = [];
    this.topics = {};
    this.loaded = false;
  }

  async load() {
    const loadJson = async (path) => {
      try {
        const res = await fetch(path);
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    };

    const [answers, dictionary, topics] = await Promise.all([
      loadJson("./words/answers.json"),
      loadJson("./words/dictionary.json"),
      loadJson("./words/topics.json"),
    ]);

    this.answers = (answers || []).map((w) => (w || "").toUpperCase());
    this.dictionary = (dictionary || []).map((w) => (w || "").toUpperCase());
    this.topics = topics || {};

    // Merge all topic words into dictionary so they pass isValid() checks.
    for (const topicData of Object.values(this.topics)) {
      for (const [key, words] of Object.entries(topicData)) {
        if (key === "label" || !Array.isArray(words)) continue;
        words.forEach((w) => {
          const upper = (w || "").toUpperCase();
          if (upper && !this.dictionary.includes(upper)) {
            this.dictionary.push(upper);
          }
        });
      }
    }

    this.loaded = true;
  }

  /** @returns {{key: string, label: string, icon: string}[]} */
  getTopics() {
    return Object.entries(this.topics).map(([key, data]) => ({
      key,
      label: data.label || key,
      icon: data.icon || "",
    }));
  }

  /**
   * @param {string} topicKey
   * @param {number} wordLength
   * @returns {string[]}
   */
  getAnswersByTopic(topicKey, wordLength) {
    const topic = this.topics[topicKey];
    if (!topic) {
      return this.answers.filter((w) => w.length === wordLength);
    }
    const words = topic[String(wordLength)] || [];
    return words.map((w) => w.toUpperCase()).filter(Boolean);
  }

  /**
   * @param {string} topicKey
   * @param {number} wordLength
   * @returns {string|null}
   */
  getRandomByTopic(topicKey, wordLength) {
    let pool = this.getAnswersByTopic(topicKey, wordLength);
    if (pool.length === 0) {
      pool = this.answers.filter((w) => w.length === wordLength);
    }
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  getRandomAnswer() {
    if (!this.loaded || this.answers.length === 0) return null;
    return this.answers[Math.floor(Math.random() * this.answers.length)];
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
    for (const char of today) seed += char.charCodeAt(0);
    return this.answers[seed % this.answers.length];
  }

  isValid(word) {
    if (!word || !this.loaded) return false;
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
      hintOptions.push(
        `Beseda vsebuje ${vowels} samoglasnik${vowels === 1 ? "a" : "ov"}.`
      );
    }
    if (repeated) hintOptions.push("Beseda vsebuje ponovljeno črko.");
    if (letters.length >= 2) {
      const someLetters = letters.slice(0, Math.min(3, letters.length)).join(", ");
      hintOptions.push(`Beseda vsebuje eno od teh črk: ${someLetters}.`);
    }
    hintOptions.push(`Beseda se začne z ${upper[0]}.`);
    hintOptions.push(`Beseda se konča z ${upper[upper.length - 1]}.`);

    const choice = hintOptions[Math.floor(Math.random() * hintOptions.length)];
    return `Namig: ${choice}`;
  }
}

export default Dictionary;
