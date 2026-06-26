export class Multiplayer {
  constructor({ game, ui }) {
    this.game = game;
    this.ui = ui;
    this.channel = null;
    this.roomId = null;
    this.isHost = false;
    this.peerConnected = false;
    this.sessionId = this.generateId();
    this.nickname = "Igralec";
    this.storageKey = "besedko-multiplayer-state";
    this.init();
  }

  init() {
    if (typeof BroadcastChannel === "undefined") {
      this.ui && this.ui.setMultiplayerStatus("Ta brskalnik ne podpira multiplayer komunikacije.");
      return;
    }

    this.channel = new BroadcastChannel("besedko-multiplayer");
    this.channel.onmessage = (event) => this.handleMessage(event.data);
    window.addEventListener("beforeunload", () => this.persistSession());
  }

  generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `player-${Math.random().toString(36).slice(2, 10)}`;
  }

  generateRoomCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  setNickname(nickname) {
    const nextName = (nickname || "").trim() || "Igralec";
    this.nickname = nextName;
    this.persistSession();
  }

  persistSession() {
    try {
      const state = {
        roomId: this.roomId,
        isHost: this.isHost,
        peerConnected: this.peerConnected,
        nickname: this.nickname,
        sessionId: this.sessionId,
      };
      window.localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn("Ni bilo mogoče shraniti multiplayer stanja:", error);
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
      this.peerConnected = Boolean(state.peerConnected);
      this.nickname = state.nickname || this.nickname;
      this.sessionId = state.sessionId || this.sessionId;
      this.ui && this.ui.setRoomCode(this.roomId);
      if (this.isHost) {
        this.ui && this.ui.setMultiplayerStatus(`${this.nickname} je obnovil sobo ${this.roomId}.`);
      } else {
        this.ui && this.ui.setMultiplayerStatus(`${this.nickname} obnavlja povezavo s sobo ${this.roomId}...`);
        window.setTimeout(() => {
          this.sendMessage({ type: "join-request" });
        }, 120);
      }
      return true;
    } catch (error) {
      console.warn("Ni bilo mogoče obnoviti multiplayer stanja:", error);
      return false;
    }
  }

  createRoom() {
    if (!this.channel) return null;
    this.roomId = this.generateRoomCode();
    this.isHost = true;
    this.peerConnected = false;
    this.persistSession();
    this.ui && this.ui.setRoomCode(this.roomId);
    this.ui && this.ui.setMultiplayerStatus(`${this.nickname} je ustvaril sobo. Koda sobe: ${this.roomId}`);
    return this.roomId;
  }

  joinRoom(roomId) {
    if (!this.channel || !roomId) return false;
    this.roomId = roomId.toUpperCase();
    this.isHost = false;
    this.peerConnected = false;
    this.persistSession();
    this.ui && this.ui.setRoomCode(this.roomId);
    this.ui && this.ui.setMultiplayerStatus(`${this.nickname} se pridružuje sobi ${this.roomId}...`);
    this.sendMessage({ type: "join-request" });
    return true;
  }

  handleMessage(message) {
    if (!message || !this.roomId || message.roomId !== this.roomId) return;
    if (message.senderId === this.sessionId) return;

    if (message.type === "join-request" && this.isHost) {
      this.peerConnected = true;
      this.ui && this.ui.setMultiplayerStatus(`${this.nickname} je sprejel povezavo. Posíljam stanje igre...`);
      this.sendMessage({ type: "state-update", state: this.game.getMultiplayerState() });
      return;
    }

    if (message.type === "state-update") {
      this.peerConnected = true;
      this.ui && this.ui.setMultiplayerStatus(`${this.nickname}: povezava z drugimi igralci je vzpostavljena.`);
      this.game.applyMultiplayerState(message.state);
    }
  }

  sendMessage(payload) {
    if (!this.channel || !this.roomId) return;
    this.channel.postMessage({
      ...payload,
      roomId: this.roomId,
      senderId: this.sessionId,
      nickname: this.nickname,
    });
  }

  leaveRoom() {
    if (this.channel) {
      this.sendMessage({ type: "leave-room" });
    }
    this.roomId = null;
    this.isHost = false;
    this.peerConnected = false;
    this.persistSession();
    this.ui && this.ui.setRoomCode(null);
    this.ui && this.ui.setMultiplayerStatus("Zapustil/a si sobo.");
  }

  broadcastState(state) {
    if (!this.channel || !this.roomId || !this.peerConnected) return;
    this.sendMessage({ type: "state-update", state });
  }
}
