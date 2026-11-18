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

