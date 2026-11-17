// ================= game flow =================
const RUN_PLAN = ['combat', 'combat', 'combat', 'elite', 'combat', 'shop', 'combat', 'rest', 'boss', 'army'];
const game = { state: 'hub', room: 0, type: 'combat', exits: [], cleared: false, begun: false, startT: 0, waves: [], wave: 0, reward: null, theme: THEMES[THEMES.length - 1], bossE: null, time: 0, runTime: 0, pickups: [], interact: [], timers: [], elitesDone: 0, canicasRun: 0, endingT: 0 };
let controllerStatus = 'Conecte um controle para jogar.';
window.addEventListener('gamepadstatus', (event) => {
  controllerStatus = event.detail.connected ? `Controle conectado: ${event.detail.id}` : 'Controle desconectado.';
  const status = $('controller-status');
  if (status) status.textContent = controllerStatus;
  toast(event.detail.connected ? '🎮 Controle conectado' : '🎮 Controle desconectado', 1.5);
});
function later(t, fn) { game.timers.push({ t, fn }); }

const REWARD_INFO = {
  boon: (r) => ({ icon: PATRONS[r.patron].icon, name: PATRONS[r.patron].name, color: PATRONS[r.patron].color }),
  pesos: () => ({ icon: '💰', name: 'Pesos', color: '#ffd166' }),
  pandebono: () => ({ icon: '🥯', name: 'Pandebono (+25 vida máx.)', color: '#f4a261' }),
  fita: () => ({ icon: '🩹', name: 'Fita Adesiva (melhora arma)', color: '#ced4da' }),
  canicas: () => ({ icon: '🔮', name: 'Bolinhas de Gude', color: '#4cc9f0' }),
  empanada: () => ({ icon: '🥟', name: 'Empanada (cura 30)', color: '#e9c46a' }),
  shop: () => ({ icon: '🏪', name: 'Tienda de Doña Rosa', color: '#06d6a0' }),
  rest: () => ({ icon: '⛲', name: 'Fonte dos Desejos', color: '#4cc9f0' }),
  boss: () => ({ icon: '🐕', name: 'El Reyna', color: '#e63946' }),
  army: () => ({ icon: '🚪', name: 'Portão da escola', color: '#ffd166' }),
  school: () => ({ icon: '🏫', name: 'Escola de Montería', color: '#4cc9f0' }),
};
function rewardInfo(r) { return REWARD_INFO[r.kind](r); }
function heroDisplayName(hero) { return HEROES[hero]?.name || 'Jorgito'; }

// ---------- UI helpers ----------
let toastTimer = 0, bannerTimer = 0, hintTimer = 0;
function toast(msg, dur = 2.6) { const el = $('toast'); el.innerHTML = msg; el.style.opacity = 1; clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.style.opacity = 0), dur * 1000); }
function showBanner(title, sub = '', dur = 2.4) { const el = $('banner'); el.querySelector('h2').textContent = title; el.querySelector('p').textContent = sub; el.style.opacity = 1; clearTimeout(bannerTimer); bannerTimer = setTimeout(() => (el.style.opacity = 0), dur * 1000); }
function showHint(html, dur = 6) { const el = $('hint'); el.innerHTML = html; el.style.opacity = 1; clearTimeout(hintTimer); hintTimer = setTimeout(() => (el.style.opacity = 0), dur * 1000); }
function fade(on) { $('fade').style.opacity = on ? 1 : 0; }
function refreshBoonList() {
  const el = $('boonList'); el.innerHTML = '';
  if (player.weaponLvl) el.innerHTML += `<div class="bi" style="border-color:#ced4da"><span class="e">🩹</span>Fita Adesiva Nv ${player.weaponLvl}</div>`;
  for (const id in player.boons) {
    const b = BOON_BY_ID[id], pt = PATRONS[b.p];
    el.innerHTML += `<div class="bi" style="border-color:${pt.color}"><span class="e">${pt.icon}</span>${b.name}${player.boons[id].lvl > 1 ? ' Nv ' + player.boons[id].lvl : ''}</div>`;
  }
}
function updateHUD() {
  if (game.state === 'hub') return;
  const p = player;
  $('hpFill').style.width = (Math.max(0, p.hp) / p.maxHp * 100) + '%';
  $('hpText').textContent = `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`;
  const dm = stat.dashMax(); const pips = $('dashPips');
  if (pips.children.length !== dm) pips.innerHTML = '<div class="pip"></div>'.repeat(dm);
  [...pips.children].forEach((c, i) => c.classList.toggle('off', i >= p.dashCharges));
  $('slotSp').querySelector('.cd').style.height = (Math.max(0, 15 - p.safeT) / 15 * 100) + '%';
  $('slotSp').firstChild.textContent = p.skin === 'idol' ? '🎤' : p.skin === 'abelha' ? '🍯' : p.skin === 'skatista' ? '🛹' : p.skin === 'piscina' ? '🛟' : HERO_POWER_ICON[p.hero] || '🐯';
  $('slotSp').querySelector('small').textContent = p.safeT >= 15 ? 'PRONTO' : `${Math.ceil(15 - p.safeT)}s`;
  const powerHelp = p.hero === 'bruno' ? 'O juiz rubro-negro revisa o VAR e expulsa todos os inimigos da tela, inclusive chefes; Bruno fica parado enquanto isso.' : p.hero === 'thiagao' ? 'Um "$&#*" congela todos os inimigos, inclusive chefes, por 5s; Thiagão fica parado enquanto isso.' : '';
  $('slotSp').title = `Fique 15s sem sofrer dano e aperte o botão direito ou B para ativar o especial de ${HEROES[p.hero].name}. ${powerHelp}`;
  $('slotSp').style.borderColor = p.safeT >= 15 ? '#ffd166' : '';
  $('slotCast').querySelector('.cd').style.height = (Math.max(0, p.castCd) / p.castMax * 100) + '%';
  $('revives').textContent = '📿'.repeat(p.revives);
  $('pesos').textContent = '$ ' + p.pesos;
  $('canicas').textContent = '🔮 ' + meta.canicas;
  $('roomNum').textContent = `Norte ${game.room + 1}/${RUN_PLAN.length}`;
  const be = game.bossE; const bb = $('bossBar');
  if (be && !be.dead && game.state !== 'hub') { bb.classList.remove('hidden'); bb.querySelector('.nm').textContent = be.def.name; bb.querySelector('.fill').style.width = (be.hp / be.maxHp * 100) + '%'; }
  else bb.classList.add('hidden');
}

// ---------- run / rooms ----------
function clearRoomObjects() {
  for (const e of enemies) { scene.remove(e.root); disposeOwn(e.root); }
  enemies.length = 0; pendingSpawns.length = 0;
  if (player.pad) WEAPONS[player.weapon].reset();
  for (const pr of projs) scene.remove(pr.mesh); projs.length = 0;
  for (const l of lobs) if (l.mesh) { scene.remove(l.mesh); disposeOwn(l.mesh); } lobs.length = 0;
  for (const t of trompos) scene.remove(t.mesh); trompos.length = 0;
  for (const h of hazards) { fxRoot.remove(h.mesh); h.m.dispose(); } hazards.length = 0;
  for (const pk of game.pickups) scene.remove(pk.g); game.pickups.length = 0;
  game.interact.length = 0; game.timers.length = 0; game.bossE = null;
  clearFx(); clearLabels();
}
function startRun() {
  AudioSys.init();
  meta.runs++; saveMeta();
  clearTia();
  $('hubHud').classList.add('hidden'); $('modal').classList.add('hidden'); $('hud').classList.remove('hidden');
  clearRoomObjects();
  setupPlayer(meta.weapon);
  game.room = 0; game.runTime = 0; game.elitesDone = 0; game.canicasRun = 0; game.state = 'play';
  refreshBoonList();
  enterRoom({ type: 'combat', reward: { kind: 'boon', patron: pick(Object.keys(PATRONS)) } });
  const characterHint = player.weapon === 'raquete' ? ' · <b>Raquete:</b> clique/J ou X perto de uma bola lançada para rebater em chamas' : player.weapon === 'frango' ? ' · <b>Coxa:</b> impacto causa veneno e breve pausa para comer' : '';
  showHint(`<b>WASD</b> mover · <b>Mouse</b> mirar · <b>Clique</b> ataque · <b>Botão direito/K</b> especial (15s sem dano) · <b>Espaço</b> esquiva · <b>Q</b> trompo · <b>E</b> interagir · <b>Esc</b> pausa · <b>M</b> som${characterHint}`, 11);
}
function makeExits() {
  const next = RUN_PLAN[game.room + 1]; if (!next) return [];
  let rewards;
  if (next === 'shop' || next === 'rest' || next === 'boss' || next === 'army') rewards = [{ kind: next }];
  else {
    const n = next === 'elite' ? 2 : randi(2, 3); rewards = []; const used = new Set();
    for (let i = 0; i < n; i++) {
      let rw = null;
      for (let tries = 0; tries < 30 && !rw; tries++) {
        const k = weighted([{ w: 52, v: 'boon' }, { w: 15, v: 'pesos' }, { w: 11, v: 'pandebono' }, { w: 7, v: 'fita' }, { w: 9, v: 'canicas' }, { w: 8, v: 'empanada' }]);
        if (k === 'boon') {
          const pts = Object.keys(PATRONS).filter((pt) => !used.has(pt) && boonChoices(pt, 1).length);
          if (!pts.length) continue; const pt = pick(pts); used.add(pt); rw = { kind: 'boon', patron: pt };
        } else {
          if (used.has(k) || (k === 'fita' && player.weaponLvl >= 4)) continue;
          used.add(k); rw = { kind: k };
        }
      }
      rewards.push(rw || { kind: 'pesos' });
    }
  }
  const xs = rewards.length === 1 ? [0] : rewards.length === 2 ? [-7, 7] : [-10, 0, 10];
  return rewards.map((rw, i) => ({ x: xs[i], next, reward: rw, color: rewardInfo(rw).color }));
}
function enterRoom(def) {
  clearRoomObjects();
  game.type = def.type; game.reward = def.reward || null; game.cleared = false; game.begun = false; game.startT = 0.9; game.wave = 0; game.waves = [];
  game.theme = THEMES[THEMES.length - 1];
  game.exits = def.type === 'army' ? [{ x: 0, next: null, reward: { kind: 'school' }, color: '#4cc9f0' }] : makeExits();
  buildRoom(def.type, game.theme, game.exits);
  for (const ex of game.exits) {
    const info = rewardInfo(ex.reward); const elite = ex.next === 'elite' ? '<div style="color:#ff6b6b">💀 Desafio de Elite</div>' : '';
    ex.label = makeLabel(`<span class="ic">${info.icon}</span>${info.name}${elite}`, ex.x, 5.6, -D - 1.1);
  }
  const p = player;
  p.pos.set(0, 0, D - 1.5); p.vel.set(0, 0, 0); p.face = Math.PI; p.root.rotation.y = Math.PI; p.dashCharges = stat.dashMax();
  if (p.ball) p.ball.state = 'held';
  camTarget.set(0, 0, 8);
  const titles = { combat: game.room === 0 ? 'Entrada da praça' : 'Praça arborizada', elite: 'Bosque de Montería', shop: 'Tienda de Doña Rosa', rest: 'Fonte dos Desejos', boss: 'Portão da escola', army: 'A escola está logo ali!' };
  const subs = { combat: game.room === 0 ? 'Montería, Colômbia — avance ao norte' : 'Entre as árvores, siga para o norte', elite: 'Uma turma perigosa bloqueia o caminho', shop: 'Gaste seus pesos, mijo', rest: 'Respire um pouco', boss: 'O portão se abre depois de El Reyna', army: 'A Tia está com você — atravesse o portão' };
  showBanner(titles[def.type], `Trecho ${game.room + 1}/${RUN_PLAN.length} — ${subs[def.type]}`);
  if (def.type === 'shop') { setupShop(); game.cleared = true; game.begun = true; }
  if (def.type === 'rest') { setupRest(); game.cleared = true; game.begun = true; }
  if (def.type === 'combat') game.waves = makeWaves(game.room);
  if (def.type === 'army') game.waves = makeWaves(game.room);
}
function beginRoom() {
  game.begun = true;
  if (game.type === 'combat' || game.type === 'army') startWave();
  else if (game.type === 'elite') {
    queueSpawn('fumadorChefe', 0, -5, 1.4);
    for (let i = 0; i < 4; i++) { const s = randomSpawnSpot(6); queueSpawn(i % 2 ? 'gato' : 'pombo', s.x, s.z, 1.1 + i * 0.12); }
    showBanner('Turma do cigarro aceso', 'Desvie da fumaça e dos cigarros arremessados', 2.2);
  } else if (game.type === 'boss') {
    queueSpawn('elReyna', 0, -5, 1.6);
    showBanner('El Reyna', 'Mordida na canela e corrida feroz!', 2.6);
  }
}
function makeWaves(r) {
  const n = r === 9 ? 3 : r < 2 ? 3 : 4, waves = [];
  const pool = r === 0
    ? [{ t: 'morador', c: 2, min: 0 }, { t: 'idoso', c: 1.5, min: 0 }, { t: 'ciclista', c: 2.5, min: 0 }, { t: 'rato', c: 1, min: 0 }, { t: 'cachorro', c: 2, min: 1 }]
    : r === 9
      ? [{ t: 'soldado', c: 3, min: 0 }]
      : [{ t: 'pombo', c: 1, min: 0 }, { t: 'passarinho', c: 1, min: 0 }, { t: 'gato', c: 1.8, min: 0 }, { t: 'rato', c: 0.9, min: 0 }, { t: 'fumador', c: 3, min: 1 }, { t: 'iguana', c: 3.5, min: 2 }, { t: 'ciclista', c: 2.7, min: 2 }];
  for (let w = 0; w < n; w++) {
    let budget = r === 9 ? 30 + w * 9 : 18 + r * 1.8 + w * 5; const list = []; const avail = pool.filter((p) => w >= p.min);
    while (budget >= 0.9 && list.length < (r === 9 ? 21 : 22)) { const opts = avail.filter((p) => p.c <= budget); if (!opts.length) break; const p = pick(opts); list.push(p.t); budget -= p.c; }
    waves.push(list);
  }
  return waves;
}
function startWave() {
  const list = game.waves[game.wave++];
  list.forEach((t, i) => { const s = randomSpawnSpot(6); queueSpawn(t, s.x, s.z, 0.34 + i * 0.042); });
}
function roomCleared() {
  game.cleared = true; AudioSys.sfx('door');
  if (game.type === 'army') { beginSchoolEnding(); return; }
  const base = Math.round(randi(8, 15) * stat.pesosMult() * (game.type === 'elite' ? 3 : 1));
  player.pesos += base; floatText(player.pos.x, 2.4, player.pos.z, '+$' + base, 'info');
  if (P('sancocho')) healPlayer(P('sancocho'));
  if (game.type === 'elite') game.elitesDone++;
  if (game.reward) { let x = 0, z = 3; for (let i = 0; i < 40 && !spotFree(x, z, 1); i++) { x = rand(-6, 6); z = rand(-4, 6); } spawnReward(game.reward, x, z); }
  toast(game.type === 'boss' ? '🚪 El Reyna caiu! A Tia segue com você até a escola.' : '✨ Trecho limpo! Siga pela saída ao norte.');
}
function spawnReward(rw, x, z) {
  const info = rewardInfo(rw);
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const orbMat = new THREE.MeshStandardMaterial({ color: info.color, emissive: info.color, emissiveIntensity: 0.55, roughness: 0.3 });
  const orb = new THREE.Mesh(SG.ico, orbMat); orb.scale.setScalar(0.45); orb.position.y = 1; orb.castShadow = true; g.add(orb);
  const ring = new THREE.Mesh(circGeo, basicMat(info.color, 0.3)); ring.scale.setScalar(1.1); ring.position.y = 0.05; g.add(ring);
  const label = makeLabel(`<span class="ic">${info.icon}</span>${info.name}`, x, 2.4, z);
  game.pickups.push({ rw, g, orb, label, x, z, t: 0 });
  burst(x, 1, z, [info.color, '#ffffff'], 16, 4, 0.2, 0.6);
}
function updatePickups(dt) {
  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const pk = game.pickups[i]; pk.t += dt;
    pk.orb.position.y = 1 + Math.sin(pk.t * 3) * 0.15; pk.orb.rotation.y += dt * 2; pk.orb.rotation.x += dt;
    if (Math.random() < 0.1) particle(pk.x + rand(-0.4, 0.4), 0.6, pk.z + rand(-0.4, 0.4), 0, 1.5, 0, '#ffffff', 0.08, 0.6, 0);
    if (Math.hypot(player.pos.x - pk.x, player.pos.z - pk.z) < 1.2) {
      scene.remove(pk.g); pk.g.traverse((o) => o.material && o.material.dispose()); removeLabel(pk.label); game.pickups.splice(i, 1);
      collectReward(pk.rw);
    }
  }
}
function collectReward(rw) {
  const p = player;
  switch (rw.kind) {
    case 'boon': openBoonModal(rw.patron); return;
    case 'pesos': { const v = Math.round(randi(60, 100) * stat.pesosMult()); p.pesos += v; toast(`💰 +${v} pesos!`); AudioSys.sfx('coin'); break; }
    case 'pandebono': p.maxHp += 25; healPlayer(25); toast('🥯 Pandebono quentinho! +25 de vida máxima'); AudioSys.sfx('heal'); break;
    case 'fita': p.weaponLvl++; toast(`🩹 Fita Adesiva! ${WEAPONS[p.weapon].name} agora Nv ${p.weaponLvl} (+20% dano)`); AudioSys.sfx('boon'); refreshBoonList(); break;
    case 'canicas': { const v = randi(8, 14); meta.canicas += v; game.canicasRun += v; saveMeta(); toast(`🔮 +${v} bolinhas de gude (ficam pra sempre!)`); AudioSys.sfx('pickup'); break; }
    case 'empanada': healPlayer(30); toast('🥟 Empanada com ají! +30 de vida'); AudioSys.sfx('heal'); break;
  }
}

// ---------- boon modal ----------
let modalChoices = null, modalDone = null;
function openBoonModal(patron, onDone) {
  const ch = boonChoices(patron);
  if (!ch.length) { player.pesos += 80; toast('💰 Nada de novo... +80 pesos'); return; }
  modalChoices = ch; modalDone = onDone || null; game.state = 'modal';
  const pt = PATRONS[patron];
  const m = $('modal');
  m.innerHTML = `<h1 style="font-size:46px;color:${pt.color};text-shadow:0 4px 0 #3b2a1a">${pt.icon} ${pt.name}</h1><h3>${pt.line}</h3>
    <div class="cards">${ch.map((c, i) => {
      const lv = boonLvl(c.b.id); const shown = c.b.onTake ? c.value : P(c.b.id) + c.value;
      return `<div class="card" data-i="${i}" style="border-color:${c.rar.color};box-shadow:0 6px 0 ${c.rar.color}"><span class="k">${i + 1}</span>
        <span class="tag" style="background:${c.rar.color};color:#1b1b1b">${c.rar.name}</span> <span class="tag">${c.b.slot}</span>
        <div class="big">${pt.icon}</div><div class="t">${c.b.name}${lv ? ` <small>(Nv ${lv + 1})</small>` : ''}</div><div class="d">${c.b.desc(shown)}</div></div>`;
    }).join('')}</div><div class="ctrl">Clique numa carta ou aperte <kbd>1</kbd>–<kbd>${ch.length}</kbd></div>`;
  m.classList.remove('hidden');
  m.querySelectorAll('.card').forEach((el) => el.addEventListener('click', () => chooseBoon(+el.dataset.i)));
  AudioSys.sfx('pickup');
}
function chooseBoon(i) {
  if (!modalChoices || !modalChoices[i]) return;
  takeBoon(modalChoices[i]);
  toast(`${PATRONS[modalChoices[i].b.p].icon} ${modalChoices[i].b.name}!`);
  modalChoices = null; $('modal').classList.add('hidden'); game.state = 'play';
  mouse.left = mouse.right = false;
  if (modalDone) { const f = modalDone; modalDone = null; f(); }
}

// ---------- shop & rest ----------
const SHOP_ITEMS = [
  { id: 'arepa', icon: '🫓', name: 'Arepa com Queijo', desc: 'Cura 40', price: 35, color: '#f6e7c8', buy: () => healPlayer(40) },
  { id: 'avena', icon: '🥤', name: 'Avena Gelada', desc: 'Cura tudo', price: 85, color: '#fefae0', buy: () => healPlayer(9999) },
  { id: 'boon', icon: '✨', name: 'Bênção Surpresa', desc: 'Uma bênção aleatória', price: 110, color: '#c77dff', buy: () => openBoonModal(pick(Object.keys(PATRONS).filter((pt) => boonChoices(pt, 1).length))) },
  { id: 'pandebono', icon: '🥯', name: 'Pandebono', desc: '+25 vida máxima', price: 80, color: '#f4a261', buy: () => { player.maxHp += 25; healPlayer(25); } },
  { id: 'fita', icon: '🩹', name: 'Fita Adesiva', desc: '+20% dano da arma', price: 130, color: '#ced4da', buy: () => { player.weaponLvl++; refreshBoonList(); } },
  { id: 'canica', icon: '🔮', name: 'Saquinho de Gude', desc: '+15 bolinhas de gude', price: 60, color: '#4cc9f0', buy: () => { meta.canicas += 15; game.canicasRun += 15; saveMeta(); } },
];
function shopStall() {
  const g = new THREE.Group(); g.position.set(0, 0, -7.5); world.group.add(g);
  mk(BOX(9, 1.1, 1.4), '#8c5a3c', 0, 0.55, 0, g); mk(BOX(9.2, 0.12, 1.6), '#f6e7c8', 0, 1.15, 0, g);
  for (const s of [-1, 1]) { mk(BOX(0.18, 3.4, 0.18), '#6b4226', s * 4.4, 1.7, 0.6, g); mk(BOX(0.18, 3.4, 0.18), '#6b4226', s * 4.4, 1.7, -1.6, g); }
  for (let i = 0; i < 10; i++) { const st = mk(BOX(0.95, 0.12, 2.8), i % 2 ? '#ffffff' : '#e63946', -4.3 + i * 0.95, 3.5, -0.3, g); st.rotation.x = 0.22; }
  const goods = ['#ffbe0b', '#fb8500', '#e63946', '#8ac926', '#ffd60a', '#ff006e', '#7a4419'];
  for (let i = 0; i < 26; i++) mk(SPH(rand(0.1, 0.18), 6, 5), pick(goods), rand(-4.2, 4.2), 1.32, rand(-0.6, 0.6), g);
  for (let i = 0; i < 6; i++) mk(CYL(0.1, 0.1, 0.5, 8), M(pick(['#7dd87d', '#ff9f1c', '#e63946']), { transparent: true, opacity: 0.8 }), -3.5 + i * 0.5, 1.45, -0.5, g);
  const rosa = buildKid({ shirt: '#ff70a6', shorts: '#5e548e', hair: '#d9d9d9', skin: '#b07a4f', socks: '#5e548e', stripe: '#ffffff', wide: 1.3 });
  rosa.root.position.set(0.5, 0, -9.1); rosa.root.scale.setScalar(1.25); world.group.add(rosa.root);
  world.animated.push((t) => { rosa.arms[0].rotation.x = -1.2 + Math.sin(t * 4) * 0.5; rosa.head.rotation.z = Math.sin(t * 1.5) * 0.1; });
  addBox(0, -7.5, 4.6, 0.8); addCircle(0.5, -9.1, 0.7);
  makeLabel('<span class="ic">🏪</span>Tienda de Doña Rosa', 0, 4.8, -7.5);
}
function setupShop() {
  const items = shuffle(SHOP_ITEMS.filter((it) => it.id !== 'fita' || player.weaponLvl < 4)).slice(0, 3);
  const xs = [-5, 0, 5];
  items.forEach((it, i) => {
    const x = xs[i], z = -3;
    const g = new THREE.Group(); g.position.set(x, 0, z); world.group.add(g);
    mk(CYL(0.7, 0.8, 0.9, 10), '#d4a373', 0, 0.45, 0, g); mk(CYL(0.8, 0.8, 0.08, 10), '#f6e7c8', 0, 0.92, 0, g);
    const orb = mk(SG.ico, M(it.color, { emissive: it.color, emissiveIntensity: 0.4 }), 0, 1.4, 0, g); orb.scale.setScalar(0.35);
    world.animated.push((t) => { orb.position.y = 1.4 + Math.sin(t * 3 + i) * 0.1; orb.rotation.y = t; });
    addCircle(x, z, 0.8);
    const label = makeLabel('', x, 2.3, z);
    const it2 = { x, z, r: 2, label, item: it, done: false, g };
    it2.render = (near) => { label.el.innerHTML = `<span class="ic">${it.icon}</span>${it.name}<br><small>${it.desc}</small><br><span class="price">$ ${it.price}</span>${near ? '<br><span class="key">E</span>comprar' : ''}`; };
    it2.render(false);
    it2.action = () => {
      if (player.pesos < it.price) { AudioSys.sfx('deny'); toast('😅 Faltou dinheiro, mijo!'); return; }
      player.pesos -= it.price; it2.done = true; removeLabel(label); world.group.remove(g); AudioSys.sfx('coin');
      toast(`${it.icon} ${it.name}!`); it.buy();
    };
    game.interact.push(it2);
  });
}
function setupRest() {
  const label = makeLabel('', 0, 5, -1);
  const it = { x: 0, z: -1, r: 4.6, label, done: false };
  it.render = (near) => { label.el.innerHTML = `<span class="ic">⛲</span>Fonte dos Desejos<br><small>Cura 50% da vida</small>${near ? '<br><span class="key">E</span>beber' : ''}`; };
  it.render(false);
  it.action = () => { it.done = true; removeLabel(label); healPlayer(player.maxHp * 0.5); AudioSys.sfx('heal'); burst(player.pos.x, 1, player.pos.z, ['#4cc9f0', '#ffffff'], 24, 4, 0.2, 0.8); toast('⛲ Água fresquinha! A Vó diria pra não beber da fonte...'); };
  game.interact.push(it);
}
function updateInteract() {
  let best = null, bd = 1e9;
  for (const it of game.interact) { if (it.done) continue; const d = Math.hypot(player.pos.x - it.x, player.pos.z - it.z); if (d < it.r && d < bd) { bd = d; best = it; } }
  for (const it of game.interact) { if (it.done) continue; const near = it === best; if (it.near !== near) { it.near = near; it.render(near); } }
  if (best && (pressed.KeyE || gamepad.pressed[0])) best.action();
}

// ---------- exits ----------
function checkExits() {
  if (!game.cleared || game.state !== 'play') return;
  for (const ex of game.exits) if (ex.label) ex.label.el.classList.toggle('locked', false);
  if (player.pos.z > -D + 1.0) return;
  for (const ex of game.exits) {
    if (Math.abs(player.pos.x - ex.x) < 1.7) { goToExit(ex); return; }
  }
}
function goToExit(ex) {
  game.state = 'transition'; fade(true); AudioSys.sfx('door');
  setTimeout(() => {
    game.room++;
    const rw = ['shop', 'rest', 'boss', 'army'].includes(ex.reward.kind) ? null : ex.reward;
    enterRoom({ type: ex.next, reward: rw });
    fade(false); game.state = 'play';
  }, 420);
}

// ---------- end states ----------
function playerDie() {
  if (player.pad) WEAPONS[player.weapon].reset();
  player.alive = false; game.state = 'dying'; AudioSys.sfx('lose');
  burst(player.pos.x, 1, player.pos.z, ['#ffffff', '#ffd23f', '#1d3fbb'], 24, 4, 0.25, 0.8);
  setTimeout(() => endRun(false), 1800);
}
function onBossDefeated() {
  AudioSys.sfx('win');
  roomCleared();
  showBanner('El Reyna derrotado!', 'O caminho da escola está aberto — a Tia vem junto', 3.2);
}
function beginSchoolEnding() {
  cleanupJapaPower();
  if (player.pad) WEAPONS[player.weapon].reset();
  game.state = 'ending';
  game.endingT = 0;
  game.endingFrom = { x: player.pos.x, z: player.pos.z };
  $('bossBar').classList.add('hidden');
  const heroName = heroDisplayName(player.hero);
  showBanner('Um beijo da Tia!', `${heroName} entra na escola de Montería 💛`, 4.5);
}
function updateSchoolEnding(dt) {
  game.endingT += dt;
  const k = Math.min(1, game.endingT / 3.5);
  player.pos.x = lerp(game.endingFrom.x, 0, k);
  player.pos.z = lerp(game.endingFrom.z, -D - 5, k);
  player.face = Math.PI;
  player.root.rotation.y = Math.PI;
  player.root.position.set(player.pos.x, 0, player.pos.z);
  if (tia) {
    tia.root.position.x = player.pos.x + 1.15;
    tia.root.position.z = player.pos.z + 0.1;
    tia.root.rotation.y = Math.PI;
  }
  if (game.endingT > 5) endRun(true);
}
function endRun(won) {
  cleanupJapaPower();
  const earned = (game.room + 1) * 2 + (won ? 40 : 0);
  meta.canicas += earned; game.canicasRun += earned;
  meta.best = Math.max(meta.best, game.room + 1); if (won) meta.wins++;
  saveMeta();
  game.state = won ? 'win' : 'dead';
  const heroName = heroDisplayName(player.hero);
  const mins = Math.floor(game.runTime / 60), secs = String(Math.floor(game.runTime % 60)).padStart(2, '0');
  const m = $('modal');
  m.innerHTML = `<h1>${won ? '🏆 Rei da Praça!' : '🍽️ A mãe chamou pra jantar!'}</h1>
    <h3>${won ? `El Reyna ficou para trás, a Tia deu um beijo e ${heroName} entrou na escola de Montería!` : `${heroName} voltou pra casa... mas amanhã tem mais recreio.`}</h3>
    <div class="stats">Sala alcançada: <b>${game.room + 1}/${RUN_PLAN.length}</b><br>Inimigos derrotados: <b>${player.kills}</b><br>Tempo: <b>${mins}:${secs}</b><br>Bênçãos: <b>${Object.keys(player.boons).length}</b><br>Bolinhas de gude ganhas: <b>🔮 ${game.canicasRun}</b></div>
    <div><button class="btn" id="btnAgain">Jogar de novo ▶</button><button class="btn" id="btnMenu">Voltar ao pátio</button></div>`;
  m.classList.remove('hidden');
  $('btnAgain').onclick = () => startRun();
  $('btnMenu').onclick = () => openHub();
}
function openPause() {
  game.state = 'pause';
  const m = $('modal');
  const boons = Object.keys(player.boons).map((id) => { const b = BOON_BY_ID[id], pt = PATRONS[b.p]; const v = player.boons[id].power; return `<div class="mu" style="border-color:${pt.color}"><b>${pt.icon} ${b.name}</b> <span class="lv">Nv ${player.boons[id].lvl}</span><br>${b.desc(v)}</div>`; }).join('') || '<div class="mu">Nenhuma bênção ainda.</div>';
  const affinity = weaponAffinity(player.hero, player.weapon);
  const comboLine = affinity ? `<div class="combo-affinity ${affinity.active ? 'active' : ''}">${affinity.active ? `Afinidade ativa: +${Math.round(affinity.bonus * 100)}% de dano nos ataques básicos` : `Afinidade: ${WEAPONS[affinity.weapon].name} (+${Math.round(affinity.bonus * 100)}% nos ataques básicos)`}</div>` : '';
  m.innerHTML = `<h1>⏸ Pausa</h1><h3>${WEAPONS[player.weapon].icon} ${WEAPONS[player.weapon].name}${player.weaponLvl ? ' — Fita Nv ' + player.weaponLvl : ''}</h3>${comboLine}<div class="meta">${boons}</div>
    <div style="margin-top:14px"><button class="btn" id="btnResume">Continuar</button><button class="btn" id="btnQuit">Desistir</button></div>`;
  m.classList.remove('hidden');
  $('btnResume').onclick = closePause;
  $('btnQuit').onclick = () => { m.classList.add('hidden'); player.hp = 0; player.revives = 0; game.state = 'play'; playerDie(); };
}
function closePause() { $('modal').classList.add('hidden'); game.state = 'play'; mouse.left = mouse.right = false; }

// ---------- main loop ----------
function updateCamera(dt) {
  if (game.state === 'hub') {
    const tx = clamp(player.pos.x * 0.2, -2, 2), tz = clamp(player.pos.z * 0.3 - 2.2, -4.5, -0.6);
    camTarget.x = damp(camTarget.x, tx, 4, dt); camTarget.z = damp(camTarget.z, tz, 4, dt);
    camera.position.copy(camTarget).add(HUB_CAM_OFF);
  } else {
    const tx = clamp(player.pos.x * 0.85, -5, 5), tz = game.state === 'ending' ? player.pos.z * 0.9 - 1.2 : clamp(player.pos.z * 0.9 - 1.2, -8, 6);
    camTarget.x = damp(camTarget.x, tx, 5, dt); camTarget.z = damp(camTarget.z, tz, 5, dt);
    camera.position.copy(camTarget).add(CAM_OFF);
  }
  if (shakeAmt > 0) { camera.position.x += rand(-1, 1) * shakeAmt * 0.5; camera.position.y += rand(-1, 1) * shakeAmt * 0.3; shakeAmt = Math.max(0, shakeAmt - dt * 3); }
  camera.lookAt(camTarget);
  sun.position.set(camTarget.x - 14, 28, camTarget.z + 12); sun.target.position.copy(camTarget);
}
function runTimers(dt) {
  for (let i = game.timers.length - 1; i >= 0; i--) { const t = game.timers[i]; t.t -= dt; if (t.t <= 0) { game.timers.splice(i, 1); t.fn(); } }
}
function updateGame(dt) {
  game.runTime += dt;
  runTimers(dt);
  updatePlayer(dt); updateEnemies(dt); updateProjs(dt); updateLobs(dt); updateTrompos(dt);
  if (game.state !== 'play') return;
  updatePickups(dt); updateInteract();
  if (!game.begun) { game.startT -= dt; if (game.startT <= 0) beginRoom(); }
  else if (!game.cleared) {
    const alive = enemies.some((e) => !e.dead) || pendingSpawns.length > 0;
    // The next wave waits until the VAR referee has left the field.
    const varReview = player.specialKind === 'var' && player.heroT > 0;
    if (!alive && !varReview) { if (game.wave < game.waves.length) startWave(); else if (game.type !== 'boss') roomCleared(); }
  }
  for (const ex of game.exits) if (ex.label) ex.label.el.classList.toggle('locked', !game.cleared);
  checkExits();
}
let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  pollGamepad();
  game.time += dt;
  const startPressedInHub = game.state === 'hub' && gamepad.connected && gamepad.pressed[9];
  updateMouseWorld();
  if (pressed.KeyM) toast(AudioSys.toggleMute() ? '🔇 Som desligado' : '🔊 Som ligado', 1.2);
  if (game.state === 'play') {
    if (pressed.Escape || pressed.KeyP || (!startPressedInHub && (gamepad.pressed[9] || gamepad.pressed[8]))) openPause();
    else { let gdt = dt; if (hitstop > 0) { hitstop -= dt; gdt = dt * 0.08; } updateGame(gdt); }
  } else if (game.state === 'dying') {
    updateGame(dt * 0.35);
    player.rig.body.rotation.x = damp(player.rig.body.rotation.x, -1.45, 6, dt);
    player.root.position.y = 0;
  } else if (game.state === 'modal') {
    for (let i = 1; i <= 3; i++) if (pressed['Digit' + i] || pressed['Numpad' + i]) chooseBoon(i - 1);
    if (gamepad.pressed[0]) chooseBoon(0);
  } else if (game.state === 'pause') {
    if (pressed.Escape || pressed.KeyP || gamepad.pressed[9] || gamepad.pressed[8]) closePause();
  } else if (game.state === 'ending') {
    updateSchoolEnding(dt);
  } else if (game.state === 'hub') {
    let gdt = dt; if (hitstop > 0) { hitstop -= dt; gdt = dt * 0.08; }
    updateHub(gdt);
  }
  for (const f of world.animated) f(game.time, dt);
  updateFadeables(dt, player.pos.x, player.pos.z);
  updateExits(dt, game.time, game.cleared);
  if (game.state !== 'pause' && game.state !== 'modal') { updateParticles(dt); updateFx(dt); }
  updateCamera(dt); updateFloaters(dt); updateLabels(); updateHUD(); updateHubHud(dt);
  renderer.render(scene, camera);
  clearPressed();
}