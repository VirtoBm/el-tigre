// ================= game flow =================
const game = { state: 'title', room: 0, type: 'combat', exits: [], cleared: false, begun: false, startT: 0, waves: [], wave: 0, breather: 0, reward: null, theme: THEMES[THEMES.length - 1], bossE: null, time: 0, runTime: 0, pickups: [], coins: [], interact: [], timers: [], elitesDone: 0, canicasRun: 0, pesosRun: 0, endingT: 0, slowmo: 0, heartT: 0, pausedFrom: null };
let controllerStatus = 'Nenhum controle conectado.';
let inputDevice = 'kb';
window.addEventListener('gamepadstatus', (event) => {
  controllerStatus = event.detail.connected ? `🎮 Controle conectado` : 'Nenhum controle conectado.';
  const status = $('controller-status');
  if (status) status.textContent = controllerStatus;
  if (event.detail.connected) inputDevice = 'pad';
  toast(event.detail.connected ? '🎮 Controle conectado' : '🎮 Controle desconectado', 1.5);
});
addEventListener('keydown', () => { inputDevice = 'kb'; });
addEventListener('mousedown', () => { inputDevice = 'kb'; });
function later(t, fn) { game.timers.push({ t, fn }); }

// Button glyphs follow the last device used.
const GLYPHS = {
  kb: { attack: 'Clique', special: 'Btn. dir.', dash: 'Espaço', cast: 'Q', use: 'E', pause: 'Esc', move: 'WASD', aim: 'Mouse' },
  pad: { attack: 'X', special: 'B', dash: 'LB', cast: 'Y', use: 'A', pause: 'Start', move: 'L', aim: 'R' },
};
function glyph(action) { const g = GLYPHS[inputDevice][action]; return `<span class="kb${inputDevice === 'pad' ? ' pad' : ''}">${g}</span>`; }
function shortGlyph(action) { return inputDevice === 'pad' ? GLYPHS.pad[action] : { attack: 'J', special: 'K', dash: '␣', cast: 'Q', use: 'E' }[action]; }

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
function toast(msg, dur = 2.6) { const el = $('toast'); el.innerHTML = msg; el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), dur * 1000); }
function showBanner(title, sub = '', dur = 2.4) {
  const el = $('banner'); el.querySelector('h2').textContent = title; el.querySelector('p').textContent = sub;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); el.style.opacity = 1;
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => (el.style.opacity = 0), dur * 1000);
}
function showHint(html, dur = 6) { const el = $('hint'); el.innerHTML = html; el.style.opacity = 1; clearTimeout(hintTimer); hintTimer = setTimeout(() => (el.style.opacity = 0), dur * 1000); }
function fade(on) { $('fade').style.opacity = on ? 1 : 0; }
// Re-triggerable CSS animation on a HUD element.
function hudPulse(kind) {
  const el = kind === 'hp' ? $('hpBar') : kind === 'pesos' ? $('pesos') : kind === 'canicas' ? $('canicas') : kind === 'sp' ? $('slotSp') : null;
  if (!el) return; const cls = kind === 'hp' ? 'pulse' : kind === 'sp' ? 'flash' : 'bump';
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
}
const setText = (el, v) => { if (el._v !== v) { el._v = v; el.textContent = v; } };
const setStyle = (el, k, v) => { if (el['_' + k] !== v) { el['_' + k] = v; el.style[k] = v; } };
let lastBoonCount = 0;
function refreshBoonList() {
  const el = $('boonList'); const ids = Object.keys(player.boons);
  let html = player.weaponLvl ? `<div class="bi" style="border-color:#ced4da" title="+${player.weaponLvl * 20}% de dano da arma"><span class="e">🩹</span>Fita Adesiva <span class="lv">Nv ${player.weaponLvl}</span></div>` : '';
  ids.forEach((id, i) => {
    const b = BOON_BY_ID[id], pt = PATRONS[b.p], fresh = i >= lastBoonCount;
    const tip = b.desc(player.boons[id].power).replace(/<[^>]+>/g, '');
    html += `<div class="bi${fresh ? ' new' : ''}" style="border-color:${pt.color}" title="${tip}"><span class="e">${pt.icon}</span>${b.name}${player.boons[id].lvl > 1 ? ` <span class="lv">Nv ${player.boons[id].lvl}</span>` : ''}</div>`;
  });
  lastBoonCount = ids.length;
  el.innerHTML = html;
}
function buildRunTrack() {
  $('runTrack').innerHTML = RUN_PLAN.map((type, i) => `${i ? `<div class="link" data-i="${i}"></div>` : ''}<div class="node" data-i="${i}" title="${type}">${ROOM_ICONS[type]}</div>`).join('');
}
function refreshRunTrack() {
  for (const el of $('runTrack').children) {
    const i = +el.dataset.i;
    if (el.classList.contains('node')) { el.classList.toggle('done', i < game.room); el.classList.toggle('cur', i === game.room); }
    else el.classList.toggle('done', i <= game.room);
  }
}
let hpChipK = 1, bossChipK = 1;
function updateHUD(dt) {
  if (game.state === 'hub' || game.state === 'title') return;
  const p = player;
  const hpK = clamp(p.hp / p.maxHp, 0, 1);
  hpChipK = hpChipK < hpK ? hpK : damp(hpChipK, hpK, 3.5, dt);
  setStyle($('hpFill'), 'width', (hpK * 100).toFixed(1) + '%');
  setStyle($('hpChip'), 'width', (hpChipK * 100).toFixed(1) + '%');
  $('hpFill').classList.toggle('low', hpK <= 0.3);
  setText($('hpText'), `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`);
  // hero power meter
  const ready = p.safeT >= 15, active = p.heroT > 0;
  const powerK = active ? p.heroT / 5 : Math.min(1, p.safeT / 15);
  setStyle($('powerFill'), 'width', (powerK * 100).toFixed(1) + '%');
  const pb = $('powerBar'); pb.classList.toggle('ready', ready && !active); pb.classList.toggle('active', active);
  setText($('powerText'), active ? 'PODER ATIVO!' : ready ? `PODER PRONTO — ${shortGlyph('special')}` : `PODER · ${Math.ceil(15 - p.safeT)}s sem dano`);
  const skinIcon = p.skin === 'idol' ? '🎤' : p.skin === 'abelha' ? '🍯' : p.skin === 'skatista' ? '🛹' : p.skin === 'piscina' ? '🛟' : HERO_POWER_ICON[p.hero] || '🐯';
  setText($('portrait'), skinIcon);
  $('portrait').classList.toggle('ready', ready && !active); $('portrait').classList.toggle('active', active);
  $('portrait').title = `${HEROES[p.hero].name}: ${HEROES[p.hero].desc}`;
  // weapon special & trompo
  const W = WEAPONS[p.weapon];
  setText($('slotSp').querySelector('.ic'), W.icon);
  setStyle($('slotSp').querySelector('.cd'), 'height', (Math.max(0, p.spCd) / (p.spMax || 1) * 100).toFixed(0) + '%');
  setText($('slotSp').querySelector('small'), ready ? '⭐' : shortGlyph('special'));
  $('slotSp').classList.toggle('ready', p.spCd <= 0);
  $('slotSp').title = `Especial da arma (${W.name}). Com o poder pronto, o mesmo botão ativa o poder do personagem.`;
  setStyle($('slotCast').querySelector('.cd'), 'height', (Math.max(0, p.castCd) / p.castMax * 100).toFixed(0) + '%');
  setText($('slotCast').querySelector('small'), shortGlyph('cast'));
  $('slotCast').classList.toggle('ready', p.castCd <= 0);
  const dm = stat.dashMax(); const pips = $('dashPips');
  if (pips.children.length !== dm) pips.innerHTML = '<div class="pip"></div>'.repeat(dm);
  [...pips.children].forEach((c, i) => c.classList.toggle('off', i >= p.dashCharges));
  setText($('revives'), '📿'.repeat(p.revives));
  setText($('pesos'), '$ ' + p.pesos);
  setText($('canicas'), '🔮 ' + meta.canicas);
  setText($('timeChip'), `⏱ ${Math.floor(game.runTime / 60)}:${String(Math.floor(game.runTime % 60)).padStart(2, '0')}`);
  // wave / objective line
  let wave = '';
  if (game.state !== 'play' && game.state !== 'transition') wave = '';
  else if (game.cleared) wave = game.type === 'shop' ? '🏪 Compre e siga para o norte ↑' : game.type === 'rest' ? '⛲ Descanse e siga para o norte ↑' : game.state === 'ending' ? '' : '✨ Trecho limpo! Siga para o norte ↑';
  else if (game.begun && (game.type === 'combat' || game.type === 'army')) {
    const left = enemies.filter((e) => !e.dead && !e.def.dummy).length + pendingSpawns.length;
    wave = `Onda ${Math.max(1, game.wave)}/${game.waves.length} · ${left} inimigo${left === 1 ? '' : 's'}`;
  } else if (game.begun && game.type === 'elite') wave = '💀 Derrote o chefe da turma';
  else if (game.begun && game.type === 'boss') wave = '🐕 Derrote El Reyna';
  setText($('waveInfo'), wave);
  $('waveInfo').classList.toggle('clear', game.cleared && !!wave);
  $('waveInfo').style.display = wave ? '' : 'none';
  // boss bar
  const be = game.bossE; const bb = $('bossBar');
  if (be && !be.dead && game.state !== 'hub') {
    bb.classList.remove('hidden'); setText(bb.querySelector('.nm'), be.def.name);
    const k = clamp(be.hp / be.maxHp, 0, 1); bossChipK = bossChipK < k ? k : damp(bossChipK, k, 2.5, dt);
    setStyle(bb.querySelector('.fill'), 'width', (k * 100).toFixed(1) + '%');
    setStyle(bb.querySelector('.chip'), 'width', (bossChipK * 100).toFixed(1) + '%');
    bb.classList.toggle('enraged', be.type === 'elReyna' && k < 0.42);
    for (const m of bb.querySelectorAll('.mark')) m.style.display = be.type === 'elReyna' ? '' : 'none';
  } else { bb.classList.add('hidden'); bossChipK = 1; }
  // low health feedback
  const low = p.alive && hpK <= 0.3 && game.state === 'play';
  $('lowHp').classList.toggle('on', low);
  if (low) { game.heartT -= dt; if (game.heartT <= 0) { game.heartT = 0.9; AudioSys.sfx('heart'); } }
}

// ---------- coins ----------
const coinGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.05, 12).rotateX(Math.PI / 2); coinGeo.userData.shared = true;
const coinMat = new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#b8860b', emissiveIntensity: 0.45, metalness: 0.6, roughness: 0.3 });
function spawnCoins(x, z, value) {
  const n = Math.min(8, value), per = Math.floor(value / n), extra = value - per * n;
  for (let i = 0; i < n; i++) {
    const mesh = new THREE.Mesh(coinGeo, coinMat); mesh.castShadow = true; scene.add(mesh);
    const a = Math.random() * TAU, s = rand(2, 4.5);
    game.coins.push({ mesh, x, z, y: 0.6, vx: Math.sin(a) * s, vz: Math.cos(a) * s, vy: rand(5, 8), t: 0, value: per + (i < extra ? 1 : 0) });
  }
}
function updateCoins(dt) {
  const p = player;
  for (let i = game.coins.length - 1; i >= 0; i--) {
    const c = game.coins[i]; c.t += dt;
    const dx = p.pos.x - c.x, dz = p.pos.z - c.z, d = Math.hypot(dx, dz);
    if (c.t > 0.45 && (d < 4.2 || game.cleared)) {
      const pull = Math.min(40, 10 + c.t * 14);
      c.vx = damp(c.vx, dx / (d || 1) * pull, 10, dt); c.vz = damp(c.vz, dz / (d || 1) * pull, 10, dt); c.vy = 0; c.y = damp(c.y, 0.9, 10, dt);
    } else {
      c.vy -= 22 * dt; c.y += c.vy * dt;
      if (c.y < 0.12) { c.y = 0.12; c.vy = Math.abs(c.vy) > 1.5 ? -c.vy * 0.45 : 0; c.vx *= 0.7; c.vz *= 0.7; }
      c.vx *= Math.exp(-dt * 2); c.vz *= Math.exp(-dt * 2);
    }
    c.x += c.vx * dt; c.z += c.vz * dt;
    c.mesh.position.set(c.x, c.y, c.z); c.mesh.rotation.y += dt * 9;
    if (c.t > 0.3 && d < 0.7) {
      p.pesos += c.value; game.pesosRun += c.value; AudioSys.sfx('coinPick', c.x, { gap: 0.02 }); hudPulse('pesos');
      scene.remove(c.mesh); game.coins.splice(i, 1);
    }
  }
}

// ---------- run / rooms ----------
function clearRoomObjects() {
  for (const e of enemies) removeEnemyVisuals(e);
  enemies.length = 0; pendingSpawns.length = 0;
  if (player.pad) WEAPONS[player.weapon].reset();
  for (const pr of projs) scene.remove(pr.mesh); projs.length = 0;
  for (const l of lobs) if (l.mesh) { scene.remove(l.mesh); disposeOwn(l.mesh); } lobs.length = 0;
  for (const t of trompos) scene.remove(t.mesh); trompos.length = 0;
  for (const h of hazards) { fxRoot.remove(h.mesh); h.m.dispose(); } hazards.length = 0;
  for (const pk of game.pickups) scene.remove(pk.g); game.pickups.length = 0;
  for (const c of game.coins) { player.pesos += c.value; scene.remove(c.mesh); } game.coins.length = 0;
  game.interact.length = 0; game.timers.length = 0; game.bossE = null;
  clearFx(); clearLabels();
}
function startRun() {
  AudioSys.init();
  meta.runs++; saveMeta();
  clearTia();
  Menu.close();
  $('hubHud').classList.add('hidden'); $('hud').classList.remove('hidden');
  clearRoomObjects();
  setupPlayer(meta.weapon);
  game.room = 0; game.runTime = 0; game.elitesDone = 0; game.canicasRun = 0; game.pesosRun = 0; game.state = 'play'; game.slowmo = 0;
  lastBoonCount = 0; hpChipK = 1; refreshBoonList(); buildRunTrack();
  enterRoom({ type: 'combat', reward: { kind: 'boon', patron: pick(Object.keys(PATRONS)) } });
  const characterHint = player.weapon === 'raquete' ? `<br><b>Raquete:</b> ${glyph('attack')} perto de uma bola lançada rebate em chamas` : player.weapon === 'frango' ? '<br><b>Coxa:</b> o impacto envenena e o inimigo para para comer' : player.weapon === 'bola' ? `<br><b>Bola:</b> ${glyph('attack')} de novo chama a bola de volta` : '';
  showHint(`${glyph('move')} mover · ${glyph('aim')} mirar · ${glyph('attack')} atacar · ${glyph('special')} especial · ${glyph('dash')} esquiva · ${glyph('cast')} trompo · ${glyph('pause')} pausa${characterHint}`, 9);
}
function makeExits() {
  const next = RUN_PLAN[game.room + 1]; if (!next) return [];
  let rewards;
  if (next === 'shop' || next === 'rest' || next === 'boss' || next === 'army') rewards = [{ kind: next }];
  else {
    const n = next === 'elite' ? 2 : randi(2, 3); rewards = []; const used = new Set();
    // Low health nudges the offer towards food.
    const hurt = player.hp / player.maxHp < 0.45;
    for (let i = 0; i < n; i++) {
      let rw = null;
      for (let tries = 0; tries < 30 && !rw; tries++) {
        const k = weighted([{ w: 50, v: 'boon' }, { w: 14, v: 'pesos' }, { w: 10, v: 'pandebono' }, { w: 8, v: 'fita' }, { w: 8, v: 'canicas' }, { w: hurt ? 22 : 8, v: 'empanada' }]);
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
const ROOM_TITLES = { combat: 'Praça arborizada', elite: 'Bosque de Montería', shop: 'Tienda de Doña Rosa', rest: 'Fonte dos Desejos', boss: 'Portão da escola', army: 'A escola está logo ali!' };
const ROOM_SUBS = { combat: 'Entre as árvores, siga para o norte', elite: 'Uma turma perigosa bloqueia o caminho', shop: 'Gaste seus pesos, mijo', rest: 'Respire um pouco', boss: 'O portão se abre depois de El Reyna', army: 'A Tia está com você — atravesse o portão' };
function enterRoom(def) {
  clearRoomObjects();
  game.type = def.type; game.reward = def.reward || null; game.cleared = false; game.begun = false; game.startT = 1.1; game.wave = 0; game.waves = []; game.breather = 0;
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
  const title = def.type === 'combat' && game.room === 0 ? 'Entrada da praça' : ROOM_TITLES[def.type];
  const sub = def.type === 'combat' && game.room === 0 ? 'Montería, Colômbia — avance ao norte' : ROOM_SUBS[def.type];
  showBanner(title, `Trecho ${game.room + 1}/${RUN_PLAN.length} — ${sub}`);
  refreshRunTrack();
  AudioSys.setMood(def.type === 'shop' || def.type === 'rest' ? 'calm' : def.type === 'boss' ? 'boss' : 'run');
  if (def.type === 'shop') { setupShop(); game.cleared = true; game.begun = true; }
  if (def.type === 'rest') { setupRest(); game.cleared = true; game.begun = true; }
  if (def.type === 'combat' || def.type === 'army') game.waves = buildWaves(game.room);
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
    AudioSys.sfx('growl');
  }
}
function startWave() {
  const list = game.waves[game.wave++];
  // Stagger arrivals so a wave reads as a group pouring in rather than a pop-in.
  list.forEach((t, i) => { const s = randomSpawnSpot(6); queueSpawn(t, s.x, s.z, 0.55 + i * 0.09); });
  if (game.waves.length > 1) { AudioSys.sfx('wave'); if (game.wave > 1) floatText(player.pos.x, 3, player.pos.z, `ONDA ${game.wave}/${game.waves.length}`, 'info'); }
  game.breather = 0.8;
}
function roomCleared() {
  game.cleared = true; AudioSys.sfx('door');
  if (game.type === 'army') { beginSchoolEnding(); return; }
  // A short slow-motion beat sells the last hit.
  game.slowmo = 0.55; zoomPunch(0.5); AudioSys.sfx('clear'); AudioSys.setMood('calm');
  const base = Math.round(randi(8, 15) * stat.pesosMult() * (game.type === 'elite' ? 3 : 1));
  player.pesos += base; game.pesosRun += base; floatText(player.pos.x, 2.4, player.pos.z, '+$' + base, 'coin'); hudPulse('pesos');
  if (P('sancocho')) healPlayer(P('sancocho'));
  if (game.type === 'elite') game.elitesDone++;
  if (game.reward) { let x = 0, z = 3; for (let i = 0; i < 40 && !spotFree(x, z, 1); i++) { x = rand(-6, 6); z = rand(-4, 6); } spawnReward(game.reward, x, z); }
  for (const ex of game.exits) if (ex.label) ex.label.el.classList.add('exit-open');
  toast(game.type === 'boss' ? '🚪 El Reyna caiu! A Tia segue com você até a escola.' : '✨ Trecho limpo! Pegue a recompensa e siga pela saída ao norte.');
}
function spawnReward(rw, x, z) {
  const info = rewardInfo(rw);
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const orbMat = new THREE.MeshStandardMaterial({ color: info.color, emissive: info.color, emissiveIntensity: 0.55, roughness: 0.3 });
  const orb = new THREE.Mesh(SG.ico, orbMat); orb.scale.setScalar(0.45); orb.position.y = 1; orb.castShadow = true; g.add(orb);
  const ring = new THREE.Mesh(circGeo, basicMat(info.color, 0.3)); ring.scale.setScalar(1.1); ring.position.y = 0.05; g.add(ring);
  const beam = new THREE.Mesh(SG.cyl, basicMat(info.color, 0.18)); beam.scale.set(0.5, 6, 0.5); beam.position.y = 3; g.add(beam);
  const label = makeLabel(`<span class="ic">${info.icon}</span>${info.name}`, x, 2.4, z);
  game.pickups.push({ rw, g, orb, ring, beam, label, x, z, t: 0 });
  burst(x, 1, z, [info.color, '#ffffff'], 20, 4, 0.2, 0.6); shockRing(x, z, 2.5, 0.4, info.color); AudioSys.sfx('pickup', x);
}
function updatePickups(dt) {
  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const pk = game.pickups[i]; pk.t += dt;
    pk.orb.position.y = 1 + Math.sin(pk.t * 3) * 0.15; pk.orb.rotation.y += dt * 2; pk.orb.rotation.x += dt;
    pk.ring.scale.setScalar(1.1 + Math.sin(pk.t * 4) * 0.12); pk.beam.material.opacity = 0.12 + Math.sin(pk.t * 3) * 0.06;
    if (Math.random() < 0.15) particle(pk.x + rand(-0.4, 0.4), 0.6, pk.z + rand(-0.4, 0.4), 0, 1.5, 0, '#ffffff', 0.08, 0.6, 0);
    if (Math.hypot(player.pos.x - pk.x, player.pos.z - pk.z) < 1.25) {
      scene.remove(pk.g); pk.g.traverse((o) => o.material && o.material.dispose()); removeLabel(pk.label); game.pickups.splice(i, 1);
      collectReward(pk.rw);
    }
  }
}
function collectReward(rw) {
  const p = player;
  burst(p.pos.x, 1.2, p.pos.z, [rewardInfo(rw).color, '#ffffff'], 18, 4, 0.18, 0.6);
  switch (rw.kind) {
    case 'boon': openBoonModal(rw.patron); return;
    case 'pesos': { const v = Math.round(randi(60, 100) * stat.pesosMult()); p.pesos += v; game.pesosRun += v; toast(`💰 +${v} pesos!`); AudioSys.sfx('coin'); hudPulse('pesos'); break; }
    case 'pandebono': p.maxHp += 25; healPlayer(25); toast('🥯 Pandebono quentinho! +25 de vida máxima'); AudioSys.sfx('heal'); break;
    case 'fita': p.weaponLvl++; toast(`🩹 Fita Adesiva! ${WEAPONS[p.weapon].name} agora Nv ${p.weaponLvl} (+20% dano)`); AudioSys.sfx('boon'); refreshBoonList(); break;
    case 'canicas': { const v = randi(8, 14); meta.canicas += v; game.canicasRun += v; saveMeta(); toast(`🔮 +${v} bolinhas de gude (ficam pra sempre!)`); AudioSys.sfx('pickup'); hudPulse('canicas'); break; }
    case 'empanada': healPlayer(30); toast('🥟 Empanada com ají! +30 de vida'); AudioSys.sfx('heal'); break;
  }
}

// ---------- menu controller (keyboard, mouse and gamepad) ----------
const Menu = {
  items: [], idx: 0, onBack: null, repeatT: 0, lockT: 0, horizontal: false,
  get active() { return !$('modal').classList.contains('hidden'); },
  open(html, { actions = {}, onBack = null, focus = 0, lock = 0, horizontal = false } = {}) {
    const m = $('modal'); m.innerHTML = html; m.classList.remove('hidden', 'show'); void m.offsetWidth; m.classList.add('show');
    this.onBack = onBack; this.lockT = lock; this.horizontal = horizontal; this.repeatT = 0.25; this.actions = actions;
    this.items = [...m.querySelectorAll('[data-nav]')];
    this.items.forEach((it, i) => {
      it.addEventListener('mouseenter', () => this.focus(i, true));
      it.addEventListener('click', (ev) => { ev.stopPropagation(); if (it.dataset.range) return; this.focus(i); this.activate(); });
      const bar = it.querySelector('.bar');
      if (bar) bar.addEventListener('pointerdown', (ev) => { const r = bar.getBoundingClientRect(); setOption(it.dataset.range, (ev.clientX - r.left) / r.width); });
    });
    this.idx = -1; this.focus(Math.min(focus, this.items.length - 1));
    AudioSys.setMuffle(true);
    mouse.left = mouse.right = false;
  },
  close() { $('modal').classList.add('hidden'); this.items = []; this.onBack = null; AudioSys.setMuffle(false); mouse.left = mouse.right = false; },
  focus(i, sound = false) {
    if (!this.items.length) return;
    i = (i + this.items.length) % this.items.length;
    if (i === this.idx) return;
    this.items.forEach((x) => x.classList.remove('focus'));
    this.idx = i; this.items[i].classList.add('focus');
    if (sound) AudioSys.sfx('hover', null, { pitch: 1 });
    this.items[i].scrollIntoView?.({ block: 'nearest' });
  },
  activate() {
    if (this.lockT > 0) return;
    const it = this.items[this.idx]; if (!it) return;
    if (it.dataset.toggle) { setOption(it.dataset.toggle); return; }
    if (it.dataset.range) return;
    const fn = this.actions[it.dataset.nav]; if (!fn) return;
    AudioSys.sfx('select', null, { pitch: 1 }); fn(it);
  },
  back() { if (this.onBack) { AudioSys.sfx('back', null, { pitch: 1 }); this.onBack(); } },
  update(dt) {
    if (!this.active) return;
    this.lockT -= dt; this.repeatT -= dt;
    const it = this.items[this.idx];
    let dy = 0, dx = 0;
    if (pressed.ArrowUp || pressed.KeyW || gamepad.pressed[12]) dy = -1;
    if (pressed.ArrowDown || pressed.KeyS || gamepad.pressed[13]) dy = 1;
    if (pressed.ArrowLeft || pressed.KeyA || gamepad.pressed[14]) dx = -1;
    if (pressed.ArrowRight || pressed.KeyD || gamepad.pressed[15]) dx = 1;
    const sx = gamepad.moveX, sy = gamepad.moveY;
    if (!dx && !dy && this.repeatT <= 0 && Math.max(Math.abs(sx), Math.abs(sy)) > 0.6) {
      if (Math.abs(sy) > Math.abs(sx)) dy = Math.sign(sy); else dx = Math.sign(sx);
      this.repeatT = 0.2;
    } else if (Math.max(Math.abs(sx), Math.abs(sy)) < 0.3) this.repeatT = 0;
    if (dx && it?.dataset.range) { setOption(it.dataset.range, (settings[it.dataset.range] / (SETTINGS_RANGES[it.dataset.range][1])) + dx * 0.1); }
    else if (dx && this.horizontal) this.focus(this.idx + dx, true);
    else if (dy) this.focus(this.idx + dy, true);
    let consumed = false;
    if (pressed.Enter || pressed.NumpadEnter || pressed.Space || pressed.KeyE || gamepad.pressed[0]) { this.activate(); consumed = true; }
    else if (pressed.Escape || pressed.Backspace || gamepad.pressed[1] || (gamepad.pressed[9] && this.onBack)) { this.back(); consumed = true; }
    for (let i = 1; i <= 9; i++) if (pressed['Digit' + i] || pressed['Numpad' + i]) {
      const target = this.items.findIndex((x) => x.dataset.hotkey === String(i));
      if (target >= 0) { this.focus(target); this.activate(); consumed = true; }
    }
    // Keys handled by the menu must not leak into gameplay on the same frame.
    if (consumed) { clearPressed(); gamepad.pressed = []; }
  },
};
const navHelp = (h = false, back = true) => `<div class="navhelp">${inputDevice === 'pad' ? `<span class="kb pad">L</span>/<span class="kb pad">✚</span> navegar · <span class="kb pad">A</span> confirmar${back ? ' · <span class="kb pad">B</span> voltar' : ''}` : `${h ? '<kbd>←</kbd><kbd>→</kbd>' : '<kbd>↑</kbd><kbd>↓</kbd>'} navegar · <kbd>Enter</kbd> confirmar${back ? ' · <kbd>Esc</kbd> voltar' : ''}`}</div>`;

// ---------- settings & controls screens ----------
const OPTION_LABELS = { master: '🔊 Volume geral', music: '🎵 Música', sfx: '💥 Efeitos', shake: '📳 Tremor de tela', damageNumbers: '🔢 Números de dano', aimAssist: '🎯 Mira assistida (controle)' };
function setOption(key, value) {
  if (typeof SETTINGS_DEFAULTS[key] === 'boolean') settings[key] = !settings[key];
  else settings[key] = clamp(value, 0, 1) * SETTINGS_RANGES[key][1];
  Object.assign(settings, sanitizeSettings(settings)); saveSettings();
  AudioSys.sfx(key === 'music' ? 'ui' : 'hit', null, { pitch: 1, gap: 0.06 });
  refreshOptionRows();
}
function optionRow(key) {
  if (typeof SETTINGS_DEFAULTS[key] === 'boolean') return `<div class="opt" data-nav="opt" data-toggle="${key}"><span>${OPTION_LABELS[key]}</span><div class="tg${settings[key] ? ' on' : ''}"></div></div>`;
  const k = settings[key] / SETTINGS_RANGES[key][1];
  return `<div class="opt" data-nav="opt" data-range="${key}"><span>${OPTION_LABELS[key]}</span><div class="bar"><i style="width:${Math.round(k * 100)}%"></i></div><b>${Math.round(k * 100)}%</b></div>`;
}
function refreshOptionRows() {
  for (const el of $('modal').querySelectorAll('.opt')) {
    const key = el.dataset.range || el.dataset.toggle;
    if (el.dataset.toggle) el.querySelector('.tg').classList.toggle('on', settings[key]);
    else { const k = settings[key] / SETTINGS_RANGES[key][1]; el.querySelector('i').style.width = Math.round(k * 100) + '%'; el.querySelector('b').textContent = Math.round(k * 100) + '%'; }
  }
}
function openSettings(back) {
  Menu.open(`<h1>⚙️ Configurações</h1><h3>Ajustes ficam salvos neste navegador</h3>
    <div class="opts">${['master', 'music', 'sfx', 'shake', 'damageNumbers', 'aimAssist'].map(optionRow).join('')}</div>
    <div class="btns"><button class="btn alt" data-nav="back">Voltar</button></div>${navHelp()}`,
  { actions: { back }, onBack: back });
}
function openControls(back) {
  Menu.open(`<h1>🎮 Controles</h1>
    <table class="ctable"><tr><th>Ação</th><th>Teclado e mouse</th><th>Controle</th></tr>
    <tr><td>Mover</td><td><kbd>WASD</kbd> / setas</td><td>Analógico esquerdo</td></tr>
    <tr><td>Mirar</td><td>Mouse</td><td>Analógico direito</td></tr>
    <tr><td>Ataque</td><td>Clique esquerdo / <kbd>J</kbd></td><td><span class="kb pad">X</span></td></tr>
    <tr><td>Especial da arma · Poder</td><td>Clique direito / <kbd>K</kbd></td><td><span class="kb pad">B</span></td></tr>
    <tr><td>Esquiva</td><td><kbd>Espaço</kbd> / <kbd>Shift</kbd></td><td><span class="kb pad">LB</span> <span class="kb pad">RB</span> <span class="kb pad">LT</span> <span class="kb pad">RT</span></td></tr>
    <tr><td>Trompo</td><td><kbd>Q</kbd> / <kbd>L</kbd></td><td><span class="kb pad">Y</span></td></tr>
    <tr><td>Interagir</td><td><kbd>E</kbd> / <kbd>Enter</kbd></td><td><span class="kb pad">A</span></td></tr>
    <tr><td>Pausa</td><td><kbd>Esc</kbd> / <kbd>P</kbd></td><td><span class="kb pad">Start</span></td></tr>
    <tr><td>Som</td><td><kbd>M</kbd></td><td>—</td></tr></table>
    <div class="ctrl">O <b>poder do personagem</b> carrega após <b>15 segundos sem sofrer dano</b>. Com ele pronto, o botão do especial ativa o poder.</div>
    <div class="btns"><button class="btn alt" data-nav="back">Voltar</button></div>${navHelp()}`,
  { actions: { back }, onBack: back });
}

// ---------- title screen ----------
function openTitle() {
  game.state = 'title';
  $('titleScreen').classList.remove('hidden'); $('hubHud').classList.add('hidden'); aimReticle.visible = false; $('labels').style.visibility = 'hidden';
  $('titlePress').textContent = 'PRESSIONE QUALQUER TECLA';
  AudioSys.setMood('title');
}
function leaveTitle() {
  AudioSys.init(); AudioSys.sfx('select', null, { pitch: 1 });
  $('titleScreen').classList.add('hidden'); $('hubHud').classList.remove('hidden'); $('labels').style.visibility = '';
  game.state = 'hub'; AudioSys.setMood('hub');
  showBanner('Pátio de Treino', 'Escolha personagem, arma e melhorias — depois siga o tapete até o portão', 3);
}
$('titleScreen').addEventListener('pointerdown', (e) => { e.preventDefault(); if (game.state === 'title') leaveTitle(); });

// ---------- boon modal ----------
let modalChoices = null, modalDone = null;
function openBoonModal(patron, onDone) {
  const ch = boonChoices(patron);
  if (!ch.length) { player.pesos += 80; toast('💰 Nada de novo... +80 pesos'); return; }
  modalChoices = ch; modalDone = onDone || null; game.state = 'modal';
  const pt = PATRONS[patron];
  const html = `<h1 style="color:${pt.color}">${pt.icon} ${pt.name}</h1><h3>${pt.line}</h3>
    <div class="cards">${ch.map((c, i) => {
      const lv = boonLvl(c.b.id); const shown = c.b.onTake ? c.value : P(c.b.id) + c.value;
      return `<div class="card r-${c.rar.name}" data-nav="pick" data-hotkey="${i + 1}" data-i="${i}" style="border-color:${c.rar.color}"><span class="k">${i + 1}</span>
        <div><span class="tag" style="background:${c.rar.color};color:#1b1b1b">${c.rar.name}</span> <span class="tag">${c.b.slot}</span>${lv ? ' <span class="tag" style="background:#ffd166;color:#3b2a1a">MELHORIA</span>' : ''}</div>
        <div class="big">${pt.icon}</div><div class="t">${c.b.name}${lv ? ` <small>(Nv ${lv + 1})</small>` : ''}</div><div class="d">${c.b.desc(shown)}</div></div>`;
    }).join('')}</div>
    <div class="ctrl">Escolha uma bênção · <kbd>1</kbd>–<kbd>${ch.length}</kbd> ou ${inputDevice === 'pad' ? '<span class="kb pad">L</span> + <span class="kb pad">A</span>' : '<kbd>←</kbd><kbd>→</kbd> + <kbd>Enter</kbd>'}</div>`;
  Menu.open(html, { actions: { pick: (el) => chooseBoon(+el.dataset.i) }, horizontal: true, lock: 0.35, focus: 0 });
  AudioSys.sfx('pickup');
}
function chooseBoon(i) {
  if (!modalChoices || !modalChoices[i]) return;
  takeBoon(modalChoices[i]);
  toast(`${PATRONS[modalChoices[i].b.p].icon} ${modalChoices[i].b.name}!`);
  modalChoices = null; Menu.close(); game.state = 'play';
  burst(player.pos.x, 1, player.pos.z, ['#ffd166', '#ffffff'], 24, 5, 0.2, 0.7); shockRing(player.pos.x, player.pos.z, 3, 0.35, '#ffd166');
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
  // Hurt heroes always find something to eat.
  if (player.hp / player.maxHp < 0.5 && !items.some((it) => it.id === 'arepa' || it.id === 'avena')) items[2] = SHOP_ITEMS[0];
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
    it2.render = (near) => { const poor = player.pesos < it.price; label.el.innerHTML = `<span class="ic">${it.icon}</span>${it.name}<br><small>${it.desc}</small><br><span class="price" style="${poor ? 'color:#ff8b8b' : ''}">$ ${it.price}</span>${near ? `<br>${glyph('use')} comprar` : ''}`; };
    it2.render(false);
    it2.action = () => {
      if (player.pesos < it.price) { AudioSys.sfx('deny'); toast(`😅 Faltam $ ${it.price - player.pesos}, mijo!`); return; }
      player.pesos -= it.price; it2.done = true; removeLabel(label); world.group.remove(g); AudioSys.sfx('coin'); hudPulse('pesos');
      burst(x, 1.2, z, [it.color, '#ffd166', '#ffffff'], 20, 4, 0.18, 0.6);
      toast(`${it.icon} ${it.name}!`); it.buy();
      for (const other of game.interact) if (!other.done) other.render(other.near);
    };
    game.interact.push(it2);
  });
}
function setupRest() {
  const label = makeLabel('', 0, 5, -1);
  const it = { x: 0, z: -1, r: 4.6, label, done: false };
  it.render = (near) => { label.el.innerHTML = `<span class="ic">⛲</span>Fonte dos Desejos<br><small>Cura 50% da vida</small>${near ? `<br>${glyph('use')} beber` : ''}`; };
  it.render(false);
  it.action = () => { it.done = true; removeLabel(label); healPlayer(player.maxHp * 0.5); AudioSys.sfx('heal'); burst(player.pos.x, 1, player.pos.z, ['#4cc9f0', '#ffffff'], 24, 4, 0.2, 0.8); toast('⛲ Água fresquinha! A Vó diria pra não beber da fonte...'); };
  game.interact.push(it);
}
function updateInteract() {
  let best = null, bd = 1e9;
  for (const it of game.interact) { if (it.done) continue; const d = Math.hypot(player.pos.x - it.x, player.pos.z - it.z); if (d < it.r && d < bd) { bd = d; best = it; } }
  for (const it of game.interact) { if (it.done) continue; const near = it === best; if (it.near !== near) { it.near = near; it.render(near); } }
  if (best && (pressed.KeyE || pressed.Enter || gamepad.pressed[0])) best.action();
}

// ---------- exits ----------
function checkExits() {
  if (!game.cleared || game.state !== 'play') return;
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
  player.alive = false; aimReticle.visible = false; game.state = 'dying'; AudioSys.sfx('lose'); AudioSys.setMood('calm'); AudioSys.setMuffle(true);
  burst(player.pos.x, 1, player.pos.z, ['#ffffff', '#ffd23f', '#1d3fbb'], 30, 4, 0.25, 0.8);
  zoomPunch(1); addShake(0.6); $('lowHp').classList.remove('on');
  setTimeout(() => endRun(false), 1900);
}
function onBossDefeated() {
  AudioSys.sfx('win');
  roomCleared();
  showBanner('El Reyna derrotado!', 'O caminho da escola está aberto — a Tia vem junto', 3.2);
}
function beginSchoolEnding() {
  cleanupJapaPower();
  if (player.pad) WEAPONS[player.weapon].reset();
  game.state = 'ending'; aimReticle.visible = false;
  game.endingT = 0;
  game.endingFrom = { x: player.pos.x, z: player.pos.z };
  $('bossBar').classList.add('hidden');
  AudioSys.setMood('calm'); AudioSys.sfx('win');
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
  animKid(player.rig, 0.8, game.endingT * 9);
  if (tia) {
    tia.root.position.x = player.pos.x + 1.15;
    tia.root.position.z = player.pos.z + 0.1;
    tia.root.rotation.y = Math.PI;
  }
  if (Math.random() < 0.3) particle(player.pos.x + rand(-3, 3), 4, player.pos.z + rand(-3, 3), 0, -1, 0, pick(['#ffd166', '#ff70a6', '#4cc9f0', '#ffffff']), 0.15, 1.5, -2);
  if (game.endingT > 5) endRun(true);
}
function endRun(won) {
  cleanupJapaPower();
  const earned = (game.room + 1) * 2 + (won ? 40 : 0);
  meta.canicas += earned; game.canicasRun += earned;
  const newBest = game.room + 1 > meta.best;
  meta.best = Math.max(meta.best, game.room + 1); if (won) meta.wins++;
  saveMeta();
  game.state = won ? 'win' : 'dead';
  $('lowHp').classList.remove('on');
  const heroName = heroDisplayName(player.hero);
  const mins = Math.floor(game.runTime / 60), secs = String(Math.floor(game.runTime % 60)).padStart(2, '0');
  const stats = [
    ['Trecho alcançado', `${game.room + 1}/${RUN_PLAN.length}${newBest ? ' ⭐' : ''}`],
    ['Inimigos derrotados', player.kills], ['Tempo', `${mins}:${secs}`],
    ['Bênçãos', Object.keys(player.boons).length], ['Pesos juntados', `$ ${game.pesosRun}`], ['Bolinhas de gude', `🔮 +${game.canicasRun}`],
  ];
  Menu.open(`<h1>${won ? '🏆 Rei da Praça!' : '🍽️ A mãe chamou pra jantar!'}</h1>
    <h3>${won ? `El Reyna ficou para trás, a Tia deu um beijo e ${heroName} entrou na escola de Montería!` : `${heroName} voltou pra casa... mas amanhã tem mais recreio. As bolinhas de gude ficam guardadas no cofrinho.`}</h3>
    <div class="stats">${stats.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('')}</div>
    <div class="btns h"><button class="btn" data-nav="again">Jogar de novo ▶</button><button class="btn alt" data-nav="hub">Voltar ao pátio</button></div>${navHelp(true, false)}`,
  { actions: { again: () => startRun(), hub: () => openHub(true) }, lock: 0.6, horizontal: true });
  AudioSys.setMuffle(false);
}
function openPause() {
  const fromHub = game.state === 'hub';
  game.pausedFrom = game.state; game.state = 'pause';
  const resume = () => closePause();
  const back = () => openPause2();
  const openPause2 = () => {
    let body = '';
    if (!fromHub) {
      const boons = Object.keys(player.boons).map((id) => { const b = BOON_BY_ID[id], pt = PATRONS[b.p]; const v = player.boons[id].power; return `<div class="mu" style="border-color:${pt.color}"><b>${pt.icon} ${b.name}</b> <span class="lv">Nv ${player.boons[id].lvl}</span><br>${b.desc(v)}</div>`; }).join('') || '<div class="mu">Nenhuma bênção ainda — pegue recompensas de patronos nas saídas.</div>';
      const affinity = weaponAffinity(player.hero, player.weapon);
      const comboLine = affinity ? `<div class="combo-affinity ${affinity.active ? 'active' : ''}">${affinity.active ? `Afinidade ativa: +${Math.round(affinity.bonus * 100)}% de dano nos ataques básicos` : `Afinidade: ${WEAPONS[affinity.weapon].name} (+${Math.round(affinity.bonus * 100)}% nos ataques básicos)`}</div>` : '';
      body = `<h3>${HERO_POWER_ICON[player.hero]} ${heroDisplayName(player.hero)} · ${WEAPONS[player.weapon].icon} ${WEAPONS[player.weapon].name}${player.weaponLvl ? ' — Fita Nv ' + player.weaponLvl : ''} · Trecho ${game.room + 1}/${RUN_PLAN.length}</h3>${comboLine}<div class="meta">${boons}</div>`;
    } else body = '<h3>Pátio de Treino</h3>';
    Menu.open(`<h1>⏸ Pausa</h1>${body}
      <div class="btns"><button class="btn" data-nav="resume">Continuar</button><button class="btn alt" data-nav="settings">Configurações</button><button class="btn alt" data-nav="controls">Controles</button>
      ${fromHub ? '<button class="btn alt" data-nav="title">Tela inicial</button>' : '<button class="btn danger" data-nav="quit">Desistir da partida</button>'}</div>${navHelp()}`,
    { actions: { resume, settings: () => openSettings(back), controls: () => openControls(back), quit: confirmQuit, title: () => { Menu.close(); game.state = 'hub'; openTitle(); } }, onBack: resume });
  };
  const confirmQuit = () => Menu.open(`<h1>Desistir?</h1><h3>A partida termina agora. As bolinhas de gude ganhas ficam guardadas.</h3>
    <div class="btns h"><button class="btn alt" data-nav="no">Não, continuar</button><button class="btn danger" data-nav="yes">Sim, desistir</button></div>${navHelp(true)}`,
  { actions: { no: back, yes: () => { Menu.close(); game.state = 'play'; player.hp = 0; player.revives = 0; playerDie(); } }, onBack: back, horizontal: true });
  openPause2();
}
function closePause() { Menu.close(); game.state = game.pausedFrom || 'play'; game.pausedFrom = null; }

// ---------- main loop ----------
function updateCamera(dt) {
  if (game.state === 'title') {
    const t = game.time * 0.12;
    camTarget.x = damp(camTarget.x, Math.sin(t) * 3, 2, dt); camTarget.z = damp(camTarget.z, -2 + Math.cos(t * 0.8) * 1.5, 2, dt);
    camera.position.copy(camTarget).add(HUB_CAM_OFF);
  } else if (game.state === 'hub' || (game.state === 'pause' && game.pausedFrom === 'hub')) {
    const tx = clamp(player.pos.x * 0.2, -2, 2), tz = clamp(player.pos.z * 0.3 - 2.2, -4.5, -0.6);
    camTarget.x = damp(camTarget.x, tx, 4, dt); camTarget.z = damp(camTarget.z, tz, 4, dt);
    camera.position.copy(camTarget).add(HUB_CAM_OFF);
  } else if (game.state === 'pause' || game.state === 'modal') {
    camera.position.copy(camTarget).add(CAM_OFF);
  } else {
    // Look a little ahead towards where the hero is aiming / moving.
    const live = game.state === 'play';
    const ax = live ? Math.sin(player.face) * 1.6 + player.vel.x * 0.12 : 0, az = live ? Math.cos(player.face) * 1.2 + player.vel.z * 0.1 : 0;
    const tx = clamp(player.pos.x * 0.85 + ax, -5.5, 5.5), tz = game.state === 'ending' ? player.pos.z * 0.9 - 1.2 : clamp(player.pos.z * 0.9 - 1.2 + az, -8.5, 6.5);
    camTarget.x = damp(camTarget.x, tx, 4.5, dt); camTarget.z = damp(camTarget.z, tz, 4.5, dt);
    camera.position.copy(camTarget).add(CAM_OFF);
  }
  applyCameraFeedback(dt, game.time);
  camera.lookAt(camTarget);
  sun.position.set(camTarget.x - 14, 28, camTarget.z + 12); sun.target.position.copy(camTarget);
}
function runTimers(dt) {
  for (let i = game.timers.length - 1; i >= 0; i--) { const t = game.timers[i]; t.t -= dt; if (t.t <= 0) { game.timers.splice(i, 1); t.fn(); } }
}
function updateGame(dt) {
  game.runTime += dt;
  runTimers(dt);
  updatePlayer(dt); updateEnemies(dt); updateProjs(dt); updateLobs(dt); updateTrompos(dt); updateCoins(dt);
  if (game.state !== 'play') return;
  updatePickups(dt); updateInteract();
  if (!game.begun) { game.startT -= dt; if (game.startT <= 0) beginRoom(); }
  else if (!game.cleared) {
    game.breather -= dt;
    const alive = enemies.filter((e) => !e.dead).length, pending = pendingSpawns.length;
    // The next wave waits until the VAR referee has left the field.
    const varReview = player.specialKind === 'var' && player.heroT > 0;
    const waveState = { alive, pending, wave: game.wave, waves: game.waves.length, breather: game.breather };
    if (!varReview && (game.type === 'combat' || game.type === 'army') && nextWaveReady(waveState)) startWave();
    else if (!varReview && game.type !== 'boss' && roomFinished({ ...waveState, waves: game.type === 'elite' ? 0 : waveState.waves })) roomCleared();
  }
  for (const ex of game.exits) if (ex.label) ex.label.el.classList.toggle('locked', !game.cleared);
  checkExits();
}
let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  pollGamepad();
  if (gamepad.pressed.some(Boolean) || Math.hypot(gamepad.moveX, gamepad.moveY) > 0.5) inputDevice = 'pad';
  game.time += dt;
  updateMouseWorld();
  if (pressed.KeyM) toast(AudioSys.toggleMute() ? '🔇 Som desligado' : '🔊 Som ligado', 1.2);
  // Time scale: hit-stop freezes for a few frames, slow-mo eases out after a room is cleared.
  let gdt = dt;
  if (hitstop > 0) { hitstop -= dt; gdt = dt * 0.08; }
  else if (game.slowmo > 0) { game.slowmo -= dt; gdt = dt * lerp(1, 0.25, Math.min(1, game.slowmo / 0.4)); }
  Menu.update(dt);
  const pausePressed = pressed.Escape || pressed.KeyP || gamepad.pressed[9];
  if (game.state === 'title') {
    if (Object.keys(pressed).length || gamepad.pressed.some(Boolean)) leaveTitle();
  } else if (game.state === 'play') {
    if (pausePressed || gamepad.pressed[8]) openPause();
    else updateGame(gdt);
  } else if (game.state === 'dying') {
    updateGame(dt * 0.35);
    player.rig.body.rotation.x = damp(player.rig.body.rotation.x, -1.45, 6, dt);
    player.root.position.y = 0;
  } else if (game.state === 'ending') {
    updateSchoolEnding(dt);
  } else if (game.state === 'hub') {
    if (pressed.Escape || pressed.KeyP || gamepad.pressed[8]) openPause();
    else updateHub(gdt);
  } else if (game.state === 'pause' && pressed.KeyP) closePause();
  for (const f of world.animated) f(game.time, dt);
  updateFadeables(dt, player.pos.x, player.pos.z);
  updateExits(dt, game.time, game.cleared);
  if (game.state !== 'pause' && game.state !== 'modal') { updateParticles(gdt); updateFx(gdt); }
  updateCamera(dt); updateFloaters(dt); updateLabels(); updateHUD(dt); updateHubHud(dt);
  renderer.render(scene, camera);
  clearPressed();
}
