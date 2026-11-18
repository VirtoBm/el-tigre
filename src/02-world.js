// ================= world / plaza =================
const W = 16, D = 12;
const matCache = new Map();
function M(color, extra) {
  const key = color + (extra ? JSON.stringify(extra) : '');
  let m = matCache.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.88, metalness: 0, flatShading: true }, extra || {})); matCache.set(key, m); }
  return m;
}
function mk(geo, mat, x = 0, y = 0, z = 0, parent = null, cast = true) {
  const m = new THREE.Mesh(geo, typeof mat === 'string' ? M(mat) : mat);
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CYL = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);
const SPH = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const ICO = (r, d = 0) => new THREE.IcosahedronGeometry(r, d);
const CONE = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
function shade(hex, k) { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); }

const world = { group: null, colliders: [], fadeables: [], animated: [], reserved: [] };
const fxRoot = new THREE.Group(); scene.add(fxRoot);

function clearWorld() {
  if (world.group) {
    scene.remove(world.group);
    world.group.traverse((o) => {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      if (o.userData.ownMat && o.material) o.material.dispose();
    });
  }
  world.group = new THREE.Group(); scene.add(world.group);
  world.colliders = []; world.fadeables = []; world.animated = []; world.reserved = [];
}
function addCircle(x, z, r) { world.colliders.push({ t: 'c', x, z, r }); }
function addBox(x, z, hw, hd) { world.colliders.push({ t: 'b', x, z, hw, hd }); }

function resolveCollision(p, r, ignoreBounds = false) {
  let hit = false;
  for (const c of world.colliders) {
    if (c.t === 'c') {
      const dx = p.x - c.x, dz = p.z - c.z, d2 = dx * dx + dz * dz, rr = c.r + r;
      if (d2 < rr * rr) { const d = Math.sqrt(d2) || 0.001; p.x = c.x + dx / d * rr; p.z = c.z + dz / d * rr; hit = true; }
    } else {
      const cx = clamp(p.x, c.x - c.hw, c.x + c.hw), cz = clamp(p.z, c.z - c.hd, c.z + c.hd);
      const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-6) { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
        else {
          const ox = c.hw - Math.abs(p.x - c.x) + r, oz = c.hd - Math.abs(p.z - c.z) + r;
          if (ox < oz) p.x += Math.sign(p.x - c.x || 1) * ox; else p.z += Math.sign(p.z - c.z || 1) * oz;
        }
        hit = true;
      }
    }
  }
  if (!ignoreBounds) {
    if (p.x < -W + r) { p.x = -W + r; hit = true; } if (p.x > W - r) { p.x = W - r; hit = true; }
    if (p.z < -D + r) { p.z = -D + r; hit = true; } if (p.z > D - r) { p.z = D - r; hit = true; }
  }
  return hit;
}
function projectileCollide(p, r) {
  const ox = p.x, oz = p.z;
  if (!resolveCollision(p, r)) return null;
  const nx = p.x - ox, nz = p.z - oz, l = Math.hypot(nx, nz);
  return l < 1e-5 ? { x: 0, z: 1 } : { x: nx / l, z: nz / l };
}
function spotFree(x, z, r) {
  if (x < -W + r || x > W - r || z < -D + r || z > D - r) return false;
  for (const c of world.colliders) {
    if (c.t === 'c') { if (Math.hypot(x - c.x, z - c.z) < c.r + r) return false; }
    else { const cx = clamp(x, c.x - c.hw, c.x + c.hw), cz = clamp(z, c.z - c.hd, c.z + c.hd); if (Math.hypot(x - cx, z - cz) < r) return false; }
  }
  for (const q of world.reserved) if (Math.hypot(x - q.x, z - q.z) < q.r + r) return false;
  return true;
}
function makeFadeable(obj, x, z, r) {
  const mats = [];
  obj.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.userData.ownMat = true; mats.push(o.material); } });
  world.fadeables.push({ x, z, r, mats, op: 1 });
}
function updateFadeables(dt, px, pz) {
  for (const f of world.fadeables) {
    const behind = pz < f.z + 0.5 && pz > f.z - f.r - 3.5 && Math.abs(px - f.x) < f.r + 0.6;
    const target = behind || Math.hypot(px - f.x, pz - f.z) < f.r ? 0.16 : 1;
    f.op = damp(f.op, target, 10, dt);
    for (const m of f.mats) { m.opacity = f.op; m.depthWrite = f.op > 0.95; }
  }
}

const THEMES = [
  { name: 'Plaza de Bolívar', tiles: ['#dcb98e', '#c99c6c'], accent: '#a85b44', walls: ['#f6e7c8', '#f2c14e', '#7fb3d5', '#f4978e', '#a7c957', '#ffffff'] },
  { name: 'Plaza Santo Domingo', tiles: ['#e8d6b9', '#cdb08a'], accent: '#7a9e7e', walls: ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#fff1d0', '#f78c6b'] },
  { name: 'Parque Berrío', tiles: ['#d6a98a', '#b9876a'], accent: '#e9d8a6', walls: ['#e9c46a', '#f4a261', '#90be6d', '#fefae0', '#cdb4db', '#8ecae6'] },
  { name: 'Plaza de San Pedro', tiles: ['#ead8c0', '#d4b48c'], accent: '#c2735c', walls: ['#ffafcc', '#bde0fe', '#fdffb6', '#caffbf', '#ffc6ff', '#fff'] },
  { name: 'Parque de la Ceiba', tiles: ['#d9bf9a', '#bf9f74'], accent: '#6c8f55', walls: ['#f6bd60', '#f7ede2', '#84a59d', '#f28482', '#f5cac3', '#9cc5a1'] },
  { name: 'Chorro de Quevedo', tiles: ['#cf9f7c', '#b07a5a'], accent: '#ecd9b8', walls: ['#fcbf49', '#eae2b7', '#d62828', '#3a86ff', '#ffbe0b', '#8338ec'] },
  { name: 'Plaza de Montería', tiles: ['#d6bd91', '#c4a878'], accent: '#4f7a55', walls: ['#f6e7c8', '#e8b94f', '#7aa8a0', '#f4a49a', '#8cae65', '#ffffff'] },
];

function buildGround(th) {
  const g = world.group;
  mk(new THREE.PlaneGeometry(160, 160).rotateX(-Math.PI / 2), '#a39382', 0, -0.06, 0, g, false);
  mk(BOX(2 * W + 3.4, 0.2, 2 * D + 3.4), '#ecdfc6', 0, -0.12, 0, g, false);
  const nx = W, nz = D; const count = nx * nz;
  const inst = new THREE.InstancedMesh(BOX(1.93, 0.1, 1.93), new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), count);
  inst.receiveShadow = true; inst.userData.ownMat = true;
  const m4 = new THREE.Matrix4(), c = new THREE.Color(); let i = 0;
  for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) {
    const x = -W + 1 + ix * 2, z = -D + 1 + iz * 2;
    m4.makeTranslation(x, -0.03, z); inst.setMatrixAt(i, m4);
    const r = Math.hypot(x, z);
    let col = (ix + iz) % 2 ? th.tiles[0] : th.tiles[1];
    if ((r > 6.2 && r < 8.2) || Math.abs(x) === Math.abs(z)) col = th.accent;
    c.set(col).multiplyScalar(rand(0.93, 1.06)); inst.setColorAt(i, c); i++;
  }
  g.add(inst);
  const curb = '#cbb795';
  mk(BOX(2 * W + 0.6, 0.18, 0.3), curb, 0, 0.05, D + 0.15, g);
  mk(BOX(0.3, 0.18, 2 * D), curb, -W - 0.15, 0.05, 0, g);
  mk(BOX(0.3, 0.18, 2 * D), curb, W + 0.15, 0.05, 0, g);
}

function bougainvillea(parent, x, y, z, n = 7) {
  const cols = ['#e0218a', '#ff4fa3', '#c9184a', '#ff85c0', '#d81159'];
  for (let i = 0; i < n; i++) mk(ICO(rand(0.2, 0.42)), pick(cols), x + rand(-0.9, 0.9), y - rand(0, 1.3), z + rand(-0.05, 0.3), parent);
  for (let i = 0; i < 3; i++) mk(ICO(rand(0.2, 0.3)), '#4f7a34', x + rand(-0.8, 0.8), y - rand(0, 1), z + 0.1, parent);
}
function house(parent, cx, w, depth, th) {
  const h = rand(5.2, 8), wall = pick(th.walls), trim = pick(['#ffffff', '#f7ede2', '#3d5a80', '#2a9d8f', '#e76f51', '#6b4226']);
  mk(BOX(w, h, depth), wall, cx, h / 2, -depth / 2, parent);
  mk(BOX(w + 0.03, 0.9, depth + 0.03), shade(wall, 0.72), cx, 0.45, -depth / 2, parent);
  mk(BOX(w + 0.12, 0.25, 0.35), trim, cx, h - 0.1, 0.12, parent);
  const eave = mk(BOX(w + 0.3, 0.16, 1.4), '#b5523b', cx, h + 0.32, -0.15, parent); eave.rotation.x = 0.42;
  mk(BOX(w + 0.05, 0.7, depth - 0.8), '#a8432f', cx, h + 0.35, -depth / 2 - 0.4, parent);
  const doorX = cx + rand(-w / 5, w / 5);
  mk(BOX(1.3, 2.4, 0.15), pick(['#6b3e26', '#3d5a80', '#2a6f4e', '#8c2f39', '#5e548e']), doorX, 1.2, 0.05, parent);
  mk(BOX(1.6, 0.22, 0.25), trim, doorX, 2.5, 0.1, parent);
  const nWin = w > 5 ? 2 : 1;
  for (let i = 0; i < nWin; i++) {
    const wx = cx + (nWin === 1 ? 0 : (i ? 1 : -1) * w * 0.26), wy = h - 2.2;
    mk(BOX(1.0, 1.5, 0.12), '#4a3326', wx, wy, 0.04, parent);
    mk(BOX(1.25, 0.15, 0.22), trim, wx, wy + 0.85, 0.1, parent);
    if (Math.random() < 0.75) {
      mk(BOX(1.9, 0.14, 0.85), '#6b4226', wx, wy - 0.8, 0.42, parent);
      for (let k = -2; k <= 2; k++) mk(BOX(0.06, 0.6, 0.06), '#5a3620', wx + k * 0.44, wy - 0.45, 0.8, parent, false);
      mk(BOX(1.9, 0.08, 0.08), '#5a3620', wx, wy - 0.15, 0.8, parent, false);
      if (Math.random() < 0.65) bougainvillea(parent, wx, wy - 0.6, 0.85);
    }
    if (Math.abs(wx - doorX) > 1.3 && Math.random() < 0.7) {
      mk(BOX(0.9, 1.2, 0.1), '#3d2b1f', wx, 1.7, 0.04, parent);
      for (let k = -1; k <= 1; k++) mk(BOX(0.05, 1.2, 0.08), '#222', wx + k * 0.25, 1.7, 0.12, parent, false);
    }
  }
  if (Math.random() < 0.3) bougainvillea(parent, cx + w / 2 - 0.4, h - 0.3, 0.2, 10);
}
function church(parent, cx) {
  const w = 11, h = 9, white = '#fbf6ec', yel = '#f2c14e';
  mk(BOX(w, h, 8), white, cx, h / 2, -4, parent);
  mk(BOX(w + 0.1, 0.9, 8.1), yel, cx, 0.45, -4, parent);
  for (const s of [-1, 1]) {
    const tx = cx + s * (w / 2 - 1.3);
    mk(BOX(2.6, h + 5, 2.6), white, tx, (h + 5) / 2, -1.1, parent);
    mk(BOX(2.9, 0.35, 2.9), yel, tx, h + 5, -1.1, parent);
    const roof = mk(CONE(2.1, 2.8, 4), '#c0583f', tx, h + 6.5, -1.1, parent); roof.rotation.y = Math.PI / 4;
    mk(BOX(1.1, 1.7, 0.2), '#3b2a1a', tx, h + 3.2, 0.22, parent);
    mk(SPH(0.38), '#d4a017', tx, h + 3.0, 0.1, parent);
  }
  const ped = mk(CYL(3.6, 3.6, 0.6, 3), white, cx, h + 1.2, -0.6, parent); ped.rotation.x = -Math.PI / 2;
  mk(BOX(w + 0.2, 0.3, 0.6), yel, cx, h, 0.05, parent);
  const rose = mk(CYL(0.9, 0.9, 0.2, 16), '#5fa8d3', cx, h - 1.6, 0.05, parent); rose.rotation.x = Math.PI / 2;
  mk(BOX(2.6, 4, 0.2), yel, cx, 2, 0.04, parent);
  const cross = new THREE.Group(); cross.position.set(cx, h + 3.4, -0.6); parent.add(cross);
  mk(BOX(0.15, 1.1, 0.15), yel, 0, 0, 0, cross); mk(BOX(0.6, 0.15, 0.15), yel, 0, 0.18, 0, cross);
}
// A row of facades facing +z, from x=-len/2..len/2, then rotated/positioned by caller.
function facadeRow(len, th, withChurch) {
  const g = new THREE.Group();
  let x = -len / 2, churchDone = !withChurch;
  while (x < len / 2 - 0.5) {
    if (!churchDone && x >= -5.6) { church(g, 0); x = 5.5; churchDone = true; continue; }
    let w = Math.min(rand(4, 6.5), len / 2 - x);
    if (!churchDone && x + w > -5.5) w = -5.5 - x;
    if (w < 1.5) { x += w; continue; }
    house(g, x + w / 2, w, 5, th);
    x += w;
  }
  return g;
}

function bench(x, z, rot = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; world.group.add(g);
  for (let i = 0; i < 3; i++) mk(BOX(2.2, 0.08, 0.18), '#a0522d', 0, 0.55, -0.2 + i * 0.2, g);
  mk(BOX(2.2, 0.45, 0.08), '#a0522d', 0, 0.85, -0.32, g).rotation.x = -0.15;
  for (const s of [-1, 1]) { mk(BOX(0.08, 0.55, 0.6), '#2b2d42', s * 0.9, 0.27, -0.05, g); }
  if (Math.abs(Math.sin(rot)) > 0.5) addBox(x, z, 0.4, 1.15); else addBox(x, z, 1.15, 0.4);
}
function planter(x, z, w = 2.4, d = 1.4) {
  const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
  mk(BOX(w, 0.6, d), '#d4a373', 0, 0.3, 0, g);
  mk(BOX(w - 0.2, 0.1, d - 0.2), '#5c4033', 0, 0.6, 0, g, false);
  const cols = ['#e63946', '#ffb703', '#ff70a6', '#ffffff', '#c77dff'];
  for (let i = 0; i < Math.round(w * d * 2.2); i++) mk(ICO(rand(0.15, 0.32)), Math.random() < 0.5 ? '#4f8a3a' : pick(cols), rand(-w / 2 + 0.3, w / 2 - 0.3), 0.75, rand(-d / 2 + 0.3, d / 2 - 0.3), g);
  addBox(x, z, w / 2, d / 2);
}
function lamp(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
  mk(CYL(0.08, 0.13, 3.4, 8), '#1f2a30', 0, 1.7, 0, g);
  mk(CYL(0.25, 0.18, 0.15, 8), '#1f2a30', 0, 3.45, 0, g);
  mk(BOX(0.34, 0.45, 0.34), M('#ffe08a', { emissive: '#ffb703', emissiveIntensity: 0.6 }), 0, 3.75, 0, g);
  mk(CONE(0.3, 0.3, 4), '#1f2a30', 0, 4.12, 0, g).rotation.y = Math.PI / 4;
  addCircle(x, z, 0.25);
}
function palm(x, z, h = rand(4.5, 6), withPlanter = true) {
  const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
  if (withPlanter) { mk(CYL(0.85, 0.95, 0.5, 10), '#d4a373', 0, 0.25, 0, g); mk(CYL(0.75, 0.75, 0.08, 10), '#5c4033', 0, 0.52, 0, g, false); }
  const segs = 7, lean = rand(-0.4, 0.4), leanZ = rand(-0.3, 0.3);
  let top = new THREE.Vector3();
  for (let i = 0; i < segs; i++) {
    const k = i / segs, y = 0.4 + (i + 0.5) * h / segs;
    mk(CYL(0.2, 0.26, h / segs + 0.02, 7), i % 2 ? '#a58a65' : '#8f7552', lean * k * k * 2, y, leanZ * k * k * 2, g);
    top.set(lean * k * k * 2, y + h / segs / 2, leanZ * k * k * 2);
  }
  const crown = new THREE.Group(); crown.position.copy(top); g.add(crown);
  for (let i = 0; i < 8; i++) {
    const piv = new THREE.Group(); piv.rotation.y = i * TAU / 8 + rand(-0.2, 0.2); crown.add(piv);
    const inner = new THREE.Group(); inner.rotation.x = rand(0.35, 0.7); piv.add(inner);
    mk(BOX(0.55, 0.05, 2.6), i % 2 ? '#4d9a3a' : '#3e8530', 0, 0, 1.25, inner);
    mk(BOX(0.35, 0.05, 1.0), '#5fb04a', 0, -0.25, 2.6, inner).rotation.x = 0.5;
  }
  for (let i = 0; i < 3; i++) mk(SPH(0.17, 6, 5), '#6b4f2a', rand(-0.25, 0.25), -0.25, rand(-0.25, 0.25), crown);
  world.animated.push((t) => { crown.rotation.z = Math.sin(t * 1.3 + x) * 0.05; crown.rotation.x = Math.cos(t * 1.1 + z) * 0.04; });
  makeFadeable(crown, x + top.x, z + top.z, 2.6);
  addCircle(x, z, withPlanter ? 0.9 : 0.3);
}
function fruitCart(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rand(-0.3, 0.3); world.group.add(g);
  const col = pick(['#2a9d8f', '#e76f51', '#3a86ff', '#ffbe0b']);
  mk(BOX(1.9, 0.8, 1.0), col, 0, 0.85, 0, g);
  mk(BOX(2.0, 0.1, 1.1), '#fefae0', 0, 1.3, 0, g);
  for (const s of [-1, 1]) { const wh = mk(CYL(0.35, 0.35, 0.12, 12), '#222', s * 0.6, 0.35, 0.55, g); wh.rotation.x = Math.PI / 2; }
  const fruits = ['#ffbe0b', '#fb8500', '#e63946', '#8ac926', '#ffd60a', '#ff006e'];
  for (let i = 0; i < 16; i++) mk(SPH(rand(0.1, 0.17), 6, 5), pick(fruits), rand(-0.85, 0.85), 1.45, rand(-0.42, 0.42), g);
  mk(CYL(0.04, 0.04, 2.0, 6), '#ddd', 0, 2.2, 0, g);
  const umb = new THREE.Group(); umb.position.set(0, 3.1, 0); g.add(umb);
  mk(CONE(1.5, 0.6, 8), pick(['#e63946', '#ffbe0b', '#3a86ff', '#06d6a0']), 0, 0, 0, umb);
  mk(CONE(0.6, 0.3, 8), '#ffffff', 0, 0.35, 0, umb);
  addBox(x, z, 1.0, 0.6);
}
function fountain(x, z, big = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(big); world.group.add(g);
  const stone = '#e3d5b8';
  mk(CYL(2.5, 2.7, 0.7, 16), stone, 0, 0.35, 0, g);
  const water = M('#56cfe1', { emissive: '#1b6f8f', emissiveIntensity: 0.35, roughness: 0.15, flatShading: false });
  const wat = mk(CYL(2.2, 2.2, 0.1, 20), water, 0, 0.62, 0, g, false);
  mk(CYL(0.35, 0.55, 1.8, 8), stone, 0, 1.2, 0, g);
  mk(CYL(1.15, 0.4, 0.45, 12), stone, 0, 2.1, 0, g);
  mk(CYL(0.95, 0.95, 0.08, 12), water, 0, 2.3, 0, g, false);
  mk(SPH(0.3, 8, 6), stone, 0, 2.6, 0, g);
  const jet = mk(CONE(0.3, 1.3, 8), M('#bde0fe', { transparent: true, opacity: 0.65 }), 0, 3.2, 0, g, false);
  world.animated.push((t, dt) => {
    jet.scale.y = 1 + Math.sin(t * 7) * 0.15; wat.position.y = 0.62 + Math.sin(t * 2) * 0.02;
    if (Math.random() < dt * 25) particle(x + rand(-0.4, 0.4) * big, 3.6 * big, z + rand(-0.4, 0.4) * big, rand(-2, 2), rand(1, 3), rand(-2, 2), '#bde0fe', 0.12, 0.8, -10, 0.2);
  });
  addCircle(x, z, 2.6 * big);
}
function statue(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
  mk(BOX(2.8, 0.5, 2.8), '#d8c8a8', 0, 0.25, 0, g);
  mk(BOX(2.0, 2.0, 2.0), '#e8dcc4', 0, 1.5, 0, g);
  mk(BOX(2.2, 0.25, 2.2), '#c9b48f', 0, 2.6, 0, g);
  const br = '#5f8f7a';
  const fig = new THREE.Group(); fig.position.y = 2.7; g.add(fig);
  mk(CYL(0.28, 0.35, 1.2, 8), br, 0, 0.6, 0, fig);
  mk(CYL(0.5, 0.7, 1.3, 8), shade(br, 0.85), 0, 0.85, -0.12, fig);
  mk(SPH(0.27, 8, 6), br, 0, 1.45, 0, fig);
  const arm = mk(BOX(0.14, 0.9, 0.14), br, 0.35, 1.4, 0.1, fig); arm.rotation.z = -0.6;
  const sw = mk(BOX(0.06, 1.0, 0.06), '#8fb8a5', 0.75, 2.1, 0.1, fig); sw.rotation.z = -0.2;
  makeFadeable(fig, x, z, 1.4);
  addBox(x, z, 1.4, 1.4);
}
function ceiba(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
  mk(CYL(0.6, 1.1, 5.5, 9), '#8a7968', 0, 2.75, 0, g);
  for (let i = 0; i < 6; i++) { const b = mk(BOX(0.25, 1.2, 1.4), '#7d6c5c', Math.sin(i) * 0.9, 0.6, Math.cos(i) * 0.9, g); b.rotation.y = i; }
  const can = new THREE.Group(); can.position.y = 6; g.add(can);
  const greens = ['#5a8f3e', '#6aa84f', '#4f7a34', '#7cb35a'];
  for (let i = 0; i < 11; i++) { const a = i / 11 * TAU; const rr = i ? rand(1.8, 3.6) : 0; const c = mk(ICO(rand(1.4, 2.3), 0), pick(greens), Math.sin(a) * rr, rand(-0.4, 1.2), Math.cos(a) * rr, can); c.scale.y = 0.65; }
  for (let i = 0; i < 8; i++) mk(ICO(0.2), '#ff70a6', rand(-3.5, 3.5), rand(-0.6, 0.8), rand(-3.5, 3.5), can);
  world.animated.push((t) => { can.rotation.y = Math.sin(t * 0.6) * 0.03; });
  makeFadeable(can, x, z, 4.2);
  addCircle(x, z, 1.2);
}
function bunting(z, y = 6.8) {
  const cols = ['#ffd100', '#0033a0', '#ce1126', '#ffffff', '#2a9d8f', '#ff70a6'];
  const g = new THREE.Group(); g.position.set(0, y, z); world.group.add(g);
  const len = 2 * W + 2; const n = 24;
  mk(BOX(len, 0.03, 0.03), '#3b2a1a', 0, 0.05, 0, g, false);
  const flags = [];
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (i + 0.5) * len / n; const sag = -Math.sin((i + 0.5) / n * Math.PI) * 0.8;
    const f = mk(CONE(0.28, 0.6, 3), cols[i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2], x, sag - 0.3, 0, g);
    f.rotation.x = Math.PI; f.scale.z = 0.12; flags.push(f);
  }
  world.animated.push((t) => { flags.forEach((f, i) => { f.rotation.z = Math.sin(t * 3 + i) * 0.15; }); });
}
function southEdge() {
  const g = world.group;
  mk(BOX(2 * W + 3, 0.55, 0.5), '#e9dcc3', 0, 0.27, D + 1.2, g);
  for (let x = -W; x <= W; x += 2.2) mk(ICO(rand(0.45, 0.7), 0), pick(['#4f8a3a', '#5b9a45', '#3e7a2e']), x + rand(-0.3, 0.3), 0.7, D + 1.8, g);
  for (let x = -W; x <= W; x += 1.3) if (Math.random() < 0.5) mk(ICO(0.18), pick(['#ff70a6', '#ffd166', '#e63946']), x, 1.1, D + 1.7, g);
  // pigeon-free sidewalk props outside arena
  for (const x of [-W + 1, -6, 6, W - 1]) { const l = new THREE.Group(); l.position.set(x, 0, D + 1.6); g.add(l); mk(CYL(0.08, 0.12, 3, 8), '#1f2a30', 0, 1.5, 0, l); mk(BOX(0.32, 0.4, 0.32), M('#ffe08a', { emissive: '#ffb703', emissiveIntensity: 0.6 }), 0, 3.2, 0, l); }
}
function plazaEntrance() {
  const g = world.group, z = D + 1.2;
  for (const x of [-10, 10]) mk(BOX(12, 0.55, 0.55), '#e9dcc3', x, 0.27, z, g);
  for (const x of [-4, 4]) {
    mk(BOX(0.9, 4.7, 0.9), '#f1d8a6', x, 2.35, z, g);
    mk(BOX(1.15, 0.3, 1.1), '#3f807a', x, 4.75, z, g);
  }
  mk(BOX(8.7, 0.7, 0.8), '#f1d8a6', 0, 4.9, z, g);
  mk(BOX(6.7, 0.85, 0.16), '#8c2f39', 0, 4.05, z + 0.5, g);
  makeLabel('<span class="ic">🌿</span>ENTRADA · PLAZA DE MONTERÍA', 0, 6.2, z + 0.5);
}
function schoolBuilding() {
  const g = new THREE.Group(); g.position.set(0, 0, -D - 8.5); world.group.add(g);
  mk(BOX(13, 6.8, 1.5), '#f1d8a6', 0, 3.4, -0.5, g);
  mk(BOX(13.5, 0.4, 1.8), '#3f807a', 0, 6.9, -0.5, g);
  mk(BOX(4.4, 3.6, 0.22), '#b75f43', 0, 1.8, 0.33, g);
  mk(BOX(3.2, 0.3, 0.25), '#f2c14e', 0, 3.8, 0.34, g);
  for (const x of [-4.6, -2.7, 2.7, 4.6]) {
    mk(BOX(1.25, 1.4, 0.18), '#69a9bf', x, 4.4, 0.31, g);
    mk(BOX(1.4, 0.14, 0.22), '#fff4d6', x, 5.18, 0.34, g);
    mk(BOX(0.1, 1.55, 0.2), '#fff4d6', x, 4.4, 0.35, g);
  }
  const flag = mk(BOX(2.4, 0.9, 0.08), '#e9b64a', 0, 5.7, 0.36, g);
  mk(BOX(2.4, 0.3, 0.09), '#34689a', 0, 5.4, 0.36, g);
  mk(BOX(2.4, 0.3, 0.09), '#b64942', 0, 5.1, 0.36, g);
  flag.position.y = 5.7;
  makeLabel('<span class="ic">🏫</span>ESCUELA DE MONTERÍA', 0, 8, -D - 8.5);
}
function armyBarricade(x, z, color) {
  const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
  mk(BOX(3.4, 1.2, 0.45), color, 0, 0.6, 0, g);
  mk(BOX(3.6, 0.16, 0.5), '#f2c14e', 0, 1.23, 0, g);
  for (let i = -1; i <= 1; i++) mk(BOX(0.12, 0.55, 0.52), '#263238', i * 0.95, 0.6, 0.02, g);
  addBox(x, z, 1.7, 0.3);
}

// exits: big wooden gates on the north facades
function buildExit(ex) {
  const grp = new THREE.Group(); grp.position.set(ex.x, 0, -D - 1.15); world.group.add(grp);
  const stone = '#efe3c8';
  for (const s of [-1, 1]) { mk(BOX(0.65, 4, 0.7), stone, s * 1.6, 2, 0.25, grp); mk(BOX(0.8, 0.3, 0.85), shade(stone, 0.85), s * 1.6, 0.15, 0.25, grp); }
  mk(BOX(4, 0.65, 0.8), stone, 0, 4.2, 0.25, grp);
  const cap = mk(CYL(0.01, 0.9, 0.7, 4), stone, 0, 4.85, 0.25, grp); cap.rotation.y = Math.PI / 4; cap.scale.x = 2.2;
  mk(BOX(2.6, 3.9, 0.1), '#1d140d', 0, 1.95, 0.0, grp, false);
  const glowMat = new THREE.MeshBasicMaterial({ color: ex.color || '#ffd27a', transparent: true, opacity: 0 });
  const glow = mk(new THREE.PlaneGeometry(2.6, 3.9), glowMat, 0, 1.95, 0.08, grp, false); glow.userData.ownMat = true;
  const floorMat = new THREE.MeshBasicMaterial({ color: ex.color || '#ffd27a', transparent: true, opacity: 0, depthWrite: false });
  const floor = mk(new THREE.CircleGeometry(1.6, 24).rotateX(-Math.PI / 2), floorMat, 0, 0.05, 1.4, grp, false); floor.userData.ownMat = true;
  const leaves = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 1.3, 0, 0.12); grp.add(piv);
    mk(BOX(1.3, 3.8, 0.14), '#7a4a2a', -s * 0.65, 1.9, 0, piv);
    for (let k = 0; k < 3; k++) mk(BOX(1.2, 0.1, 0.18), '#4e2f1a', -s * 0.65, 0.6 + k * 1.3, 0.02, piv);
    mk(SPH(0.07, 6, 4), '#d4a017', -s * 1.1, 1.8, 0.1, piv);
    leaves.push(piv);
  }
  ex.obj = { grp, glowMat, floorMat, leaves, open: 0 };
}
function updateExits(dt, t, unlocked) {
  for (const ex of game.exits) {
    if (!ex.obj) continue;
    const o = ex.obj; o.open = damp(o.open, unlocked ? 1 : 0, 4, dt);
    o.leaves[0].rotation.y = -o.open * 1.65; o.leaves[1].rotation.y = o.open * 1.65;
    o.glowMat.opacity = o.open * (0.75 + Math.sin(t * 4) * 0.15);
    o.floorMat.opacity = o.open * (0.25 + Math.sin(t * 4) * 0.08);
  }
}

// ---------- room assembly ----------
function buildRoom(type, th, exits) {
  clearWorld();
  buildGround(th);
  if (type === 'boss' || type === 'army') {
    for (const x of [-11, 11]) { const side = facadeRow(10, th, false); side.position.set(x, 0, -D - 1.2); world.group.add(side); }
    schoolBuilding();
  } else {
    const north = facadeRow(2 * W + 12, th, false);
    north.position.set(0, 0, -D - 1.2); world.group.add(north);
  }
  const west = facadeRow(2 * D + 6, th, false); west.rotation.y = Math.PI / 2; west.position.set(-W - 1.3, 0, 1); world.group.add(west);
  const east = facadeRow(2 * D + 6, th, false); east.rotation.y = -Math.PI / 2; east.position.set(W + 1.3, 0, 1); world.group.add(east);
  if (game.room === 0) plazaEntrance(); else southEdge();
  bunting(-4); bunting(5, 6.2);
  for (const ex of exits) buildExit(ex);

  world.reserved.push({ x: 0, z: D - 2, r: 3.4 });
  for (const ex of exits) world.reserved.push({ x: ex.x, z: -D + 1.2, r: 3 });

  if (type === 'shop') { shopStall(); }
  else if (type === 'rest') { fountain(0, -1, 1.15); world.reserved.push({ x: 0, z: -1, r: 4.5 }); }
  else if (type === 'boss') { for (const [x, z] of [[-11, -7], [11, -7], [-11, 7], [11, 7]]) planter(x, z, 2, 2); for (const [x, z] of [[-6, 0], [6, 0]]) lamp(x, z); }
  else if (type === 'army') { for (const [x, z] of [[-9, 3], [9, 1], [-9, -4], [9, -6]]) planter(x, z, 2.2, 2); armyBarricade(-5, -2, '#4f673d'); armyBarricade(5, -7, '#456344'); }
  else {
    const center = game.room >= 1 && game.room <= 7 ? (Math.random() < 0.55 ? 'ceiba' : 'palmeiras') : pick(['fonte', 'estatua', 'ceiba', 'fonte', 'vazio', 'palmeiras']);
    if (center === 'fonte') fountain(0, -1);
    else if (center === 'estatua') statue(0, -1);
    else if (center === 'ceiba') ceiba(0, -1);
    else if (center === 'palmeiras') { palm(-3, -1); palm(3, -1); }
    world.reserved.push({ x: 0, z: -1, r: center === 'vazio' ? 2 : 3.2 });
    const props = randi(5, 8);
    for (let i = 0, tries = 0; i < props && tries < 200; tries++) {
      const x = rand(-W + 2.5, W - 2.5), z = rand(-D + 3, D - 3.5);
      const kind = pick(['bench', 'planter', 'palm', 'cart', 'lamp', 'bench', 'palm']);
      const r = kind === 'lamp' ? 1 : kind === 'palm' ? 1.6 : 2.2;
      if (!spotFree(x, z, r + 1.2)) continue;
      if (kind === 'bench') bench(x, z, pick([0, Math.PI / 2, Math.PI]));
      else if (kind === 'planter') planter(x, z, rand(1.8, 3), rand(1.2, 1.8));
      else if (kind === 'palm') palm(x, z);
      else if (kind === 'cart') fruitCart(x, z);
      else lamp(x, z);
      i++;
    }
  }
}
