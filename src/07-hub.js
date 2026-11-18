// ================= hub: Pátio de Treino (training yard inspired by Hades) =================
// The player walks around a 3D yard: heroes stand on pedestals (west), weapons on stands (east),
// the Cofrinho da Vó upgrades sit on tables (south), the wardrobe sells/equips skins and a dummy
// lets you test the loadout. The carpet leads north to the gate that starts the run.
const HUB_CAM_OFF = new THREE.Vector3(0, 35, 24.5);
const HUB_THEME = { name: 'Pátio de Treino', tiles: ['#d9ab7b', '#c69466'], accent: '#a8473a', walls: ['#f6e7c8', '#f2c14e', '#e9a07a', '#fff1d0', '#a7c957', '#f4978e'] };
const HUB_SPAWN = { x: 0, z: 2.4 };
const HUB_HERO_ORDER = ['jorgito', 'crazyleleo', 'japa', 'matheusinho', 'vitao', 'bruno', 'thiagao'];
const HUB_UPGRADE_X = [-9.6, -6.4, -3.2, 3.2, 6.4, 9.6];
const HUB_DUMMY = { x: 7.6, z: -7.2 };
const hub = { stations: [], pickables: [], heroStatues: {}, weaponStands: {}, upgradeItems: {}, wardrobe: null, nearest: null, pendingStation: null, pendingT: 0, dummyRespawn: 1.4, hudKey: '', hudT: 0, touchId: null };
const _hubRay = new THREE.Raycaster(), _hubNdc = new THREE.Vector2(), _hubGround = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _hubPoint = new THREE.Vector3();

// Decorative hub props skip the shadow pass to keep the yard as cheap to render as a combat room.
function noShadow(root) { root.traverse((o) => { if (o.isMesh) o.castShadow = false; }); return root; }
function disposeObject(root) {
  root.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    if (o.userData.ownMat && o.material) for (const m of [].concat(o.material)) m.dispose();
  });
}

// ---------- stations ----------
function addStation(o) {
  const st = { r: 1.9, near: false, lx: o.x, lz: o.z, ...o };
  st.label = makeLabel('', st.lx, st.labelY, st.lz);
  st.label.el.classList.add('station', 'station-' + st.kind);
  st.label.el.addEventListener('click', (event) => { event.stopPropagation(); AudioSys.init(); goToStation(st); });
  if (st.pick) { st.pick.traverse((obj) => { obj.userData.station = st; }); hub.pickables.push(st.pick); }
  st.render = () => {
    st.label.el.innerHTML = st.html(st.near); st.label.el.classList.toggle('near', st.near);
    // Stations approached from the north show their details beside the item so the hero stays visible.
    const side = st.near && st.nearAnchor;
    st.label.anchor = side ? st.nearAnchor : 'top'; st.label.y = side ? st.nearY : st.labelY;
  };
  st.render();
  hub.stations.push(st);
  return st;
}
function refreshHubLabels() { for (const st of hub.stations) st.render(); hub.hudKey = ''; }
function goToStation(st) {
  if (game.state !== 'hub' || specialLocksMovement(player.specialKind, player.heroT)) return;
  player.autoMove = { x: st.ax, z: st.az };
  hub.pendingStation = st.kind === 'gate' ? null : st; hub.pendingT = 6;
}
function interactStation(st) {
  if (!st.action) return;
  AudioSys.init();
  st.action();
}
const keyHint = (verb) => `<span class="key">E</span><span class="key pad">A</span>${verb}`;

// ---------- world ----------
function brazier(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
  mk(CYL(0.12, 0.2, 1.1, 8), '#3b2a1a', 0, 0.55, 0, g);
  mk(CYL(0.42, 0.25, 0.3, 10), '#6b4226', 0, 1.2, 0, g);
  const flame = mk(CONE(0.3, 0.75, 7), M('#ff9f1c', { emissive: '#ff6b00', emissiveIntensity: 1.2 }), 0, 1.72, 0, g, false);
  const core = mk(CONE(0.16, 0.45, 6), M('#ffe066', { emissive: '#ffd166', emissiveIntensity: 1.3 }), 0, 1.62, 0, g, false);
  world.animated.push((t, dt) => {
    const k = Math.sin(t * 13 + x * 3 + z) * 0.12;
    flame.scale.set(1 - k * 0.5, 1 + k, 1 - k * 0.5); core.scale.y = 1 - k;
    if (Math.random() < dt * 9) particle(x + rand(-0.15, 0.15), 1.95, z + rand(-0.15, 0.15), rand(-0.3, 0.3), rand(1.5, 2.6), rand(-0.3, 0.3), pick(['#ffb703', '#ff6b00', '#ffd166']), 0.07, 0.6, 0.5, 0.5);
  });
  addCircle(x, z, 0.42);
}
function buildHubPath() {
  const g = world.group, len = 16, cz = -D + len / 2;
  mk(BOX(2.6, 0.05, len), '#8c2f39', 0, 0.03, cz, g, false);
  for (const s of [-1, 1]) mk(BOX(0.16, 0.06, len), '#e0a943', s * 1.38, 0.035, cz, g, false);
  const arrow = M('#ffd166', { emissive: '#ffb703', emissiveIntensity: 0.55 });
  for (const z of [-9.2, -5.6, -2, 1.4]) for (const s of [-1, 1]) {
    const bar = mk(BOX(0.95, 0.04, 0.18), arrow, s * 0.32, 0.07, z, g, false);
    bar.rotation.y = s * 0.7;
  }
  for (const z of [-8.6, -3.6, 1.2]) for (const s of [-1, 1]) brazier(s * 2.4, z);
}
function buildPiggyBank() {
  const g = new THREE.Group(), pink = '#ff8fab', dark = '#c9184a';
  mk(CYL(1.25, 1.35, 0.35, 20), '#e9dcc3', 0, 0.175, 0, g);
  mk(CYL(1.27, 1.27, 0.06, 20), '#d4a017', 0, 0.37, 0, g);
  const body = new THREE.Group(); body.position.y = 1.45; g.add(body);
  part('sph', pink, 0.95, 0.82, 1.1, 0, 0, 0, body);
  const snout = part('cyl', '#ff9fb8', 0.34, 0.2, 0.34, 0, -0.05, 1.08, body); snout.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    part('sph', dark, 0.06, 0.09, 0.04, s * 0.12, -0.05, 1.19, body);
    part('sph', '#1b1b1b', 0.09, 0.11, 0.06, s * 0.36, 0.3, 0.86, body);
    const ear = part('cone', pink, 0.22, 0.32, 0.12, s * 0.48, 0.78, 0.45, body); ear.rotation.z = -s * 0.35;
    for (const z of [-0.5, 0.5]) part('cyl', pink, 0.18, 0.5, 0.18, s * 0.52, -0.78, z, body);
  }
  part('box', '#3b2a1a', 0.5, 0.06, 0.12, 0, 0.82, 0, body);
  const coin = part('cyl', M('#ffd166', { metalness: 0.6, roughness: 0.3 }), 0.2, 0.04, 0.2, 0, 0.98, 0, body); coin.rotation.x = Math.PI / 2;
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 6, 12, 4.8), M(pink)); tail.position.set(0, 0.15, -1.1); body.add(tail);
  return g;
}
function upgradeItemMesh(id) {
  const g = new THREE.Group();
  if (id === 'vida') {
    part('cyl', '#3d3d3d', 0.36, 0.34, 0.36, 0, 0, 0, g); part('cyl', '#5b2f1a', 0.32, 0.04, 0.32, 0, 0.17, 0, g);
    for (let i = 0; i < 10; i++) part('sph', '#7b3f1d', 0.07, 0.05, 0.05, rand(-0.2, 0.2), 0.2, rand(-0.2, 0.2), g);
    for (const s of [-1, 1]) part('box', '#3d3d3d', 0.12, 0.05, 0.08, s * 0.42, 0.08, 0, g);
  } else if (id === 'forca') {
    part('cyl', M('#fff8e7', { transparent: true, opacity: 0.45 }), 0.2, 0.5, 0.2, 0, 0, 0, g);
    part('cyl', '#ffe066', 0.17, 0.4, 0.17, 0, -0.04, 0, g);
    part('cyl', '#e63946', 0.025, 0.42, 0.025, 0.08, 0.3, 0, g).rotation.z = -0.3;
    part('sph', '#ffd60a', 0.09, 0.09, 0.32, -0.28, 0.24, 0, g).rotation.x = 0.6;
  } else if (id === 'dash') {
    part('box', '#f8f9fa', 0.3, 0.2, 0.55, 0, 0, 0, g); part('box', '#e63946', 0.32, 0.07, 0.58, 0, -0.12, 0, g);
    part('box', '#1d3fbb', 0.31, 0.06, 0.2, 0, 0.08, 0.12, g); part('box', '#f8f9fa', 0.28, 0.22, 0.22, 0, 0.16, -0.16, g);
  } else if (id === 'reza') {
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; part('sph', '#c77dff', 0.055, 0.055, 0.055, Math.cos(a) * 0.3, Math.sin(a) * 0.3 + 0.08, 0, g); }
    part('box', '#d4a017', 0.05, 0.28, 0.04, 0, -0.36, 0, g); part('box', '#d4a017', 0.18, 0.05, 0.04, 0, -0.3, 0, g);
  } else if (id === 'sorte') {
    const coin = part('cyl', M('#ffd166', { metalness: 0.6, roughness: 0.3 }), 0.34, 0.07, 0.34, 0, 0, 0, g); coin.rotation.x = Math.PI / 2;
    for (const [x, y] of [[-0.07, 0.05], [0.07, 0.05], [0, -0.07]]) part('sph', '#2a9d50', 0.08, 0.08, 0.03, x, y, 0.05, g);
  } else if (id === 'trompo') {
    const top = trompoMesh(); top.scale.setScalar(1.2); g.add(top);
  }
  return g;
}
function weaponDisplay(id) {
  const g = new THREE.Group();
  if (id === 'bola') { const ball = new THREE.Mesh(ballGeo, ballMat); ball.scale.setScalar(0.34); ball.castShadow = true; g.add(ball); return g; }
  const weapon = weaponMesh(id);
  if (id === 'lata') { weapon.scale.setScalar(0.95); weapon.position.set(0, -0.33, -0.33); }
  else { weapon.rotation.x = -Math.PI / 2; weapon.scale.multiplyScalar(1.1); weapon.position.y = -0.42; }
  g.add(weapon);
  return g;
}

// ---------- heroes ----------
function buildHeroStatue(id) {
  const statue = hub.heroStatues[id];
  if (statue.rig) { statue.holder.remove(statue.rig.root); disposeObject(statue.rig.root); }
  const rig = buildKid(heroLook(id, meta.equippedSkins?.[id] || 'base'));
  ownMaterials(rig.root); noShadow(rig.root); rig.root.scale.setScalar(heroScale(id));
  statue.holder.add(rig.root); statue.rig = rig;
}
function animateStatue(statue, t) {
  const { rig, id } = statue; if (!rig || !statue.holder.visible) return;
  const ph = t * 1.6 + statue.phase;
  if (id === 'japa') animJapa(rig, 0.6, ph * 1.6);
  else if (id === 'bruno') animSamba(rig, 0.35, ph * 1.4);
  else if (id === 'thiagao') animThiagao(rig, 0.2, ph);
  else animKid(rig, id === 'vitao' ? 0.1 : 0.15, ph * (id === 'vitao' ? 0.6 : 1.2));
  rig.head.rotation.y = Math.sin(t * 0.9 + statue.phase) * 0.25;
}
function heroStationHtml(id, near) {
  const hero = HEROES[id], selected = meta.hero === id, w = WEAPONS[HERO_WEAPON_AFFINITY[id]];
  const badge = selected ? '<span class="pill">EM CAMPO</span>' : '';
  if (!near) return `${badge}${hero.name}`;
  return `<span class="ic">${HERO_POWER_ICON[id]}</span><b>${hero.name}</b><div class="st-desc">${hero.desc}</div><div class="st-aff">Afinidade: ${w.icon} ${w.name} · +${Math.round(WEAPON_AFFINITY_BONUS * 100)}% dano básico</div>${selected ? badge : keyHint('escolher')}`;
}
function buildHeroGallery() {
  HUB_HERO_ORDER.forEach((id, i) => {
    const x = -12.7, z = -6.3 + i * 2.2;
    const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
    mk(CYL(0.9, 1.0, 0.45, 18), '#e9dcc3', 0, 0.225, 0, g);
    mk(CYL(0.92, 0.92, 0.06, 18), '#d4a017', 0, 0.47, 0, g);
    const glow = new THREE.Mesh(ringGeo, basicMat('#ffd166', 0.3)); glow.userData.ownMat = true; glow.scale.setScalar(0.82); glow.position.y = 0.52; g.add(glow);
    const holder = new THREE.Group(); holder.position.y = 0.5; holder.rotation.y = 1.05; g.add(holder);
    addCircle(x, z, 0.95);
    hub.heroStatues[id] = { id, group: g, holder, glow, rig: null, phase: i * 0.9 };
    buildHeroStatue(id);
    addStation({ kind: 'hero', id, x, z, ax: x + 1.75, az: z, r: 2.05, labelY: 3.3, pick: g, html: (near) => heroStationHtml(id, near), action: () => chooseHubHero(id) });
  });
  world.animated.push((t) => {
    for (const id in hub.heroStatues) {
      const statue = hub.heroStatues[id];
      animateStatue(statue, t);
      statue.glow.material.opacity = meta.hero === id ? 0.65 + Math.sin(t * 4) * 0.25 : 0.25;
    }
  });
}
function chooseHubHero(id) {
  if (meta.hero === id) { toast(`${HERO_POWER_ICON[id]} ${HEROES[id].name} já está em campo.`, 1.6); return; }
  meta.hero = id; saveMeta();
  swapHubLoadout(`${HERO_POWER_ICON[id]} ${HEROES[id].name} entrou em campo!`);
}

// ---------- weapons ----------
function weaponStationHtml(id, near) {
  const w = WEAPONS[id], equipped = meta.weapon === id, affinity = HERO_WEAPON_AFFINITY[meta.hero] === id;
  const badge = equipped ? '<span class="pill">EQUIPADA</span>' : '';
  if (!near) return `${badge}${w.icon} ${w.name}${affinity ? ' <span class="star">★</span>' : ''}`;
  return `<span class="ic">${w.icon}</span><b>${w.name}</b><div class="st-desc">${w.desc}</div>${affinity ? `<div class="st-aff on">★ Afinidade com ${heroDisplayName(meta.hero)}: +${Math.round(WEAPON_AFFINITY_BONUS * 100)}% dano básico</div>` : ''}${equipped ? badge : keyHint('equipar')}`;
}
function buildArsenal() {
  Object.keys(WEAPONS).forEach((id, i) => {
    const x = 12.7, z = -5.5 + i * 2.0;
    const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
    mk(BOX(1.0, 0.9, 1.0), '#7a4a2a', 0, 0.45, 0, g);
    mk(BOX(1.1, 0.08, 1.1), '#d4a017', 0, 0.93, 0, g);
    for (const s of [-1, 1]) mk(BOX(0.08, 1.9, 0.08), '#5a3620', s * 0.42, 1.4, -0.42, g);
    mk(BOX(0.92, 0.08, 0.08), '#5a3620', 0, 2.35, -0.42, g);
    const glow = new THREE.Mesh(ringGeo, basicMat('#ffd166', 0.3)); glow.userData.ownMat = true; glow.scale.setScalar(0.5); glow.position.y = 0.98; g.add(glow);
    const holder = new THREE.Group(); holder.position.y = 1.6; g.add(holder);
    holder.add(noShadow(weaponDisplay(id)));
    addCircle(x, z, 0.62);
    hub.weaponStands[id] = { holder, glow, phase: i };
    addStation({ kind: 'weapon', id, x, z, ax: x - 1.55, az: z, r: 1.95, labelY: 2.8, pick: g, html: (near) => weaponStationHtml(id, near), action: () => chooseHubWeapon(id) });
  });
  world.animated.push((t) => {
    for (const id in hub.weaponStands) {
      const stand = hub.weaponStands[id];
      stand.holder.rotation.y = t * 1.1 + stand.phase;
      stand.holder.position.y = 1.6 + Math.sin(t * 2 + stand.phase) * 0.08;
      stand.glow.material.opacity = meta.weapon === id ? 0.65 + Math.sin(t * 4) * 0.25 : 0.25;
    }
  });
}
function chooseHubWeapon(id) {
  const w = WEAPONS[id];
  if (meta.weapon === id) { toast(`${w.icon} ${w.name} já está equipada.`, 1.6); return; }
  meta.weapon = id; saveMeta();
  const affinity = HERO_WEAPON_AFFINITY[meta.hero] === id ? ` ★ Afinidade +${Math.round(WEAPON_AFFINITY_BONUS * 100)}%!` : '';
  swapHubLoadout(`${w.icon} ${w.name} equipada!${affinity}`);
}

// ---------- Cofrinho da Vó (upgrades) ----------
function upgradeHtml(u, near) {
  const lv = meta.up[u.id], maxed = lv >= u.max, cost = u.cost(lv), afford = meta.canicas >= cost;
  if (!near) return `${u.icon} <b>${lv}/${u.max}</b>`;
  return `<span class="ic">${u.icon}</span><b>${u.name}</b> <span class="lvl">${lv}/${u.max}</span><div class="st-desc">${u.desc}</div>${maxed ? '<span class="pill">MÁXIMO</span>' : `${keyHint('comprar')} <span class="price ${afford ? '' : 'poor'}">🔮 ${cost}</span>`}`;
}
function refreshUpgradePips() {
  const lit = M('#ffd166', { emissive: '#ffb703', emissiveIntensity: 0.9 }), off = M('#4a3628');
  for (const u of META_UPS) { const item = hub.upgradeItems[u.id]; if (item) item.pips.forEach((pip, k) => { pip.material = k < meta.up[u.id] ? lit : off; }); }
}
function buyHubUpgrade(u) {
  const result = buyMetaUpgrade(meta, u);
  if (result.status === 'maxed') { toast(`${u.icon} ${u.name} já está no máximo.`, 1.6); AudioSys.sfx('deny'); return; }
  if (result.status === 'poor') { toast(`😅 Faltam 🔮 ${result.cost - meta.canicas} para ${u.name}.`, 1.8); AudioSys.sfx('deny'); return; }
  saveMeta(); AudioSys.sfx('boon');
  const item = hub.upgradeItems[u.id], x = item.item.parent.position.x, z = item.item.parent.position.z;
  burst(x, 1.4, z, ['#ffd166', '#4cc9f0', '#ffffff'], 22, 4, 0.18, 0.7);
  toast(`${u.icon} ${u.name} Nv ${result.level}/${u.max}! (${u.desc})`, 2.2);
  refreshUpgradePips(); refreshHubLabels();
}
function buildCofrinho() {
  const pig = buildPiggyBank(); pig.position.set(0, 0, 7.7); world.group.add(pig); addCircle(0, 7.7, 1.35);
  const vo = buildKid({ shirt: '#c77dff', shorts: '#5e548e', hair: '#e8e8e8', skin: '#c79068', socks: '#f2e8cf', shoes: '#6b4226', glasses: true, wide: 1.2 });
  noShadow(vo.root); vo.root.position.set(2.2, 0, 9.0); vo.root.rotation.y = -0.45; world.group.add(vo.root); addCircle(2.2, 9.0, 0.6);
  world.animated.push((t) => { vo.arms[1].rotation.x = -0.7 + Math.sin(t * 2) * 0.35; vo.head.rotation.z = Math.sin(t * 1.3) * 0.08; pig.rotation.y = Math.sin(t * 0.7) * 0.15; });
  addStation({
    kind: 'piggy', id: 'cofrinho', x: 0, z: 7.7, ax: 0, az: 5.8, r: 2.4, labelY: 3.4, nearAnchor: 'right', nearY: 1.6, pick: pig,
    html: (near) => (near ? `<span class="ic">🐷</span><b>Cofrinho da Vó</b><div class="st-desc">🔮 ${meta.canicas} bolinhas de gude. Compre melhorias permanentes nas mesinhas ao redor.</div>` : `🐷 Cofrinho da Vó · 🔮 ${meta.canicas}`),
    action: () => toast(`👵 "Junta as bolinhas, mijo!" — 🔮 ${meta.canicas} no cofrinho.`, 2.2),
  });
  META_UPS.forEach((u, i) => {
    const x = HUB_UPGRADE_X[i], z = 7.2;
    const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
    mk(CYL(0.62, 0.7, 0.85, 14), '#8c5a3c', 0, 0.425, 0, g);
    mk(CYL(0.72, 0.66, 0.1, 14), '#f6e7c8', 0, 0.9, 0, g);
    const item = noShadow(upgradeItemMesh(u.id)); item.position.y = 1.35; g.add(item);
    const pips = [];
    for (let k = 0; k < u.max; k++) { const a = (k - (u.max - 1) / 2) * 0.32; pips.push(mk(SPH(0.075, 8, 6), '#4a3628', Math.sin(a) * 0.7, 0.62, Math.cos(a) * 0.7, g)); }
    addCircle(x, z, 0.72);
    hub.upgradeItems[u.id] = { item, pips, phase: i };
    addStation({ kind: 'upgrade', id: u.id, x, z, ax: x, az: z - 1.5, r: 1.95, labelY: 2.35, nearAnchor: x < 0 ? 'left' : 'right', nearY: 1.3, pick: g, html: (near) => upgradeHtml(u, near), action: () => buyHubUpgrade(u) });
  });
  refreshUpgradePips();
  world.animated.push((t) => {
    for (const id in hub.upgradeItems) { const it = hub.upgradeItems[id]; it.item.rotation.y = t * 0.9 + it.phase; it.item.position.y = 1.35 + Math.sin(t * 2.2 + it.phase) * 0.07; }
  });
}

// ---------- wardrobe (skins) ----------
function currentSkin() { return (HERO_SKINS[meta.hero] || [])[0]; }
function buildMannequin() {
  const w = hub.wardrobe; if (!w) return;
  if (w.rig) { w.holder.remove(w.rig.root); disposeObject(w.rig.root); }
  const skin = currentSkin();
  const rig = buildKid(heroLook(meta.hero, skin ? skin.id : 'base'));
  const mats = ownMaterials(rig.root); noShadow(rig.root); rig.root.scale.setScalar(heroScale(meta.hero) * 0.92);
  if (!skin || !meta.unlockedSkins[skin.id]) for (const m of mats) { m.transparent = true; m.opacity = 0.5; }
  w.holder.add(rig.root); w.rig = rig;
}
function wardrobeHtml(near) {
  const skin = currentSkin(), name = heroDisplayName(meta.hero);
  if (!near) return `👕 Arara de Fantasias${skin && meta.equippedSkins[meta.hero] === skin.id ? ' <span class="pill">VESTIDA</span>' : ''}`;
  if (!skin) return `<span class="ic">👕</span><b>Arara de Fantasias</b><div class="st-desc">${name} ainda não tem fantasias.</div>`;
  const unlocked = meta.unlockedSkins[skin.id], equipped = meta.equippedSkins[meta.hero] === skin.id;
  const action = unlocked ? keyHint(equipped ? 'tirar fantasia' : 'vestir') : `${keyHint('desbloquear')} <span class="price ${meta.canicas >= skin.cost ? '' : 'poor'}">🔮 ${skin.cost}</span>`;
  return `<span class="ic">${skin.icon}</span><b>${skin.name}</b> <small>(${name})</small><div class="st-desc">Especial: ${skin.power}.</div>${action}${equipped ? ' <span class="pill">VESTIDA</span>' : ''}`;
}
function useWardrobe() {
  const skin = currentSkin(), action = applySkinStation(meta, meta.hero, skin);
  if (action === 'none') { toast(`👕 ${heroDisplayName(meta.hero)} ainda não tem fantasias.`, 1.8); return; }
  if (action === 'poor') { toast(`😅 Faltam 🔮 ${skin.cost - meta.canicas} para ${skin.name}.`, 1.8); AudioSys.sfx('deny'); return; }
  saveMeta();
  buildHeroStatue(meta.hero);
  const msg = action === 'buy' ? `${skin.icon} ${skin.name} desbloqueada e vestida!` : action === 'equip' ? `${skin.icon} ${skin.name} vestida!` : `👕 ${heroDisplayName(meta.hero)} voltou à roupa normal.`;
  swapHubLoadout(msg, action === 'buy' ? 'boon' : 'pickup');
}
function buildWardrobe() {
  const x = -7.4, z = -8.6;
  const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
  for (const s of [-1, 1]) mk(CYL(0.06, 0.06, 2.4, 8), '#3b2a1a', s * 1.3, 1.2, -0.5, g);
  mk(CYL(0.05, 0.05, 2.7, 8), '#3b2a1a', 0, 2.35, -0.5, g).rotation.z = Math.PI / 2;
  ['#e63946', '#f7c948', '#34a0d4', '#a855f7', '#06d6a0'].forEach((color, i) => {
    const hx = -1.0 + i * 0.5;
    mk(BOX(0.04, 0.16, 0.04), '#adb5bd', hx, 2.22, -0.5, g);
    mk(BOX(0.42, 0.62, 0.1), color, hx, 1.8, -0.5, g).rotation.z = (i - 2) * 0.04;
  });
  mk(CYL(0.75, 0.8, 0.25, 16), '#e9dcc3', 0, 0.125, 0.45, g);
  mk(CYL(0.77, 0.77, 0.05, 16), '#d4a017', 0, 0.26, 0.45, g);
  const holder = new THREE.Group(); holder.position.set(0, 0.27, 0.45); g.add(holder);
  addBox(x, z - 0.5, 1.45, 0.25); addCircle(x, z + 0.45, 0.8);
  hub.wardrobe = { holder, rig: null };
  buildMannequin();
  addStation({ kind: 'wardrobe', id: 'arara', x, z: z + 0.45, ax: x, az: z + 2.2, r: 2.2, labelY: 3.4, pick: g, html: wardrobeHtml, action: useWardrobe });
  world.animated.push((t) => { const rig = hub.wardrobe?.rig; if (rig) { animKid(rig, 0.12, t * 1.5); holder.rotation.y = Math.sin(t * 0.6) * 0.5; } });
}

// ---------- training dummy & gate ----------
function buildTrainingCorner() {
  const mat = mk(new THREE.CircleGeometry(2.3, 32).rotateX(-Math.PI / 2), '#6b8f5e', HUB_DUMMY.x, 0.03, HUB_DUMMY.z, world.group, false);
  mat.receiveShadow = true;
  const ring = mk(new THREE.RingGeometry(2.15, 2.3, 40).rotateX(-Math.PI / 2), '#f6e7c8', HUB_DUMMY.x, 0.045, HUB_DUMMY.z, world.group, false);
  ring.receiveShadow = true;
  spawnEnemy('boneco', HUB_DUMMY.x, HUB_DUMMY.z);
  addStation({
    kind: 'dummy', id: 'boneco', x: HUB_DUMMY.x, z: HUB_DUMMY.z, ax: HUB_DUMMY.x - 0.2, az: HUB_DUMMY.z + 2.6, r: 2.9, labelY: 3.1,
    html: (near) => (near ? `<span class="ic">🎯</span><b>Boneco de treino</b><div class="st-desc">Ataque para testar arma e especial da arma. O poder do personagem carrega após 15s sem dano.</div>` : '🎯 Boneco de treino'),
    action: () => toast('🎯 Clique/J ou X ataca · botão direito/K ou B usa o especial.', 2.4),
  });
}
function updateHubDummy(dt) {
  const present = enemies.some((e) => e.type === 'boneco' && !e.dead) || pendingSpawns.some((s) => s.type === 'boneco');
  if (present) { hub.dummyRespawn = 1.4; return; }
  hub.dummyRespawn -= dt;
  if (hub.dummyRespawn <= 0) { queueSpawn('boneco', HUB_DUMMY.x, HUB_DUMMY.z, 0.7); hub.dummyRespawn = 1.4; }
}
function addGateStation() {
  const gate = { x: 0, next: null, reward: { kind: 'army' }, color: '#ffd166' };
  buildExit(gate); game.exits = [gate]; game.cleared = true;
  addStation({
    kind: 'gate', id: 'gate', x: 0, z: -D + 0.5, lx: 0, lz: -D + 0.3, ax: 0, az: -D + 0.4, r: 0, labelY: 3.7, pick: gate.obj.grp,
    html: () => '<span class="ic">🚪</span><b>JOGAR ▶</b><br><small>Siga o tapete até o portão da praça</small>',
  });
}

// Lightweight colonial courtyard walls (the hub camera sees the whole yard, so full facades would be costly).
function hubWalls() {
  const g = world.group, wall = '#f1d8a6', trim = '#a8473a', roof = '#b5523b';
  const northZ = -D - 1.9, sideX = W + 1.9, h = 5.2;
  mk(BOX(2 * W + 4.4, h, 1.2), wall, 0, h / 2, northZ, g);
  for (const s of [-1, 1]) mk(BOX(1.2, h, 2 * D + 4.4), wall, s * sideX, h / 2, 0.4, g);
  mk(BOX(2 * W + 5, 0.5, 1.8), roof, 0, h + 0.2, northZ - 0.1, g);
  for (const s of [-1, 1]) mk(BOX(1.8, 0.5, 2 * D + 5), roof, s * (sideX + 0.1), h + 0.2, 0.4, g);
  mk(BOX(2 * W + 4.4, 0.9, 1.25), shade(wall, 0.75), 0, 0.45, northZ + 0.02, g);
  for (const s of [-1, 1]) mk(BOX(1.25, 0.9, 2 * D + 4.4), shade(wall, 0.75), s * (sideX - 0.02), 0.45, 0.4, g);
  for (let x = -W; x <= W; x += 4) if (Math.abs(x) > 3) mk(BOX(0.7, h, 0.35), trim, x, h / 2, northZ + 0.7, g);
  for (const s of [-1, 1]) for (let z = -D + 2; z <= D; z += 4.4) mk(BOX(0.35, h, 0.7), trim, s * (sideX - 0.7), h / 2, z, g);
  for (const [x, color] of [[-8, '#e63946'], [-6, '#ffd166'], [6, '#ffd166'], [8, '#e63946']]) {
    const banner = mk(BOX(1.3, 2.6, 0.08), color, x, 3.1, northZ + 0.66, g, false);
    mk(CONE(0.65, 0.6, 3), color, x, 1.55, northZ + 0.66, g, false).rotation.set(Math.PI, 0, 0);
    banner.receiveShadow = false;
  }
  for (const x of [-12, 12]) {
    mk(BOX(1.2, 1.6, 0.12), '#4a3326', x, 3.2, northZ + 0.62, g, false);
    mk(BOX(1.45, 0.16, 0.25), '#fff4d6', x, 4.08, northZ + 0.68, g, false);
  }
}

// ---------- assembly ----------
function buildHub() {
  clearWorld();
  Object.assign(hub, { stations: [], pickables: [], heroStatues: {}, weaponStands: {}, upgradeItems: {}, wardrobe: null, nearest: null, pendingStation: null, dummyRespawn: 1.4, hudKey: '' });
  buildGround(HUB_THEME);
  hubWalls();

  southEdge();
  bunting(-5.2, 7);
  buildHubPath();
  for (const [x, z] of [[-14.6, -10.4], [14.6, -10.4], [-14.6, 10.6], [14.6, 10.6]]) palm(x, z, 5.2);
  addGateStation(); buildHeroGallery(); buildArsenal(); buildCofrinho(); buildWardrobe(); buildTrainingCorner();
  refreshHubVisibility();
}
function refreshHubVisibility() {
  for (const id in hub.heroStatues) hub.heroStatues[id].holder.visible = id !== meta.hero;
  for (const id in hub.weaponStands) hub.weaponStands[id].holder.visible = id !== meta.weapon;
}
function swapHubLoadout(message, sfx = 'pickup') {
  const pos = player.pos.clone(), face = player.face;
  setupPlayer(meta.weapon);
  player.pos.copy(pos); player.face = face; player.root.position.copy(pos); player.root.rotation.y = face;
  AudioSys.sfx(sfx);
  burst(pos.x, 1, pos.z, ['#ffd166', '#fff8e7', '#4cc9f0'], 22, 4, 0.2, 0.6);
  refreshHubVisibility(); buildMannequin(); refreshHubLabels();
  toast(message, 2);
}
function openHub(fromRun = false) {
  game.state = 'hub';
  if (!HEROES[meta.hero]) meta.hero = 'jorgito';
  if (!WEAPONS[meta.weapon]) meta.weapon = 'luvas';
  clearTia();
  Menu.close(); AudioSys.setMood('hub');
  $('hud').classList.add('hidden'); $('bossBar').classList.add('hidden'); $('lowHp').classList.remove('on');
  if (fromRun) { fade(true); setTimeout(() => fade(false), 60); }
  clearRoomObjects();
  setupPlayer(meta.weapon);
  game.room = 0; game.type = 'hub'; game.exits = []; game.cleared = true;
  buildHub();
  player.pos.set(HUB_SPAWN.x, 0, HUB_SPAWN.z); player.vel.set(0, 0, 0); player.face = Math.PI;
  player.root.position.copy(player.pos); player.root.rotation.y = Math.PI;
  camTarget.set(0, 0, -1.5);
  $('hubHud').classList.remove('hidden');
  if (fromRun) showBanner('Pátio de Treino', 'Melhore o cofrinho e tente de novo!', 2.4);
}
function leaveHubToRun() {
  if (game.state !== 'hub') return;
  game.state = 'transition'; player.autoMove = null; hub.pendingStation = null;
  fade(true); AudioSys.init(); AudioSys.sfx('door');
  setTimeout(() => { startRun(); fade(false); }, 450);
}

// ---------- input & per-frame update ----------
function stationFromRay(ray) {
  const hit = ray.intersectObjects(hub.pickables, true).find((h) => h.object.userData.station);
  return hit ? hit.object.userData.station : null;
}
// Touch: tap a station to walk to it and use it, or tap/drag on the floor to walk there.
function hubTouchAt(x, y, first) {
  _hubNdc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1);
  _hubRay.setFromCamera(_hubNdc, camera);
  const st = first ? stationFromRay(_hubRay) : null;
  if (st) { goToStation(st); return; }
  if (!_hubRay.ray.intersectPlane(_hubGround, _hubPoint) || specialLocksMovement(player.specialKind, player.heroT)) return;
  player.autoMove = { x: clamp(_hubPoint.x, -W + 0.6, W - 0.6), z: clamp(_hubPoint.z, -D + 0.4, D - 0.6) };
  hub.pendingStation = null;
}
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch' || game.state !== 'hub') return;
  event.preventDefault(); AudioSys.init();
  hub.touchId = event.pointerId; hubTouchAt(event.clientX, event.clientY, true);
});
addEventListener('pointermove', (event) => { if (event.pointerId === hub.touchId && game.state === 'hub') hubTouchAt(event.clientX, event.clientY, false); });
addEventListener('pointerup', (event) => { if (event.pointerId === hub.touchId) hub.touchId = null; });
addEventListener('pointercancel', (event) => { if (event.pointerId === hub.touchId) hub.touchId = null; });

function updateHub(dt) {
  runTimers(dt);
  // Mouse click on a station walks there instead of attacking; clicks elsewhere attack (e.g. the dummy).
  if (pressed.M0) { const st = stationFromRay(_ray); if (st) { mouse.left = false; goToStation(st); } }
  updatePlayer(dt); updateEnemies(dt); updateProjs(dt); updateLobs(dt); updateTrompos(dt);
  if (game.state !== 'hub') return;
  updateHubDummy(dt);
  let best = null, bestD = Infinity;
  for (const st of hub.stations) {
    const d = Math.hypot(player.pos.x - st.x, player.pos.z - st.z);
    if (d < st.r && d < bestD) { best = st; bestD = d; }
  }
  if (best !== hub.nearest) {
    const prev = hub.nearest; hub.nearest = best;
    if (prev) { prev.near = false; prev.render(); }
    if (best) { best.near = true; best.render(); }
  }
  if (hub.pendingStation) {
    hub.pendingT -= dt;
    const st = hub.pendingStation;
    if (!player.autoMove || hub.pendingT <= 0) {
      hub.pendingStation = null;
      if (hub.pendingT > 0 && Math.hypot(player.pos.x - st.ax, player.pos.z - st.az) < 0.6) { player.face = Math.atan2(st.x - player.pos.x, st.z - player.pos.z); interactStation(st); }
      else player.autoMove = null;
    }
  }
  if (hub.nearest && (pressed.KeyE || pressed.Enter || pressed.NumpadEnter || gamepad.pressed[0])) interactStation(hub.nearest);
  if ((player.pos.z < -D + 1.05 && Math.abs(player.pos.x) < 1.8) || (gamepad.connected && gamepad.pressed[9])) leaveHubToRun();
}
function updateHubHud(dt) {
  if (game.state !== 'hub') return;
  hub.hudT -= dt; if (hub.hudT > 0) return;
  hub.hudT = 0.2;
  const p = player, w = WEAPONS[meta.weapon], affinity = weaponAffinity(meta.hero, meta.weapon), heroName = heroDisplayName(meta.hero);
  const skin = currentSkin(), skinOn = skin && meta.equippedSkins[meta.hero] === skin.id;
  const special = p.heroT > 0 ? 'Poder em ação!' : p.safeT >= 15 ? `⭐ Poder PRONTO — ${inputDevice === 'pad' ? 'B' : 'botão direito / K'}` : `Poder do personagem em ${Math.ceil(15 - p.safeT)}s (15s sem dano)`;
  const key = [meta.canicas, meta.hero, meta.weapon, skinOn, special, meta.runs, meta.wins, meta.best, controllerStatus, inputDevice].join('|');
  if (key === hub.hudKey) return;
  hub.hudKey = key;
  const combo = affinity.active
    ? `<div class="combo-affinity active">Combo ativo: +${Math.round(affinity.bonus * 100)}% de dano nos ataques básicos</div>`
    : `<div class="combo-affinity">Afinidade de ${heroName}: ${WEAPONS[affinity.weapon].icon} ${WEAPONS[affinity.weapon].name} (+${Math.round(affinity.bonus * 100)}%)</div>`;
  $('hubInfo').innerHTML = `<div class="hub-chip">🔮 <b>${meta.canicas}</b> bolinhas de gude</div>
    <div class="hub-loadout"><div>${HERO_POWER_ICON[meta.hero]} <b>${heroName}</b>${skinOn ? ` · ${skin.icon} ${skin.name}` : ''}</div><div>${w.icon} ${w.name}</div>${combo}<div class="hub-special">${special}</div></div>`;
  $('hubStats').innerHTML = `<span id="controller-status">${controllerStatus}</span><br>Partidas: <b>${meta.runs}</b> · Vitórias: <b>${meta.wins}</b> · Melhor trecho: <b>${meta.best}</b>`;
  $('hubHint').innerHTML = inputDevice === 'pad'
    ? `${glyph('move')} andar · ${glyph('use')} usar estação · ${glyph('attack')} ataca o boneco · ${glyph('dash')} esquiva · <span class="kb pad">Select</span> menu · <span class="kb pad">Start</span> jogar`
    : `${glyph('move')} andar · ${glyph('use')} usar estação · clique numa estação para ir até ela · ${glyph('attack')} ataca o boneco · ${glyph('dash')} esquiva · ${glyph('pause')} menu<br>Siga o <b>tapete vermelho</b> até o portão ao norte para começar`;
}

// ---------- boot ----------
// Each logo copy gets its own ids: gradients referenced by url(#id) break when the first copy is hidden.
function logoCopy(prefix) {
  return $('logo-template').innerHTML.replace(/id="([^"]+)"/g, `id="${prefix}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/(href|aria-labelledby)="#?([^"]+)"/g, (m, attr, ids) => `${attr}="${attr === 'href' ? '#' : ''}${ids.split(' ').map((id) => `${prefix}-${id}`).join(' ')}"`);
}
$('hubBrand').querySelector('.hub-logo').innerHTML = logoCopy('hublogo');
$('titleScreen').querySelector('.logo').innerHTML = logoCopy('titlelogo');
$('logo-template').remove();
openHub();
if (!location.search.includes('skiptitle')) openTitle(); else { game.state = 'hub'; }
requestAnimationFrame(frame);
if (location.search.includes('debug')) window.__elTigreAdventures = { game, player, enemies, meta, hub, openHub, startRun, startWave, enterRoom, spawnEnemy, queueSpawn, openBoonModal, RUN_PLAN, toScreen, projs, killEnemy, playerHit, WEAPONS, HERO_WEAPON_AFFINITY, camera, CAM_OFF, saveMeta, renderer, scene, hurtPlayer, Menu, settings, AudioSys };
