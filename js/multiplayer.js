export class Multiplayer {
  /**
   * @param {{ game: Game, ui: UI }} opts
   */
  constructor({ game, ui }) {
    this.game = game;
    this.ui = ui;
    this.channel = null;
    this.roomId = null;
    this.isHost = false;
    this.peerConnected = false;
    this.peerNickname = null;
    this.sessionId = this.generateId();
    this.nickname = "Igralec";
    this.storageKey = "besedko-mp";
    this._joinRetryTimer = null;
    this._msgSeq = 0;
    this._seen = new Set();
    this.init();
    try { window.mp = this; } catch (e) {}
  }

  init() {
    // Primary channel: BroadcastChannel (same browser profile)
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.channel = new BroadcastChannel("besedko-multiplayer");
        this.channel.onmessage = (e) => this._onReceive(e.data);
      } catch (e) {
        console.warn("[MP] BroadcastChannel failed:", e);
      }
    }

    // Fallback channel: localStorage storage event
    // Works across Chrome windows/profiles on the same machine & origin.
    window.addEventListener("storage", (e) => {
      if (e.key === "mp-bus" && e.newValue) {
        try { this._onReceive(JSON.parse(e.newValue)); } catch (err) {}
      }
    });

    window.addEventListener("beforeunload", () => this.persistSession());
    console.log("[MP] Init — protokol:", location.protocol, "| origin:", location.origin,
      "| BroadcastChannel:", this.channel ? "OK" : "N/A");
  }

  /** Dedup + dispatch incoming message from either channel. */
  _onReceive(msg) {
    if (!msg || !msg._id) return;
    if (this._seen.has(msg._id)) return;
    this._seen.add(msg._id);
    if (this._seen.size > 200) {
      const first = this._seen.values().next().value;
      this._seen.delete(first);
    }
    this.handleMessage(msg);
  }

  generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `p-${Math.random().toString(36).slice(2, 10)}`;
  }

  generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 5 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  }

  setNickname(nickname) {
    this.nickname = (nickname || "").trim() || "Igralec";
    this.persistSession();
  }

  // --- Session persistence ---

  persistSession() {
    try {
      window.localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          roomId: this.roomId,
          isHost: this.isHost,
          nickname: this.nickname,
          sessionId: this.sessionId,
        })
      );
    } catch (e) {
      console.warn("[MP] persistSession failed:", e);
    }
  }

  restoreSession() {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (!state || !state.roomId) return false;
      this.roomId = state.roomId;
      this.isHost = Boolean(state.isHost);
      this.nickname = state.nickname || this.nickname;
      this.sessionId = state.sessionId || this.sessionId;
      this.peerConnected = false;
      this.ui?.setRoomCode(this.roomId);
      if (this.isHost) {
        this.ui?.setMultiplayerStatus(`Soba ${this.roomId} je obnovljena. Čaka na gosta.`);
      } else {
        this.ui?.setMultiplayerStatus(`Obnavljam povezavo s sobo ${this.roomId}...`);
        this._restoreTimer = window.setTimeout(() => this.sendJoinRequest(), 150);
      }
      return true;
    } catch (e) {
      console.warn("[MP] restoreSession failed:", e);
      return false;
    }
  }

  clearSession() {
    try { window.localStorage.removeItem(this.storageKey); } catch (e) {}
  }

  // --- Room management ---

  createRoom() {
    clearTimeout(this._joinRetryTimer);
    clearTimeout(this._restoreTimer);
    this.roomId = this.generateRoomCode();
    this.isHost = true;
    this.peerConnected = false;
    this.persistSession();
    this.ui?.setRoomCode(this.roomId);
    this.ui?.setMultiplayerStatus(`Soba ${this.roomId} ustvarjena. Čaka na gosta...`);
    console.info("[MP] Room created:", this.roomId);
    return this.roomId;
  }

  joinRoom(roomId) {
    clearTimeout(this._joinRetryTimer);
    clearTimeout(this._restoreTimer);
    if (!roomId) return false;
    this.roomId = roomId.trim().toUpperCase();
    this.isHost = false;
    this.peerConnected = false;
    this.persistSession();
    this.ui?.setRoomCode(this.roomId);
    this.ui?.setMultiplayerStatus(`Pridružujem se sobi ${this.roomId}...`);
    console.info("[MP] Joining room:", this.roomId);
    this.sendJoinRequest();
    return true;
  }

  leaveRoom() {
    clearTimeout(this._joinRetryTimer);
    clearTimeout(this._restoreTimer);
    this.sendMessage({ type: "leave-room" });
    this.roomId = null;
    this.isHost = false;
    this.peerConnected = false;
    this.peerNickname = null;
    this.clearSession();
    this.ui?.setRoomCode(null);
    this.ui?.setMultiplayerStatus("Zapustil/a si sobo.");
    this.ui?.hideOpponentBoard();
  }

  // --- Join with retry ---

  sendJoinRequest(attempt = 1) {
    if (this.peerConnected || !this.roomId || this.isHost) return;
    console.info("[MP] Sending join-request, attempt", attempt);
    this.sendMessage({ type: "join-request" });

    if (attempt < 5) {
      this._joinRetryTimer = setTimeout(
        () => this.sendJoinRequest(attempt + 1),
        1500
      );
    } else {
      this._joinRetryTimer = setTimeout(() => {
        if (!this.peerConnected) {
          this.ui?.setMultiplayerStatus(
            "Soba ni bila najdena. Oba zavihka morata biti v ISTEM brskalniku na ISTEM naslovu."
          );
        }
      }, 1500);
    }
  }

  // --- Message dispatch ---

  handleMessage(msg) {
    if (!msg || !this.roomId || msg.roomId !== this.roomId) return;
    if (msg.senderId === this.sessionId) return;
    console.log("[MP] Received:", msg.type, "from", msg.nickname);

    switch (msg.type) {
      case "join-request":
        if (this.isHost) this.onGuestJoin(msg);
        break;
      case "game-config":
        if (!this.isHost) this.onGameConfig(msg);
        break;
      case "board-update":
        this.onBoardUpdate(msg);
        break;
      case "player-finished":
        this.onPlayerFinished(msg);
        break;
      case "leave-room":
        this.onPeerLeave(msg);
        break;
    }
  }

  onGuestJoin(msg) {
    this.peerConnected = true;
    this.peerNickname = msg.nickname || "Gost";
    this.persistSession();
    this.sendMessage({ type: "game-config", config: this.game.getGameConfig() });
    this.ui?.setOpponentNickname(this.peerNickname);
    this.ui?.showOpponentBoard();
    this.ui?.setMultiplayerStatus(`${this.peerNickname} se je pridružil/a!`);
    console.info("[MP] Guest joined:", this.peerNickname);
  }

  onGameConfig(msg) {
    clearTimeout(this._joinRetryTimer);
    this.peerConnected = true;
    this.peerNickname = msg.nickname || "Gostitelj";
    this.persistSession();
    try {
      this.game.receiveGameConfig(msg.config);
    } catch (e) {
      console.error("[MP] receiveGameConfig failed:", e);
    }
    this.ui?.setOpponentNickname(this.peerNickname);
    this.ui?.showOpponentBoard();
    this.ui?.setMultiplayerStatus("Igra se je začela. Srečno!");
    console.info("[MP] Game config received from:", this.peerNickname);
  }

  onBoardUpdate(msg) {
    try { this.game.applyOpponentBoardUpdate(msg.snapshot); } catch (e) {
      console.error("[MP] applyOpponentBoardUpdate failed:", e);
    }
  }

  onPlayerFinished(msg) {
    const name = msg.nickname || this.peerNickname || "Nasprotnik";
    const verb = msg.won ? "zmagal/a" : "izgubil/a";
    const guessWord = msg.guessCount === 1 ? "ugibu" : "ugibih";
    this.ui?.setMultiplayerStatus(`${name} je ${verb} v ${msg.guessCount} ${guessWord}.`);
  }

  onPeerLeave() {
    this.peerConnected = false;
    this.peerNickname = null;
    this.ui?.setMultiplayerStatus("Nasprotnik je zapustil sobo.");
    this.ui?.hideOpponentBoard();
  }

  // --- Send helpers ---

  sendMessage(payload) {
    if (!this.roomId) return;
    const msg = {
      ...payload,
      roomId: this.roomId,
      senderId: this.sessionId,
      nickname: this.nickname,
      _id: `${this.sessionId}-${++this._msgSeq}`,
    };

    // Primary: BroadcastChannel
    if (this.channel) {
      try { this.channel.postMessage(msg); } catch (e) {
        console.warn("[MP] BroadcastChannel postMessage failed:", e);
      }
    }

    // Parallel: localStorage storage event (works across Chrome windows/profiles)
    try {
      window.localStorage.setItem("mp-bus", JSON.stringify(msg));
    } catch (e) {
      console.warn("[MP] localStorage send failed:", e);
    }
  }

  sendBoardUpdate(snapshot) {
    if (!this.peerConnected) return;
    this.sendMessage({ type: "board-update", snapshot });
  }

  sendPlayerFinished(won, guessCount) {
    this.sendMessage({ type: "player-finished", won, guessCount });
  }
}
