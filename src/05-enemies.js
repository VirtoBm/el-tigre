// ================= enemies =================
const enemies = [], pendingSpawns = [], hazards = [];
const DOG_COLORS = [['#c8894a', '#8a5a2b'], ['#e9d8a6', '#bb9457'], ['#6f4e37', '#3b2a1a'], ['#f1dcc0', '#c8894a']];
let tia = null;
function buildCat() {
  const cat = buildDog(pick(['#e9a23b', '#343a40', '#eee2cf']), '#28211b', 0.68, '#f2c14e');
  for (const s of [-1, 1]) {
    const ear = part('cone', '#28211b', 0.12, 0.24, 0.1, s * 0.15, 0.27, 0.02, cat.head); ear.rotation.z = -s * 0.22;
    part('sph', '#f4a8a8', 0.06, 0.08, 0.035, s * 0.15, 0.3, 0.1, cat.head);
  }
  return cat;
}
function buildRat() {
  const rat = buildDog('#72756f', '#4d5350', 0.55, '#4d5350');
  part('box', '#898d86', 0.17, 0.12, 0.28, 0, -0.08, 0.34, rat.head);
  part('sph', '#d97574', 0.055, 0.05, 0.045, 0, -0.04, 0.49, rat.head);
  return rat;
}
const ENEMY_DEFS = {
  pombo: { name: 'Pombo', hp: 16, r: 0.45, speed: 4.3, cost: 1, build: () => buildPigeon(1, pick(['#9aa5b1', '#adb5bd', '#8d99ae', '#ced4da'])), ai: aiPigeon, anim: animPigeon },
  passarinho: { name: 'Passarinho', hp: 11, r: 0.32, speed: 5.2, cost: 1, build: () => buildPigeon(0.65, pick(['#e9c46a', '#90be6d', '#4cc9f0'])), ai: aiPigeon, anim: animPigeon },
  gato: { name: 'Gato da Praça', hp: 26, r: 0.48, speed: 5.2, cost: 2, build: buildCat, ai: aiCat, anim: animDog },
  cachorro: { name: 'Cachorro', hp: 38, r: 0.7, speed: 3.6, cost: 2, build: () => buildDog(...pick(DOG_COLORS)), ai: aiDog, anim: animDog },
  moleque: { name: 'Moleque Rival', hp: 28, r: 0.55, speed: 3.3, cost: 2, build: () => buildKid({ shirt: '#d62828', shorts: '#f8f9fa', socks: '#f8f9fa', stripe: '#f8f9fa', cap: pick(['#222', '#3a86ff', '#ffbe0b']), capBack: true, skin: pick(['#8d5524', '#c68642', '#e0ac69']) }), ai: aiKid, anim: animKidEnemy },
  morador: { name: 'Morador da Rua', hp: 34, r: 0.58, speed: 3.5, cost: 2, build: () => buildKid({ shirt: '#8c6b4f', shorts: '#5d5547', socks: '#413b34', shoes: '#4b4b4b', hair: '#30251d', skin: '#9a6848', wide: 1.08 }), ai: aiKid, anim: animKidEnemy },
  idoso: { name: 'Idoso da Praça', hp: 24, r: 0.52, speed: 2.8, cost: 2, build: () => buildKid({ shirt: '#d9c8a4', shorts: '#6f7782', socks: '#ddd2bd', shoes: '#493b32', hair: '#b7b3a5', skin: '#c79068', wide: 1.04 }), ai: aiKid, anim: animKidEnemy },
  ciclista: { name: 'Ciclista', hp: 38, r: 0.7, speed: 4.9, cost: 3, build: buildCyclist, ai: aiCyclist, anim: animKidEnemy },
  rato: { name: 'Rato', hp: 18, r: 0.42, speed: 5.8, cost: 1, build: buildRat, ai: aiDog, anim: animDog },
  fumador: { name: 'Grupo de Fumadores', hp: 46, r: 0.62, speed: 3.2, cost: 3, build: () => buildKid({ shirt: pick(['#5f6368', '#7b5b4b', '#4f5965']), shorts: '#292b30', socks: '#383838', shoes: '#252525', hair: '#312b26', skin: '#ae795a', cap: '#383838', wide: 1.15 }), ai: aiSmoker, anim: animKidEnemy },
  fumadorChefe: { name: 'Chefe da turma', hp: 310, r: 0.84, speed: 3.5, heavy: true, elite: true, build: () => { const k = buildKid({ shirt: '#55463d', shorts: '#272525', socks: '#333', shoes: '#252525', hair: '#30251d', skin: '#ae795a', cap: '#45362d', wide: 1.35 }); k.root.scale.setScalar(1.35); return k; }, ai: aiSmoker, anim: animKidEnemy },
  iguana: { name: 'Iguana', hp: 75, r: 0.85, speed: 2.3, cost: 3, build: () => buildIguana(pick(['#6a994e', '#7cb518', '#588157'])), ai: aiIguana, anim: animIguana },
  mancha: { name: 'Mancha, o Cão Chefe', hp: 540, r: 1.3, speed: 4.2, heavy: true, elite: true, build: () => buildDog('#3d2b1f', '#f1dcc0', 1.9, '#111'), ai: aiMancha, anim: animDog },
  rainha: { name: 'Iguana Rainha', hp: 640, r: 1.45, speed: 2.6, heavy: true, elite: true, build: () => buildIguana('#2d6a4f', 1.8, true), ai: aiRainha, anim: animIguana },
  maton: { name: 'El Matón do Bairro', hp: 1500, r: 1.3, speed: 3.4, heavy: true, boss: true, build: () => { const k = buildKid({ shirt: '#6c757d', shorts: '#3a5a8c', socks: '#f8f9fa', stripe: '#343a40', cap: '#d62828', hair: '#1b1b1b', skin: '#a86b3c', wide: 1.35 }); k.root.scale.setScalar(2.1); return k; }, ai: aiMaton, anim: animKidEnemy },
  soldado: { name: 'Soldado do Exército', hp: 52, r: 0.62, speed: 3.8, cost: 3, build: () => buildKid({ shirt: '#687a4c', shorts: '#425337', socks: '#393d2d', shoes: '#242820', hair: '#302e28', skin: '#a86b3c', cap: '#3f5132', wide: 1.12 }), ai: aiSoldier, anim: animKidEnemy },
  elReyna: { name: 'El Reyna', hp: 2250, r: 1.38, speed: 5.9, heavy: true, boss: true, build: () => { const d = buildDog('#a97643', '#6e3c28', 1.95, '#ffd166'); d.root.scale.setScalar(1.35); return d; }, ai: aiElReyna, anim: animDog },
  boneco: { name: 'Boneco de Treino', hp: 420, r: 0.62, speed: 0, heavy: true, dummy: true, build: buildTrainingDummy, ai: aiDummy, anim: animDummy },
};

function buildTrainingDummy() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  part('cyl', '#7a4a2a', 0.42, 0.12, 0.42, 0, 0.06, 0, root);
  part('cyl', '#8b5a2b', 0.07, 1.0, 0.07, 0, 0.5, 0, body);
  part('cyl', '#d9bf8c', 0.34, 0.62, 0.3, 0, 1.15, 0, body);
  for (const y of [0.93, 1.38]) part('cyl', '#8b5a2b', 0.35, 0.05, 0.31, 0, y, 0, body);
  const bar = part('cyl', '#8b5a2b', 0.05, 1.3, 0.05, 0, 1.3, 0, body); bar.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) part('sph', '#d9bf8c', 0.13, 0.13, 0.13, s * 0.66, 1.3, 0, body);
  const head = new THREE.Group(); head.position.set(0, 1.78, 0); body.add(head);
  part('sph', '#e2c995', 0.3, 0.3, 0.3, 0, 0, 0, head);
  for (const s of [-1, 1]) {
    const a = part('box', '#3b2a1a', 0.11, 0.025, 0.02, s * 0.11, 0.06, 0.28, head); a.rotation.z = 0.785;
    const b = part('box', '#3b2a1a', 0.11, 0.025, 0.02, s * 0.11, 0.06, 0.28, head); b.rotation.z = -0.785;
  }
  part('box', '#e63946', 0.16, 0.03, 0.02, 0, -0.1, 0.29, head);
  const target = new THREE.Mesh(circGeo, M('#e63946', { side: THREE.DoubleSide })); target.rotation.x = Math.PI / 2; target.scale.setScalar(0.17); target.position.set(0, 1.18, 0.31); body.add(target);
  const center = new THREE.Mesh(circGeo, M('#fff8e7', { side: THREE.DoubleSide })); center.rotation.x = Math.PI / 2; center.scale.setScalar(0.08); center.position.set(0, 1.18, 0.315); body.add(center);
  return { root, body, head };
}
// The training dummy has no attacks: it only springs back to where it was planted.
function aiDummy(e) {
  e.data.ax ??= e.pos.x; e.data.az ??= e.pos.z;
  e.vel.set((e.data.ax - e.pos.x) * 5, 0, (e.data.az - e.pos.z) * 5);
  e.face = 0;
}
function animDummy(e, dt) {
  if (e.flash > 0) e.data.wobble = 1;
  e.data.wobble = Math.max(0, (e.data.wobble || 0) - dt * 1.6);
  e.rig.body.rotation.z = Math.sin(e.anim * 17) * 0.22 * e.data.wobble;
  e.rig.body.rotation.x = Math.cos(e.anim * 13) * 0.1 * e.data.wobble;
}

function buildCyclist() {
  const rig = buildKid({ shirt: '#2a9d8f', shorts: '#294c79', socks: '#f8f9fa', shoes: '#252525', hair: '#2b1b10', skin: '#c68642' });
  const bike = new THREE.Group(); rig.root.add(bike);
  const wheelGeo = new THREE.TorusGeometry(0.3, 0.045, 6, 14); wheelGeo.userData.shared = true;
  for (const x of [-0.36, 0.36]) {
    const wheel = new THREE.Mesh(wheelGeo, M('#252525')); wheel.position.set(x, 0.34, -0.04); bike.add(wheel);
  }
  const frame = M('#d62828');
  const barGeo = new THREE.CylinderGeometry(0.025, 0.025, 1, 6); barGeo.userData.shared = true;
  const vertices = [[-0.36, 0.34], [0.36, 0.34], [0.06, 0.72], [0.25, 0.76]];
  for (const [a, b] of [[vertices[0], vertices[1]], [vertices[0], vertices[2]], [vertices[2], vertices[1]], [vertices[2], vertices[3]], [vertices[3], vertices[1]]]) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const bar = new THREE.Mesh(barGeo, frame); bar.scale.y = Math.hypot(dx, dy);
    bar.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, -0.04);
    bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, 0).normalize()); bike.add(bar);
  }
  return rig;
}

// ---------- floating health bars (ordinary enemies, elites and the dummy; bosses use the top bar) ----------
const hpBarGeo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0); hpBarGeo.userData.shared = true;
function barMat(color, opacity) { const m = basicMat(color, opacity); m.depthTest = false; return m; }
function ensureHpBar(e) {
  if (e.bar || e.def.boss) return;
  const w = clamp(e.r * 2, 0.9, 2), g = new THREE.Group(); g.renderOrder = 10;
  const bg = new THREE.Mesh(hpBarGeo, barMat('#1b120c', 0.8)); bg.scale.set(w + 0.1, 0.22, 1); bg.position.set(-(w + 0.1) / 2, 0, 0);
  const chip = new THREE.Mesh(hpBarGeo, barMat('#fff3c4', 0.95)); chip.scale.set(w, 0.13, 1); chip.position.set(-w / 2, 0, 0.001);
  const fill = new THREE.Mesh(hpBarGeo, barMat(e.def.elite ? '#ffb703' : e.def.dummy ? '#4cc9f0' : '#ff4d4d', 1)); fill.scale.set(w, 0.13, 1); fill.position.set(-w / 2, 0, 0.002);
  for (const m of [bg, chip, fill]) m.renderOrder = 10;
  g.add(bg, chip, fill); scene.add(g);
  e.bar = { g, fill, chip, w, chipK: 1, hold: 0 };
}
function updateHpBar(e, dt) {
  const b = e.bar; if (!b) return;
  const k = clamp(e.hp / e.maxHp, 0, 1);
  b.fill.scale.x = Math.max(0.001, b.w * k);
  b.hold -= dt; if (b.hold <= 0) b.chipK = damp(b.chipK, k, 6, dt);
  b.chip.scale.x = Math.max(0.001, b.w * Math.max(k, b.chipK));
  b.g.position.set(e.pos.x, e.data.barY + e.yOff, e.pos.z); b.g.quaternion.copy(camera.quaternion);
  b.g.visible = !e.dead && !e.data.expel && k < 1;
}
function removeHpBar(e) { if (!e.bar) return; scene.remove(e.bar.g); for (const m of e.bar.g.children) m.material.dispose(); e.bar = null; }
function removeEnemyVisuals(e) { scene.remove(e.root); disposeOwn(e.root); removeHpBar(e); }

function queueSpawn(type, x, z, delay = 0.9) {
  teleCircle(x, z, 0.9, delay, ENEMY_DEFS[type]?.boss || ENEMY_DEFS[type]?.elite ? '#ff6b35' : '#ffffff');
  pendingSpawns.push({ type, x, z, t: delay });
}
// Prefers spots at a fair distance (not on top of the hero, not miles away) and away from other pending spawns.
function randomSpawnSpot(minDist = 6) {
  for (let i = 0; i < 80; i++) {
    const x = rand(-W + 1.5, W - 1.5), z = rand(-D + 1.5, D - 2);
    const d = Math.hypot(x - player.pos.x, z - player.pos.z);
    if (d < minDist || (i < 50 && d > minDist + 11)) continue;
    if (!spotFree(x, z, 1.0)) continue;
    if (i < 60 && pendingSpawns.some((s) => Math.hypot(s.x - x, s.z - z) < 1.6)) continue;
    return { x, z };
  }
  return { x: rand(-W + 2, W - 2), z: -D + 3 };
}
function spawnEnemy(type, x, z) {
  const def = ENEMY_DEFS[type]; const rig = def.build(); const root = rig.root;
  root.position.set(x, 0, z); scene.add(root);
  const mats = ownMaterials(root);
  const hpScale = game.state === 'hub' ? 1 : enemyHpScale(game.room, def);
  const e = {
    type, def, rig, root, mats, pos: new THREE.Vector3(x, 0, z), vel: new THREE.Vector3(), kb: new THREE.Vector3(), r: def.r,
    hp: Math.round(def.hp * hpScale), maxHp: 0, state: 'chase', t: rand(0.2, 0.8), cd: rand(0.6, 1.6), face: Math.atan2(player.pos.x - x, player.pos.z - z),
    st: { burn: 0, burnDps: 0, burnTick: 0, poison: 0, poisonDps: 0, poisonTick: 0, food: 0, embarrass: 0, slow: 0, slowAmt: 0, stun: 0 }, flash: 0, dead: false, spawning: false, anim: rand(0, 10), seed: rand(0, 10),
    hitDone: false, data: {}, sm: 1, yOff: 0, pop: 0.25, windup: false, baseScale: root.scale.x,
  };
  e.maxHp = e.hp; enemies.push(e);
  e.data.barY = new THREE.Box3().setFromObject(root).max.y + 0.4;
  burst(x, 0.3, z, '#efe3c8', 12, 4, 0.25, 0.5);
  if (!def.dummy) AudioSys.sfx('spawn', x);
  if (def.boss || def.elite) game.bossE = e;
  if (def.boss) { AudioSys.sfx('bossIntro'); AudioSys.duck(0.3, 1.2); addShake(0.5); zoomPunch(0.6); }
  return e;
}
function damageEnemy(e, dmg, cls = '') {
  if (e.dead) return;
  e.hp -= dmg; e.flash = 0.08; e.data.squash = 1;
  ensureHpBar(e); if (e.bar) e.bar.hold = 0.45;
  floatText(e.pos.x + rand(-0.3, 0.3), 1.4 + e.r, e.pos.z, String(dmg), cls);
  if (cls !== 'burn' && cls !== 'poison') {
    AudioSys.sfx(cls === 'crit' ? 'crit' : 'hit', e.pos.x);
    burst(e.pos.x, 0.8, e.pos.z, cls === 'crit' ? ['#ffffff', '#ffd166', '#ff9f1c'] : ['#ffffff', '#ffd166'], cls === 'crit' ? 10 : 5, cls === 'crit' ? 5 : 3, 0.14, 0.3);
  }
  if (cls === 'crit') { hitstop = Math.max(hitstop, 0.06); addShake(0.12); }
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.dead = true; e.deathT = 0.45; player.kills++;
  if (e.data.mealMesh) { e.root.remove(e.data.mealMesh); e.data.mealMesh = null; }
  // Fly away along the last knockback, spinning, then vanish in a puff.
  const kl = Math.hypot(e.kb.x, e.kb.z), dx = kl > 0.5 ? e.kb.x / kl : e.pos.x - player.pos.x, dz = kl > 0.5 ? e.kb.z / kl : e.pos.z - player.pos.z, dl = Math.hypot(dx, dz) || 1;
  e.data.dieV = { x: dx / dl * (e.def.heavy ? 2 : 7), z: dz / dl * (e.def.heavy ? 2 : 7), y: e.def.heavy ? 2 : 6 };
  removeHpBar(e);
  AudioSys.sfx('kill', e.pos.x); if (!e.def.dummy) hitstop = Math.max(hitstop, 0.035);
  const col = e.type === 'pombo' ? ['#9aa5b1', '#ffffff', '#4f9d8a'] : e.type === 'iguana' || e.type === 'rainha' ? ['#6a994e', '#386641', '#f4a261'] : ['#ffffff', '#efe3c8', '#ffd166'];
  burst(e.pos.x, 0.7, e.pos.z, col, 18, 5.5, 0.25, 0.7);
  shockRing(e.pos.x, e.pos.z, 1.2 + e.r, 0.22, '#ffffff');
  if (game.state === 'play' && !e.data.expel) { const coins = coinDrop(e.def); if (coins) spawnCoins(e.pos.x, e.pos.z, coins); }
  if (e.st.burn > 0 && P('aji_estouro')) { const x = e.pos.x, z = e.pos.z; later(0.05, () => explode(x, z, 2.5, P('aji_estouro'), 'estouro', '#e63946')); }
  if (e.def.boss || e.def.elite) {
    hitstop = 0.25; addShake(1); zoomPunch(1); AudioSys.duck(0.25, 1);
    for (const o of enemies) if (!o.dead && o !== e) { o.hp = 0; killEnemy(o); }
    pendingSpawns.length = 0;
    for (const pr of projs) if (pr.owner === 'e') pr.dead = true;
    hazards.forEach((h) => (h.r = 999));
    if (e.def.boss) later(1.2, () => onBossDefeated());
  }
}
function toP(e) { const dx = player.pos.x - e.pos.x, dz = player.pos.z - e.pos.z; return { dx, dz, d: Math.hypot(dx, dz), a: Math.atan2(dx, dz) }; }
function chase(e, a, mult = 1) { const sp = e.def.speed * e.sm * mult * (1 + game.room * 0.018); e.vel.set(Math.sin(a) * sp, 0, Math.cos(a) * sp); }
function touchHurt(e, dmg) {
  if (e.hitDone) return;
  if (Math.hypot(player.pos.x - e.pos.x, player.pos.z - e.pos.z) < e.r + player.r + 0.15 && hurtPlayer(dmg, e.pos.x, e.pos.z)) e.hitDone = true;
}
function hazardRing(x, z, maxR, speed, dmg, color = '#ff6b35') {
  const m = basicMat(color, 0.85); const mesh = new THREE.Mesh(ringGeo, m); mesh.position.set(x, 0.1, z); fxRoot.add(mesh);
  hazards.push({ x, z, r: 0.5, maxR, speed, dmg, hit: false, mesh, m });
}
function updateHazards(dt) {
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i]; h.r += h.speed * dt;
    h.mesh.scale.set(h.r, 1, h.r); h.m.opacity = 0.85 * (1 - h.r / h.maxR);
    if (!h.hit && h.r < h.maxR) { const d = Math.hypot(player.pos.x - h.x, player.pos.z - h.z); if (Math.abs(d - h.r) < 0.55 && hurtPlayer(h.dmg, h.x, h.z)) h.hit = true; }
    if (h.r >= h.maxR) { fxRoot.remove(h.mesh); h.m.dispose(); hazards.splice(i, 1); }
  }
}
function lobBalloon(e, tx, tz, dmg = 10, r = 1.3, color = '#4cc9f0', kind = 'balloon') {
  teleCircle(tx, tz, r, 0.9, color);
  lob({ fromX: e.pos.x, fromZ: e.pos.z, toX: tx, toZ: tz, dur: 0.9, h: 3.5, y0: 1.6 * e.baseScale, mesh: projMesh(kind, 0.26), onLand: (x, z) => {
    burst(x, 0.3, z, [color, '#ffffff', '#90e0ef'], 14, 4, 0.2, 0.5); AudioSys.sfx('splash');
    if (Math.hypot(player.pos.x - x, player.pos.z - z) < r + player.r * 0.5) hurtPlayer(dmg, x, z);
  } });
}

function updateEnemies(dt) {
  for (let i = pendingSpawns.length - 1; i >= 0; i--) { const s = pendingSpawns[i]; s.t -= dt; if (s.t <= 0) { pendingSpawns.splice(i, 1); spawnEnemy(s.type, s.x, s.z); } }
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dead) {
      e.deathT -= dt; const k = Math.max(0, e.deathT / 0.45), v = e.data.dieV;
      if (v) { e.pos.x += v.x * dt; e.pos.z += v.z * dt; v.y -= 22 * dt; e.yOff = Math.max(0, e.yOff + v.y * dt); v.x *= 0.92; v.z *= 0.92; }
      e.root.position.set(e.pos.x, e.yOff, e.pos.z);
      e.root.scale.setScalar(e.baseScale * (k > 0.35 ? 1 : 0.15 + 0.85 * k / 0.35)); e.root.rotation.z += dt * 10; e.root.rotation.y += dt * 6;
      if (e.deathT <= 0) { burst(e.pos.x, 0.5, e.pos.z, ['#efe3c8', '#ffffff'], 8, 2.5, 0.22, 0.4); removeEnemyVisuals(e); enemies.splice(i, 1); }
      continue;
    }
    updateEnemy(e, dt);
  }
  updateTia(dt);
  updateHazards(dt);
}
function clearTia() {
  if (!tia) return;
  scene.remove(tia.root); disposeOwn(tia.root); tia = null;
}
function spawnTia() {
  if (tia) return;
  const rig = buildKid({ skin: '#c79068', shirt: '#d887a5', shorts: '#6b5b76', socks: '#d8d1c5', shoes: '#493b32', hair: '#c9c4b8', wide: 1.3 });
  rig.root.scale.setScalar(1.12); rig.root.position.set(player.pos.x + 1.2, 0, player.pos.z + 0.6); scene.add(rig.root);
  tia = { root: rig.root, rig, hitCd: 0, phase: 0 };
  toast('👵 A Tia chegou! Ela acompanha você e não pode sofrer dano.', 3.5);
  burst(rig.root.position.x, 1, rig.root.position.z, ['#f2b5c4', '#fff8e7', '#ffd166'], 18, 4, 0.2, 0.7);
}
function updateTia(dt) {
  if (!tia) return;
  tia.phase += dt; tia.hitCd -= dt;
  const px = player.pos.x + Math.cos(tia.phase * 0.7) * 1.25, pz = player.pos.z + 1.1;
  tia.root.position.x += (px - tia.root.position.x) * Math.min(1, dt * 4);
  tia.root.position.z += (pz - tia.root.position.z) * Math.min(1, dt * 4);
  const speed = Math.hypot(px - tia.root.position.x, pz - tia.root.position.z);
  animKid(tia.rig, Math.min(1, speed), tia.phase * 4);
  const target = game.type === 'boss' && game.bossE && !game.bossE.dead
    ? game.bossE
    : game.type === 'army' ? enemies.find((e) => !e.dead && !e.spawning && e.type === 'soldado') : null;
  if (target && tia.hitCd <= 0 && Math.hypot(target.pos.x - tia.root.position.x, target.pos.z - tia.root.position.z) < 11) {
    damageEnemy(target, game.type === 'boss' ? 10 : 14);
    tia.hitCd = game.type === 'boss' ? 0.55 : 0.8;
    tia.rig.arms[0].rotation.x = -2.4;
  }
}
function updateEnemy(e, dt) {
  const st = e.st;
  const pace = enemyPace(game.room);
  e.anim += dt; e.t -= dt * pace; e.cd -= dt * pace; e.windup = false;
  if (e.pop > 0) { e.pop -= dt; e.root.scale.setScalar(e.baseScale * (1 - Math.max(0, e.pop) / 0.25 * 0.7)); }
  if (e.data.expel) { updateExpelledEnemy(e, dt); return; }
  if (st.burn > 0) {
    st.burn -= dt; st.burnTick -= dt;
    if (st.burnTick <= 0) { st.burnTick = 0.5; damageEnemy(e, Math.max(1, Math.round(st.burnDps * 0.5)), 'burn'); }
    if (Math.random() < 0.35) particle(e.pos.x + rand(-0.3, 0.3), 1, e.pos.z + rand(-0.3, 0.3), 0, 2, 0, pick(['#ff6b35', '#e63946', '#ffd166']), 0.12, 0.4, 2);
    if (e.dead) return;
  }
  if (st.poison > 0) {
    st.poison -= dt; st.poisonTick -= dt;
    if (st.poisonTick <= 0) { st.poisonTick = 0.5; damageEnemy(e, Math.max(1, Math.round(st.poisonDps * 0.5)), 'poison'); }
    if (Math.random() < 0.3) particle(e.pos.x + rand(-0.3, 0.3), 0.8, e.pos.z + rand(-0.3, 0.3), 0, 1.1, 0, '#85d34a', 0.1, 0.35, -0.5);
    if (st.poison <= 0) st.poisonDps = 0;
    if (e.dead) return;
  }
  if (st.food > 0) {
    st.food = Math.max(0, st.food - dt);
    st.stun = Math.max(st.stun, st.food);
    if (e.data.mealMesh) { e.data.mealMesh.rotation.y += dt * 2; e.data.mealMesh.position.y = 1.75 + Math.sin(e.anim * 8) * 0.06; }
    if (st.food <= 0 && e.data.mealMesh) { e.root.remove(e.data.mealMesh); e.data.mealMesh = null; }
  }
  e.sm = 1;
  if (st.slow > 0) { st.slow -= dt; e.sm = 1 - st.slowAmt; if (Math.random() < 0.15) particle(e.pos.x, 0.3, e.pos.z, 0, 0.5, 0, '#ff8fab', 0.15, 0.5, -1); if (st.slow <= 0) st.slowAmt = 0; }
  if (st.embarrass > 0) {
    st.embarrass -= dt; e.vel.set(0, 0, 0);
  } else if (st.stun > 0) {
    st.stun -= dt; e.vel.set(0, 0, 0);
    if (Math.random() < 0.3) particle(e.pos.x + Math.sin(e.anim * 8) * 0.5, 1.5 + e.r, e.pos.z + Math.cos(e.anim * 8) * 0.5, 0, 0, 0, '#ffd166', 0.14, 0.25, 0);
  } else e.def.ai(e, dt);

  e.kb.x = damp(e.kb.x, 0, 7, dt); e.kb.z = damp(e.kb.z, 0, 7, dt);
  e.pos.x += (e.vel.x + e.kb.x) * dt; e.pos.z += (e.vel.z + e.kb.z) * dt;
  for (const o of enemies) {
    if (o === e || o.dead || o.data.expel) continue;
    const dx = e.pos.x - o.pos.x, dz = e.pos.z - o.pos.z, d = Math.hypot(dx, dz), min = e.r + o.r;
    if (d < min && d > 0.001) { const push = (min - d) * (o.def.heavy && !e.def.heavy ? 0.9 : 0.5); e.pos.x += dx / d * push; e.pos.z += dz / d * push; }
  }
  // Enemies yield to the hero instead of overlapping (heavies barely move).
  if (player.alive && !e.def.dummy) {
    const dx = e.pos.x - player.pos.x, dz = e.pos.z - player.pos.z, d = Math.hypot(dx, dz), min = e.r + player.r * 0.8;
    if (d < min && d > 0.001) { const push = (min - d) * (e.def.heavy ? 0.25 : 0.8); e.pos.x += dx / d * push; e.pos.z += dz / d * push; }
  }
  e.hitWall = resolveCollision(e.pos, e.r);
  const cur = e.root.rotation.y; e.root.rotation.y = cur + angDiff(cur, e.face) * Math.min(1, dt * 12);
  e.root.position.set(e.pos.x, e.yOff, e.pos.z);
  // Squash & stretch on hit.
  if (e.data.squash > 0) {
    e.data.squash = Math.max(0, e.data.squash - dt * 7); const q = Math.sin(e.data.squash * Math.PI) * 0.18;
    e.root.scale.set(e.baseScale * (1 + q), e.baseScale * (1 - q), e.baseScale * (1 + q));
  } else if (e.pop <= 0 && e.root.scale.y !== e.baseScale && !e.data.expel) e.root.scale.setScalar(e.baseScale);
  updateHpBar(e, dt);
  if (player.specialKind === 'sedan' && player.heroT > 0 && Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z) < 8) e.root.rotation.y += dt * 11;
  if (player.specialKind === 'guitar' && player.heroT > 0) {
    const away = Math.atan2(e.pos.x - player.pos.x, e.pos.z - player.pos.z);
    chase(e, away, 1.25); e.face = away; e.st.stun = Math.max(e.st.stun, 0.08);
  }
  let er = 0, eg = 0, eb = 0;
  if (e.flash > 0) { e.flash -= dt; er = eg = eb = e.def.heavy ? 0.28 : 0.55; }
  else if (e.windup) { const k = 0.35 + Math.sin(e.anim * 30) * 0.25; er = k; eg = k * 0.15; }
  else if (st.embarrass > 0) { er = 0.16; eg = 0.02; eb = 0.06; }
  else if (st.slow > 0) { er = 0.25; eg = 0.05; eb = 0.15; }
  if (er !== e.er || eg !== e.eg || eb !== e.eb) { for (const m of e.mats) m.emissive.setRGB(er, eg, eb); e.er = er; e.eg = eg; e.eb = eb; }
  if (e.def.anim) e.def.anim(e, dt);
  if (st.embarrass > 0) poseEmbarrassed(e);
  else if (e.data.shyIcon) relaxEmbarrassed(e);
}

// ---------- Thiagão's embarrassment and Bruno's VAR send-off ----------
function attachHeadIcon(e, material, size) {
  const sprite = new THREE.Sprite(material), scale = e.baseScale || 1;
  sprite.scale.set(size / scale, size / scale, 1);
  sprite.position.y = (1.75 + e.r * 1.25) / scale;
  e.root.add(sprite);
  return sprite;
}
// Frozen with embarrassment: hands (or paws/wings) over the mouth, a blush and a slight tremble.
function poseEmbarrassed(e) {
  const rig = e.rig;
  if (!e.data.shyIcon) e.data.shyIcon = attachHeadIcon(e, embarrassedSpriteMaterial, 0.82);
  if (rig.arms && rig.head) {
    rig.arms[0].rotation.set(-2.21, 0, 0.57);
    rig.arms[1].rotation.set(-2.21, 0, -0.57);
    rig.head.rotation.set(0.22, 0, 0.06);
  } else if (rig.legs?.length === 4 && rig.tail && !Array.isArray(rig.tail)) {
    rig.legs[0].rotation.set(-2.24, 0, 0.28);
    rig.legs[1].rotation.set(-2.24, 0, -0.28);
    rig.head.rotation.set(0.25, 0, 0);
  } else if (rig.wings) {
    rig.wings[0].rotation.set(-0.5, 2.3, 0.4);
    rig.wings[1].rotation.set(-0.5, -2.3, -0.4);
  } else if (rig.legs?.length === 4) {
    rig.legs[0].rotation.set(0, -0.9, 0.9);
    rig.legs[1].rotation.set(0, 0.9, -0.9);
    if (rig.head) rig.head.rotation.set(0.25, 0, 0);
  }
  e.root.position.x += Math.sin(e.anim * 40) * 0.025;
}
function relaxEmbarrassed(e) {
  const rig = e.rig;
  e.root.remove(e.data.shyIcon); e.data.shyIcon = null;
  for (const limb of [...(rig.arms || []), ...(rig.legs || []), ...(rig.wings || [])]) limb.rotation.set(0, 0, 0);
  rig.head?.rotation.set(0, 0, 0);
}
function startExpel(e, delay = 0) {
  if (e.dead || e.data.expel) return;
  const screen = toScreen(e.pos.x, 1, e.pos.z);
  const exit = nearestScreenExit(screen.x, screen.y, innerWidth, innerHeight);
  if (e.data.shyIcon) relaxEmbarrassed(e);
  e.st.stun = 0; e.st.embarrass = 0; e.vel.set(0, 0, 0); e.kb.set(0, 0, 0);
  // Sent-off enemies can no longer be targeted; they only leave the screen and are removed.
  e.spawning = true;
  e.data.expel = { delay, t: 0, speed: 0, x: exit.x, z: exit.z, card: attachHeadIcon(e, redCardSpriteMaterial, 0.7) };
  e.data.expel.card.scale.y *= 1.4;
}
function updateExpelledEnemy(e, dt) {
  const ex = e.data.expel;
  if (ex.delay > 0) {
    ex.delay -= dt;
    e.root.position.set(e.pos.x + Math.sin(e.anim * 45) * 0.05, e.yOff, e.pos.z);
    return;
  }
  if (ex.t === 0) { floatText(e.pos.x, 1.8 + e.r, e.pos.z, 'EXPULSO!', 'hurt'); AudioSys.sfx('dash'); }
  ex.t += dt; ex.speed = Math.min(30, ex.speed + dt * 42);
  e.pos.x += ex.x * ex.speed * dt; e.pos.z += ex.z * ex.speed * dt;
  e.yOff = Math.sin(Math.min(1, ex.t / 0.45) * Math.PI / 2) * 1.3 + Math.sin(ex.t * 9) * 0.12;
  e.root.rotation.y += dt * 14;
  if (e.rig.body) e.rig.body.rotation.z = Math.sin(ex.t * 7) * 0.5;
  e.root.position.set(e.pos.x, e.yOff, e.pos.z);
  if (Math.random() < 0.7) particle(e.pos.x + rand(-0.3, 0.3), e.yOff + 0.6, e.pos.z + rand(-0.3, 0.3), -ex.x * 2, 0.5, -ex.z * 2, pick(['#d62828', '#151719', '#fff8e7']), 0.14, 0.45, 0);
  const s = toScreen(e.pos.x, e.yOff + 1, e.pos.z);
  if (s.x < -90 || s.x > innerWidth + 90 || s.y < -90 || s.y > innerHeight + 90 || ex.t > 2.4) killEnemy(e);
}

// ---------- animations ----------
function animPigeon(e) {
  const mv = Math.min(1, Math.hypot(e.vel.x, e.vel.z) / 3);
  const flap = e.state === 'peck' ? 1 : mv * 0.4;
  e.rig.wings[0].rotation.z = -0.1 - Math.abs(Math.sin(e.anim * 22)) * flap * 1.2;
  e.rig.wings[1].rotation.z = 0.1 + Math.abs(Math.sin(e.anim * 22)) * flap * 1.2;
  e.rig.body.position.y = Math.abs(Math.sin(e.anim * 14)) * 0.15 * mv + (e.state === 'peck' ? 0.3 : 0);
  e.rig.body.rotation.x = e.state === 'wind' ? -0.4 : e.state === 'peck' ? 0.5 : Math.sin(e.anim * 14) * 0.1 * mv;
}
function animDog(e) {
  const mv = Math.min(1, Math.hypot(e.vel.x, e.vel.z) / 4), s = Math.sin(e.anim * (e.state === 'charge' ? 22 : 14)) * mv;
  e.rig.legs[0].rotation.x = s; e.rig.legs[3].rotation.x = s; e.rig.legs[1].rotation.x = -s; e.rig.legs[2].rotation.x = -s;
  e.rig.tail.rotation.z = Math.sin(e.anim * 18) * 0.6;
  e.rig.body.rotation.x = e.state === 'aim' ? -0.15 : 0;
  e.rig.head.rotation.x = e.windup ? Math.sin(e.anim * 30) * 0.15 : 0;
}
function animKidEnemy(e, dt) {
  const mv = Math.min(1, Math.hypot(e.vel.x, e.vel.z) / 3); e.data.ph = (e.data.ph || 0) + Math.hypot(e.vel.x, e.vel.z) * dt * 1.7 / e.baseScale;
  animKid(e.rig, mv, e.data.ph);
  e.rig.arms[0].rotation.x = e.windup ? -2.6 : -Math.sin(e.data.ph) * 0.7 * mv;
  e.rig.body.rotation.y = e.state === 'stompAir' ? e.anim * 10 : 0;
}
function animIguana(e, dt) {
  const mv = Math.min(1, Math.hypot(e.vel.x, e.vel.z) / 2);
  e.rig.tail.forEach((t, i) => (t.rotation.y = Math.sin(e.anim * 4 - i * 0.7) * (0.25 + (e.windup ? 0.3 : 0))));
  e.rig.legs.forEach((l, i) => (l.rotation.y = Math.sin(e.anim * 12 + i * Math.PI) * 0.5 * mv));
  if (e.data.spin > 0) { e.data.spin -= dt; e.rig.body.rotation.y += dt * 30; } else e.rig.body.rotation.y = damp(e.rig.body.rotation.y % TAU, 0, 10, dt);
  e.rig.head.rotation.x = e.windup ? -0.4 : 0;
}

// ---------- AI ----------
function aiPigeon(e) {
  const tp = toP(e);
  switch (e.state) {
    case 'chase': {
      const a = tp.a + Math.sin(e.anim * 1.6 + e.seed) * 0.9; chase(e, a); e.face = a;
      if (tp.d < 3.8 && e.cd <= 0) { e.state = 'wind'; e.t = 0.45; e.data.dir = tp.a; AudioSys.sfx('coo'); }
      break;
    }
    case 'wind': e.vel.set(0, 0, 0); e.windup = true; if (e.t > 0.15) e.data.dir = tp.a; e.face = e.data.dir;
      if (e.t <= 0) { e.state = 'peck'; e.t = 0.28; e.hitDone = false; } break;
    case 'peck': e.vel.set(Math.sin(e.data.dir) * 14 * e.sm, 0, Math.cos(e.data.dir) * 14 * e.sm); touchHurt(e, 7);
      if (e.t <= 0) { e.state = 'rest'; e.t = 0.7; } break;
    default: e.vel.multiplyScalar(0.85); if (e.t <= 0) { e.state = 'chase'; e.cd = rand(0.8, 1.6); }
  }
}
function aiDog(e) {
  const tp = toP(e);
  switch (e.state) {
    case 'chase': chase(e, tp.a); e.face = tp.a;
      if (tp.d < 8 && e.cd <= 0) { e.state = 'aim'; e.t = 0.7; e.data.dir = tp.a; teleRect(e.pos.x, e.pos.z, tp.a, 9, 1.5, 0.7); AudioSys.sfx('bark', e.pos.x); }
      break;
    case 'aim': e.vel.set(0, 0, 0); e.windup = true; e.face = e.data.dir;
      if (e.t <= 0) { e.state = 'charge'; e.t = 0.5; e.hitDone = false; } break;
    case 'charge': e.vel.set(Math.sin(e.data.dir) * 17 * e.sm, 0, Math.cos(e.data.dir) * 17 * e.sm); touchHurt(e, 12);
      if (Math.random() < 0.6) particle(e.pos.x, 0.15, e.pos.z, 0, 1, 0, '#efe3c8', 0.25, 0.35, -2);
      if (e.hitWall && e.t < 0.42) { e.state = 'dazed'; e.t = 0.9; e.st.stun = 0.9; addShake(0.2); }
      else if (e.t <= 0) { e.state = 'rest'; e.t = 0.5; } break;
    default: e.vel.multiplyScalar(0.8); if (e.t <= 0) { e.state = 'chase'; e.cd = rand(1.2, 2.2); }
  }
}
function aiCat(e) {
  const tp = toP(e), d = e.data;
  switch (e.state) {
    case 'chase':
      e.face = tp.a;
      if (tp.d > 5.5) chase(e, tp.a, 0.9);
      else if (tp.d < 3.2) chase(e, tp.a + Math.PI, 0.7);
      else e.vel.set(0, 0, 0);
      if (e.cd <= 0 && tp.d < 12) {
        d.tx = clamp(player.pos.x + player.vel.x * 0.35, -W + 1, W - 1);
        d.tz = clamp(player.pos.z + player.vel.z * 0.35, -D + 1, D - 1);
        e.state = 'pounceWind'; e.t = 0.55; teleCircle(d.tx, d.tz, 2.4, e.t, '#f4a8a8'); AudioSys.sfx('coo');
      }
      break;
    case 'pounceWind': e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) { d.sx = e.pos.x; d.sz = e.pos.z; d.pounceT = e.t = 0.38; e.state = 'pounce'; e.hitDone = false; }
      break;
    case 'pounce': {
      const k = 1 - e.t / d.pounceT;
      e.pos.x = lerp(d.sx, d.tx, k); e.pos.z = lerp(d.sz, d.tz, k); e.vel.set(0, 0, 0); e.windup = true;
      touchHurt(e, 13);
      if (e.t <= 0) { e.state = 'rest'; e.t = 0.65; e.cd = rand(1.5, 2.2); }
      break;
    }
    default: e.vel.multiplyScalar(0.8); if (e.t <= 0) e.state = 'chase';
  }
}
function aiCyclist(e) {
  const tp = toP(e), d = e.data;
  switch (e.state) {
    case 'chase':
      e.face = tp.a;
      if (tp.d > 7) chase(e, tp.a, 0.85);
      else e.vel.set(Math.sin(tp.a + Math.PI) * e.def.speed * 0.4, 0, Math.cos(tp.a + Math.PI) * e.def.speed * 0.4);
      if (e.cd <= 0 && tp.d < 14) { d.dir = tp.a; e.state = 'sprintWind'; e.t = 0.65; teleRect(e.pos.x, e.pos.z, d.dir, 16, 1.65, e.t, '#4cc9f0'); }
      break;
    case 'sprintWind': e.vel.set(0, 0, 0); e.windup = true; e.face = d.dir;
      if (e.t <= 0) { e.state = 'sprint'; e.t = 0.7; e.hitDone = false; }
      break;
    case 'sprint':
      e.vel.set(Math.sin(d.dir) * 22 * e.sm, 0, Math.cos(d.dir) * 22 * e.sm); touchHurt(e, 15);
      if (e.hitWall && e.t < 0.55) { e.state = 'dazed'; e.t = 0.8; e.st.stun = 0.8; addShake(0.2); }
      else if (e.t <= 0) { e.state = 'rest'; e.t = 0.55; e.cd = rand(1.7, 2.5); }
      break;
    default: e.vel.multiplyScalar(0.78); if (e.t <= 0) e.state = 'chase';
  }
}
function aiSoldier(e) {
  const tp = toP(e), d = e.data;
  switch (e.state) {
    case 'chase':
      e.face = tp.a;
      if (tp.d < 7) chase(e, tp.a + Math.PI, 0.75);
      else if (tp.d > 11) chase(e, tp.a, 0.72);
      else e.vel.set(0, 0, 0);
      if (e.cd <= 0) { e.state = 'volleyWind'; e.t = 0.48; teleRect(e.pos.x, e.pos.z, tp.a, 13, 1.6, e.t, '#d7e78a'); }
      break;
    case 'volleyWind': e.vel.set(0, 0, 0); e.windup = true; e.face = tp.a;
      if (e.t <= 0) { e.state = 'volley'; e.t = 0.01; d.shots = 3; }
      break;
    case 'volley':
      e.vel.set(0, 0, 0);
      if (e.t <= 0) {
        const aim = toP(e).a;
        for (let k = -1; k <= 1; k++) { const a = aim + k * 0.16; spawnProj({ owner: 'e', x: e.pos.x, z: e.pos.z, y: 1.05, vx: Math.sin(a) * 13, vz: Math.cos(a) * 13, r: 0.2, dmg: 8, life: 2, kind: 'ecap' }); }
        AudioSys.sfx('eshoot', e.pos.x);
        if (--d.shots > 0) e.t = 0.26;
        else { e.state = 'grenadeWind'; e.t = 0.58; }
      }
      break;
    case 'grenadeWind': e.vel.set(0, 0, 0); e.windup = true; e.face = tp.a;
      if (e.t <= 0) {
        const x = clamp(player.pos.x + player.vel.x * 0.28, -W + 1, W - 1), z = clamp(player.pos.z + player.vel.z * 0.28, -D + 1, D - 1);
        lobBalloon(e, x, z, 15, 2.25, '#a3b18a', 'balloon'); e.state = 'rest'; e.t = 0.72; e.cd = 1.35;
      }
      break;
    default: e.vel.multiplyScalar(0.8); if (e.t <= 0) e.state = 'chase';
  }
}
function aiKid(e) {
  const tp = toP(e);
  switch (e.state) {
    case 'chase': {
      e.face = tp.a; if (!e.data.side || Math.random() < 0.005) e.data.side = Math.random() < 0.5 ? -1 : 1;
      if (tp.d < 5) chase(e, tp.a + Math.PI); else if (tp.d > 9) chase(e, tp.a); else chase(e, tp.a + e.data.side * Math.PI / 2, 0.7);
      if (e.cd <= 0 && tp.d < 13) { e.state = 'throw'; e.t = 0.4; }
      break;
    }
    case 'throw': e.vel.set(0, 0, 0); e.windup = true; e.face = tp.a;
      if (e.t <= 0) {
        const tx = clamp(player.pos.x + player.vel.x * 0.4, -W + 1, W - 1), tz = clamp(player.pos.z + player.vel.z * 0.4, -D + 1, D - 1);
        lobBalloon(e, tx, tz, 10); e.state = 'chase'; e.cd = rand(2, 2.8);
      } break;
    default: e.state = 'chase';
  }
}
function aiSmoker(e) {
  const tp = toP(e);
  switch (e.state) {
    case 'chase':
      e.face = tp.a;
      if (tp.d > 7) chase(e, tp.a, 0.85);
      else if (e.cd <= 0) { e.state = 'throw'; e.t = 0.5; e.vel.set(0, 0, 0); }
      else e.vel.set(0, 0, 0);
      break;
    case 'throw':
      e.vel.set(0, 0, 0); e.windup = true; e.face = tp.a;
      if (e.t <= 0) {
        const a = tp.a + rand(-0.09, 0.09);
        spawnProj({ owner: 'e', x: e.pos.x + Math.sin(a) * 0.7, z: e.pos.z + Math.cos(a) * 0.7, y: 1.1, vx: Math.sin(a) * 11, vz: Math.cos(a) * 11, r: 0.16, dmg: 9, life: 2.2, kind: 'cigarette' });
        e.state = 'chase'; e.cd = rand(1.7, 2.6); AudioSys.sfx('eshoot', e.pos.x);
      }
      break;
    default: e.state = 'chase';
  }
}
function aiIguana(e) {
  const tp = toP(e);
  switch (e.state) {
    case 'chase': chase(e, tp.a); e.face = tp.a;
      if (tp.d < 3.4 && e.cd <= 0) { e.state = 'wind'; e.t = 0.75; teleCircle(e.pos.x, e.pos.z, 3.3, 0.75); }
      else if (tp.d > 7 && e.cd <= 0 && Math.random() < 0.01) { e.state = 'spitwind'; e.t = 0.5; }
      break;
    case 'wind': e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) {
        e.data.spin = 0.35; shockRing(e.pos.x, e.pos.z, 3.3, 0.25, '#90be6d'); AudioSys.sfx('swing');
        if (tp.d < 3.3 + player.r) hurtPlayer(14, e.pos.x, e.pos.z);
        e.state = 'rest'; e.t = 1; } break;
    case 'spitwind': e.vel.set(0, 0, 0); e.windup = true; e.face = tp.a;
      if (e.t <= 0) { for (let k = -1; k <= 1; k++) { const a = tp.a + k * 0.2; spawnProj({ owner: 'e', x: e.pos.x, z: e.pos.z, y: 0.6, vx: Math.sin(a) * 9, vz: Math.cos(a) * 9, r: 0.22, dmg: 8, life: 2, kind: 'spit' }); } AudioSys.sfx('eshoot', e.pos.x); e.state = 'rest'; e.t = 0.6; } break;
    default: e.vel.multiplyScalar(0.8); if (e.t <= 0) { e.state = 'chase'; e.cd = rand(1.2, 2); }
  }
}
function aiMancha(e) {
  const tp = toP(e); const d = e.data;
  d.seq ??= ['triple', 'bark', 'triple', 'howl']; d.i ??= 0;
  switch (e.state) {
    case 'chase': chase(e, tp.a, 0.8); e.face = tp.a;
      if (e.t <= 0) { const nxt = d.seq[d.i++ % d.seq.length];
        if (nxt === 'triple') { d.n = 3; e.state = 'aim'; e.t = 0.6; d.dir = tp.a; teleRect(e.pos.x, e.pos.z, tp.a, 11, 2.4, 0.6); AudioSys.sfx('bark', e.pos.x); }
        else if (nxt === 'bark') { e.state = 'barkWind'; e.t = 0.7; teleCircle(e.pos.x, e.pos.z, 2.2, 0.7, '#ffb703'); }
        else { e.state = 'howl'; e.t = 1; AudioSys.sfx('bark', e.pos.x); }
      } break;
    case 'aim': e.vel.set(0, 0, 0); e.windup = true; e.face = d.dir; if (e.t <= 0) { e.state = 'charge'; e.t = 0.5; e.hitDone = false; } break;
    case 'charge': e.vel.set(Math.sin(d.dir) * 19 * e.sm, 0, Math.cos(d.dir) * 19 * e.sm); touchHurt(e, 16);
      if (Math.random() < 0.8) particle(e.pos.x, 0.2, e.pos.z, rand(-1, 1), 1, rand(-1, 1), '#efe3c8', 0.35, 0.4, -2);
      if (e.t <= 0 || (e.hitWall && e.t < 0.45)) {
        if (e.hitWall) addShake(0.3);
        if (--d.n > 0) { const a = toP(e).a; e.state = 'aim'; e.t = 0.45; d.dir = a; teleRect(e.pos.x, e.pos.z, a, 11, 2.4, 0.45); AudioSys.sfx('bark', e.pos.x); }
        else { e.state = 'rest'; e.t = 1.3; }
      } break;
    case 'barkWind': e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) { AudioSys.sfx('bark', e.pos.x); hazardRing(e.pos.x, e.pos.z, 11, 9, 14, '#ffb703'); later(0.35, () => !e.dead && hazardRing(e.pos.x, e.pos.z, 11, 9, 14, '#ffb703')); addShake(0.4); e.state = 'rest'; e.t = 1.2; } break;
    case 'howl': e.vel.set(0, 0, 0); e.windup = true; e.face += 0.05;
      if (e.t <= 0) { if (enemies.filter((o) => !o.dead).length < 6) { for (const t of ['cachorro', 'pombo', 'pombo']) { const s = randomSpawnSpot(4); queueSpawn(t, s.x, s.z); } } e.state = 'rest'; e.t = 0.8; } break;
    default: e.vel.multiplyScalar(0.85); if (e.t <= 0) { e.state = 'chase'; e.t = rand(1, 1.6); }
  }
}
function aiRainha(e) {
  const tp = toP(e); const d = e.data;
  d.seq ??= ['whip', 'spit', 'whip', 'summon', 'spit']; d.i ??= 0;
  switch (e.state) {
    case 'chase': chase(e, tp.a); e.face = tp.a;
      if (e.t <= 0 || (tp.d < 4 && e.cd <= 0)) {
        const nxt = tp.d < 4.5 ? 'whip' : d.seq[d.i++ % d.seq.length]; e.cd = 2;
        if (nxt === 'whip') { e.state = 'wind'; e.t = 0.8; teleCircle(e.pos.x, e.pos.z, 4.6, 0.8); }
        else if (nxt === 'spit') { e.state = 'spit'; d.n = 3; e.t = 0.5; }
        else { e.state = 'summon'; e.t = 0.9; }
      } break;
    case 'wind': e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) { d.spin = 0.4; shockRing(e.pos.x, e.pos.z, 4.6, 0.3, '#90be6d'); AudioSys.sfx('swing'); addShake(0.3); if (tp.d < 4.6 + player.r) hurtPlayer(18, e.pos.x, e.pos.z); e.state = 'rest'; e.t = 0.9; } break;
    case 'spit': e.vel.set(0, 0, 0); e.windup = true; e.face = tp.a;
      if (e.t <= 0) {
        for (let k = -3; k <= 3; k++) { const a = tp.a + k * 0.16; spawnProj({ owner: 'e', x: e.pos.x, z: e.pos.z, y: 0.9, vx: Math.sin(a) * 10, vz: Math.cos(a) * 10, r: 0.28, dmg: 9, life: 2.4, kind: 'spit' }); }
        AudioSys.sfx('eshoot', e.pos.x); if (--d.n > 0) e.t = 0.5; else { e.state = 'rest'; e.t = 0.8; }
      } break;
    case 'summon': e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) { if (enemies.filter((o) => !o.dead).length < 6) for (const t of ['iguana', 'pombo', 'pombo']) { const s = randomSpawnSpot(4); queueSpawn(t, s.x, s.z); } e.state = 'rest'; e.t = 0.6; } break;
    default: e.vel.multiplyScalar(0.85); if (e.t <= 0) { e.state = 'chase'; e.t = rand(1.2, 2); }
  }
}
function aiMaton(e) {
  const tp = toP(e); const d = e.data; const p2 = e.hp < e.maxHp * 0.5;
  if (p2 && !d.p2) { d.p2 = true; toast('😠 El Matón ficou bravo de verdade!'); addShake(0.6); e.state = 'rest'; e.t = 0.8; }
  switch (e.state) {
    case 'chase': chase(e, tp.a, p2 ? 1.25 : 1); e.face = tp.a;
      if (e.t <= 0) {
        const opts = [{ w: 3, v: 'stomp' }, { w: 2, v: 'balls' }, { w: 2, v: 'caps' }, { w: 2, v: 'charge' }];
        if (p2) opts.push({ w: 1.5, v: 'summon' });
        let nxt = weighted(opts); if (nxt === d.last) nxt = weighted(opts); d.last = nxt;
        if (nxt === 'stomp') { d.n = p2 ? 2 : 1; startStomp(e); }
        else if (nxt === 'balls') { e.state = 'ballsWind'; e.t = 0.6; }
        else if (nxt === 'caps') { e.state = 'caps'; d.n = p2 ? 6 : 4; e.t = 0.5; d.off = 0; }
        else if (nxt === 'charge') { e.state = 'aim'; e.t = 0.8; d.dir = tp.a; teleRect(e.pos.x, e.pos.z, tp.a, 16, 2.8, 0.8); }
        else { e.state = 'summon'; e.t = 0.8; }
      } break;
    case 'stompAir': {
      const k = 1 - Math.max(0, e.t) / d.airT;
      e.pos.x = lerp(d.sx, d.tx, k); e.pos.z = lerp(d.sz, d.tz, k); e.yOff = Math.sin(k * Math.PI) * 5; e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) {
        e.yOff = 0; addShake(0.8); AudioSys.sfx('boom', e.pos.x); burst(e.pos.x, 0.3, e.pos.z, ['#efe3c8', '#a39382'], 30, 8, 0.35, 0.6, -10, 4);
        if (Math.hypot(player.pos.x - e.pos.x, player.pos.z - e.pos.z) < 3.5 + player.r) hurtPlayer(20, e.pos.x, e.pos.z);
        hazardRing(e.pos.x, e.pos.z, 9, 8, 10, '#ff6b35');
        if (--d.n > 0) { e.state = 'pause'; e.t = 0.3; } else { e.state = 'rest'; e.t = p2 ? 0.7 : 1.1; }
      } break;
    }
    case 'pause': e.vel.set(0, 0, 0); if (e.t <= 0) startStomp(e); break;
    case 'ballsWind': e.vel.set(0, 0, 0); e.windup = true; e.face = tp.a;
      if (e.t <= 0) {
        const n = p2 ? 5 : 3; AudioSys.sfx('kick');
        for (let k = 0; k < n; k++) { const a = tp.a + (k - (n - 1) / 2) * 0.45; spawnProj({ owner: 'e', x: e.pos.x + Math.sin(a) * 1.5, z: e.pos.z + Math.cos(a) * 1.5, y: 0.6, vx: Math.sin(a) * 10, vz: Math.cos(a) * 10, r: 0.6, dmg: 12, life: 5, bounce: 8, kind: 'bigball' }); }
        e.state = 'rest'; e.t = 1; } break;
    case 'caps': e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) {
        for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + d.off; spawnProj({ owner: 'e', x: e.pos.x, z: e.pos.z, y: 1.2, vx: Math.sin(a) * 8.5, vz: Math.cos(a) * 8.5, r: 0.28, dmg: 8, life: 3, kind: 'ecap' }); }
        d.off += 0.13; AudioSys.sfx('eshoot', e.pos.x); if (--d.n > 0) e.t = 0.38; else { e.state = 'rest'; e.t = 0.9; }
      } break;
    case 'aim': e.vel.set(0, 0, 0); e.windup = true; e.face = d.dir; if (e.t <= 0) { e.state = 'charge'; e.t = 0.75; e.hitDone = false; } break;
    case 'charge': e.vel.set(Math.sin(d.dir) * 20 * e.sm, 0, Math.cos(d.dir) * 20 * e.sm); touchHurt(e, 18);
      if (Math.random() < 0.8) particle(e.pos.x, 0.2, e.pos.z, rand(-1, 1), 1, rand(-1, 1), '#efe3c8', 0.35, 0.4, -2);
      if (e.hitWall && e.t < 0.7) { e.state = 'dazed'; e.t = 1.4; e.st.stun = 1.4; addShake(0.6); AudioSys.sfx('boom', e.pos.x); toast('💫 El Matón bateu a cabeça!'); }
      else if (e.t <= 0) { e.state = 'rest'; e.t = 0.6; } break;
    case 'summon': e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) { if (enemies.filter((o) => !o.dead).length < 7) for (const t of ['pombo', 'pombo', 'pombo', 'moleque']) { const s = randomSpawnSpot(5); queueSpawn(t, s.x, s.z); } e.state = 'rest'; e.t = 0.6; } break;
    default: e.vel.multiplyScalar(0.85); e.yOff = 0; if (e.t <= 0) { e.state = 'chase'; e.t = p2 ? rand(0.6, 1.1) : rand(1.1, 1.8); }
  }
}
function aiElReyna(e) {
  const tp = toP(e), d = e.data;
  d.attackIndex ??= 0;
  if (e.hp < e.maxHp * 0.78 && !d.supreme) {
    d.supreme = true; e.state = 'summon'; e.t = 1.2; e.vel.set(0, 0, 0);
    spawnTia(); showBanner('Poder supremo: Tia!', 'Uma aliada invencível entrou na luta', 3);
    AudioSys.sfx('bark', e.pos.x); addShake(0.65);
  }
  const enraged = e.hp < e.maxHp * 0.42;
  if (enraged && !d.enragedShown) { d.enragedShown = true; showBanner('El Reyna está furioso!', 'Ataques mais rápidos — o uivo vem em dobro', 2.2); AudioSys.sfx('growl', e.pos.x); addShake(0.6); }
  switch (e.state) {
    case 'chase':
      chase(e, tp.a, enraged ? 1.25 : 1); e.face = tp.a;
      if (e.t <= 0) {
        const attacks = enraged ? ['bite', 'leap', 'howl', 'tail'] : ['bite', 'bite', 'leap', 'howl', 'tail'];
        const attack = attacks[d.attackIndex++ % attacks.length];
        if (attack === 'bite') {
          e.state = 'biteWind'; e.t = enraged ? 0.42 : 0.62; d.dir = tp.a; e.windup = true;
          teleRect(e.pos.x, e.pos.z, d.dir, 8, 1.8, e.t, '#ff6b35'); AudioSys.sfx('bark', e.pos.x);
        } else if (attack === 'howl') {
          e.state = 'howlWind'; e.t = enraged ? 0.5 : 0.72;
          teleCircle(e.pos.x, e.pos.z, 10.5, e.t, '#ffb703'); AudioSys.sfx('bark', e.pos.x);
        } else if (attack === 'leap') {
          d.sx = e.pos.x; d.sz = e.pos.z;
          d.tx = clamp(player.pos.x + player.vel.x * 0.32, -W + 2, W - 2);
          d.tz = clamp(player.pos.z + player.vel.z * 0.32, -D + 2, D - 2);
          e.state = 'leapWind'; e.t = enraged ? 0.52 : 0.72;
          teleCircle(d.tx, d.tz, 3.1, e.t, '#ff8c42'); AudioSys.sfx('dash');
        } else {
          d.dir = tp.a; e.state = 'tailWind'; e.t = 0.55;
          teleRect(e.pos.x, e.pos.z, d.dir, 6.5, 2.4, e.t, '#e63946'); AudioSys.sfx('swing');
        }
      }
      break;
    case 'biteWind':
      e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) { e.state = 'bite'; e.t = 0.48; e.hitDone = false; }
      break;
    case 'bite':
      e.vel.set(Math.sin(d.dir) * (enraged ? 27 : 23) * e.sm, 0, Math.cos(d.dir) * (enraged ? 27 : 23) * e.sm);
      touchHurt(e, enraged ? 26 : 22); e.windup = true;
      if (e.hitWall && e.t < 0.4) { e.state = 'dazed'; e.t = 0.9; e.st.stun = 0.9; addShake(0.35); AudioSys.sfx('boom', e.pos.x); floatText(e.pos.x, 2.6, e.pos.z, 'TONTO!', 'info'); }
      else if (e.t <= 0) { e.state = 'rest'; e.t = enraged ? 0.55 : 0.85; }
      break;
    case 'howlWind':
      e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) {
        AudioSys.sfx('bark', e.pos.x); hazardRing(e.pos.x, e.pos.z, 11.5, enraged ? 15 : 12, 16, '#ffb703');
        if (enraged) later(0.28, () => !e.dead && hazardRing(e.pos.x, e.pos.z, 11.5, 15, 13, '#ff6b35'));
        addShake(0.4); e.state = 'rest'; e.t = enraged ? 0.42 : 0.65;
      }
      break;
    case 'leapWind':
      e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) { d.leapT = e.t = enraged ? 0.42 : 0.55; e.state = 'leap'; }
      break;
    case 'leap': {
      const k = 1 - e.t / d.leapT;
      e.pos.x = lerp(d.sx, d.tx, k); e.pos.z = lerp(d.sz, d.tz, k);
      e.yOff = Math.sin(k * Math.PI) * 4.5; e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) {
        e.yOff = 0; addShake(0.75); AudioSys.sfx('boom', e.pos.x); shockRing(e.pos.x, e.pos.z, 3.8, 0.35, '#ff8c42');
        if (Math.hypot(player.pos.x - e.pos.x, player.pos.z - e.pos.z) < 3.8 + player.r) hurtPlayer(enraged ? 24 : 20, e.pos.x, e.pos.z);
        hazardRing(e.pos.x, e.pos.z, 7.5, 8, 11, '#ff8c42'); e.state = 'rest'; e.t = enraged ? 0.42 : 0.62;
      }
      break;
    }
    case 'tailWind':
      e.vel.set(0, 0, 0); e.windup = true; e.face = d.dir;
      if (e.t <= 0) {
        const dx = player.pos.x - e.pos.x, dz = player.pos.z - e.pos.z;
        const forward = dx * Math.sin(d.dir) + dz * Math.cos(d.dir);
        const side = Math.abs(dx * Math.cos(d.dir) - dz * Math.sin(d.dir));
        if (forward > -1 && forward < 6.5 && side < 2.3) hurtPlayer(enraged ? 22 : 18, e.pos.x, e.pos.z);
        shockRing(e.pos.x, e.pos.z, 4.5, 0.25, '#e63946'); AudioSys.sfx('swing'); e.state = 'rest'; e.t = 0.55;
      }
      break;
    case 'summon':
      e.vel.set(0, 0, 0); e.windup = true;
      if (e.t <= 0) { e.state = 'rest'; e.t = 0.55; }
      break;
    default:
      e.vel.multiplyScalar(0.82);
      if (e.t <= 0) { e.state = 'chase'; e.t = enraged ? 0.35 : 0.65; }
  }
}
function startStomp(e) {
  const d = e.data; e.state = 'stompAir'; d.airT = e.t = 0.95;
  d.sx = e.pos.x; d.sz = e.pos.z;
  d.tx = clamp(player.pos.x, -W + 2, W - 2); d.tz = clamp(player.pos.z, -D + 2, D - 2);
  teleCircle(d.tx, d.tz, 3.5, 0.95); AudioSys.sfx('dash');
}
