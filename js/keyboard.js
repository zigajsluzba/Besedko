export class Keyboard {
  constructor(cb) {
    this.cb = cb;
    this.element = document.getElementById("keyboard");
    this.layout = [
      ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Š"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Č"],
      ["ENTER", "Y", "X", "C", "V", "B", "N", "M", "←"],
    ];
    this.create();
    this.register();
  }
  create() {
    this.layout.forEach((row) => {
      const d = document.createElement("div");
      d.className = "keyboard-row";
      row.forEach((k) => {
        const b = document.createElement("button");
        b.className = "key";
        if (k === "ENTER" || k === "←") b.classList.add("large");
        b.textContent = k;
        b.onclick = () => this.cb(k);
        d.appendChild(b);
      });
      this.element.appendChild(d);
    });
  }
  register() {
    document.addEventListener("keydown", (e) => {
      let k = e.key.toUpperCase();
      if (k === "BACKSPACE") return this.cb("←");
      if (k === "ENTER") return this.cb("ENTER");
      if (/^[A-ZČŠŽ]$/.test(k)) this.cb(k);
    });
  }
}
