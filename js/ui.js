import { Multiplayer } from "./multiplayer.js?v=20260626-2";

export class UI {
  constructor(storage) {
    this.storage = storage;
    this.game = null;
    this.messageElement = document.getElementById("message");
    this.statsButton = document.getElementById("stats-button");
    this.statsModal = document.getElementById("stats-modal");
    this.statsPlayed = document.getElementById("stats-played");
    this.statsWins = document.getElementById("stats-wins");
    this.statsClose = document.getElementById("stats-close");
    this.newGameButton = document.getElementById("new-game-button");
    this.hintButton = document.getElementById("hint-button");
    this.statsSummary = document.getElementById("stats-summary");
    this.roundSummary = document.getElementById("round-summary");
    this.dailyMode = document.getElementById("daily-mode");
    this.modeSingleButton = document.getElementById("mode-single");
    this.modeMultiButton = document.getElementById("mode-multi");
    this.multiplayerPanel = document.querySelector(".multiplayer-panel");
    this.roomCodeElement = document.getElementById("room-code");
    this.multiplayerStatusElement = document.getElementById("multiplayer-status");
    this.createRoomButton = document.getElementById("multiplayer-create");
    this.joinRoomButton = document.getElementById("multiplayer-join");
    this.leaveRoomButton = document.getElementById("multiplayer-leave");
    this.hideTimer = null;
    this.register();
  }

  setGame(game) {
    this.game = game;
    const stats = this.storage.getStats();
    this.updateHeaderStats(stats.played || 0, stats.wins || 0);
    if (game) {
      this.updateRound(game.roundIndex + 1, game.answers.length);
    }
    this.updateHintButton();
    this.updateDailyMode();
  }

  register() {
    if (this.statsButton) {
      this.statsButton.addEventListener("click", () => this.showStats());
    }
    if (this.statsClose) {
      this.statsClose.addEventListener("click", () => this.hideStats());
    }
    if (this.statsModal) {
      this.statsModal.addEventListener("click", (event) => {
        if (event.target === this.statsModal) this.hideStats();
      });
    }
    if (this.newGameButton) {
      this.newGameButton.addEventListener("click", () => {
        if (this.game) {
          const nextAnswer = this.game.dictionary ? this.game.dictionary.getDailyAnswer() : this.game.answer;
          const nextAnswers = nextAnswer ? [nextAnswer] : [this.game.answer];
          this.game.restart(nextAnswers);
          this.hideStats();
        }
      });
    }
    if (this.hintButton) {
      this.hintButton.addEventListener("click", () => {
        if (this.game) this.game.requestHint();
      });
    }
    if (this.modeSingleButton) {
      this.modeSingleButton.addEventListener("click", () => this.setMode("single"));
    }
    if (this.modeMultiButton) {
      this.modeMultiButton.addEventListener("click", () => this.setMode("multiplayer"));
    }
    if (this.createRoomButton) {
      this.createRoomButton.addEventListener("click", () => this.createMultiplayerRoom());
    }
    if (this.joinRoomButton) {
      this.joinRoomButton.addEventListener("click", () => this.joinMultiplayerRoom());
    }
    if (this.leaveRoomButton) {
      this.leaveRoomButton.addEventListener("click", () => this.leaveMultiplayerRoom());
    }
  }

  showMessage(text, type = "info", duration = 2600) {
    if (!this.messageElement) return;
    this.messageElement.textContent = text;
    this.messageElement.className = `message ${type} visible`;
    this.messageElement.style.display = "flex";
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    if (duration > 0) {
      this.hideTimer = setTimeout(() => {
        this.hideMessage();
      }, duration);
    }
  }

  hideMessage() {
    if (!this.messageElement) return;
    this.messageElement.textContent = "";
    this.messageElement.className = "message hidden";
    this.messageElement.style.display = "none";
  }

  showStats() {
    if (!this.statsModal || !this.storage) return;
    const stats = this.storage.getStats();
    this.statsPlayed.textContent = stats.played || 0;
    this.statsWins.textContent = stats.wins || 0;
    this.statsModal.classList.add("visible");
  }

  updateHeaderStats(played = 0, wins = 0) {
    if (!this.statsSummary) return;
    this.statsSummary.textContent = `${wins}/${played}`;
  }

  updateRound(current = 1, total = 1) {
    if (!this.roundSummary) return;
    this.roundSummary.textContent = `${current}/${total}`;
  }

  updateDailyMode() {
    if (!this.dailyMode) return;
    this.dailyMode.textContent = "Daily";
  }

  setMode(mode = "single") {
    const normalized = mode === "multiplayer" ? "multiplayer" : "single";
    window.localStorage.setItem("besedko-mode", normalized);
    if (this.storage) {
      this.storage.set("mode", normalized);
    }
    if (this.modeSingleButton) {
      this.modeSingleButton.classList.toggle("active", normalized === "single");
    }
    if (this.modeMultiButton) {
      this.modeMultiButton.classList.toggle("active", normalized === "multiplayer");
    }
    if (this.dailyMode) {
      this.dailyMode.textContent = normalized === "multiplayer" ? "Daily + Multiplayer" : "Daily";
    }
    if (this.multiplayerPanel) {
      this.multiplayerPanel.classList.toggle("visible", normalized === "multiplayer");
    }
    if (this.game) {
      this.game.mode = normalized;
      if (normalized === "multiplayer") {
        if (!this.game.multiplayer) {
          this.game.multiplayer = new Multiplayer({ game: this.game, ui: this });
        }
        if (!this.game.multiplayer.roomId) {
          const restored = this.game.multiplayer.restoreSession();
          if (!restored) {
            this.setMultiplayerStatus("Multiplayer je pripravljen. Ustvari sobo ali se pridruži.");
          }
        }
      }
    }

    if (normalized === "multiplayer") {
      this.showMessage("Multiplayer je aktiven. Ustvari sobo ali se pridruži z drugo kartico.", "info", 2800);
    } else {
      this.showMessage("Single mode je aktiven.", "info", 1800);
    }
  }

  createMultiplayerRoom() {
    if (!this.game) return;
    if (!this.game.multiplayer) {
      this.game.multiplayer = new Multiplayer({ game: this.game, ui: this });
    }
    const nickname = this.promptForNickname();
    if (!nickname) return;
    this.game.multiplayer.setNickname(nickname);
    const roomCode = this.game.multiplayer.createRoom();
    if (roomCode) {
      this.showMessage(`Soba ustvarjena. Koda: ${roomCode}`, "info", 3200);
    }
  }

  joinMultiplayerRoom() {
    if (!this.game) return;
    if (!this.game.multiplayer) {
      this.game.multiplayer = new Multiplayer({ game: this.game, ui: this });
    }
    const nickname = this.promptForNickname();
    if (!nickname) return;
    this.game.multiplayer.setNickname(nickname);
    const roomCode = window.prompt("Vnesi kodo sobe:");
    if (!roomCode) return;
    this.game.multiplayer.joinRoom(roomCode);
    this.showMessage(`Poskušam se pridružiti sobi ${roomCode}`, "info", 2400);
  }

  leaveMultiplayerRoom() {
    if (!this.game || !this.game.multiplayer) {
      this.setMultiplayerStatus("Nimaš aktivne multiplayer sobe.");
      return;
    }
    this.game.multiplayer.leaveRoom();
    this.setRoomCode(null);
    this.showMessage("Zapustil/a si sobo.", "info", 2400);
  }

  promptForNickname() {
    const previous = window.localStorage.getItem("besedko-nickname") || "";
    const value = window.prompt("Vnesi vzdevek:", previous || "Igralec");
    if (value === null) return null;
    const nickname = value.trim();
    if (!nickname) {
      return null;
    }
    window.localStorage.setItem("besedko-nickname", nickname);
    return nickname;
  }

  setRoomCode(code) {
    if (!this.roomCodeElement) return;
    this.roomCodeElement.textContent = code ? `Soba: ${code}` : "Soba: -";
  }

  setMultiplayerStatus(text) {
    if (!this.multiplayerStatusElement) return;
    this.multiplayerStatusElement.textContent = text;
  }

  showHint(text) {
    if (!this.messageElement) return;
    this.showMessage(text, "info", 4200);
  }

  updateHintButton() {
    if (!this.hintButton) return;
    const disabled = !this.game || this.game.gameOver || this.game.hintUsed;
    this.hintButton.disabled = disabled;
    this.hintButton.style.opacity = disabled ? "0.5" : "1";
    this.hintButton.setAttribute("aria-disabled", disabled ? "true" : "false");
  }

  hideStats() {
    if (!this.statsModal) return;
    this.statsModal.classList.remove("visible");
  }
}
