export class Multiplayer {
  /**
   * @param {{ game: Game, ui: UI, firebaseUrl: string }} opts
   */
  constructor({ game, ui, firebaseUrl }) {
    this.game = game;
    this.ui = ui;
    this.firebaseUrl = (firebaseUrl || "").replace(/\/$/, "");
    this.available = Boolean(this.firebaseUrl && !this.firebaseUrl.includes("YOUR-PROJECT"));

    this.roomId = null;
    this.isHost = false;
    this.peerConnected = false;
    this.peerNickname = null;
    this.sessionId = this._genId();
    this.nickname = "Igralec";
    this.storageKey = "besedko-mp";
    this.sse = null;
    this.roomData = {};
    this._opponentFinishedShown = false;

    if (!this.available) {
      this.ui?.setMultiplayerStatus(
        "Multiplayer ni konfiguriran. Nastavi Firebase URL v js/config.js"
      );
    }

    try { window.mp = this; } catch (e) {}
  }

  // ─── Room management ─────────────────────────────────────────────────────

  async createRoom() {
    if (!this.available) return null;
    this.roomId = this._genRoomCode();
    this.isHost = true;
    this.peerConnected = false;
    this._opponentFinishedShown = false;
    this.roomData = {};
    this.persistSession();

    await this._fbSet(`rooms/${this.roomId}`, {
      status: "waiting",
      host: { nickname: this.nickname, sessionId: this.sessionId },
      created_at: Date.now(),
    });

    this._startListening();
    this.ui?.setRoomCode(this.roomId);
    this.ui?.setPlayerName(this.nickname);
    this.ui?.setMultiplayerStatus(`Soba ${this.roomId} čaka na gosta...`);
    console.info("[MP] Room created:", this.roomId);
    return this.roomId;
  }

  async joinRoom(roomId) {
    if (!this.available) return false;
    this.roomId = roomId.trim().toUpperCase();
    this.isHost = false;
    this.peerConnected = false;
    this._opponentFinishedShown = false;
    this.roomData = {};
    this.persistSession();

    this._startListening();
    this.ui?.setRoomCode(this.roomId);
    this.ui?.setPlayerName(this.nickname);
    this.ui?.setMultiplayerStatus("Zahteva za vstop poslana. Čakam na potrditev gostitelja...");

    await this._fbPatch(`rooms/${this.roomId}`, {
      status: "confirming",
      join_request: {
        nickname: this.nickname,
        sessionId: this.sessionId,
        timestamp: Date.now(),
      },
    });
    return true;
  }

  async confirmGuest() {
    const req = this.roomData?.join_request;
    if (!req) return;
    this.peerConnected = true;
    this.peerNickname = req.nickname;
    this.persistSession();

    const config = this.game.getGameConfig();
    await this._fbPatch(`rooms/${this.roomId}`, {
      status: "playing",
      game_config: config,
      guest: { nickname: req.nickname, sessionId: req.sessionId },
      join_request: null,
    });

    this.ui?.setOpponentNickname(this.peerNickname);
    this.ui?.showOpponentBoard();
    this.ui?.hideConfirmDialog();
    this.ui?.setMultiplayerStatus(`${this.peerNickname} se je pridružil/a! Igra se začne.`);
    console.info("[MP] Guest confirmed:", this.peerNickname);
  }

  async rejectGuest() {
    await this._fbPatch(`rooms/${this.roomId}`, {
      status: "waiting",
      join_request: null,
    });
    this.ui?.hideConfirmDialog();
    this.ui?.setMultiplayerStatus(`Soba ${this.roomId} čaka na gosta...`);
  }

  async leaveRoom() {
    this._stopListening();
    if (this.roomId) {
      if (this.isHost) {
        await this._fbDelete(`rooms/${this.roomId}`);
      } else {
        await this._fbPatch(`rooms/${this.roomId}`, {
          status: "waiting",
          guest: null,
          guest_left: true,
          game_config: null,
          join_request: null,
        });
      }
    }
    this.roomId = null;
    this.isHost = false;
    this.peerConnected = false;
    this.peerNickname = null;
    this._opponentFinishedShown = false;
    this.roomData = {};
    this.clearSession();
    this.ui?.setRoomCode(null);
    this.ui?.setMultiplayerStatus("Zapustil/a si sobo.");
    this.ui?.hideOpponentBoard();
    this.ui?.hideConfirmDialog();
  }

  // ─── SSE / Firebase real-time ─────────────────────────────────────────────

  _startListening() {
    this._stopListening();
    const url = `${this.firebaseUrl}/rooms/${this.roomId}.json`;
    try {
      this.sse = new EventSource(url);
      this.sse.addEventListener("put", (e) => this._onFirebaseUpdate(JSON.parse(e.data)));
      this.sse.addEventListener("patch", (e) => this._onFirebaseUpdate(JSON.parse(e.data)));
      this.sse.onerror = () =>
        this.ui?.setMultiplayerStatus("Napaka v Firebase povezavi. Osveži stran.");
    } catch (e) {
      console.error("[MP] SSE failed:", e);
    }
  }

  _stopListening() {
    if (this.sse) { this.sse.close(); this.sse = null; }
  }

  _onFirebaseUpdate(event) {
    if (!event) return;
    const { path, data } = event;

    if (data === null && path === "/") {
      // Room deleted (host left)
      if (!this.isHost && this.roomId) {
        this.peerConnected = false;
        this.peerNickname = null;
        this._stopListening();
        this.clearSession();
        this.ui?.setRoomCode(null);
        this.ui?.setMultiplayerStatus("Gostitelj je zapustil sobo.");
        this.ui?.hideOpponentBoard();
        this.ui?.hideConfirmDialog();
      }
      return;
    }

    // Merge update into local roomData
    if (path === "/") {
      this.roomData = data || {};
    } else {
      const parts = path.split("/").filter(Boolean);
      let node = this.roomData;
      for (let i = 0; i < parts.length - 1; i++) {
        node = node[parts[i]] = node[parts[i]] || {};
      }
      node[parts[parts.length - 1]] = data;
    }

    this._processRoomState();
  }

  _processRoomState() {
    const d = this.roomData;
    if (!d) return;

    // HOST: guest wants to join
    if (this.isHost && d.join_request && d.status === "confirming") {
      const req = d.join_request;
      if (req.sessionId !== this.sessionId) {
        this.ui?.showConfirmDialog(req.nickname);
      }
    }

    // HOST: guest left while game was active
    if (this.isHost && this.peerConnected && d.guest_left && !d.guest) {
      this.peerConnected = false;
      this.peerNickname = null;
      this._opponentFinishedShown = false;
      this.ui?.setMultiplayerStatus("Nasprotnik je zapustil sobo.");
      this.ui?.hideOpponentBoard();
    }

    // GUEST: host confirmed → game config arrived
    if (!this.isHost && d.game_config && d.status === "playing" && !this.peerConnected) {
      this.peerConnected = true;
      this.peerNickname = d.host?.nickname || "Gostitelj";
      this.persistSession();
      try { this.game.receiveGameConfig(d.game_config); } catch (e) {
        console.error("[MP] receiveGameConfig failed:", e);
      }
      this.ui?.setOpponentNickname(this.peerNickname);
      this.ui?.showOpponentBoard();
      this.ui?.hideConfirmDialog();
      this.ui?.setMultiplayerStatus("Igra se je začela. Srečno!");
    }

    // Board updates from opponent
    if (this.peerConnected) {
      const oppBoard = this.isHost ? d.guest?.board : d.host?.board;
      if (oppBoard) {
        try { this.game.applyOpponentBoardUpdate(oppBoard); } catch (e) {}
      }

      const oppFinished = this.isHost ? d.guest?.finished : d.host?.finished;
      if (oppFinished && !this._opponentFinishedShown) {
        this._opponentFinishedShown = true;
        const name = this.peerNickname || "Nasprotnik";
        const verb = oppFinished.won ? "zmagal/a" : "izgubil/a";
        const n = oppFinished.guessCount;
        this.ui?.setMultiplayerStatus(`${name} je ${verb} v ${n} ${n === 1 ? "ugibu" : "ugibih"}.`);
      }
    }
  }

  // ─── Outgoing messages ────────────────────────────────────────────────────

  async sendBoardUpdate(snapshot) {
    if (!this.peerConnected || !this.roomId) return;
    const key = this.isHost ? "host" : "guest";
    await this._fbPatch(`rooms/${this.roomId}/${key}`, { board: snapshot });
  }

  async sendPlayerFinished(won, guessCount) {
    if (!this.roomId) return;
    const key = this.isHost ? "host" : "guest";
    await this._fbPatch(`rooms/${this.roomId}/${key}`, { finished: { won, guessCount } });
  }

  // ─── Firebase REST ────────────────────────────────────────────────────────

  async _fbSet(path, data) {
    try {
      const res = await fetch(`${this.firebaseUrl}/${path}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) console.error("[MP] fbSet failed:", res.status, path);
    } catch (e) { console.error("[MP] fbSet error:", e); }
  }

  async _fbPatch(path, data) {
    // Remove null values explicitly via PUT on sub-paths
    const nullKeys = Object.entries(data).filter(([, v]) => v === null);
    const rest = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null));

    if (Object.keys(rest).length > 0) {
      try {
        const res = await fetch(`${this.firebaseUrl}/${path}.json`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rest),
        });
        if (!res.ok) console.error("[MP] fbPatch failed:", res.status, path);
      } catch (e) { console.error("[MP] fbPatch error:", e); }
    }

    for (const [key] of nullKeys) {
      try {
        await fetch(`${this.firebaseUrl}/${path}/${key}.json`, { method: "DELETE" });
      } catch (e) {}
    }
  }

  async _fbDelete(path) {
    try {
      await fetch(`${this.firebaseUrl}/${path}.json`, { method: "DELETE" });
    } catch (e) { console.error("[MP] fbDelete error:", e); }
  }

  // ─── Session & helpers ────────────────────────────────────────────────────

  setNickname(nickname) {
    this.nickname = (nickname || "").trim() || "Igralec";
    this.persistSession();
  }

  persistSession() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        roomId: this.roomId, isHost: this.isHost,
        nickname: this.nickname, sessionId: this.sessionId,
      }));
    } catch (e) {}
  }

  restoreSession() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (!state?.roomId || !this.available) return false;
      this.roomId = state.roomId;
      this.isHost = Boolean(state.isHost);
      this.nickname = state.nickname || this.nickname;
      this.sessionId = state.sessionId || this.sessionId;
      this.peerConnected = false;
      this.ui?.setRoomCode(this.roomId);
      this.ui?.setPlayerName(this.nickname);
      this._startListening();
      this.ui?.setMultiplayerStatus(
        this.isHost ? `Soba ${this.roomId} čaka...` : "Obnavljam sejo..."
      );
      return true;
    } catch (e) { return false; }
  }

  clearSession() {
    try { localStorage.removeItem(this.storageKey); } catch (e) {}
  }

  _genId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `p-${Math.random().toString(36).slice(2, 10)}`;
  }

  _genRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 5 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  }
}
