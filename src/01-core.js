import * as THREE from 'three';

// ================= utils =================
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const $ = (id) => document.getElementById(id);
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function weighted(list) { let s = 0; for (const it of list) s += it.w; let r = Math.random() * s; for (const it of list) { r -= it.w; if (r <= 0) return it.v; } return list[list.length - 1].v; }

// ================= renderer / scene =================
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f1c88f');
scene.fog = new THREE.Fog('#f1c88f', 48, 100);

const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.5, 220);
const CAM_OFF = new THREE.Vector3(0, 30, 21);
const camTarget = new THREE.Vector3(0, 0, 4);

const hemi = new THREE.HemisphereLight('#cfe9ff', '#d9a066', 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe0ad', 2.7);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
{ const c = sun.shadow.camera; c.left = -32; c.right = 32; c.top = 32; c.bottom = -32; c.near = 1; c.far = 110; }
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight('#ffb3c6', 0.55);
rim.position.set(18, 12, -14);
scene.add(rim);

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

const _v3 = new THREE.Vector3();
function toScreen(x, y, z) { _v3.set(x, y, z).project(camera); return { x: (_v3.x + 1) / 2 * innerWidth, y: (1 - _v3.y) / 2 * innerHeight, vis: _v3.z < 1 }; }

// ================= input =================
const keys = {}, pressed = {};
const mouse = { x: innerWidth / 2, y: innerHeight / 2, left: false, right: false, world: new THREE.Vector3() };
const gamepad = { connected: false, id: '', index: -1, moveX: 0, moveY: 0, aimX: 0, aimY: 0, buttons: [], pressed: [] };
function gamepadAxis(v, deadzone = 0.18) {
  if (!Number.isFinite(v) || Math.abs(v) <= deadzone) return 0;
  return Math.sign(v) * (Math.abs(v) - deadzone) / (1 - deadzone);
}
function pollGamepad() {
  const pads = navigator.getGamepads?.() || [];
  let pad = gamepad.index >= 0 ? pads[gamepad.index] : null;
  if (!pad?.connected) pad = [...pads].find((item) => item?.connected) || null;
  if (!pad) {
    if (gamepad.connected) {
      gamepad.connected = false; gamepad.id = ''; gamepad.index = -1;
      window.dispatchEvent(new CustomEvent('gamepadstatus', { detail: { connected: false } }));
    }
    gamepad.moveX = gamepad.moveY = gamepad.aimX = gamepad.aimY = 0;
    gamepad.buttons = []; gamepad.pressed = [];
    return;
  }
  if (!gamepad.connected || gamepad.index !== pad.index) {
    gamepad.connected = true; gamepad.id = pad.id; gamepad.index = pad.index;
    window.dispatchEvent(new CustomEvent('gamepadstatus', { detail: { connected: true, id: pad.id } }));
  }
  gamepad.moveX = gamepadAxis(pad.axes[0]); gamepad.moveY = gamepadAxis(pad.axes[1]);
  gamepad.aimX = gamepadAxis(pad.axes[2]); gamepad.aimY = gamepadAxis(pad.axes[3]);
  const previous = gamepad.buttons;
  gamepad.buttons = pad.buttons.map((button) => button.pressed || button.value > 0.55);
  gamepad.pressed = gamepad.buttons.map((down, i) => down && !previous[i]);
}
addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  AudioSys.init();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
renderer.domElement.addEventListener('mousedown', (e) => {
  AudioSys.init();
  if (e.button === 0) { mouse.left = true; pressed.M0 = true; }
  if (e.button === 2) { mouse.right = true; pressed.M2 = true; }
});
addEventListener('mouseup', (e) => { if (e.button === 0) mouse.left = false; if (e.button === 2) mouse.right = false; });
addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.left = mouse.right = false; });
function clearPressed() { for (const k in pressed) delete pressed[k]; }
const _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2(), _aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.6);
function updateMouseWorld() {
  _ndc.set(mouse.x / innerWidth * 2 - 1, -(mouse.y / innerHeight) * 2 + 1);
  _ray.setFromCamera(_ndc, camera);
  _ray.ray.intersectPlane(_aimPlane, mouse.world);
}

// ================= audio (all synthesized) =================
const AudioSys = {
  ctx: null, muted: false, last: {},
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const ctx = this.ctx = new C();
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.55; this.master.connect(ctx.destination);
    this.sfxG = ctx.createGain(); this.sfxG.gain.value = 0.9; this.sfxG.connect(this.master);
    this.musG = ctx.createGain(); this.musG.gain.value = 0.3; this.musG.connect(this.master);
    const len = ctx.sampleRate; const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    this.buildSong(); this.step = 0; this.next = ctx.currentTime + 0.15;
    setInterval(() => this.schedule(), 30);
  },
  toggleMute() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : 0.55; return this.muted; },
  tone(f, dur, type = 'square', vol = 0.15, slide = 1, t0 = 0, dest = null) {
    const c = this.ctx; const t = t0 || c.currentTime;
    const o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol = 0.2, freq = 1000, type = 'bandpass', q = 1, t0 = 0, dest = null, sweep = 1) {
    const c = this.ctx; const t = t0 || c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t);
    if (sweep !== 1) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
    f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfxG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  sfx(name) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (this.last[name] && now - this.last[name] < 0.04) return;
    this.last[name] = now;
    switch (name) {
      case 'swing': this.noise(0.12, 0.25, 1500, 'bandpass', 1.2, 0, null, 2.5); break;
      case 'hit': this.tone(rand(380, 440), 0.08, 'square', 0.1, 0.5); this.noise(0.06, 0.18, 2500, 'highpass'); break;
      case 'crit': this.tone(900, 0.14, 'square', 0.12, 1.6); this.noise(0.1, 0.25, 3000, 'highpass'); break;
      case 'kick': this.tone(150, 0.12, 'sine', 0.5, 0.4); this.noise(0.05, 0.2, 1500); break;
      case 'shoot': this.tone(rand(600, 720), 0.06, 'triangle', 0.14, 0.5); break;
      case 'spray': this.noise(0.09, 0.1, 4500, 'highpass'); break;
      case 'dash': this.noise(0.18, 0.25, 500, 'bandpass', 0.8, 0, null, 4); break;
      case 'hurt': this.tone(240, 0.25, 'sawtooth', 0.2, 0.5); break;
      case 'die': this.tone(rand(500, 620), 0.15, 'square', 0.08, 2.2); this.noise(0.15, 0.12, 1200); break;
      case 'boom': this.tone(90, 0.4, 'sine', 0.5, 0.3); this.noise(0.4, 0.35, 900, 'lowpass', 0.7, 0, null, 0.3); break;
      case 'pickup': [660, 880, 1320].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.14, 1, now + i * 0.06)); break;
      case 'coin': this.tone(1300, 0.06, 'square', 0.07); this.tone(1750, 0.14, 'square', 0.07, 1, now + 0.06); break;
      case 'door': this.tone(200, 0.35, 'triangle', 0.2, 1.5); this.tone(300, 0.35, 'triangle', 0.15, 1.5, now + 0.12); break;
      case 'boon': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.13, 1, now + i * 0.07)); break;
      case 'splash': this.noise(0.25, 0.3, 1500, 'bandpass', 0.6, 0, null, 0.4); break;
      case 'bark': this.tone(320, 0.1, 'sawtooth', 0.18, 0.6); this.tone(280, 0.12, 'sawtooth', 0.16, 0.6, now + 0.14); break;
      case 'coo': this.tone(430, 0.14, 'sine', 0.07, 0.8); break;
      case 'spin': this.noise(0.35, 0.12, 900, 'bandpass', 3, 0, null, 1.8); break;
      case 'deny': this.tone(150, 0.15, 'square', 0.1); break;
      case 'stun': this.tone(1200, 0.25, 'triangle', 0.1, 0.5); break;
      case 'engine': this.tone(82, 0.36, 'sawtooth', 0.13, 1.8); this.tone(164, 0.28, 'triangle', 0.055, 1.35); break;
      case 'sonar': this.tone(660, 0.28, 'sine', 0.14, 0.55); this.tone(990, 0.36, 'sine', 0.075, 0.7, now + 0.08); break;
      case 'guitar': [196, 247, 294, 392].forEach((f, i) => this.tone(f, 0.38, 'triangle', 0.09, 0.72, now + i * 0.025)); this.noise(0.24, 0.06, 1700, 'bandpass', 1.1); break;
      case 'whistle': this.tone(1550, 0.42, 'sine', 0.13, 1.12); this.tone(2050, 0.34, 'sine', 0.08, 0.92, now + 0.04); break;
      case 'bleep': this.tone(1000, 0.62, 'sine', 0.2); break;
      case 'gasp': this.noise(0.55, 0.16, 820, 'bandpass', 0.9, 0, null, 0.45); this.tone(330, 0.4, 'triangle', 0.07, 0.62); break;
      case 'redcard': this.tone(1550, 0.9, 'sine', 0.14, 1.04); this.tone(2080, 0.75, 'sine', 0.07, 0.98, now + 0.03); this.noise(0.4, 0.06, 3000, 'bandpass', 2); break;
      case 'kpop': [659, 784, 988, 1175, 988, 1318].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.1, 1, now + i * 0.075)); break;
      case 'honey': this.noise(0.16, 0.13, 360, 'lowpass', 2, 0, null, 2.2); this.tone(230, 0.13, 'sine', 0.1, 0.62); break;
      case 'punch': this.tone(115, 0.11, 'sine', 0.34, 0.42); this.noise(0.055, 0.15, 1100, 'bandpass', 1.6); break;
      case 'can': this.tone(520, 0.26, 'triangle', 0.12, 0.32); this.noise(0.16, 0.11, 2600, 'bandpass', 1.2, 0, null, 0.5); break;
      case 'skate': this.noise(0.16, 0.17, 2100, 'bandpass', 0.7, 0, null, 0.42); this.tone(310, 0.09, 'triangle', 0.1, 1.7); break;
      case 'heal': [523, 784, 1046].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.14, 1, now + i * 0.08)); break;
      case 'win': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.16, 1, now + i * 0.13)); break;
      case 'lose': [440, 392, 330, 262].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.16, 1, now + i * 0.2)); break;
    }
  },
  // Cumbia-flavoured loop: guacharaca, tambora, llamador, bass and a gaita-ish melody.
  buildSong() {
    let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const chords = ['Am', 'Am', 'E', 'E', 'Am', 'Am', 'Dm', 'E'];
    const tones = { Am: [440, 523.3, 659.3, 880, 587.3], E: [493.9, 659.3, 415.3, 587.3, 830.6], Dm: [587.3, 440, 698.5, 523.3, 880] };
    const roots = { Am: 110, E: 82.4, Dm: 73.4 };
    const mel = [];
    for (let bar = 0; bar < 8; bar++) {
      for (let i = 0; i < 8; i++) {
        const src = bar >= 4 && bar !== 6 && bar !== 7 ? mel[(bar - 4) * 8 + i] : null;
        if (src !== null && src !== undefined && rng() < 0.8) { mel.push(src); continue; }
        const play = i === 0 || rng() < (i % 2 ? 0.35 : 0.6);
        mel.push(play ? pick.call(null, tones[chords[bar]].slice(0, rng() < 0.7 ? 3 : 5)) : 0);
      }
    }
    this.song = { chords, roots, mel };
  },
  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const spb = 60 / 98 / 2;
    while (this.next < this.ctx.currentTime + 0.15) { this.playStep(this.step, this.next); this.next += spb; this.step = (this.step + 1) % 64; }
  },
  playStep(s, t) {
    const bar = Math.floor(s / 8), i = s % 8, d = this.musG, sg = this.song;
    const root = sg.roots[sg.chords[bar]];
    this.noise(i % 2 ? 0.09 : 0.05, i % 2 ? 0.07 : 0.035, 6000, 'highpass', 1, t, d);
    if (i === 0 || i === 4) this.tone(72, 0.22, 'sine', 0.42, 0.5, t, d);
    if (i === 2 || i === 6) { this.tone(210, 0.07, 'triangle', 0.12, 0.7, t, d); this.noise(0.05, 0.08, 1800, 'bandpass', 2, t, d); }
    if (i === 7 && bar % 2) this.tone(180, 0.06, 'triangle', 0.08, 0.7, t, d);
    if (i === 0) this.tone(root, 0.3, 'triangle', 0.26, 1, t, d);
    if (i === 3) this.tone(root * 1.5, 0.2, 'triangle', 0.2, 1, t, d);
    if (i === 4) this.tone(root * 2, 0.2, 'triangle', 0.2, 1, t, d);
    if (i === 6) this.tone(root * 1.5, 0.15, 'triangle', 0.16, 1, t, d);
    const n = sg.mel[s];
    if (n) { this.tone(n, 0.26, 'triangle', 0.075, 1, t, d); this.tone(n * 2, 0.18, 'sine', 0.025, 1, t, d); }
  },
};
