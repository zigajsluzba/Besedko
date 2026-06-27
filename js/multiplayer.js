function _fmtElapsed(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export class Multiplayer {
  constructor({ game, ui, firebaseUrl }) {
    this.game = game;
    this.ui = ui;
    this.firebaseUrl = (firebaseUrl || "").replace(/\/$/, "");
    this.available = Boolean(this.firebaseUrl && !this.firebaseUrl.includes("YOUR-PROJECT"));

    this.roomId = null;
    this.isHost = false;
    this.peerConnected = false;
    this.sessionId = this._genId();
    this.nickname = "Igralec";
    this.roomCapacity = 2;
    this.storageKey = "besedko-mp";
    this.sse = null;
    this.roomData = {};

    // Per-opponent state tracking
    this._knownPlayers = {};      // sessionId → { nickname, shownBoard, finishedShown }
    this._pendingRequests = new Set(); // sessionIds shown in confirm dialog
    this._winnerShown = false;
    this._gameStarting = false;
    this._lastEmojiAt = 0;
    this._lastHintAt = 0;
    this._lastRematchReqAt = 0;
    this._lastRematchAt = 0;
    this._myResult = null;       // { won, guessCount }
    this._opponentResult = null; // { won, guessCount }

    if (!this.available) {
      this.ui?.setMultiplayerStatus("Multiplayer ni konfiguriran. Nastavi Firebase URL v js/config.js");
    }
    try { window.mp = this; } catch (e) {}
  }

  get peerNickname() {
    // For UI compat — returns first opponent nickname
    const entry = Object.entries(this.roomData?.players || {})
      .find(([sid]) => sid !== this.sessionId);
    return entry?.[1]?.nickname || "Nasprotnik";
  }

  // ─── Room management ─────────────────────────────────────────────────────

  async createRoom(password = null) {
    if (!this.available) return null;
    this.roomId = this._genRoomCode();
    this.isHost = true;
    this.peerConnected = false;
    this._resetLocalState();
    this.persistSession();

    const roomData = {
      status: "waiting",
      topic: this.game.topic || "mešano",
      players: {
        [this.sessionId]: { nickname: this.nickname, isHost: true, joinedAt: Date.now(), avatar: this.game?.storage?.getAvatar() || "🎮" },
      },
      created_at: Date.now(),
    };
    if (password) roomData.password = password.toUpperCase();
    await this._fbSet(`rooms/${this.roomId}`, roomData);

    this._startListening();
    this.ui?.setRoomCode(this.roomId);
    this.ui?.setPlayerName(this.nickname);
    if (password) this.ui?.setRoomPassword(password.toUpperCase());
    this.ui?.setMultiplayerStatus(`Soba ${this.roomId} je odprta. Pošlji link prijateljem!`);
    return this.roomId;
  }

  async joinRoom(roomId) {
    if (!this.available) return false;
    this.roomId = roomId.trim().toUpperCase();
    this.isHost = false;
    this.peerConnected = false;
    this._resetLocalState();
    this.persistSession();

    this._startListening();
    this.ui?.setRoomCode(this.roomId);
    this.ui?.setPlayerName(this.nickname);
    this.ui?.setMultiplayerStatus("Zahteva za vstop poslana. Čakam na potrditev...");

    // Use direct paths — slash-keyed PATCH body sends flat keys in SSE
    await this._fbSet(`rooms/${this.roomId}/join_requests/${this.sessionId}`, {
      nickname: this.nickname, at: Date.now(), avatar: this.game?.storage?.getAvatar() || "🎮",
    });
    await this._fbPatch(`rooms/${this.roomId}`, { status: "confirming" });
    this._joinRequestSent = true;
    return true;
  }

  async confirmPlayer(sessionId) {
    const req = this.roomData?.join_requests?.[sessionId];
    if (!req) return;
    this._pendingRequests.delete(sessionId);
    await this._fbSet(`rooms/${this.roomId}/players/${sessionId}`,
      { nickname: req.nickname, isHost: false, joinedAt: Date.now(), avatar: req.avatar || "🎮" });
    await this._fbDelete(`rooms/${this.roomId}/join_requests/${sessionId}`);
    this.ui?.hideConfirmDialog();
  }

  async rejectPlayer(sessionId) {
    this._pendingRequests.delete(sessionId);
    await this._fbDelete(`rooms/${this.roomId}/join_requests/${sessionId}`);
    this.ui?.hideConfirmDialog();
  }

  async leaveRoom() {
    this._stopListening();
    if (this.roomId) {
      if (this.isHost) {
        await this._fbDelete(`rooms/${this.roomId}`);
      } else {
        await this._fbDelete(`rooms/${this.roomId}/players/${this.sessionId}`);
        await this._fbDelete(`rooms/${this.roomId}/join_requests/${this.sessionId}`);
      }
    }
    this._resetLocalState();
    this.roomId = null;
    this.isHost = false;
    this.clearSession();
    this.ui?.setRoomCode(null);
    this.ui?.setMultiplayerStatus("Zapustil/a si sobo.");
    this.ui?.hideAllOpponentBoards();
    this.ui?.hideConfirmDialog();
    this.ui?.hideMpRematch();
    this.ui?.hideMpEmojiPanel();
    this.ui?.hideMpHintBtn();
  }

  async kickPlayer(sessionId) {
    if (!this.isHost || !this.roomId) return;
    await this._fbDelete(`rooms/${this.roomId}/players/${sessionId}`);
  }

  _handleKicked() {
    this._stopListening();
    this.clearSession();
    this._inRoom = false;
    this.roomId = null;
    this.ui?.setRoomCode(null);
    this.ui?.setMultiplayerStatus("Gostitelj te je odstranil iz sobe.");
    this.ui?.hideAllOpponentBoards();
    this.ui?.hideConfirmDialog();
  }

  _handleRejected() {
    this._stopListening();
    this.clearSession();
    this._joinRequestSent = false;
    this.roomId = null;
    this.ui?.setRoomCode(null);
    this.ui?.setMultiplayerStatus("Gostitelj te ni sprejel v sobo.");
    this.ui?.hideAllOpponentBoards();
  }

  async startGameManual() {
    if (!this.isHost || this._gameStarting) return;
    const players = this.roomData?.players || {};
    if (Object.keys(players).length < 2) {
      this.ui?.showMessage("Čaka vsaj en nasprotnik!", "error", 2000);
      return;
    }
    this._gameStarting = true;
    await this._startGame(players);
  }

  _resetLocalState() {
    this.peerConnected = false;
    this._knownPlayers = {};
    this._pendingRequests = new Set();
    this._winnerShown = false;
    this._gameStarting = false;
    this._showingConfirm = false;
    this._inRoom = false;
    this._joinRequestSent = false;
    this.roomData = {};
    this._lastEmojiAt = 0;
    this._lastHintAt = 0;
    this._lastRematchReqAt = 0;
    this._lastRematchAt = 0;
    this._myResult = null;
    this._opponentResults = {};  // sid → { won, guessCount, finishedAt, nickname }
  }

  // ─── SSE / Firebase real-time ─────────────────────────────────────────────

  _startListening() {
    this._stopListening();
    const url = `${this.firebaseUrl}/rooms/${this.roomId}.json`;
    try {
      this.sse = new EventSource(url);
      this.sse.addEventListener("put",   (e) => this._onFirebaseData(JSON.parse(e.data), false));
      this.sse.addEventListener("patch", (e) => this._onFirebaseData(JSON.parse(e.data), true));
      this.sse.onerror = () =>
        this.ui?.setMultiplayerStatus("Napaka v Firebase povezavi. Osveži stran.");
    } catch (e) { console.error("[MP] SSE failed:", e); }
  }

  _stopListening() {
    if (this.sse) { this.sse.close(); this.sse = null; }
  }

  _onFirebaseData({ path, data } = {}, isPatch = false) {
    if (data === null && path === "/") {
      if (!this.isHost && this.roomId) {
        this._stopListening();
        this.clearSession();
        this.ui?.setRoomCode(null);
        this.ui?.setMultiplayerStatus("Gostitelj je zapustil sobo.");
        this.ui?.hideAllOpponentBoards();
        this.ui?.hideConfirmDialog();
        this.ui?.hideMpRematch();
      }
      return;
    }

    if (path === "/") {
      this.roomData = isPatch ? { ...this.roomData, ...data } : (data || {});
    } else {
      const parts = path.split("/").filter(Boolean);
      let node = this.roomData;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!node[parts[i]] || typeof node[parts[i]] !== "object") node[parts[i]] = {};
        node = node[parts[i]];
      }
      const last = parts[parts.length - 1];
      if (isPatch && node[last] && typeof node[last] === "object" && typeof data === "object" && data !== null) {
        node[last] = { ...node[last], ...data };
      } else {
        node[last] = data;
      }
    }

    this._processRoomState();
  }

  _processRoomState() {
    const d = this.roomData;
    if (!d) return;
    const players = d.players || {};
    const joinReqs = d.join_requests || {};

    // ── Lobby display + topic ──
    this.ui?.updateLobby(players, joinReqs, this.sessionId, d.status === "playing");
    this.ui?.setRoomTopic(d.topic || d.game_config?.topic);

    // ── Guest: track confirmation, detect kick + rejection ──
    if (!this.isHost) {
      if (players[this.sessionId] && !this._inRoom) this._inRoom = true;
      if (this._inRoom && !players[this.sessionId] && d.status === "waiting") {
        this._handleKicked(); return;
      }
      if (this._joinRequestSent && !joinReqs[this.sessionId] && !players[this.sessionId] && !this._inRoom) {
        this._handleRejected(); return;
      }
    }

    // ── HOST: join requests are handled inline in lobby slots ──

    // ── GUEST: host started the game ──
    if (!this.isHost && d.status === "playing" && !this.peerConnected && players[this.sessionId]) {
      this.peerConnected = true;
      this.roomCapacity = Object.keys(players).length;
      this.game.gameStartTime = Date.now();
      this.persistSession();
      try { this.game.receiveGameConfig(d.game_config); } catch (e) {
        console.error("[MP] receiveGameConfig failed:", e);
      }
      this.ui?.setRoomTopic(d.game_config?.topic);
      this.ui?.hideConfirmDialog();
      this.ui?.onMpGameStart();
      this.ui?.showMpEmojiPanel();
      this.ui?.showMpHintBtn();
      for (const [sid, p] of Object.entries(players)) {
        if (sid !== this.sessionId) this._ensureOpponentBoard(sid, p, d.game_config?.gameMode);
      }
      this.ui?.setMultiplayerStatus("Igra se je začela. Srečno!");
    }

    // ── Update opponent boards / riddle progress ──
    if (this.peerConnected || (this.isHost && d.status === "playing")) {
      const gameMode = this.game.gameMode;
      for (const [sid, p] of Object.entries(players)) {
        if (sid === this.sessionId || !p) continue;

        // Ensure board/card exists for this player
        this._ensureOpponentBoard(sid, p, gameMode);

        if (gameMode === "riddle") {
          const rp = p.riddle_progress;
          if (rp !== undefined) {
            this.ui?.updateOpponentRiddleProgress(sid, p.nickname, rp?.clueCount || 0, rp?.guessCount || 0);
          }
        } else if (p.board) {
          try { this.game.applyOpponentBoardUpdate(p.board, sid); } catch (e) {}
        }

        // Opponent finished
        const k = this._knownPlayers[sid];
        if (p.finished && k && !k.finishedShown) {
          k.finishedShown = true;
          const verb = p.finished.won ? "zmagal/a" : "izgubil/a";
          const n = p.finished.guessCount;
          const elapsed = p.finished.finishedAt && this.game?.gameStartTime
            ? _fmtElapsed(p.finished.finishedAt - this.game.gameStartTime)
            : null;
          const timePart = elapsed ? ` v ${elapsed}` : "";
          this.ui?.setMultiplayerStatus(`${p.nickname} je ${verb} v ${n} ${n === 1 ? "ugibu" : "ugibih"}${timePart}.`);
        }
      }

      // Winner when all finished
      const me = players[this.sessionId];
      const allFinished = me?.finished && Object.values(players).every(p => p?.finished);
      if (allFinished && !this._winnerShown) {
        this._winnerShown = true;
        const bestSid = this._getBestPlayer(players);
        if (bestSid === this.sessionId) {
          this.ui?.setMultiplayerStatus("🏆 Zmaga! Čestitke!");
        } else {
          const bestName = players[bestSid]?.nickname || "Nasprotnik";
          this.ui?.setMultiplayerStatus(`😔 Zmaga: ${bestName}`);
        }
      }

      // Check if any opponent has finished (via results node)
      const results = d.results || {};
      let anyNew = false;
      for (const [sid, res] of Object.entries(results)) {
        if (sid !== this.sessionId && !this._opponentResults[sid]) {
          this._opponentResults[sid] = {
            ...res,
            nickname: players[sid]?.nickname || "Nasprotnik",
          };
          anyNew = true;
        }
      }
      if (anyNew) {
        const finishedCount = Object.keys(this._opponentResults).length + (this._myResult ? 1 : 0);
        this.ui?.updateMpWaitingProgress(finishedCount, this.roomCapacity);
        this._checkAllFinished();
      }
    }

    // ── Emoji toast ──
    const et = d.emoji_toast;
    if (et?.at && et.at > this._lastEmojiAt) {
      this._lastEmojiAt = et.at;
      if (et.from !== this.nickname) this.ui?.showEmojiToast(et.emoji, et.from);
    }

    // ── Hint toast ──
    const ht = d.hint_toast;
    if (ht?.at && ht.at > this._lastHintAt) {
      this._lastHintAt = ht.at;
      if (ht.fromNickname !== this.nickname) {
        this.ui?.showHintToast(ht.letter, ht.position, ht.fromNickname);
      }
    }

    // ── Rematch request ──
    const rr = d.rematch_req;
    if (rr?.at && rr.at > this._lastRematchReqAt) {
      this._lastRematchReqAt = rr.at;
      if (rr.by !== this.sessionId) {
        const fromName = players[rr.by]?.nickname || "Nasprotnik";
        this.ui?.showRematchRequest(fromName);
      }
    }

    // ── Rematch: host accepted ──
    if (this.isHost && d.rematch_accept?.at && d.rematch_accept.at > this._lastRematchAt) {
      this._lastRematchAt = d.rematch_accept.at;
      this._executeRematch(players);
    }

    // ── Rematch: guest receives new game ──
    if (!this.isHost && d.rematch_at && d.rematch_at > this._lastRematchAt) {
      this._lastRematchAt = d.rematch_at;
      try { this.game.receiveGameConfig(d.game_config); } catch (e) {}
      this._winnerShown = false;
      this._myResult = null;
      this._opponentResult = null;
      for (const k of Object.values(this._knownPlayers)) k.finishedShown = false;
      this.ui?.hideMpRematch();
      this.ui?.hideEndScreen?.();
      this.ui?.setMultiplayerStatus("Nova igra — srečno!");
    }

    // ── A player left ──
    if (this.peerConnected) {
      for (const [sid, k] of Object.entries(this._knownPlayers)) {
        if (!players[sid]) {
          delete this._knownPlayers[sid];
          this.ui?.hideOpponentBoard(sid);
          this.ui?.setMultiplayerStatus(`${k.nickname} je zapustil/a sobo.`);
          if (Object.keys(this._knownPlayers).length === 0) {
            this.peerConnected = false;
            this.ui?.setMultiplayerStatus("Vsi nasprotniki so odšli.");
          }
        }
      }
    }
  }

  _ensureOpponentBoard(sid, player, gameMode) {
    if (this._knownPlayers[sid]) return;
    this._knownPlayers[sid] = { nickname: player.nickname, finishedShown: false };
    if (gameMode === "riddle") {
      this.ui?.showOpponentRiddleProgress(sid, player.nickname, 0, 0);
    } else {
      this.ui?.showOpponentBoard(sid, player.nickname);
    }
  }

  async _startGame(players) {
    const config = this.game.getGameConfig();
    await this._fbPatch(`rooms/${this.roomId}`, {
      status: "playing",
      game_config: config,
    });

    this.game.gameStartTime = Date.now();
    this.peerConnected = true;
    this.roomCapacity = Object.keys(players).length;

    for (const [sid, p] of Object.entries(players)) {
      if (sid !== this.sessionId) this._ensureOpponentBoard(sid, p, config.gameMode);
    }

    this.ui?.setRoomTopic(this.game.topic);
    this.ui?.onMpGameStart();
    this.ui?.showMpEmojiPanel();
    this.ui?.showMpHintBtn();
    this.ui?.setMultiplayerStatus("Igra se je začela. Srečno!");
  }

  // ─── Outgoing messages ─────────────────────────────────────────────────────

  async sendBoardUpdate(snapshot) {
    if (!this.peerConnected || !this.roomId) return;
    await this._fbPatch(`rooms/${this.roomId}/players/${this.sessionId}`, { board: snapshot });
  }

  async sendPlayerFinished(won, guessCount, greenCount) {
    if (!this.roomId) return;
    await this._fbPatch(`rooms/${this.roomId}/players/${this.sessionId}`, {
      finished: { won, guessCount, greenCount: greenCount || 0, finishedAt: Date.now() },
    });
    this._myResult = { won, guessCount };
    // Write result to Firebase so opponents can see it
    await this._fbSet(`rooms/${this.roomId}/results/${this.sessionId}`, {
      won, guessCount, finishedAt: Date.now(),
    });
    this._checkAllFinished();
  }

  _checkAllFinished() {
    if (!this._myResult) return;
    const opponentCount = this.roomCapacity - 1;
    if (Object.keys(this._opponentResults).length < opponentCount) return;
    // Everyone finished — show full results
    this.ui?.showMpResults(this._myResult, this._opponentResults);
    this.ui?.showMpRematch();
  }

  async sendRiddleProgress(clueCount, guessCount) {
    if (!this.peerConnected || !this.roomId) return;
    await this._fbPatch(`rooms/${this.roomId}/players/${this.sessionId}`, {
      riddle_progress: { clueCount, guessCount },
    });
  }

  async sendEmoji(emoji) {
    if (!this.peerConnected || !this.roomId) return;
    await this._fbPatch(`rooms/${this.roomId}`, {
      emoji_toast: { from: this.nickname, emoji, at: Date.now() },
    });
  }

  async sendHint() {
    if (!this.peerConnected || !this.roomId) return;
    const hint = this.game.getRandomGreenHint();
    if (!hint) {
      this.ui?.showMessage("Najprej ugotovi zeleno črko!", "error", 2200);
      return;
    }
    await this._fbPatch(`rooms/${this.roomId}`, {
      hint_toast: { letter: hint.letter, position: hint.position, fromNickname: this.nickname, at: Date.now() },
    });
    this.ui?.showMessage(`Namig poslan: ${hint.position + 1}. črka je '${hint.letter}'`, "info", 2200);
  }

  async sendRematchRequest() {
    if (!this.peerConnected || !this.roomId) return;
    await this._fbPatch(`rooms/${this.roomId}`, {
      rematch_req: { by: this.sessionId, at: Date.now() },
    });
    this.ui?.setMultiplayerStatus("Zahteva za novo igro poslana...");
  }

  async acceptRematch() {
    if (!this.roomId) return;
    if (this.isHost) {
      this._executeRematch(this.roomData?.players || {});
    } else {
      await this._fbPatch(`rooms/${this.roomId}`, {
        rematch_accept: { at: Date.now() },
      });
    }
  }

  async _executeRematch(players) {
    if (!this.isHost) return;
    const len = this.game.cols || 5;
    const topic = this.game.topic || "mešano";
    const newAnswer = this.game.dictionary?.getRandomByTopic(topic, len) ||
      this.game.dictionary?.getRandomAnswer() || this.game.answer;
    this.game.restart([newAnswer]);
    if (this.game.gameMode === "reveal") this.game._startReveal();
    const config = this.game.getGameConfig();

    await this._fbPatch(`rooms/${this.roomId}`, {
      game_config: config,
      rematch_req: null,
      rematch_accept: null,
      rematch_at: Date.now(),
      status: "playing",
    });

    for (const sid of Object.keys(players)) {
      await this._fbPatch(`rooms/${this.roomId}/players/${sid}`, {
        board: null, finished: null, riddle_progress: null,
      });
    }
    // Clear results node for rematch
    await this._fbSet(`rooms/${this.roomId}/results`, null);

    this._winnerShown = false;
    this._myResult = null;
    this._opponentResults = {};
    for (const k of Object.values(this._knownPlayers)) k.finishedShown = false;
    this.ui?.hideMpRematch();
    this.ui?.hideEndScreen?.();
    this.ui?.setMultiplayerStatus("Nova igra — srečno!");
  }

  // ─── Winner logic ──────────────────────────────────────────────────────────

  _getBestPlayer(players) {
    const finished = Object.entries(players)
      .filter(([, p]) => p?.finished)
      .map(([sid, p]) => ({ sid, ...p.finished }));
    if (finished.length === 0) return null;
    const winners = finished.filter(p => p.won);
    if (winners.length > 0) {
      winners.sort((a, b) => a.guessCount - b.guessCount || a.finishedAt - b.finishedAt);
      return winners[0].sid;
    }
    finished.sort((a, b) => (b.greenCount || 0) - (a.greenCount || 0));
    return finished[0].sid;
  }

  // ─── Firebase REST ─────────────────────────────────────────────────────────

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

  // ─── Session & helpers ──────────────────────────────────────────────────────

  setNickname(nickname) {
    this.nickname = (nickname || "").trim() || "Igralec";
    this.persistSession();
  }

  persistSession() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        roomId: this.roomId, isHost: this.isHost,
        nickname: this.nickname, sessionId: this.sessionId,
        roomCapacity: this.roomCapacity,
      }));
    } catch (e) {}
  }

  restoreSession() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw || !this.available) return false;
      const state = JSON.parse(raw);
      if (!state?.roomId) return false;
      this.roomId = state.roomId;
      this.isHost = Boolean(state.isHost);
      this.nickname = state.nickname || this.nickname;
      this.sessionId = state.sessionId || this.sessionId;
      this.roomCapacity = state.roomCapacity || 2;
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
