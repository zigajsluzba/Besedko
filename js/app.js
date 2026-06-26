import { Game } from "./game.js?v=20260626-7";
import { Dictionary } from "./dictionary.js?v=20260626-7";
import { Storage } from "./storage.js?v=20260626-7";
import { UI } from "./ui.js?v=20260626-7";
import { Multiplayer } from "./multiplayer.js?v=20260626-7";

window.__besedkoInitStatus = "pending";
window.__besedkoInitError = null;

async function init() {
  try {
    const dict = new Dictionary();
    await dict.load();
    const storage = new Storage();
    const ui = new UI(storage);
    const storedMode = storage.get(
      "mode",
      window.localStorage.getItem("besedko-mode") || "single"
    );
    const mode = String(storedMode || "single").toLowerCase();
    const dailyAnswer = dict.getDailyAnswer();
    const answers = dailyAnswer ? [dailyAnswer] : dict.getDailyAnswers(1);
    const game = new Game(answers, dict, storage, ui, mode);

    if (mode === "multiplayer") {
      game.multiplayer = new Multiplayer({ game, ui });
      const restored = game.multiplayer.restoreSession();
      if (!restored) {
        ui.setMultiplayerStatus("Ustvari sobo ali se pridruži z drugo kartico.");
      }
    }

    ui.setGame(game);
    ui.setMode(mode);
    window.__besedkoInitStatus = "ready";
  } catch (error) {
    window.__besedkoInitStatus = "failed";
    window.__besedkoInitError =
      error && (error.stack || error.message || String(error));
    console.error("Besedko+ initialization failed:", error);
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
