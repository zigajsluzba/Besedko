let _ctx = null;
function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function tone(freq, type, dur, gain, delay = 0) {
  const c = ctx();
  const osc = c.createOscillator();
  const g   = c.createGain();
  osc.connect(g); g.connect(c.destination);
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + dur + 0.01);
}

export const sounds = {
  get enabled() { return localStorage.getItem("besedko-sounds") !== "0"; },

  keyPress()     { if (!this.enabled) return; tone(220, "sine",     0.04, 0.04); },
  tileCorrect()  { if (!this.enabled) return; tone(523, "sine",     0.12, 0.09); },
  tilePresent()  { if (!this.enabled) return; tone(370, "sine",     0.10, 0.07); },
  tileAbsent()   { if (!this.enabled) return; tone(180, "triangle", 0.08, 0.04); },
  invalidWord()  { if (!this.enabled) return; tone(150, "sawtooth", 0.10, 0.05); },

  win() {
    if (!this.enabled) return;
    [[523,0],[659,0.1],[784,0.2],[1047,0.32]].forEach(([f,d]) => tone(f,"sine",0.35,0.10,d));
  },

  lose() {
    if (!this.enabled) return;
    [[300,0],[240,0.15],[190,0.3]].forEach(([f,d]) => tone(f,"sawtooth",0.25,0.06,d));
  },

  toggle() {
    const next = !this.enabled;
    localStorage.setItem("besedko-sounds", next ? "1" : "0");
    return next;
  },
};
