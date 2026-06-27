export class Multiplayer {
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
    this._winnerShown = false;
    this._lastEmojiAt = 0;
    this._lastRematchReqAt = 0;
    this._lastRematchAt = 0;

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
    this._winnerShown = false;
    this._lastEmojiAt = 0;
    this._lastRematchReqAt = 0;
    this._lastRematchAt = 0;
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
    return this.roomId;
  }

  async joinRoom(roomId) {
    if (!this.available) return false;
    this.roomId = roomId.trim().toUpperCase();
    this.isHost = false;
    this.peerConnected = false;
    this._opponentFinishedShown = false;
    this._winnerShown = false;
    this._lastEmojiAt = 0;
    this._lastRematchReqAt = 0;
    this._lastRematchAt = 0;
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

    this.ui?.setRoomTopic(this.game.topic);
    this.ui?.setOpponentNickname(this.peerNickname);
    this.ui?.showOpponentBoard();
    this.ui?.hideConfirmDialog();
    this.ui?.setMultiplayerStatus(`${this.peerNickname} se je pridružil/a! Igra se začne.`);
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
    this._winnerShown = false;
    this.roomData = {};
    this.clearSession();
    this.ui?.setRoomCode(null);
    this.ui?.setMultiplayerStatus("Zapustil/a si sobo.");
    this.ui?.hideOpponentBoard();
    this.ui?.hideConfirmDialog();
    this.ui?.hideMpRematch();
    this.ui?.hideMpEmojiPanel();
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
      if (!this.isHost && this.roomId) {
        this.peerConnected = false;
        this.peerNickname = null;
        this._stopListening();
        this.clearSession();
        this.ui?.setRoomCode(null);
        this.ui?.setMultiplayerStatus("Gostitelj je zapustil sobo.");
        this.ui?.hideOpponentBoard();
        this.ui?.hideConfirmDialog();
        this.ui?.hideMpRematch();
      }
      return;
    }

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
      this._winnerShown = false;
      this.ui?.setMultiplayerStatus("Nasprotnik je zapustil sobo.");
      this.ui?.hideOpponentBoard();
      this.ui?.hideMpRematch();
      this.ui?.hideMpEmojiPanel();
    }

    // GUEST: host confirmed → game config arrived
    if (!this.isHost && d.game_config && d.status === "playing" && !this.peerConnected) {
      this.peerConnected = true;
      this.peerNickname = d.host?.nickname || "Gostitelj";
      this.persistSession();
      try { this.game.receiveGameConfig(d.game_config); } catch (e) {
        console.error("[MP] receiveGameConfig failed:", e);
      }
      this.ui?.setRoomTopic(d.game_config.topic);
      this.ui?.setOpponentNickname(this.peerNickname);
      this.ui?.showOpponentBoard();
      this.ui?.hideConfirmDialog();
      this.ui?.showMpEmojiPanel();
      this.ui?.setMultiplayerStatus("Igra se je začela. Srečno!");
    }

    // Show emoji panel when game starts (host side)
    if (this.isHost && this.peerConnected && d.status === "playing") {
      this.ui?.showMpEmojiPanel();
    }

    // Board updates from opponent
    if (this.peerConnected) {
      const oppBoard = this.isHost ? d.guest?.board : d.host?.board;
      if (oppBoard) {
        try { this.game.applyOpponentBoardUpdate(oppBoard); } catch (e) {}
      }

      const oppFinished = this.isHost ? d.guest?.finished : d.host?.finished;
      const myFinished = this.isHost ? d.host?.finished : d.guest?.finished;

      if (oppFinished && !this._opponentFinishedShown) {
        this._opponentFinishedShown = true;
        const name = this.peerNickname || "Nasprotnik";
        const verb = oppFinished.won ? "zmagal/a" : "izgubil/a";
        const n = oppFinished.guessCount;
        this.ui?.setMultiplayerStatus(`${name} je ${verb} v ${n} ${n === 1 ? "ugibu" : "ugibih"}.`);
      }

      // Determine winner when both finished
      if (myFinished && oppFinished && !this._winnerShown) {
        this._winnerShown = true;
        const result = this._determineWinner(myFinished, oppFinished);
        const name = this.peerNickname || "Nasprotnik";
        if (result === "me") this.ui?.setMultiplayerStatus(`🏆 Zmaga! Čestitke!`);
        else if (result === "opponent") this.ui?.setMultiplayerStatus(`😔 ${name} je zmagal/a.`);
        else this.ui?.setMultiplayerStatus(`🤝 Izenačeno!`);
      }
    }

    // Emoji toast
    const emojiToast = d.emoji_toast;
    if (emojiToast?.at && emojiToast.at > this._lastEmojiAt) {
      this._lastEmojiAt = emojiToast.at;
      if (emojiToast.from !== this.nickname) {
        this.ui?.showEmojiToast(emojiToast.emoji, emojiToast.from);
      }
    }

    // Rematch request from opponent
    const rematchReq = d.rematch_req;
    if (rematchReq?.at && rematchReq.at > this._lastRematchReqAt) {
      this._lastRematchReqAt = rematchReq.at;
      const byMe = (rematchReq.by === "host") === this.isHost;
      if (!byMe) {
        this.ui?.showRematchRequest(this.peerNickname || "Nasprotnik");
      }
    }

    // HOST: guest accepted rematch
    if (this.isHost && d.rematch_accept?.at && d.rematch_accept.at > this._lastRematchAt) {
      this._lastRematchAt = d.rematch_accept.at;
      this._executeRematch();
    }

    // GUEST: host started new game (rematch_at changed)
    if (!this.isHost && d.rematch_at && d.rematch_at > this._lastRematchAt) {
      this._lastRematchAt = d.rematch_at;
      try { this.game.receiveGameConfig(d.game_config); } catch (e) {}
      this._opponentFinishedShown = false;
      this._winnerShown = false;
      this.ui?.hideMpRematch();
      this.ui?.setMultiplayerStatus("Nova igra — srečno!");
    }
  }

  // ─── Outgoing messages ────────────────────────────────────────────────────

  async sendBoardUpdate(snapshot) {
    if (!this.peerConnected || !this.roomId) return;
    const key = this.isHost ? "host" : "guest";
    await this._fbPatch(`rooms/${this.roomId}/${key}`, { board: snapshot });
  }

  async sendPlayerFinished(won, guessCount, greenCount) {
    if (!this.roomId) return;
    const key = this.isHost ? "host" : "guest";
    await this._fbPatch(`rooms/${this.roomId}/${key}`, {
      finished: { won, guessCount, greenCount: greenCount || 0, finishedAt: Date.now() },
    });
  }

  async sendEmoji(emoji) {
    if (!this.peerConnected || !this.roomId) return;
    await this._fbPatch(`rooms/${this.roomId}`, {
      emoji_toast: { from: this.nickname, emoji, at: Date.now() },
    });
  }

  async sendRematchRequest() {
    if (!this.peerConnected || !this.roomId) return;
    const by = this.isHost ? "host" : "guest";
    await this._fbPatch(`rooms/${this.roomId}`, {
      rematch_req: { by, at: Date.now() },
    });
    this.ui?.setMultiplayerStatus("Zahteva za novo igro poslana...");
  }

  async acceptRematch() {
    if (!this.roomId) return;
    if (this.isHost) {
      this._executeRematch();
    } else {
      await this._fbPatch(`rooms/${this.roomId}`, {
        rematch_accept: { at: Date.now() },
      });
    }
  }

  async _executeRematch() {
    if (!this.isHost) return;
    const len = this.game.cols || 5;
    const topic = this.game.topic || "mešano";
    const newAnswer = this.game.dictionary?.getRandomByTopic(topic, len) ||
      this.game.dictionary?.getDailyAnswer() || this.game.answer;
    this.game.restart([newAnswer]);
    const config = this.game.getGameConfig();

    const hostNick = this.roomData.host?.nickname || this.nickname;
    const guestNick = this.roomData.guest?.nickname || this.peerNickname;

    await this._fbPatch(`rooms/${this.roomId}`, {
      game_config: config,
      rematch_req: null,
      rematch_accept: null,
      rematch_at: Date.now(),
      host: { nickname: hostNick, board: null, finished: null },
      guest: { nickname: guestNick, board: null, finished: null },
    });

    this._opponentFinishedShown = false;
    this._winnerShown = false;
    this.ui?.hideMpRematch();
    this.ui?.setMultiplayerStatus("Nova igra — srečno!");
  }

  // ─── Winner logic ─────────────────────────────────────────────────────────

  _determineWinner(me, opp) {
    if (me.won && !opp.won) return "me";
    if (!me.won && opp.won) return "opponent";
    if (me.won && opp.won) {
      if (me.guessCount !== opp.guessCount) return me.guessCount < opp.guessCount ? "me" : "opponent";
      return (me.finishedAt || 0) <= (opp.finishedAt || 0) ? "me" : "opponent";
    }
    // Both lost — compare green count
    if (me.greenCount !== opp.greenCount) return me.greenCount > opp.greenCount ? "me" : "opponent";
    return "tie";
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
