import { Multiplayer } from "./multiplayer.js?v=20260626-22";
import { config } from "./config.js?v=20260626-22";

export class UI {
  constructor(storage) {
    this.storage = storage;
    this.game = null;
    this.selectedWordLength = 5;
    this.selectedRows = 6;
    this.selectedTopic = "mešano";

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
    this.hintsToggle = document.getElementById("hints-toggle");
    this.keyboardActions = document.querySelector(".keyboard-actions");
    this.themeToggle = document.getElementById("theme-toggle");
    this.gameModeButtons = document.querySelectorAll(".game-mode-btn");
    this.gameModeDesc = document.getElementById("game-mode-desc");
    this.gameTimerEl = document.getElementById("game-timer");
    this.gameTimerDisplay = document.getElementById("game-timer-display");
    this.gameTimerScore = document.getElementById("game-timer-score");
    this.mpGamemodeBtns = document.querySelectorAll(".mp-gamemode-btn");
    this.selectedGameMode = "classic";
    this.statsSummary = document.getElementById("stats-summary");
    this.roundSummary = document.getElementById("round-summary");
    this.dailyMode = document.getElementById("daily-mode");
    this.modeSingleButton = document.getElementById("mode-single");
    this.modeMultiButton = document.getElementById("mode-multi");

    // Multiplayer panel
    this.multiplayerPanel = document.querySelector(".multiplayer-panel");
    this.multiplayerStatusElement = document.getElementById("multiplayer-status");

    // Pre-room
    this.mpPreroom = document.getElementById("mp-preroom");
    this.createRoomButton = document.getElementById("multiplayer-create");
    this.joinRoomButton = document.getElementById("multiplayer-join");

    // In-room
    this.mpInroom = document.getElementById("mp-inroom");
    this.mpRoomCodeDisplay = document.getElementById("mp-room-code-display");
    this.mpMyName = document.getElementById("mp-my-name");
    this.mpRoomTopicDisplay = document.getElementById("mp-room-topic-display");
    this.leaveRoomButton = document.getElementById("multiplayer-leave");
    this.mpConfirm = document.getElementById("mp-confirm");
    this.mpConfirmText = document.getElementById("mp-confirm-text");
    this.mpConfirmYes = document.getElementById("mp-confirm-yes");
    this.mpConfirmNo = document.getElementById("mp-confirm-no");

    // Create modal
    this.mpCreateModal = document.getElementById("mp-create-modal");
    this.mpCreateClose = document.getElementById("mp-create-close");
    this.mpModalNickname = document.getElementById("mp-modal-nickname");
    this.mpModalCreateBtn = document.getElementById("mp-modal-create-btn");
    this.mpTopicContainer = document.getElementById("mp-topic-buttons");
    this.mpLengthButtons = document.querySelectorAll(".mp-length-btn");
    this.mpRowsButtons = document.querySelectorAll(".mp-rows-btn");

    // Join modal
    this.mpJoinModal = document.getElementById("mp-join-modal");
    this.mpJoinClose = document.getElementById("mp-join-close");
    this.mpJoinNickname = document.getElementById("mp-join-nickname");
    this.mpJoinCode = document.getElementById("mp-join-code");
    this.mpModalJoinBtn = document.getElementById("mp-modal-join-btn");

    // Auth
    this.authBtn = document.getElementById("auth-btn");
    this.authUserChip = document.getElementById("auth-user-chip");
    this.authAvatar = document.getElementById("auth-avatar");
    this.authChipName = document.getElementById("auth-chip-name");
    this.authModal = document.getElementById("auth-modal");
    this.authViewLogin = document.getElementById("auth-view-login");
    this.authViewProfile = document.getElementById("auth-view-profile");
    this.authClose = document.getElementById("auth-close");
    this.authCloseProfile = document.getElementById("auth-close-profile");
    this.authGoogleBtn = document.getElementById("auth-google-btn");
    this.authNameInput = document.getElementById("auth-name-input");
    this.authEmailInput = document.getElementById("auth-email");
    this.authPasswordInput = document.getElementById("auth-password");
    this.authSigninBtn = document.getElementById("auth-signin-btn");
    this.authRegisterBtn = document.getElementById("auth-register-btn");
    this.authError = document.getElementById("auth-error");
    this.authProfileAvatar = document.getElementById("auth-profile-avatar");
    this.authProfileName = document.getElementById("auth-profile-name");
    this.authProfileEmail = document.getElementById("auth-profile-email");
    this.authLogoutBtn = document.getElementById("auth-logout-btn");
    this.profileStatsPlayed = document.getElementById("profile-stats-played");
    this.profileStatsWins = document.getElementById("profile-stats-wins");
    this.profileStatsPct = document.getElementById("profile-stats-pct");
    this.langSlBtn = document.getElementById("lang-sl-btn");
    this.langIntBtn = document.getElementById("lang-int-btn");
    this.profileNewGameBtn = document.getElementById("profile-new-game-btn");

    // Opponent board
    this.opponentBoardWrapper = document.getElementById("opponent-board-wrapper");
    this.opponentLabel = document.getElementById("opponent-label");
    this.mainElement = document.querySelector("main");

    // Riddle panel
    this.riddlePanel = document.getElementById("riddle-panel");
    this.riddleCluesEl = document.getElementById("riddle-clues");
    this.riddleNextClueBtn = document.getElementById("riddle-next-clue-btn");
    this.riddleInput = document.getElementById("riddle-input");
    this.riddleSubmitBtn = document.getElementById("riddle-submit-btn");
    this.riddleResultEl = document.getElementById("riddle-result");
    this.riddleNextBtn = document.getElementById("riddle-next-btn");
    this.boardsContainer = document.getElementById("boards-container");
    this.riddleGame = null;

    this.hideTimer = null;
    this._authCallbacks = {};
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
    this.hintButton?.addEventListener("click", () => this.game && this.game.requestHint());
    this.modeSingleButton?.addEventListener("click", () => this.setMode("single"));
    this.modeMultiButton?.addEventListener("click", () => this.setMode("multiplayer"));

    // Pre-room buttons → open modals
    this.createRoomButton?.addEventListener("click", () => this.openCreateModal());
    this.joinRoomButton?.addEventListener("click", () => this.openJoinModal());

    // In-room
    this.leaveRoomButton?.addEventListener("click", () => this.leaveMultiplayerRoom());
    this.mpConfirmYes?.addEventListener("click", () => this.game?.multiplayer?.confirmGuest());
    this.mpConfirmNo?.addEventListener("click", () => this.game?.multiplayer?.rejectGuest());

    // Auth
    this.authBtn?.addEventListener("click", () => this.openAuthModal());
    this.authUserChip?.addEventListener("click", () => this.openAuthModal());
    this.authClose?.addEventListener("click", () => this.closeAuthModal());
    this.authCloseProfile?.addEventListener("click", () => this.closeAuthModal());
    this.authModal?.addEventListener("click", (e) => {
      if (e.target === this.authModal) this.closeAuthModal();
    });
    this.authGoogleBtn?.addEventListener("click", () => this._authCallbacks.onGoogle?.());
    this.authSigninBtn?.addEventListener("click", () => this._authCallbacks.onSignin?.());
    this.authRegisterBtn?.addEventListener("click", () => this._authCallbacks.onRegister?.());
    this.authLogoutBtn?.addEventListener("click", () => this._authCallbacks.onLogout?.());
    this.authPasswordInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this._authCallbacks.onSignin?.();
    });
    this.langSlBtn?.addEventListener("click", () => this._setLang("sl"));
    this.langIntBtn?.addEventListener("click", () => this._setLang("int"));
    this.profileNewGameBtn?.addEventListener("click", () => {
      if (!this.game) return;
      const daily = this.game.dictionary?.getDailyAnswer() || this.game.dictionary?.getRandomAnswer();
      if (daily) this.game.restart([daily]);
      this.closeAuthModal();
    });
    this.hintsToggle?.addEventListener("click", () => this._toggleHints());
    this._initHints();
    this.themeToggle?.addEventListener("click", () => this._toggleTheme());
    this._initTheme();
    this.gameModeButtons?.forEach((btn) => {
      btn.addEventListener("click", () => this.game?.setGameMode(btn.dataset.mode));
    });
    this.mpGamemodeBtns?.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedGameMode = btn.dataset.mode;
        this.mpGamemodeBtns.forEach((b) => b.classList.toggle("active", b === btn));
      });
    });

    // Create modal
    this.mpCreateClose?.addEventListener("click", () => this.closeCreateModal());
    this.mpCreateModal?.addEventListener("click", (e) => {
      if (e.target === this.mpCreateModal) this.closeCreateModal();
    });
    this.mpModalCreateBtn?.addEventListener("click", () => this.confirmCreateRoom());
    this.mpModalNickname?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.confirmCreateRoom();
    });

    // Join modal
    this.mpJoinClose?.addEventListener("click", () => this.closeJoinModal());
    this.mpJoinModal?.addEventListener("click", (e) => {
      if (e.target === this.mpJoinModal) this.closeJoinModal();
    });
    this.mpModalJoinBtn?.addEventListener("click", () => this.confirmJoinRoom());
    this.mpJoinCode?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.confirmJoinRoom();
    });
    this.mpJoinCode?.addEventListener("input", (e) => {
      e.target.value = e.target.value.toUpperCase();
    });

    // Settings buttons (now inside create modal)
    this.mpLengthButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedWordLength = parseInt(btn.dataset.length, 10) || 5;
        this.mpLengthButtons.forEach((b) => b.classList.toggle("active", b === btn));
      });
    });
    this.mpRowsButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedRows = parseInt(btn.dataset.rows, 10) || 6;
        this.mpRowsButtons.forEach((b) => b.classList.toggle("active", b === btn));
      });
    });
  }

  /** Build topic toggle buttons from dictionary. */
  populateTopics() {
    if (!this.mpTopicContainer || !this.game?.dictionary) return;
    const topics = this.game.dictionary.getTopics();
    this.mpTopicContainer.innerHTML = "";
    topics.forEach(({ key, label, icon }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mp-topic-btn" + (key === this.selectedTopic ? " active" : "");
      btn.dataset.topic = key;
      btn.title = label;
      btn.innerHTML = icon
        ? `<span class="mp-topic-icon">${icon}</span><span class="mp-topic-label">${label}</span>`
        : label;
      btn.addEventListener("click", () => {
        this.selectedTopic = key;
        this.mpTopicContainer.querySelectorAll(".mp-topic-btn").forEach((b) =>
          b.classList.toggle("active", b === btn)
        );
      });
      this.mpTopicContainer.appendChild(btn);
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
      this.dailyMode.textContent = normalized === "multiplayer" ? "Multi" : "Daily";
    }
    if (this.multiplayerPanel) {
      this.multiplayerPanel.classList.toggle("visible", normalized === "multiplayer");
    }
    if (this.mainElement) {
      this.mainElement.classList.toggle("mp-mode", normalized === "multiplayer");
    }

    if (this.game) {
      this.game.mode = normalized;
      if (normalized === "multiplayer") {
        if (!this.game.multiplayer) {
          this.game.multiplayer = new Multiplayer({
            game: this.game, ui: this, firebaseUrl: config.firebaseUrl,
          });
        }
        if (!this.game.multiplayer.roomId) {
          const restored = this.game.multiplayer.restoreSession();
          if (!restored && this.game.multiplayer.available) {
            this.setMultiplayerStatus("Ustvari sobo ali se pridruži z drugo napravo.");
          }
        }
      }
    }

    if (normalized === "single") {
      this.hideOpponentBoard();
      if (this.game && this.game.cols !== 5) {
        this.game.rows = 6;
        const daily = this.game.dictionary?.getDailyAnswer() || this.game.dictionary?.getRandomAnswer();
        if (daily) this.game.restart([daily]);
      }
    }

  }

  // --- Create modal ---

  openCreateModal() {
    const previous = window.localStorage.getItem("besedko-nickname") || "";
    if (this.mpModalNickname) {
      this.mpModalNickname.value = previous || "Igralec";
    }
    this.mpCreateModal?.classList.add("visible");
    setTimeout(() => this.mpModalNickname?.select(), 50);
  }

  closeCreateModal() {
    this.mpCreateModal?.classList.remove("visible");
  }

  async confirmCreateRoom() {
    const nickname = (this.mpModalNickname?.value || "").trim() || "Igralec";
    window.localStorage.setItem("besedko-nickname", nickname);
    this.closeCreateModal();
    await this._doCreateRoom(nickname);
  }

  // --- Join modal ---

  openJoinModal() {
    const previous = window.localStorage.getItem("besedko-nickname") || "";
    if (this.mpJoinNickname) this.mpJoinNickname.value = previous || "Igralec";
    if (this.mpJoinCode) this.mpJoinCode.value = "";
    this.mpJoinModal?.classList.add("visible");
    setTimeout(() => this.mpJoinCode?.focus(), 80);
  }

  closeJoinModal() {
    this.mpJoinModal?.classList.remove("visible");
  }

  async confirmJoinRoom() {
    const nickname = (this.mpJoinNickname?.value || "").trim() || "Igralec";
    const code = (this.mpJoinCode?.value || "").trim().toUpperCase();
    if (!code) {
      this.mpJoinCode?.focus();
      return;
    }
    window.localStorage.setItem("besedko-nickname", nickname);
    this.closeJoinModal();
    await this._doJoinRoom(nickname, code);
  }

  // --- Internal room operations ---

  async _doCreateRoom(nickname) {
    if (!this.game) return;
    if (!this.game.multiplayer) {
      this.game.multiplayer = new Multiplayer({
        game: this.game, ui: this, firebaseUrl: config.firebaseUrl,
      });
    }
    this.game.multiplayer.setNickname(nickname);

    const topic = this.selectedTopic || "mešano";
    const gameMode = this.selectedGameMode || "classic";
    const rows = this.selectedRows || 6;
    const wordLength = gameMode === "random"
      ? [4, 5, 6][Math.floor(Math.random() * 3)]
      : (this.selectedWordLength || 5);
    let answer = null;
    if (this.game.dictionary) {
      answer = this.game.dictionary.getRandomByTopic(topic, wordLength);
    }
    if (!answer) answer = this.game.dictionary?.getRandomAnswer() || this.game.answer;

    this.game.topic = topic;
    this.game.rows = rows;
    this.game.gameMode = gameMode;
    this.game.hardConstraints = { greens: {}, yellows: new Set() };
    this.game.restart([answer]);
    this.setGameMode(gameMode);
    if (gameMode === "riddle" && this.riddleGame?.current) {
      this.game.currentRiddle = this.riddleGame.current;
    }
    await this.game.multiplayer.createRoom();
  }

  async _doJoinRoom(nickname, code) {
    if (!this.game) return;
    if (!this.game.multiplayer) {
      this.game.multiplayer = new Multiplayer({
        game: this.game, ui: this, firebaseUrl: config.firebaseUrl,
      });
    }
    this.game.multiplayer.setNickname(nickname);
    await this.game.multiplayer.joinRoom(code);
  }

  leaveMultiplayerRoom() {
    if (!this.game?.multiplayer) {
      this.setMultiplayerStatus("Nimaš aktivne sobe.");
      return;
    }
    this.game.multiplayer.leaveRoom();
  }

  // --- Room state display ---

  setRoomCode(code) {
    const inRoom = Boolean(code);
    if (this.mpPreroom) this.mpPreroom.hidden = inRoom;
    if (this.mpInroom) this.mpInroom.hidden = !inRoom;
    if (this.mpRoomCodeDisplay) this.mpRoomCodeDisplay.textContent = code || "–";
    if (!inRoom) {
      this.hideConfirmDialog();
      if (this.mpRoomTopicDisplay) this.mpRoomTopicDisplay.textContent = "–";
    }
  }

  setRoomTopic(topicKey) {
    if (!this.mpRoomTopicDisplay) return;
    if (!topicKey) { this.mpRoomTopicDisplay.textContent = "–"; return; }
    const topics = this.game?.dictionary?.getTopics() || [];
    const found = topics.find((t) => t.key === topicKey);
    this.mpRoomTopicDisplay.textContent = found
      ? `${found.icon ? found.icon + " " : ""}${found.label}`
      : topicKey;
  }

  setPlayerName(name) {
    if (this.mpMyName) this.mpMyName.textContent = name || "–";
  }

  showConfirmDialog(nickname) {
    if (this.mpConfirmText) {
      this.mpConfirmText.textContent = `${nickname} želi vstopiti v sobo.`;
    }
    if (this.mpConfirm) this.mpConfirm.hidden = false;
  }

  hideConfirmDialog() {
    if (this.mpConfirm) this.mpConfirm.hidden = true;
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
    if (this.opponentLabel) this.opponentLabel.textContent = name || "Nasprotnik";
  }

  // --- Auth modal ---

  registerAuthCallbacks(callbacks) {
    this._authCallbacks = callbacks;
  }

  openAuthModal() {
    this.clearAuthError();
    // Refresh profile stats
    if (this.storage) {
      const stats = this.storage.getStats();
      const played = stats.played || 0;
      const wins = stats.wins || 0;
      const pct = played > 0 ? Math.round((wins / played) * 100) : 0;
      if (this.profileStatsPlayed) this.profileStatsPlayed.textContent = played;
      if (this.profileStatsWins) this.profileStatsWins.textContent = wins;
      if (this.profileStatsPct) this.profileStatsPct.textContent = `${pct}%`;
    }
    // Sync active lang button
    const lang = this.game?.keyboard?.lang || localStorage.getItem("besedko-lang") || "sl";
    this.langSlBtn?.classList.toggle("active", lang === "sl");
    this.langIntBtn?.classList.toggle("active", lang === "int");
    // Sync hints toggle
    const hintsOn = this.hintsEnabled();
    this.hintsToggle?.setAttribute("aria-checked", hintsOn ? "true" : "false");
    // Sync theme toggle
    const isLight = document.documentElement.dataset.theme === "light";
    this.themeToggle?.setAttribute("aria-checked", isLight ? "true" : "false");
    this.authModal?.classList.add("visible");
  }

  _setLang(lang) {
    this.game?.keyboard?.setLang(lang);
    this.langSlBtn?.classList.toggle("active", lang === "sl");
    this.langIntBtn?.classList.toggle("active", lang === "int");
  }

  _initHints() {
    const enabled = localStorage.getItem("besedko-hints") !== "false";
    this._setHintsEnabled(enabled);
  }

  _toggleHints() {
    const current = this.hintsToggle?.getAttribute("aria-checked") === "true";
    this._setHintsEnabled(!current);
  }

  _setHintsEnabled(enabled) {
    localStorage.setItem("besedko-hints", enabled ? "true" : "false");
    this.hintsToggle?.setAttribute("aria-checked", enabled ? "true" : "false");
    if (this.keyboardActions) this.keyboardActions.hidden = !enabled;
    this.updateHintButton();
  }

  hintsEnabled() {
    return localStorage.getItem("besedko-hints") !== "false";
  }

  static _modeInfo = {
    classic:    { desc: "6 vrstic, ni omejitev ugibanja.", toast: "Klasičen način — 6 vrstic." },
    hard:       { desc: "Vsako ugibanje mora vsebovati vse ugotovljene črke.", toast: "Težki način 🔥 — ugotovljene črke moraš uporabiti!" },
    timeattack: { desc: "3 minute, reši čim več besed. Za vsako rešeno +10 sekund.", toast: "Časovni napad ⏱ — 3 minute, reši čim več besed!" },
    zen:        { desc: "9 vrstic, brez poraza — igra se nadaljuje z novo besedo.", toast: "Zen način 🧘 — sprosti se, ni poraza." },
    riddle:     { desc: "Ugani besedo ali zvezo iz namigov — čim manj namigov, tem boljše!", toast: "Uganka 🎭 — ugani iz namigov!" },
    random:     { desc: "Naključna beseda — 4, 5 ali 6 črk. Tabela se prilagodi dolžini.", toast: "Naključni način 🎲 — nova dolžina vsako igro!" },
  };

  setGameMode(mode) {
    this.gameModeButtons?.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
    const info = UI._modeInfo[mode] || UI._modeInfo.classic;
    if (this.gameModeDesc) this.gameModeDesc.textContent = info.desc;

    const isRiddle = mode === "riddle";
    const isTimeAttack = mode === "timeattack";

    if (this.boardsContainer) this.boardsContainer.style.display = isRiddle ? "none" : "";
    const kb = document.getElementById("keyboard");
    if (kb) kb.style.display = isRiddle ? "none" : "";
    if (this.keyboardActions) this.keyboardActions.hidden = isRiddle || !this.hintsEnabled();
    if (this.gameTimerEl) this.gameTimerEl.hidden = !isTimeAttack;
    if (this.riddlePanel) this.riddlePanel.hidden = !isRiddle;

    if (isRiddle && this.riddleGame) this.startRiddle();
  }

  setRiddleGame(rg) {
    this.riddleGame = rg;
    this.riddleNextClueBtn?.addEventListener("click", () => this._riddleReveal());
    this.riddleSubmitBtn?.addEventListener("click", () => this._riddleCheck());
    this.riddleInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this._riddleCheck();
    });
    this.riddleNextBtn?.addEventListener("click", () => this.startRiddle());
  }

  startRiddle() {
    if (!this.riddleGame) return;
    this.riddleGame.start();
    this._renderRiddleClues();
    if (this.riddleResultEl) { this.riddleResultEl.hidden = true; this.riddleResultEl.className = "riddle-result"; }
    if (this.riddleNextBtn) this.riddleNextBtn.hidden = true;
    if (this.riddleInput) { this.riddleInput.value = ""; this.riddleInput.disabled = false; }
    if (this.riddleSubmitBtn) this.riddleSubmitBtn.disabled = false;
    this._updateRiddleNextBtn();
  }

  _renderRiddleClues() {
    if (!this.riddleCluesEl || !this.riddleGame?.current) return;
    const clues = this.riddleGame.visibleClues;
    const total = this.riddleGame.totalClues;
    this.riddleCluesEl.innerHTML = clues.map((c, i) =>
      `<div class="riddle-clue"><span class="riddle-clue-num">${i + 1}.</span><span>${c}</span></div>`
    ).join("");
    this.riddleCluesEl.insertAdjacentHTML("beforeend",
      `<p style="text-align:center;color:var(--text-muted);font-size:0.85rem">Namig ${clues.length} / ${total}</p>`
    );
  }

  _updateRiddleNextBtn() {
    if (this.riddleNextClueBtn) this.riddleNextClueBtn.disabled = !this.riddleGame?.canRevealMore;
  }

  _riddleReveal() {
    if (!this.riddleGame) return;
    this.riddleGame.revealNext();
    this._renderRiddleClues();
    this._updateRiddleNextBtn();
    if (this.riddleResultEl && !this.riddleGame.solved && !this.riddleGame.failed) {
      this.riddleResultEl.hidden = true;
    }
  }

  _riddleCheck() {
    if (!this.riddleGame || !this.riddleInput) return;
    const guess = this.riddleInput.value;
    if (!guess.trim()) return;
    const result = this.riddleGame.check(guess);
    if (!result) return;
    if (result.correct) {
      const stars = "⭐".repeat(Math.max(1, result.score));
      this._showRiddleResult(`Bravo! ${stars} (${this.riddleGame.revealedCount} namig${this.riddleGame.revealedCount === 1 ? "" : "i"})`, true);
    } else if (this.riddleGame.failed) {
      this._showRiddleResult(`Odgovor je bil: ${this.riddleGame.current.answer}`, false);
    } else {
      this._riddleReveal();
      this._showRiddleResult("❌ Napačno!", false);
      this.riddleInput.value = "";
      setTimeout(() => { if (this.riddleResultEl) this.riddleResultEl.hidden = true; }, 2000);
      return;
    }
    if (this.riddleInput) this.riddleInput.disabled = true;
    if (this.riddleSubmitBtn) this.riddleSubmitBtn.disabled = true;
    if (this.riddleNextClueBtn) this.riddleNextClueBtn.disabled = true;
    if (this.riddleNextBtn) this.riddleNextBtn.hidden = false;
  }

  _showRiddleResult(text, correct) {
    if (!this.riddleResultEl) return;
    this.riddleResultEl.textContent = text;
    this.riddleResultEl.className = `riddle-result ${correct ? "correct" : "wrong"}`;
    this.riddleResultEl.hidden = false;
  }

  showModeToast(mode) {
    const info = UI._modeInfo[mode] || UI._modeInfo.classic;
    this.showMessage(info.toast, "info", 3000);
  }

  updateTimer(seconds, score = 0) {
    if (!this.gameTimerDisplay) return;
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.max(0, seconds) % 60;
    this.gameTimerDisplay.textContent = `${m}:${String(s).padStart(2, "0")}`;
    if (this.gameTimerScore) this.gameTimerScore.innerHTML = `Besede: <strong>${score}</strong>`;
    if (this.gameTimerEl) this.gameTimerEl.classList.toggle("warning", seconds <= 30 && seconds > 0);
  }

  _initTheme() {
    const light = localStorage.getItem("besedko-theme") === "light";
    this._applyTheme(light);
  }

  _toggleTheme() {
    const isLight = document.documentElement.dataset.theme === "light";
    this._applyTheme(!isLight);
  }

  _applyTheme(light) {
    document.documentElement.dataset.theme = light ? "light" : "dark";
    localStorage.setItem("besedko-theme", light ? "light" : "dark");
    this.themeToggle?.setAttribute("aria-checked", light ? "true" : "false");
  }

  closeAuthModal() {
    this.authModal?.classList.remove("visible");
    this.clearAuthError();
  }

  setAuthBusy(busy) {
    if (this.authGoogleBtn) this.authGoogleBtn.disabled = busy;
    if (this.authSigninBtn) this.authSigninBtn.disabled = busy;
    if (this.authRegisterBtn) this.authRegisterBtn.disabled = busy;
  }

  showAuthError(text) {
    if (!this.authError) return;
    this.authError.textContent = text;
    this.authError.hidden = false;
  }

  clearAuthError() {
    if (this.authError) this.authError.hidden = true;
  }

  /** Call this when auth state changes. user = Firebase user object or null. */
  setAuthUser(user) {
    if (user) {
      // Logged in: show chip, hide login button
      this.authBtn && (this.authBtn.hidden = true);
      this.authUserChip && (this.authUserChip.hidden = false);

      // Set chip content
      const name = user.displayName || user.email?.split("@")[0] || "Uporabnik";
      if (this.authChipName) this.authChipName.textContent = name.slice(0, 14);

      // Avatar: photo or initial
      if (this.authAvatar) {
        if (user.photoURL) {
          this.authAvatar.innerHTML = `<img src="${user.photoURL}" alt="${name}" referrerpolicy="no-referrer" />`;
        } else {
          this.authAvatar.textContent = name[0].toUpperCase();
        }
      }

      // Profile view
      if (this.authViewLogin) this.authViewLogin.hidden = true;
      if (this.authViewProfile) this.authViewProfile.hidden = false;
      if (this.authProfileName) this.authProfileName.textContent = name;
      if (this.authProfileEmail) this.authProfileEmail.textContent = user.email || "";
      if (this.authProfileAvatar) {
        if (user.photoURL) {
          this.authProfileAvatar.innerHTML = `<img src="${user.photoURL}" alt="${name}" referrerpolicy="no-referrer" />`;
        } else {
          this.authProfileAvatar.textContent = name[0].toUpperCase();
        }
      }
    } else {
      // Logged out: show login button, hide chip
      this.authBtn && (this.authBtn.hidden = false);
      this.authUserChip && (this.authUserChip.hidden = true);
      if (this.authViewLogin) this.authViewLogin.hidden = false;
      if (this.authViewProfile) this.authViewProfile.hidden = true;
    }
  }

  getAuthFormValues() {
    return {
      name: (this.authNameInput?.value || "").trim(),
      email: (this.authEmailInput?.value || "").trim(),
      password: this.authPasswordInput?.value || "",
    };
  }

  // --- Status display ---

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
    const disabled = !this.game || this.game.gameOver || this.game.hintUsed || !this.hintsEnabled();
    this.hintButton.disabled = disabled;
    this.hintButton.setAttribute("aria-disabled", disabled ? "true" : "false");
  }
}
