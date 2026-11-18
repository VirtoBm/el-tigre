// ================= settings =================
const settings = (() => { try { return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY))); } catch (e) { return sanitizeSettings(null); } })();
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ } AudioSys.applyVolumes(); }

// ================= audio (all synthesized) =================
// Bus layout: sfx (panned, pitch-varied) + reverb send, music (duck + low-pass for menus), all into a compressor.
const AudioSys = {
  ctx: null, last: {}, mood: 'hub', nextMood: 'hub', bpm: 92, _dest: null, _pitch: 1,
  get muted() { return settings.muted; },
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const ctx = this.ctx = new C();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.18;
    comp.connect(ctx.destination);
    this.master = ctx.createGain(); this.master.connect(comp);
    this.sfxG = ctx.createGain(); this.sfxG.connect(this.master);
    // Small plaza reverb built from a decaying noise impulse.
    const len = Math.floor(ctx.sampleRate * 1.4), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.verb = ctx.createConvolver(); this.verb.buffer = ir;
    this.verbSend = ctx.createGain(); this.verbSend.gain.value = 0.2;
    this.sfxG.connect(this.verbSend); this.verbSend.connect(this.verb); this.verb.connect(this.master);
    this.musDuck = ctx.createGain();
    this.musFilter = ctx.createBiquadFilter(); this.musFilter.type = 'lowpass'; this.musFilter.frequency.value = 18000; this.musFilter.Q.value = 0.7;
    this.musG = ctx.createGain();
    this.musG.connect(this.musDuck); this.musDuck.connect(this.musFilter); this.musFilter.connect(this.master);
    const musVerb = ctx.createGain(); musVerb.gain.value = 0.12; this.musFilter.connect(musVerb); musVerb.connect(this.verb);
    const nlen = ctx.sampleRate; const buf = ctx.createBuffer(1, nlen, ctx.sampleRate); const nd = buf.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    this.applyVolumes();
    this.buildSongs(); this.step = 0; this.next = ctx.currentTime + 0.15;
    setInterval(() => this.schedule(), 25);
  },
  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(settings.muted ? 0 : volumeCurve(settings.master) * 0.9, t, 0.03);
    this.sfxG.gain.setTargetAtTime(volumeCurve(settings.sfx), t, 0.03);
    this.musG.gain.setTargetAtTime(volumeCurve(settings.music) * 0.5, t, 0.03);
  },
  toggleMute() { settings.muted = !settings.muted; saveSettings(); return settings.muted; },
  setMood(mood) { this.nextMood = mood; },
  // Menus muffle the music; big moments briefly duck it so the sfx punch through.
  setMuffle(on) { if (this.ctx) this.musFilter.frequency.setTargetAtTime(on ? 650 : 18000, this.ctx.currentTime, 0.08); },
  duck(amount = 0.45, hold = 0.35) {
    if (!this.ctx) return; const g = this.musDuck.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setTargetAtTime(amount, t, 0.02); g.setTargetAtTime(1, t + hold, 0.25);
  },
  tone(f, dur, type = 'square', vol = 0.15, slide = 1, t0 = 0, dest = null) {
    const c = this.ctx; const t = t0 || c.currentTime;
    if (!dest) f *= this._pitch;
    const o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this._dest || this.sfxG); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol = 0.2, freq = 1000, type = 'bandpass', q = 1, t0 = 0, dest = null, sweep = 1) {
    const c = this.ctx; const t = t0 || c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq * (dest ? 1 : this._pitch), t);
    if (sweep !== 1) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * sweep), t + dur);
    f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this._dest || this.sfxG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  // name: sound id; x: optional world x for stereo placement; opts.pitch overrides the random pitch variation.
  sfx(name, x, opts = {}) {
    if (!this.ctx || settings.muted) return;
    const now = this.ctx.currentTime;
    const gap = opts.gap ?? 0.035;
    if (this.last[name] && now - this.last[name] < gap) return;
    this.last[name] = now;
    let panner = null;
    if (x !== undefined && x !== null && this.ctx.createStereoPanner) {
      panner = this.ctx.createStereoPanner(); panner.pan.value = clamp((x - camTarget.x) / 15, -0.75, 0.75); panner.connect(this.sfxG);
      setTimeout(() => panner.disconnect(), 2500);
    }
    this._dest = panner; this._pitch = opts.pitch ?? rand(0.95, 1.05);
    try { this.play(name, now); } finally { this._dest = null; this._pitch = 1; }
  },
  play(name, now) {
    switch (name) {
      case 'swing': this.noise(0.13, 0.22, 1300, 'bandpass', 1.4, 0, null, 3); break;
      case 'swingHeavy': this.noise(0.2, 0.3, 700, 'bandpass', 1.2, 0, null, 3.5); this.tone(180, 0.12, 'triangle', 0.08, 0.5); break;
      case 'hit': this.tone(170, 0.09, 'sine', 0.32, 0.45); this.noise(0.05, 0.22, 2600, 'highpass', 0.8); this.tone(rand(420, 520), 0.05, 'square', 0.05, 0.6); break;
      case 'crit': this.tone(140, 0.14, 'sine', 0.38, 0.4); this.noise(0.08, 0.28, 3200, 'highpass'); this.tone(1320, 0.18, 'triangle', 0.09, 1.5); this.tone(1980, 0.22, 'sine', 0.05, 1.2, now + 0.03); break;
      case 'kill': this.tone(520, 0.12, 'square', 0.06, 2.1); this.noise(0.14, 0.18, 1600, 'bandpass', 0.9, 0, null, 0.4); this.tone(95, 0.16, 'sine', 0.3, 0.5); break;
      case 'kick': this.tone(150, 0.12, 'sine', 0.45, 0.4); this.noise(0.05, 0.2, 1500); break;
      case 'shoot': this.tone(rand(600, 720), 0.06, 'triangle', 0.12, 0.5); this.noise(0.04, 0.08, 3000, 'highpass'); break;
      case 'eshoot': this.tone(rand(380, 440), 0.08, 'square', 0.05, 0.6); this.noise(0.06, 0.1, 1800, 'bandpass', 1.5); break;
      case 'spray': this.noise(0.09, 0.1, 4500, 'highpass'); break;
      case 'dash': this.noise(0.2, 0.26, 420, 'bandpass', 0.9, 0, null, 5); this.tone(260, 0.12, 'sine', 0.05, 2); break;
      case 'hurt': this.tone(240, 0.24, 'sawtooth', 0.16, 0.45); this.tone(120, 0.2, 'sine', 0.35, 0.5); this.noise(0.12, 0.2, 900, 'lowpass'); break;
      case 'die': this.tone(rand(500, 620), 0.15, 'square', 0.07, 2.2); this.noise(0.15, 0.12, 1200); break;
      case 'boom': this.tone(85, 0.5, 'sine', 0.55, 0.28); this.noise(0.45, 0.38, 900, 'lowpass', 0.7, 0, null, 0.25); this.noise(0.08, 0.2, 3000, 'highpass'); break;
      case 'pickup': [660, 880, 1320].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.12, 1, now + i * 0.06)); break;
      case 'coin': this.tone(1300, 0.06, 'square', 0.06); this.tone(1750, 0.14, 'square', 0.06, 1, now + 0.06); break;
      case 'coinPick': this.tone(1600 + rand(0, 300), 0.07, 'triangle', 0.07, 1.2); break;
      case 'door': this.tone(200, 0.35, 'triangle', 0.18, 1.5); this.tone(300, 0.35, 'triangle', 0.13, 1.5, now + 0.12); break;
      case 'boon': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, 1, now + i * 0.07)); this.tone(2093, 0.5, 'sine', 0.03, 1, now + 0.28); break;
      case 'splash': this.noise(0.25, 0.28, 1500, 'bandpass', 0.6, 0, null, 0.4); break;
      case 'bark': this.tone(320, 0.1, 'sawtooth', 0.16, 0.6); this.tone(280, 0.12, 'sawtooth', 0.14, 0.6, now + 0.14); this.noise(0.08, 0.1, 900, 'bandpass', 2); break;
      case 'growl': this.tone(78, 0.7, 'sawtooth', 0.12, 1.15); this.noise(0.7, 0.12, 300, 'lowpass', 1, 0, null, 1.4); break;
      case 'coo': this.tone(430, 0.14, 'sine', 0.06, 0.8); break;
      case 'spin': this.noise(0.35, 0.12, 900, 'bandpass', 3, 0, null, 1.8); break;
      case 'deny': this.tone(150, 0.15, 'square', 0.09); this.tone(110, 0.15, 'square', 0.07, 1, now + 0.08); break;
      case 'stun': this.tone(1200, 0.25, 'triangle', 0.09, 0.5); break;
      case 'engine': this.tone(82, 0.36, 'sawtooth', 0.12, 1.8); this.tone(164, 0.28, 'triangle', 0.05, 1.35); break;
      case 'sonar': this.tone(660, 0.28, 'sine', 0.13, 0.55); this.tone(990, 0.36, 'sine', 0.07, 0.7, now + 0.08); break;
      case 'guitar': [196, 247, 294, 392].forEach((f, i) => this.tone(f, 0.38, 'triangle', 0.08, 0.72, now + i * 0.025)); this.noise(0.24, 0.05, 1700, 'bandpass', 1.1); break;
      case 'whistle': this.tone(1550, 0.42, 'sine', 0.12, 1.12); this.tone(2050, 0.34, 'sine', 0.07, 0.92, now + 0.04); break;
      case 'bleep': this.tone(1000, 0.62, 'sine', 0.18); break;
      case 'gasp': this.noise(0.55, 0.15, 820, 'bandpass', 0.9, 0, null, 0.45); this.tone(330, 0.4, 'triangle', 0.06, 0.62); break;
      case 'redcard': this.tone(1550, 0.9, 'sine', 0.13, 1.04); this.tone(2080, 0.75, 'sine', 0.06, 0.98, now + 0.03); this.noise(0.4, 0.05, 3000, 'bandpass', 2); break;
      case 'kpop': [659, 784, 988, 1175, 988, 1318].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.09, 1, now + i * 0.075)); break;
      case 'honey': this.noise(0.16, 0.12, 360, 'lowpass', 2, 0, null, 2.2); this.tone(230, 0.13, 'sine', 0.09, 0.62); break;
      case 'punch': this.tone(115, 0.11, 'sine', 0.32, 0.42); this.noise(0.055, 0.15, 1100, 'bandpass', 1.6); break;
      case 'can': this.tone(520, 0.26, 'triangle', 0.11, 0.32); this.noise(0.16, 0.1, 2600, 'bandpass', 1.2, 0, null, 0.5); break;
      case 'skate': this.noise(0.16, 0.16, 2100, 'bandpass', 0.7, 0, null, 0.42); this.tone(310, 0.09, 'triangle', 0.09, 1.7); break;
      case 'heal': [523, 784, 1046].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.13, 1, now + i * 0.08)); break;
      case 'spawn': this.noise(0.22, 0.09, 600, 'bandpass', 1.2, 0, null, 3); this.tone(220, 0.16, 'sine', 0.05, 1.8); break;
      case 'wave': this.tone(90, 0.3, 'sine', 0.4, 0.5); this.noise(0.18, 0.18, 1400, 'bandpass', 1.2); [392, 523].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.08, 1, now + 0.08 + i * 0.09)); break;
      case 'clear': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.1, 1, now + i * 0.08)); this.noise(0.6, 0.05, 6000, 'highpass', 1, now + 0.3); break;
      case 'ready': this.tone(880, 0.16, 'triangle', 0.1); this.tone(1318, 0.3, 'triangle', 0.1, 1, now + 0.09); this.tone(1760, 0.4, 'sine', 0.05, 1, now + 0.18); break;
      case 'power': this.tone(110, 0.6, 'sawtooth', 0.12, 2.2); this.noise(0.5, 0.18, 400, 'bandpass', 1, 0, null, 6); [523, 784, 1046].forEach((f, i) => this.tone(f, 0.35, 'square', 0.04, 1, now + 0.15 + i * 0.05)); break;
      case 'bossIntro': this.tone(55, 1.4, 'sawtooth', 0.14, 1); this.tone(82.4, 1.4, 'sawtooth', 0.1, 1); this.noise(1.2, 0.12, 200, 'lowpass', 1, 0, null, 3); this.tone(110, 0.5, 'sine', 0.4, 0.5, now + 0.9); break;
      case 'heart': this.tone(62, 0.12, 'sine', 0.4, 0.7); this.tone(58, 0.12, 'sine', 0.3, 0.7, now + 0.16); break;
      case 'ui': this.tone(880, 0.05, 'triangle', 0.07, 1.2); break;
      case 'hover': this.tone(1320, 0.03, 'sine', 0.035); break;
      case 'select': this.tone(660, 0.07, 'triangle', 0.09); this.tone(990, 0.12, 'triangle', 0.09, 1, now + 0.05); break;
      case 'back': this.tone(660, 0.06, 'triangle', 0.08); this.tone(440, 0.1, 'triangle', 0.08, 1, now + 0.05); break;
      case 'win': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.14, 1, now + i * 0.13)); break;
      case 'lose': [440, 392, 330, 262].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.14, 1, now + i * 0.2)); break;
    }
  },
  // Cumbia-flavoured loops: guacharaca, tambora, llamador, bass and a gaita-ish melody. Separate boss tune.
  buildSong(seed, chords, tones, roots) {
    const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const mel = [];
    for (let bar = 0; bar < 8; bar++) {
      for (let i = 0; i < 8; i++) {
        const src = bar >= 4 && bar !== 6 && bar !== 7 ? mel[(bar - 4) * 8 + i] : null;
        if (src !== null && src !== undefined && rng() < 0.8) { mel.push(src); continue; }
        const play = i === 0 || rng() < (i % 2 ? 0.35 : 0.6);
        const set = tones[chords[bar]].slice(0, rng() < 0.7 ? 3 : 5);
        mel.push(play ? set[Math.floor(rng() * set.length)] : 0);
      }
    }
    return { chords, roots, mel };
  },
  buildSongs() {
    this.song = this.buildSong(7, ['Am', 'Am', 'E', 'E', 'Am', 'Am', 'Dm', 'E'],
      { Am: [440, 523.3, 659.3, 880, 587.3], E: [493.9, 659.3, 415.3, 587.3, 830.6], Dm: [587.3, 440, 698.5, 523.3, 880] },
      { Am: 110, E: 82.4, Dm: 73.4 });
    this.bossSong = this.buildSong(31, ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'Gm', 'A'],
      { Dm: [587.3, 698.5, 880, 1174.7, 659.3], Bb: [466.2, 587.3, 698.5, 932.3, 523.3], A: [440, 554.4, 659.3, 880, 493.9], Gm: [392, 466.2, 587.3, 784, 440] },
      { Dm: 73.4, Bb: 58.3, A: 55, Gm: 49 });
  },
  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    while (this.next < this.ctx.currentTime + 0.15) {
      if (this.step % 8 === 0) {
        if (this.mood !== this.nextMood) { const toBoss = this.nextMood === 'boss' || this.mood === 'boss'; this.mood = this.nextMood; if (toBoss) this.step = 0; }
        this.bpm = { hub: 90, title: 86, calm: 92, run: 100, boss: 116 }[this.mood] || 100;
      }
      this.playStep(this.step, this.next);
      this.next += 60 / this.bpm / 2; this.step = (this.step + 1) % 64;
    }
  },
  playStep(s, t) {
    const m = this.mood, boss = m === 'boss', full = m === 'run' || boss, soft = m === 'title' || m === 'hub';
    const sg = boss ? this.bossSong : this.song;
    const bar = Math.floor(s / 8), i = s % 8, d = this.musG;
    const root = sg.roots[sg.chords[bar]];
    // guacharaca (scraper) — the cumbia heartbeat
    this.noise(i % 2 ? 0.09 : 0.05, (i % 2 ? 0.07 : 0.035) * (soft ? 0.6 : 1), 6000, 'highpass', 1, t, d);
    if (full) {
      if (i === 0 || i === 4 || (boss && (i === 2 || i === 6))) this.tone(boss ? 64 : 72, 0.22, 'sine', boss ? 0.48 : 0.42, 0.5, t, d);
      if (i === 2 || i === 6) { this.tone(210, 0.07, 'triangle', 0.12, 0.7, t, d); this.noise(0.05, 0.08, 1800, 'bandpass', 2, t, d); }
      if (i === 7 && bar % 2) this.tone(180, 0.06, 'triangle', 0.08, 0.7, t, d);
    } else if (i === 0) this.tone(72, 0.18, 'sine', 0.22, 0.5, t, d);
    const bv = soft ? 0.6 : 1;
    if (i === 0) this.tone(root, 0.3, 'triangle', 0.26 * bv, 1, t, d);
    if (i === 3) this.tone(root * 1.5, 0.2, 'triangle', 0.2 * bv, 1, t, d);
    if (i === 4) this.tone(root * 2, 0.2, 'triangle', 0.2 * bv, 1, t, d);
    if (i === 6) this.tone(root * 1.5, 0.15, 'triangle', 0.16 * bv, 1, t, d);
    if (boss && (i === 0 || i === 3)) this.tone(root * 4, 0.16, 'sawtooth', 0.035, 1, t, d);
    const n = sg.mel[s];
    if (n && !(soft && i % 2)) { this.tone(n, 0.26, 'triangle', 0.075 * (soft ? 0.8 : 1), 1, t, d); this.tone(n * 2, 0.18, 'sine', 0.025, 1, t, d); }
  },
};
