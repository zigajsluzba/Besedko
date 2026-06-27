import { Multiplayer } from "./multiplayer.js?v=20260627-09";
import { config } from "./config.js?v=20260627-09";
import { sounds } from "./sounds.js?v=20260627-14";

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
    this.mpModalPassword = document.getElementById("mp-modal-password");
    this.mpModalCreateBtn = document.getElementById("mp-modal-create-btn");
    this.mpTopicContainer = document.getElementById("mp-topic-buttons");
    this.mpLengthButtons = document.querySelectorAll(".mp-length-btn");
    this.mpRowsButtons = document.querySelectorAll(".mp-rows-btn");
    this.mpCapacityBtns = document.querySelectorAll(".mp-capacity-btn");

    // MP hint
    this.mpHintArea = document.getElementById("mp-hint-area");
    this.mpHintSendBtn = document.getElementById("mp-hint-send-btn");

    // MP lobby
    this.mpLobbyStartBtn = document.getElementById("mp-lobby-start-btn");
    this.mpLobbyLinkInput = document.getElementById("mp-lobby-link-input");
    this.mpLobbyLinkCopy = document.getElementById("mp-lobby-link-copy");
    this._currentRoomCode = null;

    // Lobby browser
    this.mpBrowseBtn = document.getElementById("multiplayer-browse");
    this.mpLobbyBrowser = document.getElementById("mp-lobby-browser");
    this.mpBrowserClose = document.getElementById("mp-browser-close");
    this.mpBrowserList = document.getElementById("mp-browser-list");
    this.mpBrowserRefresh = document.getElementById("mp-browser-refresh");
    this._browserInterval = null;

    // Join modal
    this.mpJoinModal = document.getElementById("mp-join-modal");
    this.mpJoinClose = document.getElementById("mp-join-close");
    this.mpJoinNickname = document.getElementById("mp-join-nickname");
    this.mpJoinCode = document.getElementById("mp-join-code");
    this.mpJoinPassword = document.getElementById("mp-join-password");
    this.mpJoinPasswordField = document.getElementById("mp-join-password-field");
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

    this.mainElement = document.querySelector("main");
    this._pendingConfirmSessionId = null;
    this._riddleGuessCount = 0;

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

    // Live stats bar
    this.liveStatsEl = document.getElementById("game-live-stats");
    this.liveTimerEl = document.getElementById("live-timer");
    this.liveGuessesEl = document.getElementById("live-guesses");
    this.liveStartedEl = document.getElementById("live-started");
    this._liveStatsInterval = null;

    // Reveal bar
    this.revealBarEl = document.getElementById("reveal-bar");
    this._revealCountdownInterval = null;

    // Mode ready overlay
    this.modeReadyOverlay = document.getElementById("mode-ready-overlay");
    this._avatarGridOpen = false;

    // Identity card
    this.nicknameInput   = document.getElementById("nickname-input");
    this.nicknameSaveBtn = document.getElementById("nickname-save-btn");
    this.identityAvatar  = document.getElementById("identity-avatar-btn");
    this.avatarGrid      = document.getElementById("avatar-grid");
    this.headerAvatar    = document.getElementById("header-avatar");

    // MP mode display
    this.mpRoomModeDisplay = document.getElementById("mp-room-mode-display");

    // Tile swap
    this._swapSelectedCol = null;

    // MP emoji panel & toast
    this.mpEmojiPanel = document.getElementById("mp-emoji-panel");
    this.mpEmojiToast = document.getElementById("mp-emoji-toast");
    this.mpEmojiToastEmoji = document.getElementById("mp-emoji-toast-emoji");
    this.mpEmojiToastFrom = document.getElementById("mp-emoji-toast-from");
    this._emojiToastTimer = null;

    // MP rematch area
    this.mpRematchArea = document.getElementById("mp-rematch-area");
    this.mpRematchBtn = document.getElementById("mp-rematch-btn");
    this.mpRematchNotification = document.getElementById("mp-rematch-notification");
    this.mpRematchAcceptBtn = document.getElementById("mp-rematch-accept-btn");

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
    this._startLiveStats();
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
    this.mpConfirmYes?.addEventListener("click", () => {
      const sid = this._pendingConfirmSessionId;
      if (sid) this.game?.multiplayer?.confirmPlayer(sid);
    });
    this.mpConfirmNo?.addEventListener("click", () => {
      const sid = this._pendingConfirmSessionId;
      if (sid) this.game?.multiplayer?.rejectPlayer(sid);
    });
    this.mpHintSendBtn?.addEventListener("click", () => {
      this.game?.multiplayer?.sendHint();
    });
    this.mpLobbyStartBtn?.addEventListener("click", () => {
      this.game?.multiplayer?.startGameManual();
    });

    // Lobby browser
    this.mpBrowseBtn?.addEventListener("click", () => this.openLobbyBrowser());
    this.mpBrowserClose?.addEventListener("click", () => this.closeLobbyBrowser());
    this.mpLobbyBrowser?.addEventListener("click", (e) => {
      if (e.target === this.mpLobbyBrowser) this.closeLobbyBrowser();
    });
    this.mpBrowserRefresh?.addEventListener("click", () => this._loadBrowserRooms());

    // Lobby slot actions (kick + inline confirm/reject) — delegated
    document.getElementById("mp-lobby-slots")?.addEventListener("click", (e) => {
      const kick = e.target.closest(".slot-kick-btn");
      if (kick) { this.game?.multiplayer?.kickPlayer(kick.dataset.sid); return; }
      const yes = e.target.closest(".slot-confirm-yes");
      if (yes) { this.game?.multiplayer?.confirmPlayer(yes.dataset.sid); return; }
      const no = e.target.closest(".slot-confirm-no");
      if (no) { this.game?.multiplayer?.rejectPlayer(no.dataset.sid); return; }
    });
    this.mpLobbyLinkCopy?.addEventListener("click", async (e) => {
      const val = this.mpLobbyLinkInput?.value;
      if (!val) return;
      try {
        await navigator.clipboard.writeText(val);
      } catch {
        this.mpLobbyLinkInput?.select();
        document.execCommand("copy");
      }
      e.currentTarget.textContent = "✓ Kopirano!";
      setTimeout(() => { e.currentTarget.textContent = "📋 Kopiraj"; }, 2000);
    });

    // Auto-open join modal when URL contains ?join=CODE
    const joinParam = new URLSearchParams(location.search).get("join");
    if (joinParam) {
      history.replaceState(null, "", location.pathname);
      setTimeout(() => {
        this.openJoinModal();
        if (this.mpJoinCode) this.mpJoinCode.value = joinParam.toUpperCase();
      }, 400);
    }

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
    document.getElementById("mp-modal-gen-password")?.addEventListener("click", () => {
      if (this.mpModalPassword) this.mpModalPassword.value = this._genLobbyPassword();
    });
    document.getElementById("mp-modal-clear-password")?.addEventListener("click", () => {
      if (this.mpModalPassword) this.mpModalPassword.value = "";
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
    this.mpJoinCode?.addEventListener("focus", () => {
      this.mpJoinCode.scrollIntoView({ behavior: "smooth", block: "center" });
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


    // Emoji buttons
    this.mpEmojiPanel?.querySelectorAll(".mp-emoji-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.game?.multiplayer?.sendEmoji(btn.dataset.emoji);
      });
    });

    // Rematch buttons
    this.mpRematchBtn?.addEventListener("click", () => {
      this.game?.multiplayer?.sendRematchRequest();
      if (this.mpRematchBtn) this.mpRematchBtn.hidden = true;
      if (this.mpRematchNotification) {
        this.mpRematchNotification.textContent = "Čakam na nasprotnika...";
        this.mpRematchNotification.hidden = false;
      }
    });
    this.mpRematchAcceptBtn?.addEventListener("click", () => {
      this.game?.multiplayer?.acceptRematch();
      if (this.mpRematchAcceptBtn) this.mpRematchAcceptBtn.hidden = true;
      if (this.mpRematchNotification) this.mpRematchNotification.hidden = true;
    });

    // End screen buttons
    document.getElementById("end-stats-btn")?.addEventListener("click", () => {
      this.hideEndScreen();
      this.showStats();
    });
    document.getElementById("end-new-game-btn")?.addEventListener("click", () => {
      this.hideEndScreen();
      this.game?.newGame?.() || location.reload();
    });
    document.getElementById("end-overlay")?.addEventListener("click", e => {
      if (e.target.id === "end-overlay") this.hideEndScreen();
    });

    document.getElementById("mode-ready-btn")?.addEventListener("click", () => {
      this._hideReadyOverlay();
      this.game?.startModeGame();
    });

    // Sounds toggles (header + profile)
    const updateSoundBtns = (on) => {
      const hdr = document.getElementById("sounds-toggle-header");
      const prf = document.getElementById("sounds-toggle");
      if (hdr) hdr.textContent = on ? "🔊" : "🔇";
      if (prf) { prf.setAttribute("aria-checked", String(on)); prf.classList.toggle("active", on); }
    };
    updateSoundBtns(sounds.enabled);
    document.getElementById("sounds-toggle-header")?.addEventListener("click", () => {
      updateSoundBtns(sounds.toggle());
    });
    document.getElementById("sounds-toggle")?.addEventListener("click", () => {
      updateSoundBtns(sounds.toggle());
    });

    this._initTileSwap();

    // Mark MP nickname inputs as user-edited when user types in them
    this.mpModalNickname?.addEventListener("input", () => { if (this.mpModalNickname) this.mpModalNickname._userEdited = true; });
    document.getElementById("mp-join-nickname")?.addEventListener("input", e => { e.target._userEdited = true; });

    // ── Identity: avatar + nickname ──
    this._initIdentity();
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

    if (normalized === "multiplayer") {
      // Hide all game UI until the game actually starts (onMpGameStart will reveal it).
      if (this.revealBarEl) this.revealBarEl.hidden = true;
      if (this.riddlePanel) this.riddlePanel.hidden = true;
      if (this.gameTimerEl) this.gameTimerEl.hidden = true;
      if (this.liveStatsEl) this.liveStatsEl.hidden = true;
      const myBoard = document.getElementById("my-board-wrapper");
      if (myBoard) myBoard.style.display = "";
      const kb = document.getElementById("keyboard");
      if (kb) kb.style.display = "";
      if (this._revealCountdownInterval) { clearInterval(this._revealCountdownInterval); this._revealCountdownInterval = null; }
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
      this.hideAllOpponentBoards();
      if (this.game && this.game.cols !== 5) {
        this.game.rows = 6;
        const daily = this.game.dictionary?.getDailyAnswer() || this.game.dictionary?.getRandomAnswer();
        if (daily) this.game.restart([daily]);
      }
    }

  }

  // --- Create modal ---

  _genLobbyPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  openCreateModal() {
    if (this.mpModalNickname && !this.mpModalNickname._userEdited) {
      const nick = this.storage?.getNickname() || window.localStorage.getItem("besedko-nickname") || "";
      this.mpModalNickname.value = nick || "Igralec";
    }
    if (this.mpModalPassword) this.mpModalPassword.value = "";
    this.mpCreateModal?.classList.add("visible");
    this._syncNicknameToMP();
    setTimeout(() => this.mpModalNickname?.select(), 50);
  }

  closeCreateModal() {
    this.mpCreateModal?.classList.remove("visible");
  }

  async confirmCreateRoom() {
    const nickname = (this.mpModalNickname?.value || "").trim() || "Igralec";
    const password = (this.mpModalPassword?.value || "").trim();
    window.localStorage.setItem("besedko-nickname", nickname);
    this.closeCreateModal();
    await this._doCreateRoom(nickname, password);
  }

  // --- Join modal ---

  openJoinModal() {
    const joinNick = document.getElementById("mp-join-nickname");
    if (joinNick && !joinNick._userEdited) {
      const nick = this.storage?.getNickname() || window.localStorage.getItem("besedko-nickname") || "";
      joinNick.value = nick || "Igralec";
    }
    if (this.mpJoinCode) this.mpJoinCode.value = "";
    if (this.mpJoinPassword) this.mpJoinPassword.value = "";
    if (this.mpJoinPasswordField) this.mpJoinPasswordField.hidden = true;
    this.mpJoinModal?.classList.add("visible");
    this._syncNicknameToMP();
    setTimeout(() => this.mpJoinCode?.focus(), 80);
  }

  async _checkRoomPassword(code) {
    try {
      const res = await fetch(`${config.firebaseUrl}/rooms/${code}/password.json`);
      if (!res.ok) return null;
      return await res.json(); // null if no password, string if set
    } catch { return null; }
  }

  closeJoinModal() {
    this.mpJoinModal?.classList.remove("visible");
  }

  async confirmJoinRoom() {
    const nickname = (this.mpJoinNickname?.value || "").trim() || "Igralec";
    const code = (this.mpJoinCode?.value || "").trim().toUpperCase();
    if (!code) { this.mpJoinCode?.focus(); return; }

    // If room has a password, validate before proceeding.
    const roomPw = await this._checkRoomPassword(code);
    if (roomPw) {
      const entered = (this.mpJoinPassword?.value || "").trim();
      if (!entered) {
        // Show password field and ask user to enter it.
        if (this.mpJoinPasswordField) this.mpJoinPasswordField.hidden = false;
        this.mpJoinPassword?.focus();
        return;
      }
      if (entered.toUpperCase() !== roomPw.toUpperCase()) {
        if (this.mpJoinPasswordField) this.mpJoinPasswordField.hidden = false;
        if (this.mpJoinPassword) { this.mpJoinPassword.value = ""; this.mpJoinPassword.placeholder = "Napačno geslo – poskusi znova"; this.mpJoinPassword.focus(); }
        return;
      }
    }

    window.localStorage.setItem("besedko-nickname", nickname);
    this.closeJoinModal();
    await this._doJoinRoom(nickname, code);
  }

  // --- Internal room operations ---

  async _doCreateRoom(nickname, password = "") {
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
    await this.game.multiplayer.createRoom(password || null);
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
    this._currentRoomCode = code || null;
    const inRoom = Boolean(code);
    if (this.mpPreroom) this.mpPreroom.hidden = inRoom;
    if (this.mpInroom) this.mpInroom.hidden = !inRoom;
    if (this.mpRoomCodeDisplay) this.mpRoomCodeDisplay.textContent = code || "–";
    if (!inRoom) {
      this.hideConfirmDialog();
      this.hideMpEmojiPanel();
      this.hideMpRematch();
      this.hideMpHintBtn();
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

  showConfirmDialog(nickname, sessionId) {
    this._pendingConfirmSessionId = sessionId || null;
    if (this.mpConfirmText) {
      this.mpConfirmText.textContent = `${nickname} želi vstopiti v sobo.`;
    }
    if (this.mpConfirm) this.mpConfirm.hidden = false;
  }

  hideConfirmDialog() {
    if (this.mpConfirm) this.mpConfirm.hidden = true;
    this._pendingConfirmSessionId = null;
  }

  // --- Lobby ---

  updateLobby(players, joinReqs, mySessionId, gameStarted) {
    const lobby = document.getElementById("mp-lobby");
    if (!lobby) return;
    lobby.hidden = Boolean(gameStarted);
    if (gameStarted) return;

    const me = players[mySessionId];
    const isHost = me?.isHost === true;

    // Build ordered slot list: me first, then others by joinedAt, then pending, then 1 open slot
    const others = Object.entries(players)
      .filter(([sid]) => sid !== mySessionId)
      .sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0));
    const pending = Object.entries(joinReqs || {})
      .filter(([sid, r]) => r && !players[sid] && sid !== mySessionId);

    const slots = [];
    if (me) slots.push({ sid: mySessionId, player: me, isMe: true });
    for (const [sid, p] of others) slots.push({ sid, player: p, isMe: false });
    for (const [sid, r] of pending) slots.push({ sid, pending: true, nickname: r.nickname });
    slots.push(null); // always one open slot at the end

    const slotsEl = document.getElementById("mp-lobby-slots");
    if (slotsEl) {
      slotsEl.innerHTML = slots.map(s => {
        if (!s) return `<div class="mp-player-slot"><span class="slot-icon">⏳</span><span class="slot-name">Čaka...</span></div>`;
        if (s.pending) {
          const btns = isHost
            ? `<div class="slot-confirm-btns"><button class="slot-confirm-yes" data-sid="${s.sid}" type="button">✓</button><button class="slot-confirm-no" data-sid="${s.sid}" type="button">✕</button></div>`
            : '<span class="slot-tag">čaka</span>';
          return `<div class="mp-player-slot slot-pending"><span class="slot-icon">⌛</span><span class="slot-name">${this._escHtml(s.nickname)}</span>${btns}</div>`;
        }
        if (s.isMe) return `<div class="mp-player-slot slot-me"><span class="slot-icon">${this._escHtml(this.storage?.getAvatar() || "🙋")}</span><span class="slot-name">${this._escHtml(s.player.nickname)}</span><span class="slot-tag">jaz</span></div>`;
        const tag = s.player.isHost ? '<span class="slot-tag">gostitelj</span>' : '';
        const kickBtn = (isHost && !s.player.isHost)
          ? `<button class="slot-kick-btn" data-sid="${s.sid}" title="Odstrani" type="button">✕</button>` : '';
        return `<div class="mp-player-slot slot-filled">${kickBtn}<span class="slot-icon">${this._escHtml(s.player.avatar || "👤")}</span><span class="slot-name">${this._escHtml(s.player.nickname)}</span>${tag}</div>`;
      }).join("");
    }

    // Start button: only for host, enabled when ≥2 players confirmed
    if (this.mpLobbyStartBtn) {
      const confirmedCount = Object.keys(players).length;
      this.mpLobbyStartBtn.hidden = !isHost;
      this.mpLobbyStartBtn.disabled = confirmedCount < 2;
    }

    // Invite link: always shown while waiting
    const linkArea = document.getElementById("mp-lobby-link");
    if (linkArea && this.mpLobbyLinkInput && this._currentRoomCode) {
      const url = `${location.origin}${location.pathname}?join=${encodeURIComponent(this._currentRoomCode)}`;
      this.mpLobbyLinkInput.value = url;
      linkArea.hidden = false;
    }
  }

  // --- Lobby browser ---

  openLobbyBrowser() {
    this.mpLobbyBrowser?.classList.add("visible");
    this._loadBrowserRooms();
    this._browserInterval = setInterval(() => this._loadBrowserRooms(), 6000);
  }

  closeLobbyBrowser() {
    this.mpLobbyBrowser?.classList.remove("visible");
    if (this._browserInterval) { clearInterval(this._browserInterval); this._browserInterval = null; }
  }

  async _loadBrowserRooms() {
    if (!this.mpBrowserList) return;
    try {
      const res = await fetch(`${config.firebaseUrl}/rooms.json`);
      const all = res.ok ? await res.json() : null;
      if (!all) { this.mpBrowserList.innerHTML = `<span class="mp-browser-empty">Ni odprtih sob.</span>`; return; }
      const now = Date.now();
      const rooms = Object.entries(all)
        .filter(([, r]) => r?.status === "waiting" && (now - (r.created_at || 0)) < 86_400_000)
        .map(([code, r]) => ({
          code,
          host: Object.values(r.players || {}).find(p => p.isHost)?.nickname || "?",
          topic: r.topic || "mešano",
          playerCount: Object.keys(r.players || {}).length,
          locked: !!r.password,
        }));
      if (rooms.length === 0) { this.mpBrowserList.innerHTML = `<span class="mp-browser-empty">Ni odprtih sob.</span>`; return; }
      const topics = this.game?.dictionary?.getTopics() || [];
      this.mpBrowserList.innerHTML = rooms.map(r => {
        const topicObj = topics.find(t => t.key === r.topic);
        const topicLabel = topicObj ? `${topicObj.icon ? topicObj.icon + " " : ""}${topicObj.label}` : r.topic;
        return `<div class="mp-browser-row">
          <div class="mp-browser-info">
            <span class="mp-browser-host">${r.locked ? "🔒" : "👤"} ${this._escHtml(r.host)}</span>
            <span class="mp-browser-meta">${this._escHtml(topicLabel)} · ${r.playerCount} ${r.playerCount === 1 ? "igralec" : "igralci"}</span>
          </div>
          <button class="secondary-button mp-browser-join-btn" data-code="${this._escHtml(r.code)}" type="button">Pridruži se →</button>
        </div>`;
      }).join("");
      this.mpBrowserList.querySelectorAll(".mp-browser-join-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          this.closeLobbyBrowser();
          this.openJoinModal();
          if (this.mpJoinCode) this.mpJoinCode.value = btn.dataset.code;
        });
      });
    } catch (e) {
      this.mpBrowserList.innerHTML = `<span class="mp-browser-empty">Napaka pri nalaganju.</span>`;
    }
  }

  _escHtml(str) {
    return (str || "").replace(/[&<>"']/g,
      c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // --- Opponent boards (dynamic) ---

  showOpponentBoard(sessionId, nickname) {
    if (document.getElementById(`opp-wrapper-${sessionId}`)) {
      // Already exists — just update label if needed
      const label = document.getElementById(`opp-label-${sessionId}`);
      if (label) label.textContent = nickname || "Nasprotnik";
      return;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "board-wrapper board-wrapper--opponent";
    wrapper.id = `opp-wrapper-${sessionId}`;

    const label = document.createElement("div");
    label.className = "board-label";
    label.id = `opp-label-${sessionId}`;
    label.textContent = nickname || "Nasprotnik";

    const boardEl = document.createElement("section");
    boardEl.id = `opp-board-${sessionId}`;
    boardEl.className = "board board--opponent";
    boardEl.setAttribute("aria-label", `${nickname || "Nasprotnik"}eva tabla`);

    wrapper.appendChild(label);
    wrapper.appendChild(boardEl);
    this.boardsContainer?.appendChild(wrapper);
    this.mainElement?.classList.add("mp-active");
    this.game?.initOpponentBoard(sessionId, `opp-board-${sessionId}`);
  }

  hideOpponentBoard(sessionId) {
    document.getElementById(`opp-wrapper-${sessionId}`)?.remove();
    if (this.game) delete this.game.opponentBoards[sessionId];
    if (!this.boardsContainer?.querySelector(".board-wrapper--opponent, .opp-riddle-card")) {
      this.mainElement?.classList.remove("mp-active");
    }
  }

  hideAllOpponentBoards() {
    this.boardsContainer?.querySelectorAll(".board-wrapper--opponent, .opp-riddle-card")
      .forEach(el => el.remove());
    if (this.game) this.game.opponentBoards = {};
    this.mainElement?.classList.remove("mp-active");
  }

  // --- Riddle progress for opponent (#9) ---

  showOpponentRiddleProgress(sessionId, nickname, clueCount, guessCount) {
    let card = document.getElementById(`opp-wrapper-${sessionId}`);
    if (!card) {
      card = document.createElement("div");
      card.className = "opp-riddle-card";
      card.id = `opp-wrapper-${sessionId}`;
      const label = document.createElement("div");
      label.className = "board-label";
      label.id = `opp-label-${sessionId}`;
      label.textContent = nickname || "Nasprotnik";
      const info = document.createElement("div");
      info.className = "opp-riddle-info";
      info.id = `opp-riddle-${sessionId}`;
      card.appendChild(label);
      card.appendChild(info);
      this.boardsContainer?.appendChild(card);
      this.mainElement?.classList.add("mp-active");
    }
    this.updateOpponentRiddleProgress(sessionId, nickname, clueCount, guessCount);
  }

  updateOpponentRiddleProgress(sessionId, nickname, clueCount, guessCount) {
    const info = document.getElementById(`opp-riddle-${sessionId}`);
    if (info) {
      info.innerHTML =
        `<span>💡 ${clueCount} namig${clueCount === 1 ? "" : "i"}</span>` +
        `<span>🎯 ${guessCount} ugibanj</span>`;
    }
  }

  // --- MP hint (#6) ---

  showMpHintBtn() {
    if (this.game?.gameMode === "riddle") return; // no greens in riddle mode
    this.mpHintArea?.removeAttribute("hidden");
  }

  hideMpHintBtn() {
    this.mpHintArea?.setAttribute("hidden", "");
  }

  showHintToast(letter, position, fromName) {
    this.showMessage(
      `💡 ${fromName}: ${position + 1}. črka je '${letter}'`,
      "info",
      5000
    );
  }

  _showReadyOverlay(mode) {
    const cfg = {
      timeattack: { icon: "⏱", title: "Časovni napad", desc: "Imaš 3 minute da uganeš čim več besed." },
      reveal:     { icon: "👁", title: "Razkrivanje",   desc: "Vsake 5 sekund se razkrije ena črka. Ugani preden jih je preveč!" },
    };
    const c = cfg[mode] || { icon: "▶", title: mode, desc: "" };
    const el = id => document.getElementById(id);
    if (el("mode-ready-icon"))  el("mode-ready-icon").textContent  = c.icon;
    if (el("mode-ready-title")) el("mode-ready-title").textContent = c.title;
    if (el("mode-ready-desc"))  el("mode-ready-desc").textContent  = c.desc;
    if (this.modeReadyOverlay)  this.modeReadyOverlay.hidden = false;
  }

  _hideReadyOverlay() {
    if (this.modeReadyOverlay) this.modeReadyOverlay.hidden = true;
  }

  // Called by multiplayer.js when the game actually starts (host + guest).
  onMpGameStart() {
    const mode = this.game?.gameMode || "classic";
    // setGameMode will now run fully because peerConnected is already true.
    this.setGameMode(mode);
    // Show game mode strip description
    if (this.gameModeDesc) {
      const info = UI._modeInfo[mode] || UI._modeInfo.classic;
      this.gameModeDesc.textContent = info.desc;
    }
  }

  // --- MP emoji ---

  showMpEmojiPanel() {
    this.mpEmojiPanel?.removeAttribute("hidden");
  }

  hideMpEmojiPanel() {
    this.mpEmojiPanel?.setAttribute("hidden", "");
  }

  showEmojiToast(emoji, fromName) {
    if (!this.mpEmojiToast) return;
    if (this._emojiToastTimer) clearTimeout(this._emojiToastTimer);

    if (this.mpEmojiToastEmoji) this.mpEmojiToastEmoji.textContent = emoji;
    if (this.mpEmojiToastFrom) this.mpEmojiToastFrom.textContent = fromName || "";

    // Re-trigger animation by replacing element
    const big = this.mpEmojiToastEmoji;
    const small = this.mpEmojiToastFrom;
    if (big) { big.style.animation = "none"; void big.offsetWidth; big.style.animation = ""; }
    if (small) { small.style.animation = "none"; void small.offsetWidth; small.style.animation = ""; }

    this.mpEmojiToast.removeAttribute("hidden");
    this._emojiToastTimer = setTimeout(() => {
      this.mpEmojiToast?.setAttribute("hidden", "");
    }, 2400);
  }

  // --- MP rematch ---

  showMpRematch() {
    if (this.mpRematchArea) this.mpRematchArea.removeAttribute("hidden");
    if (this.mpRematchBtn) this.mpRematchBtn.hidden = false;
    if (this.mpRematchNotification) this.mpRematchNotification.hidden = true;
    if (this.mpRematchAcceptBtn) this.mpRematchAcceptBtn.hidden = true;
  }

  hideMpRematch() {
    this.mpRematchArea?.setAttribute("hidden", "");
    if (this.mpRematchBtn) this.mpRematchBtn.hidden = false;
    if (this.mpRematchNotification) this.mpRematchNotification.hidden = true;
    if (this.mpRematchAcceptBtn) this.mpRematchAcceptBtn.hidden = true;
  }

  showRematchRequest(fromName) {
    if (this.mpRematchArea) this.mpRematchArea.removeAttribute("hidden");
    if (this.mpRematchNotification) {
      this.mpRematchNotification.textContent = `${fromName} želi novo igro.`;
      this.mpRematchNotification.hidden = false;
    }
    if (this.mpRematchAcceptBtn) this.mpRematchAcceptBtn.hidden = false;
    if (this.mpRematchBtn) this.mpRematchBtn.hidden = true;
  }

  // --- Reveal bar ---

  _updateRevealBar() {
    if (!this.revealBarEl || !this.game) return;
    const answer = this.game.answer || "";
    const revealed = this.game._revealedPositions || new Set();

    const tilesEl = document.getElementById("reveal-tiles") || this.revealBarEl;
    tilesEl.innerHTML = "";
    [...answer].forEach((letter, i) => {
      const tile = document.createElement("div");
      tile.className = "reveal-tile" + (revealed.has(i) ? " revealed" : "");
      tile.textContent = revealed.has(i) ? letter : "";
      tilesEl.appendChild(tile);
    });

    // Start/restart countdown ticker
    this._startRevealCountdown();
  }

  _startRevealCountdown() {
    if (this._revealCountdownInterval) {
      clearInterval(this._revealCountdownInterval);
      this._revealCountdownInterval = null;
    }
    const el = document.getElementById("reveal-countdown");
    if (!el) return;
    const tick = () => {
      if (!this.game?._revealNextAt) { el.textContent = ""; return; }
      const secs = Math.max(0, Math.ceil((this.game._revealNextAt - Date.now()) / 1000));
      el.textContent = secs > 0 ? `⏱ ${secs}s` : "";
    };
    tick();
    this._revealCountdownInterval = setInterval(tick, 250);
  }

  // --- Tile swap (green letter swap) ---

  _initTileSwap() {
    const boardEl = document.getElementById("board");
    if (!boardEl) return;

    boardEl.addEventListener("click", (e) => {
      const tile = e.target.closest(".tile");
      if (!tile || !this.game || this.game.gameOver) return;
      const rowTiles = this.game.board?.tiles?.[this.game.currentRow];
      if (!rowTiles) return;
      const col = rowTiles.indexOf(tile);
      if (col === -1 || !tile.textContent) return;

      if (this._swapSelectedCol === null) {
        this._swapSelectedCol = col;
        tile.classList.add("swap-selected");
      } else if (this._swapSelectedCol === col) {
        tile.classList.remove("swap-selected");
        this._swapSelectedCol = null;
      } else {
        const prevTile = rowTiles[this._swapSelectedCol];
        const a = tile.textContent;
        const b = prevTile.textContent;
        tile.textContent = b;
        prevTile.textContent = a;
        prevTile.classList.remove("swap-selected");
        this._swapSelectedCol = null;
      }
    });

    // Deselect on any keyboard input
    document.addEventListener("keydown", () => {
      if (this._swapSelectedCol !== null) {
        this.game?.board?.tiles?.[this.game.currentRow]?.[this._swapSelectedCol]
          ?.classList.remove("swap-selected");
        this._swapSelectedCol = null;
      }
    });
  }

  // --- Identity: avatar + nickname ---

  _initIdentity() {
    const AVATARS = ["🐱","🐶","🦊","🐯","🐼","🦁","🐸","🐙","🦋","🐳","🦄","🐲","🦅","🦉","🐺","🐻","🦇","🐬","🌺","⭐","🔥","💎","🎭","🎸"];

    const stored = this.storage?.getAvatar() || "🎮";
    const nick   = this.storage?.getNickname() || "";

    if (this.nicknameInput) this.nicknameInput.value = nick;
    this._setHeaderAvatar(stored);
    if (this.identityAvatar) this.identityAvatar.textContent = stored;

    // Build avatar grid
    if (this.avatarGrid) {
      this.avatarGrid.innerHTML = AVATARS.map(a =>
        `<button class="avatar-opt${a === stored ? " selected" : ""}" data-emoji="${a}" type="button">${a}</button>`
      ).join("");
      this.avatarGrid.addEventListener("click", e => {
        const btn = e.target.closest(".avatar-opt");
        if (!btn) return;
        const emoji = btn.dataset.emoji;
        this.storage?.setAvatar(emoji);
        this.avatarGrid.querySelectorAll(".avatar-opt").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        if (this.identityAvatar) this.identityAvatar.textContent = emoji;
        this._setHeaderAvatar(emoji);
        this._syncNicknameToMP();
      });
    }

    // Toggle avatar grid
    if (this.identityAvatar) {
      this.identityAvatar.addEventListener("click", () => {
        if (this.avatarGrid) this.avatarGrid.hidden = !this.avatarGrid.hidden;
      });
    }

    // Save nickname
    if (this.nicknameSaveBtn) {
      this.nicknameSaveBtn.addEventListener("click", () => this._saveNickname());
    }
    if (this.nicknameInput) {
      this.nicknameInput.addEventListener("keydown", e => { if (e.key === "Enter") this._saveNickname(); });
    }

    this._syncNicknameToMP();
  }

  _saveNickname() {
    const name = this.nicknameInput?.value?.trim();
    if (!name) return;
    this.storage?.setNickname(name);
    // Also sync to hidden auth-name-input (for Firebase registration)
    const authName = document.getElementById("auth-name-input");
    if (authName) authName.value = name;
    this._syncNicknameToMP();
    if (this.nicknameSaveBtn) {
      this.nicknameSaveBtn.textContent = "✓";
      setTimeout(() => { if (this.nicknameSaveBtn) this.nicknameSaveBtn.textContent = "✓"; }, 800);
    }
  }

  _setHeaderAvatar(emoji) {
    if (this.headerAvatar) this.headerAvatar.textContent = emoji;
  }

  _syncNicknameToMP() {
    const nick = this.storage?.getNickname() || "";
    if (this.mpModalNickname && !this.mpModalNickname._userEdited) {
      this.mpModalNickname.value = nick;
    }
    const joinNick = document.getElementById("mp-join-nickname");
    if (joinNick && !joinNick._userEdited) joinNick.value = nick;
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
    reveal:     { desc: "Vsakih 5 sekund se razkrije ena črka. Ugani čim prej!", toast: "Razkrivanje 👁 — beseda se počasi razkriva!" },
  };

  static _modeLabels = {
    classic:    "Klasično",
    hard:       "🔥 Težko",
    timeattack: "⏱ Čas",
    zen:        "🧘 Zen",
    riddle:     "🎭 Uganka",
    random:     "🎲 Naključno",
    reveal:     "👁 Razkrivanje",
  };

  setGameMode(mode) {
    this.gameModeButtons?.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
    const info = UI._modeInfo[mode] || UI._modeInfo.classic;
    if (this.gameModeDesc) this.gameModeDesc.textContent = info.desc;
    if (this.mpRoomModeDisplay) {
      this.mpRoomModeDisplay.textContent = UI._modeLabels[mode] || mode;
    }

    const isRiddle = mode === "riddle";
    const isTimeAttack = mode === "timeattack";
    const isReveal = mode === "reveal";

    // In MP lobby (game not yet started) only update labels — don't show game UI.
    const inMpLobby = this.game?.mode === "multiplayer" && !this.game?.multiplayer?.peerConnected;
    if (inMpLobby) return;

    // Hide only the user's own board in riddle mode; opponent cards live in the same
    // boardsContainer so we must NOT hide the whole container.
    const myBoard = document.getElementById("my-board-wrapper");
    if (myBoard) myBoard.style.display = isRiddle ? "none" : "";
    const kb = document.getElementById("keyboard");
    if (kb) kb.style.display = isRiddle ? "none" : "";
    if (this.keyboardActions) this.keyboardActions.hidden = isRiddle || !this.hintsEnabled();
    if (this.gameTimerEl) this.gameTimerEl.hidden = !isTimeAttack;
    if (this.riddlePanel) this.riddlePanel.hidden = !isRiddle;
    if (this.liveStatsEl) this.liveStatsEl.hidden = isTimeAttack;
    if (this.revealBarEl) this.revealBarEl.hidden = !isReveal;
    if (isReveal) this._updateRevealBar();

    if (isRiddle && this.riddleGame) this.startRiddle();
    else if (!isRiddle) this._startLiveStats();

    // In singleplayer, show ready overlay for modes that need explicit start.
    const inMp = this.game?.mode === "multiplayer";
    this._hideReadyOverlay();
    if (!inMp && (isTimeAttack || isReveal)) {
      this._showReadyOverlay(mode);
    } else if (!inMp) {
      // Other modes start immediately.
      this.game?.startModeGame();
    }
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

  startRiddle(riddleData) {
    if (!this.riddleGame) return;
    this.riddleGame.start(riddleData || undefined);
    this._riddleGuessCount = 0;
    if (this.game) this.game.gameStartTime = Date.now();
    this._renderRiddleClues();
    if (this.riddleResultEl) { this.riddleResultEl.hidden = true; this.riddleResultEl.className = "riddle-result"; }
    if (this.riddleNextBtn) this.riddleNextBtn.hidden = true;
    if (this.riddleInput) { this.riddleInput.value = ""; this.riddleInput.disabled = false; }
    if (this.riddleSubmitBtn) this.riddleSubmitBtn.disabled = false;
    this._updateRiddleNextBtn();
    this._startLiveStats();
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

  _startLiveStats() {
    this._stopLiveStats();
    this._updateLiveStats();
    this._liveStatsInterval = setInterval(() => this._updateLiveStats(), 1000);
    // Re-sync immediately when tab becomes visible (browsers throttle background setInterval)
    if (!this._visibilityHandler) {
      this._visibilityHandler = () => {
        if (!document.hidden) this._updateLiveStats();
      };
      document.addEventListener("visibilitychange", this._visibilityHandler);
    }
  }

  _stopLiveStats() {
    if (this._liveStatsInterval) { clearInterval(this._liveStatsInterval); this._liveStatsInterval = null; }
  }

  _updateLiveStats() {
    if (!this.game) return;
    if (this.liveTimerEl) this.liveTimerEl.textContent = `⏱ ${this.game.getElapsed()}`;
    if (this.liveGuessesEl) {
      const isRiddle = this.game.gameMode === "riddle";
      if (isRiddle && this.riddleGame?.current) {
        this.liveGuessesEl.textContent = `💡 ${this.riddleGame.revealedCount} / ${this.riddleGame.totalClues}`;
      } else {
        this.liveGuessesEl.textContent = `🎯 ${this.game.currentRow} / ${this.game.rows}`;
      }
    }
    if (this.liveStartedEl && this.game.gameStartTime) {
      const d = new Date(this.game.gameStartTime);
      this.liveStartedEl.textContent = `začeto ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
    }
  }

  _riddleReveal() {
    if (!this.riddleGame) return;
    this.riddleGame.revealNext();
    this._renderRiddleClues();
    this._updateRiddleNextBtn();
    this._updateLiveStats();
    this.game?.multiplayer?.sendRiddleProgress(this.riddleGame.revealedCount, this._riddleGuessCount);
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
    this._riddleGuessCount++;
    if (result.correct) {
      const stars = "⭐".repeat(Math.max(1, result.score));
      const elapsed = this.game?.getElapsed() || "0:00";
      this._showRiddleResult(`Bravo! ${stars} (${this.riddleGame.revealedCount} namig${this.riddleGame.revealedCount === 1 ? "" : "i"} · ⏱ ${elapsed})`, true);
      this._stopLiveStats();
      this.game?.storage?.recordGame({ mode: "riddle", won: true, cluesUsed: this.riddleGame.revealedCount });
      this.game?.multiplayer?.sendRiddleProgress(this.riddleGame.revealedCount, this._riddleGuessCount);
      if (this.game?.mode === "multiplayer") {
        this.game?.multiplayer?.sendPlayerFinished(true, this._riddleGuessCount, this.riddleGame.revealedCount);
        // showMpRematch is now called from _checkBothFinished in multiplayer.js
      }
    } else if (this.riddleGame.failed) {
      this._showRiddleResult(`Odgovor je bil: ${this.riddleGame.current.answer} · ⏱ ${this.game?.getElapsed() || "0:00"}`, false);
      this._stopLiveStats();
      this.game?.storage?.recordGame({ mode: "riddle", won: false });
      this.game?.multiplayer?.sendRiddleProgress(this.riddleGame.revealedCount, this._riddleGuessCount);
      if (this.game?.mode === "multiplayer") {
        this.game?.multiplayer?.sendPlayerFinished(false, this._riddleGuessCount, 0);
        // showMpRematch is now called from _checkBothFinished in multiplayer.js
      }
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

  // --- Win/lose animations ---

  _launchConfetti() {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9000";
    document.body.appendChild(canvas);
    canvas.width = innerWidth; canvas.height = innerHeight;
    const c = canvas.getContext("2d");
    const COLORS = ["#6aaa64","#b59f3b","#4a9eff","#e05c5c","#ff9f43","#a855f7"];
    const particles = Array.from({length: 90}, () => ({
      x: Math.random() * canvas.width, y: -12,
      r: Math.random() * 5 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 3 + 2,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    }));
    let frame = 0;
    const draw = () => {
      c.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.opacity -= 0.006;
        if (p.opacity <= 0) return;
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        c.globalAlpha = p.opacity; c.fillStyle = p.color;
        c.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
        c.restore();
      });
      if (++frame < 220) requestAnimationFrame(draw); else canvas.remove();
    };
    draw();
  }

  _animateWinRow(row) {
    const board = document.getElementById("board");
    if (!board) return;
    const rows = board.querySelectorAll(".row");
    if (!rows[row]) return;
    rows[row].querySelectorAll(".tile").forEach((tile, i) => {
      setTimeout(() => tile.classList.add("tile-win"), i * 80);
    });
  }

  _animateLoseBoard() {
    const board = document.getElementById("board");
    if (board) board.classList.add("board-shake");
    setTimeout(() => board?.classList.remove("board-shake"), 600);
  }

  // --- End screen ---

  showEndScreen({ won, word, guessCount, elapsed, mpWaiting = false }) {
    const overlay = document.getElementById("end-overlay");
    if (!overlay) return;
    document.getElementById("end-icon").textContent  = won ? "🎉" : "💔";
    document.getElementById("end-title").textContent = won ? "Zmaga!" : "Igra končana";
    const details = [];
    if (won && guessCount) details.push(`${guessCount} ${guessCount === 1 ? "ugibanje" : "ugibanj"}`);
    if (elapsed) details.push(`⏱ ${elapsed}`);
    document.getElementById("end-details").textContent = details.join("  ·  ");
    document.getElementById("end-word").textContent = won ? "" : `Beseda: ${word || ""}`;
    const waitEl = document.getElementById("end-mp-wait");
    if (waitEl) waitEl.hidden = !mpWaiting;
    const mpResultsEl = document.getElementById("end-mp-results");
    if (mpResultsEl) mpResultsEl.hidden = true;
    overlay.hidden = false;
  }

  hideEndScreen() {
    const overlay = document.getElementById("end-overlay");
    if (overlay) overlay.hidden = true;
  }

  showMpResults(mine, opp) {
    const el = document.getElementById("end-mp-results");
    if (!el) return;
    const fmt = r => r.won
      ? `✓ ${r.guessCount} ${r.guessCount === 1 ? "ugibanje" : "ugibanj"}`
      : "✗ izgubil";
    el.innerHTML = `
      <div class="mp-result-row mp-result-me"><span>${this.storage?.getAvatar()||"🎮"} Jaz</span><span>${fmt(mine)}</span></div>
      <div class="mp-result-row"><span>👤 Nasprotnik</span><span>${fmt(opp)}</span></div>`;
    el.hidden = false;
  }

  // --- Stats ---

  showStats() {
    if (!this.statsModal || !this.storage) return;
    const stats = this.storage.getStats();
    if (this.statsPlayed) this.statsPlayed.textContent = stats.played || 0;
    if (this.statsWins) this.statsWins.textContent = stats.wins || 0;

    // Advanced stats
    const adv = this.storage?.getStats() || {};
    const played = adv.played || 0;
    const wins = adv.wins || 0;
    const pct = played > 0 ? Math.round((wins / played) * 100) : 0;

    // Populate top stats boxes
    const el = (id) => document.getElementById(id);
    if (el("stats-winrate")) el("stats-winrate").textContent = pct + "%";
    if (el("stats-streak")) el("stats-streak").textContent = adv.streak || 0;
    if (el("stats-best-streak")) el("stats-best-streak").textContent = adv.bestStreak || 0;

    // Guess distribution
    const distSection = el("stats-dist-section");
    const distEl = el("stats-guess-dist");
    if (distEl) {
      const dist = adv.guessDistribution || [];
      const total = dist.reduce((a, b) => a + b, 0);
      if (distSection) distSection.hidden = total === 0;
      const max = Math.max(...dist, 1);
      distEl.innerHTML = dist.map((n, i) => `
        <div class="gd-row">
          <span class="gd-label">${i + 1}</span>
          <div class="gd-bar-wrap"><div class="gd-bar${n === Math.max(...dist) && n > 0 ? " gd-bar--best" : ""}" style="width:${Math.round((n/max)*100)}%">${n || ""}</div></div>
        </div>`).join("");
    }

    // By mode
    const modeEl = el("stats-by-mode");
    if (modeEl && adv.byMode) {
      const modeLabels = {
        classic: "Klasično", hard: "🔥 Težko", timeattack: "⏱ Čas", zen: "🧘 Zen",
        reveal: "👁 Razkrivanje", riddle: "🎭 Uganka", random: "🎲 Naključno", multiplayer: "👥 Multi"
      };
      modeEl.innerHTML = Object.entries(adv.byMode)
        .filter(([, m]) => m.played > 0)
        .sort((a, b) => b[1].played - a[1].played)
        .map(([key, m]) => {
          const label = modeLabels[key] || key;
          const wr = m.wins != null && m.played > 0 ? Math.round((m.wins / m.played) * 100) + "%" : null;
          const parts = [`${m.played} iger`];
          if (m.wins != null) parts.push(`${m.wins} zmag`);
          if (wr) parts.push(wr);
          const detail = parts.join(" · ");
          let extra = "";
          if (key === "timeattack") extra = `Rekord: ${m.bestScore || 0}`;
          else if (key === "riddle" && m.totalClues) extra = `pov. ${(m.totalClues / (m.wins||1)).toFixed(1)} namig`;
          else if (m.totalGuesses) extra = `pov. ${(m.totalGuesses / m.played).toFixed(1)} ugibanj`;
          return `<div class="mode-stat-card">
            <span class="mode-stat-name">${label}</span>
            <span class="mode-stat-detail">${detail}</span>
            ${extra ? `<span class="mode-stat-extra">${extra}</span>` : ""}
          </div>`;
        }).join("");
    }

    // By word length
    const lenEl = el("stats-by-length");
    if (lenEl && adv.byLength) {
      lenEl.innerHTML = Object.entries(adv.byLength)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([len, l]) => {
          const wr = l.played > 0 ? Math.round((l.wins / l.played) * 100) : 0;
          return `<div class="len-stat-item"><span class="len-label">${len} črk</span><span class="len-score">${l.wins}/${l.played}</span><span class="len-wr">${wr}%</span></div>`;
        }).join("");
    }

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
