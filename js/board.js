export class Board {
  constructor(r, c, animations) {
    this.rows = r;
    this.cols = c;
    this.animations = animations;
    this.element = document.getElementById("board");
    this.create();
  }
  create() {
    this.element.innerHTML = "";
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = document.createElement("div");
        t.className = "tile";
        t.id = `tile-${r}-${c}`;
        this.element.appendChild(t);
      }
    }
  }
  setTile(r, c, v) {
    document.getElementById(`tile-${r}-${c}`).textContent = v;
  }
  getRow(r) {
    const out = [];
    for (let c = 0; c < this.cols; c++) {
      const el = document.getElementById(`tile-${r}-${c}`);
      out.push(el ? el.textContent : "");
    }
    return out;
  }

  getSnapshot() {
    const snapshot = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        const tile = document.getElementById(`tile-${r}-${c}`);
        if (!tile) {
          row.push({ letter: "", state: "" });
          continue;
        }
        const state = ["correct", "present", "absent"].find((name) => tile.classList.contains(name)) || "";
        row.push({ letter: tile.textContent || "", state });
      }
      snapshot.push(row);
    }
    return snapshot;
  }

  applySnapshot(snapshot) {
    this.create();
    const normalized = Array.isArray(snapshot) ? snapshot : [];
    normalized.forEach((row, rowIndex) => {
      (row || []).forEach((cell, colIndex) => {
        if (!cell) return;
        if (cell.letter) {
          this.setTile(rowIndex, colIndex, cell.letter);
        }
        if (cell.state) {
          const tile = document.getElementById(`tile-${rowIndex}-${colIndex}`);
          if (tile) {
            tile.classList.remove("correct", "present", "absent");
            tile.classList.add(cell.state);
          }
        }
      });
    });
  }

  shakeRow(r) {
    const tiles = [];
    for (let c = 0; c < this.cols; c++) {
      const t = document.getElementById(`tile-${r}-${c}`);
      if (t) tiles.push(t);
    }
    if (this.animations) this.animations.shakeTiles(tiles);
    else tiles.forEach((t) => t.classList.add("shake"));
  }

  setTileState(row, col, state) {
    const tile = document.getElementById(`tile-${row}-${col}`);
    if (this.animations) {
      this.animations.flipTile(tile, state, col * 150);
      return;
    }
    tile.classList.remove("correct", "present", "absent");
    tile.classList.add(state);
  }
}
