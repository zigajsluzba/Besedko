export class Keyboard {
  constructor(cb) {
    this.cb = cb;
    this.element = document.getElementById("keyboard");
    this.lang = localStorage.getItem("besedko-lang") || "sl";
    this.layouts = {
      int: [
        ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Š"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Č", "Ž"],
        ["ENTER", "Y", "X", "C", "V", "B", "N", "M", "←"],
      ],
      sl: [
        ["E", "R", "T", "Z", "U", "I", "O", "P", "Š"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Č", "Ž"],
        ["ENTER", "C", "V", "B", "N", "M", "←"],
      ],
    };
    this.layout = this.layouts[this.lang] || this.layouts.sl;
    this.create();
    this.register();
  }

  create() {
    if (!this.element) return;
    this.element.innerHTML = "";
    this.layout.forEach((row) => {
      const d = document.createElement("div");
      d.className = "keyboard-row";
      row.forEach((k) => {
        const b = document.createElement("button");
        b.className = "key";
        if (k === "ENTER" || k === "←") b.classList.add("large");
        b.textContent = k === "ENTER" ? "enter ↵" : k;
        b.dataset.key = k;
        b.setAttribute("aria-label", k === "←" ? "Briši" : k === "ENTER" ? "Potrdi" : k);
        b.onclick = () => this.cb(k);
        d.appendChild(b);
      });
      this.element.appendChild(d);
    });
  }

  setLang(lang) {
    const states = {};
    this.element?.querySelectorAll(".key").forEach((btn) => {
      if (btn.dataset.state) states[btn.dataset.key] = btn.dataset.state;
    });
    this.lang = lang;
    this.layout = this.layouts[lang] || this.layouts.sl;
    localStorage.setItem("besedko-lang", lang);
    this.create();
    Object.entries(states).forEach(([key, state]) => this.setKeyState(key, state));
  }

  register() {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      let k = e.key.toUpperCase();
      if (k === "BACKSPACE") return this.cb("←");
      if (k === "ENTER") return this.cb("ENTER");
      if (/^[A-ZČŠŽ]$/.test(k)) this.cb(k);
    });
  }

  /** Update key color based on best achieved state. */
  setKeyState(letter, state) {
    const priority = { correct: 3, present: 2, absent: 1 };
    const btn = this.element?.querySelector(`[data-key="${letter}"]`);
    if (!btn) return;
    const current = btn.dataset.state || "";
    if ((priority[state] || 0) > (priority[current] || 0)) {
      btn.dataset.state = state;
      btn.classList.remove("correct", "present", "absent");
      btn.classList.add(state);
    }
  }

  resetKeys() {
    this.element?.querySelectorAll(".key").forEach((btn) => {
      btn.dataset.state = "";
      btn.classList.remove("correct", "present", "absent");
    });
  }
}
