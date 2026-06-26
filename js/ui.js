import { Multiplayer } from "./multiplayer.js?v=20260626-6";

export class UI {
  constructor(storage) {
    this.storage = storage;
    this.game = null;
    this.selectedWordLength = 5;

    // Core UI elements
    this.messageElement = document.getElementById("message");
    this.statsButton = document.getElementById("stats-button");
    this.statsModal = document.getElementById("stats-modal");
    this.statsPlayed = document.getElementById("stats-played");
    this.statsWins = document.getElementById("stats-wins");
    this.statsClose = document.getElementById("stats-close");
    this.newGameButton = document.getElementById("new-game-button");
    this.statsNewGameButton = document.getElementById("stats-new-game-button");
    this.hintButton = document.getElementById("hint-button");
    this.statsSummary = document.getElementById("stats-summary");
    this.roundSummary = document.getElementById("round-summary");
    this.dailyMode = document.getElementById("daily-mode");
    this.modeSingleButton = document.getElementById("mode-single");
    this.modeMultiButton = document.getElementById("mode-multi");

    // Multiplayer panel
    this.multiplayerPanel = document.querySelector(".multiplayer-panel");
    this.roomCodeElement = document.getElementById("room-code");
    this.multiplayerStatusElement = document.getElementById("multiplayer-status");
    this.createRoomButton = document.getElementById("multiplayer-create");
    this.joinRoomButton = document.getElementById("multiplayer-join");
    this.leaveRoomButton = document.getElementById("multiplayer-leave");

    // Topic + word length selectors
    this.mpSettings = document.getElementById("mp-settings");
    this.mpTopicSelect = document.getElementById("mp-topic-select");
    this.mpLengthButtons = document.querySelectorAll(".mp-length-btn");

    // Opponent board
    this.opponentBoardWrapper = document.getElementById("opponent-board-wrapper");
    this.opponentLabel = document.getElementById("opponent-label");
    this.myBoardLabel = document.getElementById("my-board-label");
    this.boardsContainer = document.getElementById("boards-container");
    this.mainElement = document.querySelector("main");

    this.hideTimer = null;
    this.register();
  }

  setGame(game) {
    this.game = game;
    const stats = this.storage.getStats();
    this.updateHeaderStats(stats.played || 0, stats.wins || 0);
    if (game) this.updateRound(game.roundIndex + 1, game.answers.length);
    this.updateHintButton();
    this.updateDailyMode();
    this.populateTopics();
  }

  // --- Event registration ---

  register() {
    this.statsButton?.addEventListener("click", () => this.showStats());
    this.statsClose?.addEventListener("click", () => this.hideStats());
    this.statsModal?.addEventListener("click", (e) => {
      if (e.target === this.statsModal) this.hideStats();
    });
    const startNewGame = () => {
      if (!this.game) return;
      const nextAnswer = this.game.dictionary
        ? this.game.dictionary.getDailyAnswer()
        : this.game.answer;
      this.game.restart(nextAnswer ? [nextAnswer] : [this.game.answer]);
      this.hideStats();
    };
    this.newGameButton?.addEventListener("click", startNewGame);
    this.statsNewGameButton?.addEventListener("click", startNewGame);
    this.hintButton?.addEventListener("click", () => {
      this.game && this.game.requestHint();
    });
    this.modeSingleButton?.addEventListener("click", () => this.setMode("single"));
    this.modeMultiButton?.addEventListener("click", () => this.setMode("multiplayer"));
    this.createRoomButton?.addEventListener("click", () => this.createMultiplayerRoom());
    this.joinRoomButton?.addEventListener("click", () => this.joinMultiplayerRoom());
    this.leaveRoomButton?.addEventListener("click", () => this.leaveMultiplayerRoom());

    // Word length buttons
    this.mpLengthButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedWordLength = parseInt(btn.dataset.length, 10) || 5;
        this.mpLengthButtons.forEach((b) =>
          b.classList.toggle("active", b === btn)
        );
      });
    });
  }

  /** Populate topic dropdown from dictionary. */
  populateTopics() {
    if (!this.mpTopicSelect || !this.game?.dictionary) return;
    const topics = this.game.dictionary.getTopics();
    this.mpTopicSelect.innerHTML = "";
    topics.forEach(({ key, label }) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = label;
      this.mpTopicSelect.appendChild(opt);
    });
  }

  // --- Mode switching ---

  setMode(mode = "single") {
    const normalized = mode === "multiplayer" ? "multiplayer" : "single";
    window.localStorage.setItem("besedko-mode", normalized);
    if (this.storage) this.storage.set("mode", normalized);

    this.modeSingleButton?.classList.toggle("active", normalized === "single");
    this.modeMultiButton?.classList.toggle("active", normalized === "multiplayer");

    if (this.dailyMode) {
      this.dailyMode.textContent =
        normalized === "multiplayer" ? "Multi" : "Daily";
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
            this.setMultiplayerStatus("Ustvari sobo ali se pridruži z drugo kartico.");
          }
        }
      }
    }

    if (normalized === "single") {
      this.hideOpponentBoard();
      this.showMessage("Single mode je aktiven.", "info", 1800);
    } else {
      this.showMessage("Multiplayer je aktiven. Ustvari sobo ali se pridruži.", "info", 2800);
    }
  }

  // --- Multiplayer room actions ---

  createMultiplayerRoom() {
    if (!this.game) return;
    if (!this.game.multiplayer) {
      this.game.multiplayer = new Multiplayer({ game: this.game, ui: this });
    }
    const nickname = this.promptForNickname();
    if (!nickname) return;
    this.game.multiplayer.setNickname(nickname);

    const topic = this.mpTopicSelect?.value || "mešano";
    const wordLength = this.selectedWordLength || 5;

    let answer = null;
    if (this.game.dictionary) {
      answer = this.game.dictionary.getRandomByTopic(topic, wordLength);
    }
    if (!answer) answer = this.game.dictionary?.getRandomAnswer() || this.game.answer;

    this.game.topic = topic;
    this.game.restart([answer]);

    const roomCode = this.game.multiplayer.createRoom();
    if (roomCode) {
      this.showMessage(`Soba ustvarjena! Koda: ${roomCode}`, "info", 3200);
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
    this.showMessage(`Pridružujem se sobi ${roomCode.toUpperCase()}...`, "info", 2400);
  }

  leaveMultiplayerRoom() {
    if (!this.game?.multiplayer) {
      this.setMultiplayerStatus("Nimaš aktivne sobe.");
      return;
    }
    this.game.multiplayer.leaveRoom();
    this.showMessage("Zapustil/a si sobo.", "info", 2400);
  }

  promptForNickname() {
    const previous = window.localStorage.getItem("besedko-nickname") || "";
    const value = window.prompt("Vnesi vzdevek:", previous || "Igralec");
    if (value === null) return null;
    const nickname = value.trim();
    if (!nickname) return null;
    window.localStorage.setItem("besedko-nickname", nickname);
    return nickname;
  }

  // --- Opponent board ---

  showOpponentBoard() {
    this.opponentBoardWrapper?.removeAttribute("hidden");
    this.mainElement?.classList.add("mp-active");
    this.game?.initOpponentBoard();
  }

  hideOpponentBoard() {
    this.opponentBoardWrapper?.setAttribute("hidden", "");
    this.mainElement?.classList.remove("mp-active");
  }

  setOpponentNickname(name) {
    if (this.opponentLabel) {
      this.opponentLabel.textContent = name || "Nasprotnik";
    }
  }

  // --- Status display ---

  setRoomCode(code) {
    if (this.roomCodeElement) {
      this.roomCodeElement.textContent = code ? `Soba: ${code}` : "Soba: -";
    }
    // Hide settings while a room is active; show them when no room is open.
    if (this.mpSettings) this.mpSettings.hidden = Boolean(code);
  }

  setMultiplayerStatus(text) {
    if (!this.multiplayerStatusElement) return;
    this.multiplayerStatusElement.textContent = text;
  }

  // --- Messages ---

  showMessage(text, type = "info", duration = 2600) {
    if (!this.messageElement) return;
    this.messageElement.textContent = text;
    this.messageElement.className = `message ${type} visible`;
    this.messageElement.style.display = "flex";
    if (this.hideTimer) clearTimeout(this.hideTimer);
    if (duration > 0) {
      this.hideTimer = setTimeout(() => this.hideMessage(), duration);
    }
  }

  hideMessage() {
    if (!this.messageElement) return;
    this.messageElement.textContent = "";
    this.messageElement.className = "message hidden";
    this.messageElement.style.display = "none";
  }

  showHint(text) {
    this.showMessage(text, "info", 4200);
  }

  // --- Stats ---

  showStats() {
    if (!this.statsModal || !this.storage) return;
    const stats = this.storage.getStats();
    if (this.statsPlayed) this.statsPlayed.textContent = stats.played || 0;
    if (this.statsWins) this.statsWins.textContent = stats.wins || 0;
    this.statsModal.classList.add("visible");
  }

  hideStats() {
    this.statsModal?.classList.remove("visible");
  }

  updateHeaderStats(played = 0, wins = 0) {
    if (this.statsSummary) this.statsSummary.textContent = `${wins}/${played}`;
  }

  updateRound(current = 1, total = 1) {
    if (this.roundSummary) this.roundSummary.textContent = `${current}/${total}`;
  }

  updateDailyMode() {
    if (this.dailyMode) this.dailyMode.textContent = "Daily";
  }

  updateHintButton() {
    if (!this.hintButton) return;
    const disabled = !this.game || this.game.gameOver || this.game.hintUsed;
    this.hintButton.disabled = disabled;
    this.hintButton.style.opacity = disabled ? "0.5" : "1";
    this.hintButton.setAttribute("aria-disabled", disabled ? "true" : "false");
  }
}
