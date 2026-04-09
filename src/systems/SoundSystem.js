// Procedural sound effects via Web Audio API — no external audio files needed
export class SoundSystem {
  constructor() {
    this.enabled = false;
    this.masterGain = null;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
      this.enabled = true;
    } catch (_) { /* no audio */ }
  }

  _resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  _osc(freq, type, startGain, endGain, dur, freqEnd) {
    if (!this.enabled) return;
    this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t + dur);
    g.gain.setValueAtTime(startGain, t);
    g.gain.exponentialRampToValueAtTime(Math.max(endGain, 0.0001), t + dur);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  _noise(dur, gainPeak, filterHz = 600) {
    if (!this.enabled) return;
    this._resume();
    const t       = this.ctx.currentTime;
    const samples = Math.ceil(this.ctx.sampleRate * dur);
    const buf     = this.ctx.createBuffer(1, samples, this.ctx.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = filterHz;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gainPeak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    src.start(t);
  }

  attack()  { this._osc(540, 'square',   0.25, 0.001, 0.07, 220); }

  jutsu()   {
    this._osc(180, 'sawtooth', 0.4, 0.001, 0.35, 900);
    setTimeout(() => this._noise(0.18, 0.5, 1200), 180);
  }

  death()   {
    this._noise(0.28, 0.55, 400);
    this._osc(160, 'square', 0.25, 0.001, 0.22, 55);
  }

  coin()    { this._osc(1100, 'sine', 0.3, 0.001, 0.14, 1600); }

  evolve()  {
    [440, 554, 659, 880, 1108].forEach((f, i) =>
      setTimeout(() => this._osc(f, 'sine', 0.5, 0.001, 0.22), i * 70));
  }

  wave()    { this._osc(280, 'triangle', 0.35, 0.001, 0.18, 140); }

  levelComplete() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => this._osc(f, 'sine', 0.55, 0.001, 0.38), i * 110));
    setTimeout(() => this._osc(1568, 'sine', 0.6, 0.001, 0.5), 500);
  }

  gameOver() {
    [392, 294, 220, 165].forEach((f, i) =>
      setTimeout(() => this._osc(f, 'sawtooth', 0.45, 0.001, 0.35), i * 160));
  }

  place()   { this._osc(660, 'sine', 0.3, 0.001, 0.1, 880); }
  sell()    { this._osc(440, 'sine', 0.3, 0.001, 0.12, 220); }
  speed()   { this._osc(800, 'square', 0.2, 0.001, 0.08, 1200); }
}
