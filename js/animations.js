export class Animations {
  /**
   * Flip a tile and then apply the final state class.
   * @param {HTMLElement} tile
   * @param {'correct'|'present'|'absent'} state
   * @param {number} delay ms before starting animation
   */
  flipTile(tile, state, delay = 0) {
    if (!tile) return;
    setTimeout(() => {
      const cleanup = () => {
        tile.classList.remove("flip");
        tile.removeEventListener("animationend", onEnd);
        tile.classList.add(state);
      };
      const onEnd = () => cleanup();
      // remove previous state classes so color change happens after flip
      tile.classList.remove("correct", "present", "absent");
      tile.addEventListener("animationend", onEnd);
      tile.classList.add("flip");
    }, delay);
  }

  /**
   * Shake multiple tiles (e.g., a row) to indicate invalid input.
   * @param {HTMLElement[]} tiles
   */
  shakeTiles(tiles) {
    if (!tiles || tiles.length === 0) return;
    tiles.forEach((t) => {
      t.classList.remove("shake");
      // force reflow
      // eslint-disable-next-line no-unused-expressions
      t.offsetWidth;
      t.classList.add("shake");
      const onEnd = () => {
        t.classList.remove("shake");
        t.removeEventListener("animationend", onEnd);
      };
      t.addEventListener("animationend", onEnd);
    });
  }
}
