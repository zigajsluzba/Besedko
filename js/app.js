import { Game } from "./game.js?v=20260627-16";
import { Dictionary } from "./dictionary.js?v=20260627-16";
import { Storage } from "./storage.js?v=20260627-16";
import { UI } from "./ui.js?v=20260627-16";
import { Multiplayer } from "./multiplayer.js?v=20260627-16";
import { config } from "./config.js?v=20260627-16";
import { RiddleGame } from "./riddleGame.js?v=20260627-16";
import {
  onAuthChange,
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  logout,
  friendlyAuthError,
} from "./auth.js?v=20260627-16";

window.__besedkoInitStatus = "pending";
window.__besedkoInitError = null;

// Sync stats between localStorage and Firebase for a logged-in user.
async function syncStats(user, storage, firebaseUrl) {
  if (!user || !firebaseUrl) return;
  const localStats = storage.getStats();
  try {
    const res = await fetch(`${firebaseUrl}/users/${user.uid}/stats.json`);
    const remote = res.ok ? await res.json() : null;
    const merged = {
      ...localStats,
      played: Math.max(localStats.played || 0, remote?.played || 0),
      wins:   Math.max(localStats.wins   || 0, remote?.wins   || 0),
    };
    storage.setStats(merged);
    await fetch(`${firebaseUrl}/users/${user.uid}/stats.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged),
    });
    return merged;
  } catch (e) {
    console.error("[Auth] Stats sync failed:", e);
  }
}

async function pushStats(user, storage, firebaseUrl) {
  if (!user || !firebaseUrl) return;
  try {
    await fetch(`${firebaseUrl}/users/${user.uid}/stats.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(storage.getStats()),
    });
  } catch (e) {}
}

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
    const savedGameMode = localStorage.getItem("besedko-gamemode") || "classic";

    // Load riddles and wire riddle game
    try {
      const riddleResp = await fetch("words/riddles.json?v=20260627-16");
      if (riddleResp.ok) {
        const riddles = await riddleResp.json();
        const riddleGame = new RiddleGame(riddles);
        ui.setRiddleGame(riddleGame);
      }
    } catch (e) {
      console.warn("[Riddle] Failed to load riddles:", e);
    }

    let initialAnswer;
    if (savedGameMode === "random") {
      const len = [4, 5, 6][Math.floor(Math.random() * 3)];
      initialAnswer = dict.getRandomByTopic("mešano", len) || dict.getRandomAnswer();
    } else {
      initialAnswer = dict.getDailyAnswer();
    }
    const answers = initialAnswer ? [initialAnswer] : dict.getDailyAnswers(1);
    const game = new Game(answers, dict, storage, ui, mode, savedGameMode);

    if (mode === "multiplayer") {
      game.multiplayer = new Multiplayer({ game, ui, firebaseUrl: config.firebaseUrl });
      const restored = game.multiplayer.restoreSession();
      if (!restored && game.multiplayer.available) {
        ui.setMultiplayerStatus("Ustvari sobo ali se pridruži z drugo napravo.");
      }
    }

    ui.setGame(game);
    ui.setMode(mode);
    ui.setGameMode(savedGameMode);
    if (savedGameMode !== "classic") setTimeout(() => ui.showModeToast(savedGameMode), 600);
    if (savedGameMode === "timeattack") game.startTimer();

    // ─── Firebase Auth ───────────────────────────────────────────
    const authAvailable = config.firebaseApp?.apiKey &&
      !config.firebaseApp.apiKey.includes("REPLACE_WITH");

    if (authAvailable) {
      let syncTimer = null;
      let currentUser = null;

      // Auth state listener
      onAuthChange(config.firebaseApp, async (user) => {
        currentUser = user;
        ui.setAuthUser(user);

        if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }

        if (user) {
          const merged = await syncStats(user, storage, config.firebaseUrl);
          if (merged) {
            game.updateHeaderStats();
          }
          // Push stats periodically while session is active
          syncTimer = setInterval(() => pushStats(user, storage, config.firebaseUrl), 60_000);
        }
      });

      // Push stats on page unload
      window.addEventListener("beforeunload", () => {
        if (currentUser) pushStats(currentUser, storage, config.firebaseUrl);
      });

      // Wire auth callbacks into UI
      ui.registerAuthCallbacks({
        onGoogle: async () => {
          ui.setAuthBusy(true);
          ui.clearAuthError();
          try {
            await signInWithGoogle(config.firebaseApp);
            ui.closeAuthModal();
          } catch (e) {
            console.error("[Auth] Google sign-in error:", e.code, e.message);
            const msg = friendlyAuthError(e.code);
            if (msg) ui.showAuthError(msg);
          } finally {
            ui.setAuthBusy(false);
          }
        },

        onSignin: async () => {
          const { email, password } = ui.getAuthFormValues();
          if (!email || !password) {
            ui.showAuthError("Vnesi e-naslov in geslo.");
            return;
          }
          ui.setAuthBusy(true);
          ui.clearAuthError();
          try {
            await signInWithEmail(config.firebaseApp, email, password);
            ui.closeAuthModal();
          } catch (e) {
            ui.showAuthError(friendlyAuthError(e.code));
          } finally {
            ui.setAuthBusy(false);
          }
        },

        onRegister: async () => {
          const { name, email, password } = ui.getAuthFormValues();
          if (!email || !password) {
            ui.showAuthError("Vnesi e-naslov in geslo.");
            return;
          }
          if (password.length < 6) {
            ui.showAuthError("Geslo mora imeti vsaj 6 znakov.");
            return;
          }
          ui.setAuthBusy(true);
          ui.clearAuthError();
          try {
            await registerWithEmail(config.firebaseApp, email, password, name || undefined);
            ui.closeAuthModal();
          } catch (e) {
            ui.showAuthError(friendlyAuthError(e.code));
          } finally {
            ui.setAuthBusy(false);
          }
        },

        onLogout: async () => {
          try {
            await logout(config.firebaseApp);
            ui.closeAuthModal();
          } catch (e) {
            console.error("[Auth] Logout failed:", e);
          }
        },
      });
    }
    // ─────────────────────────────────────────────────────────────

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
