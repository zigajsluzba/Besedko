export class BattleWord {
  constructor() {
    this.SIZE = 6;
    this.SHIP_LEN = 3;
    this.ship = [];
    this.shots = new Map(); // "r,c" -> "hit"|"near"|"miss"
    this.pendingShot = null;
    this._place();
  }

  _place() {
    const { SIZE, SHIP_LEN } = this;
    const horiz = Math.random() < 0.5;
    const r = horiz
      ? Math.floor(Math.random() * SIZE)
      : Math.floor(Math.random() * (SIZE - SHIP_LEN + 1));
    const c = horiz
      ? Math.floor(Math.random() * (SIZE - SHIP_LEN + 1))
      : Math.floor(Math.random() * SIZE);
    for (let i = 0; i < SHIP_LEN; i++) {
      this.ship.push(horiz ? { r, c: c + i } : { r: r + i, c });
    }
  }

  select(r, c) { this.pendingShot = { r, c }; }
  hasPending() { return this.pendingShot !== null; }
  clearPending() { this.pendingShot = null; }
  isShot(r, c) { return this.shots.has(`${r},${c}`); }
  getShot(r, c) { return this.shots.get(`${r},${c}`) ?? null; }

  fire() {
    if (!this.pendingShot) return null;
    const { r, c } = this.pendingShot;
    this.pendingShot = null;
    const key = `${r},${c}`;
    if (this.shots.has(key)) return { r, c, result: "already" };
    const hit = this.ship.some(s => s.r === r && s.c === c);
    const result = hit ? "hit"
      : this.ship.some(s => Math.abs(s.r - r) <= 1 && Math.abs(s.c - c) <= 1) ? "near"
      : "miss";
    this.shots.set(key, result);
    return { r, c, result };
  }

  isSunk() {
    return this.ship.every(s => this.shots.get(`${s.r},${s.c}`) === "hit");
  }

  hitsCount() {
    return this.ship.filter(s => this.shots.get(`${s.r},${s.c}`) === "hit").length;
  }
}
