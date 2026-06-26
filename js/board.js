export class Board {
  /**
   * @param {number} rows
   * @param {number} cols
   * @param {Animations|null} animations
   * @param {string} containerId - id of the container element
   */
  constructor(rows, cols, animations, containerId = "board") {
    this.rows = rows;
    this.cols = cols;
    this.animations = animations;
    this.element = document.getElementById(containerId);
    this.tiles = [];
    this.create();
  }

  create() {
    if (!this.element) return;
    this.element.innerHTML = "";
    this.element.style.gridTemplateColumns = `repeat(${this.cols}, var(--tile-size))`;
    this.tiles = [];
    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const t = document.createElement("div");
        t.className = "tile";
        this.element.appendChild(t);
        this.tiles[r][c] = t;
      }
    }
  }

  setTile(r, c, v) {
    const tile = this.tiles[r]?.[c];
    if (!tile) return;
    tile.textContent = v;
  }

  getRow(r) {
    if (!this.tiles[r]) return [];
    return this.tiles[r].map((t) => (t ? t.textContent : ""));
  }

  getSnapshot() {
    return this.tiles.map((row) =>
      row.map((tile) => {
        if (!tile) return { letter: "", state: "" };
        const state =
          ["correct", "present", "absent"].find((s) =>
            tile.classList.contains(s)
          ) || "";
        return { letter: tile.textContent || "", state };
      })
    );
  }

  applySnapshot(snapshot) {
    this.create();
    const normalized = Array.isArray(snapshot) ? snapshot : [];
    normalized.forEach((row, r) => {
      (row || []).forEach((cell, c) => {
        if (!cell) return;
        if (cell.letter) this.setTile(r, c, cell.letter);
        if (cell.state) {
          const tile = this.tiles[r]?.[c];
          if (tile) {
            tile.classList.remove("correct", "present", "absent");
            tile.classList.add(cell.state);
          }
        }
      });
    });
  }

  /** Apply only colors (no letters) — used for opponent board. */
  applySnapshotBlind(snapshot) {
    this.tiles.forEach((row) =>
      row?.forEach((tile) => {
        if (tile) tile.classList.remove("correct", "present", "absent");
      })
    );
    const normalized = Array.isArray(snapshot) ? snapshot : [];
    normalized.forEach((row, r) => {
      (row || []).forEach((cell, c) => {
        if (!cell || !cell.state) return;
        const tile = this.tiles[r]?.[c];
        if (tile) tile.classList.add(cell.state);
      });
    });
  }

  shakeRow(r) {
    const tiles = (this.tiles[r] || []).filter(Boolean);
    if (this.animations) this.animations.shakeTiles(tiles);
    else tiles.forEach((t) => t.classList.add("shake"));
  }

  setTileState(row, col, state) {
    const tile = this.tiles[row]?.[col];
    if (!tile) return;
    if (this.animations) {
      this.animations.flipTile(tile, state, col * 150);
      return;
    }
    tile.classList.remove("correct", "present", "absent");
    tile.classList.add(state);
  }
}
