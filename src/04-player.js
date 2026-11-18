// ================= meta progression =================
const META_KEY = 'pelaito_meta_v1';
const META_UPS = [
  { id: 'vida', icon: '🫘', name: 'Feijão da Vó', desc: '+10 de vida máxima', max: 5, cost: (l) => 10 + l * 10 },
  { id: 'forca', icon: '🍌', name: 'Vitamina de Banana', desc: '+6% de dano', max: 5, cost: (l) => 15 + l * 12 },
  { id: 'dash', icon: '👟', name: 'Tênis Novo', desc: '+1 carga de esquiva', max: 1, cost: () => 60 },
  { id: 'reza', icon: '📿', name: 'Terço da Vó', desc: '+1 chance de levantar ao cair', max: 2, cost: (l) => 40 + l * 40 },
  { id: 'sorte', icon: '🍀', name: 'Moedinha da Sorte', desc: '+20% de pesos', max: 3, cost: (l) => 12 + l * 12 },
  { id: 'trompo', icon: '🌀', name: 'Trompo Afinado', desc: '+25% de dano do trompo', max: 3, cost: (l) => 12 + l * 10 },
];
function loadMeta() {
  try { const m = JSON.parse(localStorage.getItem(META_KEY)); if (m && m.up) { for (const u of META_UPS) m.up[u.id] ??= 0; m.hero ??= 'jorgito'; if (m.weapon === 'galho') m.weapon = 'luvas'; m.unlockedSkins ??= {}; m.equippedSkins ??= {}; return m; } } catch (e) { /* ignore */ }
  const up = {}; for (const u of META_UPS) up[u.id] = 0;
  return { canicas: 0, up, runs: 0, wins: 0, best: 0, weapon: 'luvas', hero: 'jorgito', unlockedSkins: {}, equippedSkins: {} };
}
const meta = loadMeta();
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* ignore */ } }

// ================= boons =================
const PATRONS = {
  vo: { name: 'Vó Carmen', icon: '👵', color: '#c77dff', line: '"Come direitinho, mijo!"' },
  tio: { name: 'Tio do Tinto', icon: '☕', color: '#b07d48', line: '"Um tintico pra acordar!"' },
  aji: { name: 'Doña Ají', icon: '🌶️', color: '#e63946', line: '"Cuidado que arde!"' },
  profe: { name: 'Profe de Ed. Física', icon: '📣', color: '#2a9d8f', line: '"Mais garra, menino!"' },
  totes: { name: 'Don Pólvora', icon: '🧨', color: '#f4a261', line: '"Dezembro chegou mais cedo!"' },
  chicle: { name: 'Menina do Chiclete', icon: '🍬', color: '#ff8fab', line: '"Grudou, perdeu!"' },
};
const RARITY = [
  { name: 'Comum', mult: 1, color: '#adb5bd', w: 70 },
  { name: 'Raro', mult: 1.5, color: '#4cc9f0', w: 24 },
  { name: 'Épico', mult: 2.2, color: '#c77dff', w: 6 },
];
const pct = (v) => Math.round(v * 100) + '%';
const rn = (v) => Math.round(v);
const hasAny = (...ids) => () => ids.some((id) => P(id) > 0);
const BOONS = [
  { id: 'ruana', p: 'vo', name: 'Ruana da Vó', slot: 'Passivo', base: 0.08, max: 4, desc: (v) => `Recebe <b>-${pct(v)}</b> de dano.` },
  { id: 'sancocho', p: 'vo', name: 'Sancocho de Domingo', slot: 'Passivo', base: 8, desc: (v) => `Cura <b>${rn(v)}</b> de vida ao limpar cada sala.` },
  { id: 'reza', p: 'vo', name: 'Reza da Vó', slot: 'Passivo', base: 1, max: 1, flat: true, desc: () => `Ao cair, levanta <b>uma vez</b> com 50% da vida.`, onTake: () => { player.revives++; } },
  { id: 'bencao', p: 'vo', name: 'Bendição', slot: 'Passivo', base: 20, desc: (v) => `<b>+${rn(v)}</b> de vida máxima (e cura o mesmo).`, onTake: (v) => { player.maxHp += rn(v); player.hp += rn(v); } },
  { id: 'tinto', p: 'tio', name: 'Tinto Duplo', slot: 'Ataque', base: 0.15, max: 4, desc: (v) => `Ataque <b>+${pct(v)}</b> mais rápido.` },
  { id: 'pique', p: 'tio', name: 'Pique de Recreio', slot: 'Passivo', base: 0.1, max: 4, desc: (v) => `<b>+${pct(v)}</b> de velocidade de corrida.` },
  { id: 'dash_extra', p: 'tio', name: 'Pernas de Café', slot: 'Esquiva', base: 1, max: 2, flat: true, desc: () => `<b>+1</b> carga de esquiva.` },
  { id: 'dash_golpe', p: 'tio', name: 'Esbarrão', slot: 'Esquiva', base: 18, desc: (v) => `A esquiva causa <b>${rn(v)}</b> de dano em quem você atravessa.` },
  { id: 'aji_ataque', p: 'aji', name: 'Ataque Apimentado', slot: 'Ataque', base: 6, desc: (v) => `Ataque aplica <b>Ají</b>: <b>${rn(v)}</b> de dano/s por 3s.` },
  { id: 'aji_especial', p: 'aji', name: 'Especial Ardido', slot: 'Especial', base: 9, desc: (v) => `Especial aplica <b>Ají</b>: <b>${rn(v)}</b> de dano/s por 3s.` },
  { id: 'aji_trompo', p: 'aji', name: 'Trompo de Pimenta', slot: 'Trompo', base: 7, desc: (v) => `Trompo aplica <b>Ají</b>: <b>${rn(v)}</b> de dano/s por 3s.` },
  { id: 'aji_estouro', p: 'aji', name: 'Ají Explosivo', slot: 'Efeito', base: 22, req: hasAny('aji_ataque', 'aji_especial', 'aji_trompo'), desc: (v) => `Inimigos com Ají <b>explodem</b> ao cair, causando <b>${rn(v)}</b> de dano.` },
  { id: 'apito_dash', p: 'profe', name: 'Apito Final', slot: 'Esquiva', base: 0.9, desc: (v) => `Ao fim da esquiva, <b>atordoa</b> inimigos próximos por <b>${v.toFixed(1)}s</b>.` },
  { id: 'chute_forte', p: 'profe', name: 'Chute de Bico', slot: 'Ataque', base: 0.2, desc: (v) => `Ataque causa <b>+${pct(v)}</b> de dano e empurra mais.` },
  { id: 'critico', p: 'profe', name: 'Golaço', slot: 'Passivo', base: 0.08, max: 4, desc: (v) => `<b>${pct(v)}</b> de chance de acerto crítico (dano x2).` },
  { id: 'especial_forte', p: 'profe', name: 'Jogada Ensaiada', slot: 'Especial', base: 0.3, desc: (v) => `Especial causa <b>+${pct(v)}</b> de dano.` },
  { id: 'totes_ataque', p: 'totes', name: 'Estalinho', slot: 'Ataque', base: 12, desc: (v) => `Golpes do ataque têm 20% de chance de <b>explodir</b> (${rn(v)} de dano).` },
  { id: 'totes_especial', p: 'totes', name: 'Bombinha', slot: 'Especial', base: 20, desc: (v) => `Especial tem 35% de chance de <b>explodir</b> (${rn(v)} de dano).` },
  { id: 'totes_trompo', p: 'totes', name: 'Trompo-Rojão', slot: 'Trompo', base: 40, desc: (v) => `Trompo <b>explode</b> ao parar de girar (${rn(v)} de dano).` },
  { id: 'totes_dash', p: 'totes', name: 'Rastro de Traque', slot: 'Esquiva', base: 15, desc: (v) => `Esquiva deixa traques que explodem (${rn(v)} de dano).` },
  { id: 'chiclete_ataque', p: 'chicle', name: 'Ataque Grudento', slot: 'Ataque', base: 0.35, max: 3, desc: (v) => `Ataque aplica <b>Chiclete</b>: inimigos ficam <b>${pct(Math.min(0.7, v))}</b> mais lentos.` },
  { id: 'chiclete_especial', p: 'chicle', name: 'Bola de Chiclete', slot: 'Especial', base: 0.45, max: 3, desc: (v) => `Especial aplica <b>Chiclete</b>: inimigos ficam <b>${pct(Math.min(0.7, v))}</b> mais lentos.` },
  { id: 'chiclete_trompo', p: 'chicle', name: 'Trompo Chiclete', slot: 'Trompo', base: 0.4, max: 3, desc: (v) => `Trompo <b>puxa</b> inimigos e aplica Chiclete (${pct(Math.min(0.7, v))} lentidão).` },
  { id: 'grudento', p: 'chicle', name: 'Grudou, Perdeu', slot: 'Efeito', base: 0.2, req: hasAny('chiclete_ataque', 'chiclete_especial', 'chiclete_trompo'), desc: (v) => `Inimigos com Chiclete recebem <b>+${pct(v)}</b> de dano.` },
];
const BOON_BY_ID = Object.fromEntries(BOONS.map((b) => [b.id, b]));
function P(id) { const b = player.boons[id]; return b ? b.power : 0; }
function boonLvl(id) { const b = player.boons[id]; return b ? b.lvl : 0; }
function boonChoices(patron, n = 3) {
  const pool = BOONS.filter((b) => b.p === patron && (!b.max || boonLvl(b.id) < b.max) && (!b.req || b.req()));
  shuffle(pool);
  return pool.slice(0, n).map((b) => {
    const rar = b.flat ? RARITY[0] : weighted(RARITY.map((r) => ({ w: r.w, v: r })));
    const value = b.base * rar.mult * (boonLvl(b.id) && !b.flat ? 0.7 : 1);
    return { b, rar, value };
  });
}
function takeBoon(ch) {
  const cur = player.boons[ch.b.id] || { power: 0, lvl: 0 };
  cur.power += ch.value; cur.lvl++; player.boons[ch.b.id] = cur;
  if (ch.b.onTake) ch.b.onTake(ch.value);
  AudioSys.sfx('boon');
  refreshBoonList();
}

// ================= player =================
const HERO_WEAPON_AFFINITY = { jorgito: 'bola', crazyleleo: 'pet', japa: 'controle', matheusinho: 'luvas', vitao: 'lata', bruno: 'raquete', thiagao: 'frango' };
const WEAPON_AFFINITY_BONUS = 0.25;
const HEROES = {
  jorgito: { name: 'Jorgito', weapon: 'bola', desc: 'Sem sofrer dano por 15s: transforma-se em El Tigre e ganha força e velocidade por 5s.' },
  crazyleleo: { name: 'CrazyLeleo', weapon: 'pet', desc: 'Sem sofrer dano por 15s: invoca cinco abelhas que atacam por 5s.' },
  japa: { name: 'Japa', weapon: 'controle', desc: 'Sem sofrer dano por 15s: cria uma piscina, vira tubarão e devora inimigos por 5s.' },
  matheusinho: { name: 'Matheusinho do Jetta', weapon: 'luvas', desc: 'Sem sofrer dano por 15s: entra no sedã, atrai os inimigos com ondas sonoras e os faz dançar.' },
  vitao: { name: 'Vitão', weapon: 'lata', desc: 'Sem sofrer dano por 15s: toca violão, afasta e atordoa os inimigos.' },
  bruno: { name: 'Bruno Marvelous Stone', weapon: 'raquete', desc: 'Sem sofrer dano por 15s: para o jogo, o juiz rubro-negro revisa o VAR e expulsa todos os inimigos da tela, inclusive chefes.' },
  thiagao: { name: 'Thiagão da massa', weapon: 'frango', desc: 'Sem sofrer dano por 15s: para e solta um "$&#*"; todos os inimigos, inclusive chefes, congelam de constrangimento com a mão na boca por 5s.' },
};
const HERO_SKINS = {
  jorgito: [{ id: 'idol', name: 'Idol K-pop', icon: '🎤', cost: 120, power: 'dança e elimina inimigos comuns após a música; chefes não são eliminados instantaneamente' }],
  crazyleleo: [{ id: 'abelha', name: 'Fantasia de abelha', icon: '🐝', cost: 100, power: 'mel prende os inimigos e causa dano por 5s' }],
  matheusinho: [{ id: 'skatista', name: 'Skatista', icon: '🛹', cost: 100, power: 'skate bumerangue atinge os inimigos visíveis' }],
  japa: [{ id: 'piscina', name: 'Roupa de piscina', icon: '🛟', cost: 100, power: 'boia puxa os inimigos e causa dano em área' }],
  vitao: [],
  bruno: [],
  thiagao: [],
};
const HERO_SKIN_BY_ID = Object.fromEntries(Object.entries(HERO_SKINS).flatMap(([hero, skins]) => skins.map((skin) => [skin.id, { ...skin, hero }])));
const HERO_POWER_ICON = { jorgito: '🐯', crazyleleo: '🐝', japa: '🦈', matheusinho: '🚘', vitao: '🎸', bruno: '📺', thiagao: '🤬' };
function weaponAffinity(hero, weapon) {
  const affinityWeapon = HERO_WEAPON_AFFINITY[hero];
  return affinityWeapon ? { weapon: affinityWeapon, active: affinityWeapon === weapon, bonus: WEAPON_AFFINITY_BONUS } : null;
}
const player = {
  rig: null, root: null, pos: new THREE.Vector3(), vel: new THREE.Vector3(), face: Math.PI, r: 0.5, yOff: 0,
  hp: 100, maxHp: 100, alive: true, invuln: 0, hurtBlink: 0, dashT: 0, dashDir: new THREE.Vector3(), dashCharges: 1, dashRegen: 0, dashHit: null,
  atkCd: 0, spCd: 0, spMax: 1, castCd: 0, castMax: 4.5, combo: 0, comboT: 0, aimLock: 0, swingT: 0, swingSide: 1, spinT: 0, jumpT: 0, jumpDur: 0.4, atkSlow: 0,
  walkPhase: 0, weapon: 'luvas', weaponLvl: 0, boons: {}, pesos: 0, revives: 0, kills: 0, ball: null, pad: null, wMesh: null,
  hero: 'jorgito', safeT: 0, heroT: 0, bees: [], japaPool: null, sharkRig: null, poolVictims: [], jerseyOverlay: null, originalTorsoMaterial: null, varScene: null, autoMove: null,
};
const stat = {
  speed: () => (player.hero === 'vitao' ? 5.2 : 7.2) * (1 + P('pique')) * (player.hero === 'jorgito' && player.heroT > 0 ? 1.35 : 1),
  atkRate: () => 1 + P('tinto'),
  dashMax: () => 1 + meta.up.dash + boonLvl('dash_extra'),
  dmgTaken: () => Math.max(0.35, 1 - P('ruana')),
  weaponMult: () => (1 + player.weaponLvl * 0.2) * (1 + meta.up.forca * 0.06),
  crit: () => P('critico'),
  castMult: () => 1 + meta.up.trompo * 0.25,
  pesosMult: () => 1 + meta.up.sorte * 0.2,
};

function heroLook(hero, skin = 'base') {
  if (hero === 'jorgito' && skin === 'idol') return { shirt: '#f8f9fa', shorts: '#1d3fbb', socks: '#d62828', shoes: '#f8f9fa', hair: '#682fc4', stripe: '#a855f7', jersey: true, number10: true, sweptHair: true, idol: true };
  if (hero === 'crazyleleo' && skin === 'abelha') return { skin: '#d9a06f', shirt: '#f7c948', shorts: '#252525', pants: '#252525', socks: '#252525', shoes: '#f8f9fa', hair: '#e6bf58', polo: true, beeCostume: true };
  if (hero === 'matheusinho' && skin === 'skatista') return { skin: '#d6a77a', shirt: '#e63946', shorts: '#252525', pants: '#252525', socks: '#f8f9fa', shoes: '#252525', hair: '#1e1b1b', beard: '#33261f', mustache: '#33261f', smallGoatee: true, shortWavy: true, glassesRect: true, slim: true, skateHelmet: true, headForward: 0.08 };
  if (hero === 'japa' && skin === 'piscina') return { skin: '#f2d5bf', shirt: '#34a0d4', shorts: '#f4a261', socks: '#ffffff', shoes: '#ffffff', hair: '#242126', polo: true, swimGoggles: true, sidePart: true, wide: 0.92 };
  if (hero === 'matheusinho') return { skin: '#d6a77a', shirt: '#17191d', shorts: '#3155a4', pants: '#3155a4', socks: '#222', shoes: '#151515', hair: '#1e1b1b', beard: '#33261f', mustache: '#33261f', smallGoatee: true, shortWavy: true, glassesRect: true, slim: true, polo: true, headForward: 0.08 };
  if (hero === 'vitao') return { skin: '#f2d5bf', shirt: '#17191d', shorts: '#3155a4', pants: '#3155a4', socks: '#282828', shoes: '#332b26', hair: '#211c1a', beard: '#33261f', mustache: '#33261f', smallGoatee: true, longMessyHair: true, verticalStripes: '#fff8e7', narrowEyes: true, scar: true };
  if (hero === 'bruno') return { skin: '#f2d5bf', shirt: '#d7efff', shorts: '#27507a', pants: '#315f91', socks: '#292b30', shoes: '#f8f9fa', hair: '#161719', beard: '#51443c', sparseChinBeard: true, checkeredShirt: true, longFace: true, roundEyes: true, shortHair: true, backpackIronBars: true, wide: 0.96 };
  if (hero === 'thiagao') return { skin: '#c68642', shirt: '#d9c39a', shorts: '#315f91', pants: '#315f91', socks: '#56483c', shoes: '#593e2c', hair: '#211c1a', beard: '#46352d', sparseChinBeard: true, roundEyes: true, sidePart: true, glasses: true, strawHat: true, country: true, wide: 1.05 };
  if (hero === 'crazyleleo') return { skin: '#d9a06f', shirt: '#b77945', shorts: '#3155a4', pants: '#3155a4', socks: '#202020', shoes: '#111111', sole: '#bd3341', hair: '#e6bf58', beard: '#e6bf58', polo: true };
  if (hero === 'japa') return { skin: '#f2d5bf', shirt: '#712f45', shorts: '#3155a4', pants: '#3155a4', socks: '#f8f9fa', shoes: '#ffffff', hair: '#242126', polo: true, glasses: true, sidePart: true, wide: 0.92 };
  return { shirt: '#fff8e7', shorts: '#1d3fbb', socks: '#d62828', shoes: '#f8f9fa', hair: '#2b1b10', stripe: '#d62828', jersey: true, number10: true };
}
function heroScale(hero) { return hero === 'japa' ? 0.78 : hero === 'matheusinho' ? 0.94 : 1; }
const heartEyesMaterial = (() => {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  for (const x of [40, 88]) {
    ctx.beginPath(); ctx.moveTo(x, 98); ctx.bezierCurveTo(x - 43, 69, x - 32, 34, x, 55); ctx.bezierCurveTo(x + 32, 34, x + 43, 69, x, 98); ctx.fillStyle = '#ff4f91'; ctx.fill();
    ctx.strokeStyle = '#8b214c'; ctx.lineWidth = 5; ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  material.userData.shared = true;
  return material;
})();
function cleanupJapaPower() {
  const p = player;
  if (p.japaPool) {
    scene.remove(p.japaPool);
    p.japaPool.traverse((o) => {
      if (!o.isMesh) return;
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      if (o.material && !o.material.userData.shared) o.material.dispose();
    });
    p.japaPool = null;
  }
  for (const victim of p.poolVictims) scene.remove(victim.heart);
  p.poolVictims = [];
  if (p.sharkRig) { scene.remove(p.sharkRig.root); disposeOwn(p.sharkRig.root); p.sharkRig = null; }
  if (p.rig) p.rig.root.visible = true;
}
function createJapaPool() {
  const pool = new THREE.Group();
  const water = new THREE.Mesh(new THREE.CircleGeometry(3.35, 48), new THREE.MeshStandardMaterial({ color: '#2699bd', emissive: '#086b91', emissiveIntensity: 0.34, transparent: true, opacity: 0.8, roughness: 0.22, side: THREE.DoubleSide }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.07; pool.add(water);
  for (const [radius, color] of [[3.5, '#a7f3ff'], [2.65, '#46c8e8']]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.09, 8, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; pool.add(ring);
  }
  scene.add(pool);
  return pool;
}
function createSoundWave(color = '#70d6ff', radius = 1) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.075, 8, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82 }));
  mesh.rotation.x = Math.PI / 2; scene.add(mesh); return mesh;
}
function cleanupHeroPower() {
  const p = player;
  cleanupJapaPower();
  for (const bee of p.bees) scene.remove(bee.mesh);
  p.bees = [];
  for (const victim of p.specialVictims || []) if (victim.mesh) {
    scene.remove(victim.mesh);
    if (!victim.mesh.geometry?.userData.shared) victim.mesh.geometry?.dispose();
    victim.mesh.material?.dispose();
  }
  if (p.specialRig) { scene.remove(p.specialRig); disposeOwn(p.specialRig); p.specialRig = null; }
  if (p.varScene) { scene.remove(p.varScene.referee.root); disposeOwn(p.varScene.referee.root); p.varScene = null; }
  if (p.specialRing) { scene.remove(p.specialRing); p.specialRing.geometry.dispose(); p.specialRing.material.dispose(); p.specialRing = null; }
  if (p.jerseyOverlay) { p.jerseyOverlay.parent?.remove(p.jerseyOverlay); disposeOwn(p.jerseyOverlay); p.jerseyOverlay = null; }
  if (p.originalTorsoMaterial && p.rig?.torso) {
    const current = p.rig.torso.material;
    p.rig.torso.material = p.originalTorsoMaterial;
    current.dispose();
    p.originalTorsoMaterial = null;
  }
  p.specialVictims = []; p.specialKind = ''; p.specialTick = 0;
  if (p.rig) { p.rig.root.visible = true; p.rig.arms[1].rotation.set(0, 0, 0); p.rig.head.rotation.x = 0; }
}

function setupPlayer(weapon) {
  cleanupHeroPower();
  if (player.root) { scene.remove(player.root); disposeOwn(player.root); }
  if (player.pad?.mesh) { player.pad.mesh.parent?.remove(player.pad.mesh); player.pad = null; }
  if (player.ball) { scene.remove(player.ball.mesh); player.ball = null; }
  for (const bee of player.bees) scene.remove(bee.mesh);
  player.bees = [];
  player.hero = HEROES[meta.hero] ? meta.hero : 'jorgito';
  player.skin = meta.equippedSkins?.[player.hero] || 'base';
  player.rig = buildKid(heroLook(player.hero, player.skin));
  player.root = player.rig.root; player.root.scale.setScalar(heroScale(player.hero)); scene.add(player.root);
  Object.assign(player, {
    alive: true, invuln: 0, hurtBlink: 0, dashT: 0, dashRegen: 0, atkCd: 0, spCd: 0, castCd: 0, combo: 0, comboT: 0, aimLock: 0, swingT: 0, spinT: 0, jumpT: 0, atkSlow: 0,
    safeT: 0, heroT: 0, bees: [], japaPool: null, sharkRig: null, poolVictims: [], specialRig: null, specialRing: null, specialVictims: [], specialKind: '', specialTick: 0, jerseyOverlay: null, originalTorsoMaterial: null, varScene: null, autoMove: null,
    weapon, weaponLvl: 0, boons: {}, pesos: 0, kills: 0, yOff: 0,
  });
  player.maxHp = 100 + meta.up.vida * 10; player.hp = player.maxHp;
  player.revives = meta.up.reza;
  player.dashCharges = stat.dashMax();
  player.wMesh = weaponMesh(weapon); player.rig.hand.add(player.wMesh);
  if (WEAPONS[weapon].init) WEAPONS[weapon].init();
}
// Gamepad aim gets a gentle magnet towards the closest enemy inside a narrow cone.
function assistAim(a) {
  if (!settings.aimAssist) return a;
  let best = null, bestScore = Infinity;
  for (const e of enemies) {
    if (e.dead || e.spawning) continue;
    const dx = e.pos.x - player.pos.x, dz = e.pos.z - player.pos.z, d = Math.hypot(dx, dz);
    if (d > 13) continue;
    const off = Math.abs(angDiff(a, Math.atan2(dx, dz)));
    if (off > 0.38) continue;
    const score = off * 6 + d * 0.15;
    if (score < bestScore) { bestScore = score; best = Math.atan2(dx, dz); }
  }
  return best === null ? a : a + angDiff(a, best) * 0.75;
}
let lastAimSource = 'mouse';
addEventListener('mousemove', () => { lastAimSource = 'mouse'; });
function aimAngle() {
  if (Math.hypot(gamepad.aimX, gamepad.aimY) > 0.2) { lastAimSource = 'pad'; return assistAim(Math.atan2(gamepad.aimX, gamepad.aimY)); }
  if (gamepad.connected && Math.hypot(gamepad.moveX, gamepad.moveY) > 0.2) { lastAimSource = 'pad'; return assistAim(Math.atan2(gamepad.moveX, gamepad.moveY)); }
  if (lastAimSource === 'pad' && gamepad.connected) return assistAim(player.face);
  return Math.atan2(mouse.world.x - player.pos.x, mouse.world.z - player.pos.z);
}
// Short input buffer: a dash or trompo pressed a hair too early still comes out.
const inputBuffer = { dash: 0, cast: 0 };
function moveInput() {
  let x = gamepad.moveX, z = gamepad.moveY;
  if (keys.KeyW || keys.ArrowUp) z -= 1; if (keys.KeyS || keys.ArrowDown) z += 1;
  if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1;
  const l = Math.hypot(x, z);
  if (l) { player.autoMove = null; return { x: x / l, z: z / l }; }
  // Click/tap-to-walk target (used by the hub); manual input above always cancels it.
  const target = player.autoMove;
  if (target) {
    const dx = target.x - player.pos.x, dz = target.z - player.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.3) return { x: dx / d, z: dz / d };
    player.autoMove = null;
  }
  return { x: 0, z: 0 };
}
// Ground reticle showing where attacks will go.
const aimReticle = (() => {
  const g = new THREE.Group(), mat = basicMat('#fff8e7', 0.5);
  g.add(new THREE.Mesh(new THREE.RingGeometry(1.0, 1.16, 24, 1, -Math.PI / 2 - 0.42, 0.84).rotateX(-Math.PI / 2), mat));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.34, 3).rotateX(Math.PI / 2), mat); tip.scale.y = 0.2; tip.position.set(0, 0, 1.36); g.add(tip);
  g.renderOrder = 2; g.userData.mat = mat; g.visible = false; scene.add(g); return g;
})();
function updateAimReticle(dt) {
  const p = player, show = p.alive && (game.state === 'play' || game.state === 'hub') && p.dashT <= 0 && !specialLocksMovement(p.specialKind, p.heroT);
  aimReticle.visible = show; if (!show) return;
  const a = p.aimLock > 0 ? p.face : aimAngle();
  aimReticle.position.set(p.pos.x, 0.07, p.pos.z);
  aimReticle.rotation.y += angDiff(aimReticle.rotation.y, a) * Math.min(1, dt * 25);
  aimReticle.userData.mat.opacity = damp(aimReticle.userData.mat.opacity, p.aimLock > 0 ? 0.85 : 0.4, 12, dt);
}
function lunge(v) { player.vel.x += Math.sin(player.face) * v; player.vel.z += Math.cos(player.face) * v; }

function updatePlayer(dt) {
  const p = player; if (!p.alive) return;
  p.invuln -= dt; p.hurtBlink -= dt; p.atkCd -= dt; p.spCd -= dt; p.castCd -= dt; p.aimLock -= dt; p.comboT -= dt; p.swingT -= dt; p.spinT -= dt; p.atkSlow -= dt;
  const wasReady = p.safeT >= 15;
  p.safeT += dt;
  if (!wasReady && p.safeT >= 15 && p.heroT <= 0 && game.state === 'play') {
    AudioSys.sfx('ready'); floatText(p.pos.x, 2.6, p.pos.z, `${HERO_POWER_ICON[p.hero]} PODER PRONTO!`, 'info');
    shockRing(p.pos.x, p.pos.z, 2.2, 0.4, '#ffd166');
  }
  if (p.heroT > 0) { p.heroT = Math.max(0, p.heroT - dt); updateHeroPower(dt); }
  if (p.hero === 'jorgito') { p.root.scale.setScalar(p.heroT > 0 ? 1.16 : 1); p.rig.tigerMask.visible = p.heroT > 0; }
  if (p.comboT <= 0) p.combo = 0;
  if (p.dashCharges < stat.dashMax()) { p.dashRegen -= dt; if (p.dashRegen <= 0) { p.dashCharges++; p.dashRegen = 0.45; } }
  const locked = specialLocksMovement(p.specialKind, p.heroT);
  const inp = locked ? { x: 0, z: 0 } : moveInput();
  inputBuffer.dash -= dt; inputBuffer.cast -= dt;
  if (pressed.Space || pressed.ShiftLeft || pressed.ShiftRight || gamepad.pressed[4] || gamepad.pressed[5] || gamepad.pressed[6] || gamepad.pressed[7]) inputBuffer.dash = 0.16;
  if (pressed.KeyQ || pressed.KeyL || gamepad.pressed[3]) inputBuffer.cast = 0.2;
  if (!locked && inputBuffer.dash > 0 && p.dashCharges > 0 && p.dashT <= 0) { inputBuffer.dash = 0; startDash(inp); }
  if (p.dashT > 0) {
    p.dashT -= dt; p.vel.set(p.dashDir.x * 27, 0, p.dashDir.z * 27);
    p.ghostT = (p.ghostT || 0) - dt;
    if (p.ghostT <= 0 && p.root.visible) { p.ghostT = 0.045; ghostTrail(p.root); }
    if (Math.random() < 0.7) particle(p.pos.x + rand(-0.2, 0.2), 0.15, p.pos.z + rand(-0.2, 0.2), 0, rand(0.5, 1.5), 0, '#efe3c8', rand(0.15, 0.3), 0.35, -2);
    if (P('dash_golpe')) for (const e of enemies) {
      if (e.dead || e.spawning || p.dashHit.has(e)) continue;
      if (Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < e.r + p.r + 0.3) { p.dashHit.add(e); playerHit(e, P('dash_golpe'), 'dash', { knock: 4 }); }
    }
    if (p.dashT <= 0) onDashEnd();
  } else {
    const sp = stat.speed() * (p.atkSlow > 0 ? 0.45 : 1);
    p.vel.x = damp(p.vel.x, inp.x * sp, 16, dt); p.vel.z = damp(p.vel.z, inp.z * sp, 16, dt);
  }
  const Wp = WEAPONS[p.weapon];
  if ((mouse.left || keys.KeyJ || gamepad.buttons[2]) && p.atkCd <= 0 && p.dashT <= 0) {
    p.face = aimAngle(); p.aimLock = 0.3; p.atkCd = Wp.attack() / stat.atkRate();
  }
  if ((mouse.right || keys.KeyK || gamepad.buttons[1]) && p.dashT <= 0) {
    p.face = aimAngle(); p.aimLock = 0.4;
    if (p.safeT >= 15) activateHeroPower();
    else if (p.spCd <= 0) p.spCd = p.spMax = Wp.special();
  }
  if (inputBuffer.cast > 0 && p.castCd <= 0 && p.dashT <= 0) { inputBuffer.cast = 0; p.face = aimAngle(); p.aimLock = 0.25; castTrompo(); p.castCd = p.castMax; }

  // Standing specials pin the hero in place: knockback, lunges and dashes cannot move them either.
  if (specialLocksMovement(p.specialKind, p.heroT)) { p.vel.set(0, 0, 0); p.dashT = 0; p.autoMove = null; }
  p.pos.x += p.vel.x * dt; p.pos.z += p.vel.z * dt;
  resolveCollision(p.pos, p.r);
  if (p.aimLock <= 0 && Math.hypot(p.vel.x, p.vel.z) > 0.6) p.face = Math.atan2(p.vel.x, p.vel.z);
  const cur = p.root.rotation.y; p.root.rotation.y = cur + angDiff(cur, p.face) * Math.min(1, dt * 22);

  if (p.jumpT > 0) { p.jumpT -= dt; const k = 1 - Math.max(0, p.jumpT) / p.jumpDur; p.yOff = Math.sin(k * Math.PI) * 1.7; p.root.rotation.x = 0; p.rig.body.rotation.x = -k * TAU; } else { p.yOff = 0; p.rig.body.rotation.x = 0; }
  const floatOffset = p.hero === 'vitao' ? Math.sin(game.time * 2.2) * (Math.hypot(p.vel.x, p.vel.z) > 0.4 ? 0.12 : 0.045) : 0;
  p.root.position.set(p.pos.x, p.yOff + floatOffset, p.pos.z);

  const spd = Math.hypot(p.vel.x, p.vel.z);
  p.walkPhase += spd * dt * 1.7;
  if (p.hero === 'japa') animJapa(p.rig, Math.min(1, spd / 6), p.walkPhase);
  else if (p.hero === 'bruno') animSamba(p.rig, Math.min(1, spd / 6), p.walkPhase);
  else if (p.hero === 'thiagao') animThiagao(p.rig, Math.min(1, spd / 6), p.walkPhase);
  else animKid(p.rig, Math.min(1, spd / 6), p.walkPhase);
  const arm = p.rig.arms[0];
  if (p.swingT > 0) { const k = 1 - p.swingT / 0.16; arm.rotation.set(-1.4, p.swingSide * (1 - 2 * k) * 1.3, 0); p.rig.body.rotation.y = p.swingSide * (1 - 2 * k) * 0.5; }
  else if (p.spinT > 0) { p.rig.body.rotation.y = (1 - p.spinT / 0.3) * TAU; arm.rotation.set(-1.5, 0, 0); }
  else { p.rig.body.rotation.y = damp(p.rig.body.rotation.y, 0, 20, dt); arm.rotation.set(p.aimLock > 0 ? -1.3 : -Math.sin(p.walkPhase) * 0.7 * Math.min(1, spd / 6) - 0.2, 0, 0); }
  if (p.specialKind === 'embarrass' && p.heroT > 0) poseCurse(p, 5 - p.heroT);
  const guitarSeated = p.specialKind === 'guitar' && p.heroT > 0 && Math.hypot(p.vel.x, p.vel.z) < 0.4;
  p.root.visible = !(p.heroT > 0 && ['sedan', 'japa-base'].includes(p.specialKind)) && !(p.hero === 'japa' && p.heroT > 0 && !p.skin.startsWith('piscina')) && !guitarSeated && !(p.hurtBlink > 0 && Math.floor(p.hurtBlink * 18) % 2 === 0);
  if (Wp.update) Wp.update(dt);
  updateAimReticle(dt);
}

function activateHeroPower() {
  const p = player;
  p.safeT = 0;
  p.heroT = 5;
  p.spCd = 0;
  p.specialTick = 0;
  if (p.skin === 'idol') {
    p.specialKind = 'idol'; p.specialVictims = visibleEnemies().map((enemy) => ({ enemy, elapsed: 0 }));
    showBanner('Estreia K-pop!', 'A coreografia contagia a praça — chefe não cai com insta-kill.', 2.4);
    AudioSys.sfx('kpop');
  } else if (p.skin === 'abelha') {
    p.specialKind = 'honey'; p.specialRing = createSoundWave('#ffbe0b', 1);
    p.specialVictims = enemies.filter((e) => !e.dead && !e.spawning && Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < 9).map((enemy) => {
      const mesh = new THREE.Mesh(circGeo, new THREE.MeshBasicMaterial({ color: '#ffbe0b', transparent: true, opacity: 0.68, depthWrite: false }));
      mesh.scale.setScalar(enemy.r * 2.4); mesh.position.set(enemy.pos.x, 0.045, enemy.pos.z); scene.add(mesh);
      return { enemy, mesh };
    });
    showBanner('Mel pegajoso!', 'Os inimigos ficam presos e levam dano por 5 segundos.', 2.2); AudioSys.sfx('honey');
  } else if (p.skin === 'skatista') {
    p.specialKind = 'skate'; p.specialRig = buildSkateboard(); ownMaterials(p.specialRig); scene.add(p.specialRig);
    p.specialVictims = visibleEnemies().map((enemy) => ({ enemy, hitCd: 0 }));
    for (const { enemy } of p.specialVictims) shockRing(enemy.pos.x, enemy.pos.z, 1.4, 0.3, '#ffbe0b');
    showBanner('Skate voador!', 'O skate marca e atinge todos os inimigos na tela.', 2.2); AudioSys.sfx('skate');
  } else if (p.skin === 'piscina') {
    p.specialKind = 'buoy'; p.specialRig = buildLifebuoy(); ownMaterials(p.specialRig); scene.add(p.specialRig);
    p.japaPool = createJapaPool();
    p.specialVictims = visibleEnemies().map((enemy) => ({ enemy, originalScaleY: enemy.root.scale.y }));
    showBanner('Boia de resgate!', 'A boia puxa a turma para uma onda que atinge a área.', 2.2); AudioSys.sfx('splash');
  } else if (p.hero === 'japa') {
    p.specialKind = 'japa-base';
    p.japaPool = createJapaPool();
    p.sharkRig = buildShark(); ownMaterials(p.sharkRig.root); scene.add(p.sharkRig.root);
    p.rig.root.visible = false;
    showBanner('PISCINA DO JAPA!', 'Vire um tubarão e devore os inimigos por 5 segundos', 2.4);
  } else if (p.hero === 'crazyleleo') {
    p.specialKind = 'bees';
    p.bees = Array.from({ length: 5 }, (_, i) => {
      const mesh = buildBee(); scene.add(mesh);
      return { mesh, angle: i * TAU / 5, hitCd: 0 };
    });
    showBanner('Enxame do CrazyLeleo!', 'Cinco abelhas: ataque por 5 segundos', 2);
  } else if (p.hero === 'matheusinho') {
    p.specialKind = 'sedan'; p.specialRig = buildSedan(); ownMaterials(p.specialRig); scene.add(p.specialRig);
    p.specialRing = createSoundWave('#70d6ff', 1);
    p.rig.root.visible = false;
    showBanner('Som no talo!', 'Ondas sonoras puxam e fazem a turma dançar.', 2.2); AudioSys.sfx('engine');
  } else if (p.hero === 'vitao') {
    p.specialKind = 'guitar';
    const chair = buildChairGuitar(), sitter = buildKid(heroLook('vitao'));
    sitter.root.scale.setScalar(0.82); sitter.root.position.set(0, 0.43, 0.08);
    sitter.legs[0].rotation.x = -1.15; sitter.legs[1].rotation.x = -1.15;
    sitter.arms[0].rotation.x = -1.1; sitter.arms[1].rotation.x = -1.1;
    chair.root.add(sitter.root); chair.root.userData.guitarRig = sitter;
    p.specialRig = chair.root; ownMaterials(p.specialRig); scene.add(p.specialRig);
    p.specialRing = createSoundWave('#ffd166', 1);
    showBanner('Roda de violão!', 'Sentado, afasta e atordoa a praça; andando, golpeia de perto.', 2.4); AudioSys.sfx('guitar');
  } else if (p.hero === 'bruno') {
    p.specialKind = 'var';
    p.originalTorsoMaterial = p.rig.torso.material;
    p.rig.torso.material = p.rig.torso.material.clone();
    p.rig.torso.material.userData.ownMat = true;
    p.rig.torso.material.map = null;
    p.rig.torso.material.color.set('#d62828');
    const overlay = new THREE.Group();
    for (const y of [0.72, 0.84, 0.96]) part('cyl', '#151719', 0.308, 0.045, 0.26, 0, y, 0, overlay);
    ownMaterials(overlay); p.rig.body.add(overlay); p.jerseyOverlay = overlay;
    startVarReview();
  } else if (p.hero === 'thiagao') {
    p.specialKind = 'embarrass';
    const balloon = new THREE.Sprite(new THREE.SpriteMaterial({ map: curseBalloonTexture, transparent: true, depthTest: false }));
    balloon.userData.ownMat = true; balloon.scale.set(0.01, 0.01, 1); scene.add(balloon);
    p.specialRig = balloon;
    for (const pr of projs) if (pr.owner === 'e') pr.dead = true;
    for (const e of enemies) if (!e.dead && !e.spawning) e.st.embarrass = Math.max(e.st.embarrass, 5);
    showBanner('$&#*!', 'Constrangimento geral: todos congelam com a mão na boca por 5s, inclusive chefes.', 2.6);
    AudioSys.sfx('bleep');
    later(0.4, () => AudioSys.sfx('gasp'));
  } else {
    p.specialKind = 'tiger';
    showBanner('EL TIGRE!', 'Jorgito transformado — mais força e velocidade por 5 segundos', 2);
  }
  AudioSys.sfx('power'); AudioSys.duck(0.35, 0.8); zoomPunch(0.7); addShake(0.35);
  shockRing(p.pos.x, p.pos.z, 5, 0.45, '#ffd166');
  burst(p.pos.x, 0.8, p.pos.z, ['#ffd166', '#fff8e7', '#70d6ff'], 32, 6, 0.2, 0.8);
}
function visibleEnemies() {
  return enemies.filter((e) => {
    if (e.dead || e.spawning) return false;
    const point = toScreen(e.pos.x, 1, e.pos.z);
    return point.vis && point.x >= 0 && point.x <= innerWidth && point.y >= 0 && point.y <= innerHeight;
  });
}
function updateHeroPower(dt) {
  const p = player;
  if (p.specialKind === 'japa-base') { updateJapaPower(dt); return; }
  if (p.specialKind === 'var') { updateVarPower(dt); return; }
  if (p.specialKind === 'embarrass') { updateEmbarrassPower(dt); return; }
  if (p.skin !== 'base') { updateSkinPower(dt); return; }
  if (p.specialKind === 'sedan') { updateSedanPower(dt); return; }
  if (p.specialKind === 'guitar') { updateGuitarPower(dt); return; }
  if (p.specialKind !== 'bees') return;
  const targets = enemies.filter((e) => !e.dead && !e.spawning).sort((a, b) => Math.hypot(a.pos.x - p.pos.x, a.pos.z - p.pos.z) - Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z));
  for (const [i, bee] of p.bees.entries()) {
    bee.angle += dt * (3 + i * 0.12); bee.hitCd -= dt;
    const target = targets[i % Math.max(1, targets.length)];
    const bx = target ? target.pos.x : p.pos.x, bz = target ? target.pos.z : p.pos.z;
    const radius = target ? target.r + 0.65 : 0.9;
    const tx = bx + Math.cos(bee.angle) * radius, tz = bz + Math.sin(bee.angle) * radius;
    bee.mesh.position.x += (tx - bee.mesh.position.x) * Math.min(1, dt * 8);
    bee.mesh.position.z += (tz - bee.mesh.position.z) * Math.min(1, dt * 8);
    bee.mesh.position.y = 1.15 + Math.sin(game.time * 12 + i) * 0.15;
    bee.mesh.rotation.y = bee.angle;
    if (target && bee.hitCd <= 0 && Math.hypot(target.pos.x - bee.mesh.position.x, target.pos.z - bee.mesh.position.z) < target.r + 0.75) {
      playerHit(target, 3, 'special', { knock: 0.2 }); bee.hitCd = 0.55;
    }
  }
  if (p.heroT <= dt) { for (const bee of p.bees) scene.remove(bee.mesh); p.bees = []; }
}
// VAR timeline (seconds since activation): referee runs in, reviews the monitor, then sends everyone off.
const VAR_REVIEW = { arrive: 1.15, decide: 2.15, leave: 3.95 };
function startVarReview() {
  const p = player;
  const side = p.pos.x - 3.4 < -W + 0.8 ? 1 : -1;
  // Near the south edge the entrance arch would hide the scene, so it is staged a little further north.
  const baseZ = clamp(p.pos.z, -D + 2.2, D - 4.6);
  const monitor = buildVarTV(); ownMaterials(monitor); monitor.scale.setScalar(1.3);
  monitor.position.set(p.pos.x + side * 2.1, 0, baseZ - 0.35);
  monitor.rotation.y = -side * 0.32; scene.add(monitor);
  p.specialRig = monitor;
  const referee = buildReferee(); ownMaterials(referee.root); referee.root.scale.setScalar(1.18); scene.add(referee.root);
  const spot = { x: monitor.position.x + side * 0.6, z: monitor.position.z + 1.15 };
  const from = { x: camTarget.x + side * 19, z: spot.z + 1.2 }, to = { x: camTarget.x - side * 19, z: spot.z + 2.2 };
  referee.root.position.set(from.x, 0, from.z);
  p.varScene = { referee, monitor, side, spot, from, to, phase: 0, reviewed: false, decided: false };
  p.face = Math.atan2(monitor.position.x - p.pos.x, monitor.position.z - p.pos.z);
  p.vel.set(0, 0, 0);
  // Play stops for the review: nobody attacks while the referee checks the monitor.
  for (const e of enemies) if (!e.dead && !e.spawning) e.st.stun = Math.max(e.st.stun, VAR_REVIEW.decide + 0.1);
  for (const pr of projs) if (pr.owner === 'e') pr.dead = true;
  showBanner('VAR!', 'Jogo parado: o juiz rubro-negro vai revisar o lance.', 2);
  AudioSys.sfx('whistle');
}
function decideVar(s) {
  s.decided = true;
  const screen = s.monitor.userData.screen;
  screen.material.map = varDecisionTexture; screen.material.needsUpdate = true;
  s.referee.card.visible = true;
  AudioSys.sfx('redcard'); addShake(0.35);
  floatText(s.spot.x, 3.3, s.spot.z, 'PRIIIII! 🟥 FORA!', 'crit');
  showBanner('EXPULSÃO GERAL!', 'O juiz rubro-negro manda todos os inimigos para fora da tela.', 2.4);
  const heavy = (e) => (e.def.boss || e.def.elite ? 1 : 0);
  const distance = (e) => Math.hypot(e.pos.x - s.spot.x, e.pos.z - s.spot.z);
  enemies.filter((e) => !e.dead).sort((a, b) => heavy(a) - heavy(b) || distance(a) - distance(b))
    .forEach((e, i) => startExpel(e, Math.min(1, i * 0.045) + heavy(e) * 0.3));
}
function updateVarPower(dt) {
  const p = player, s = p.varScene; if (!s) return;
  const t = 5 - p.heroT, ref = s.referee;
  let x = s.spot.x, z = s.spot.z, face, moving = false;
  if (t < VAR_REVIEW.arrive) {
    const k = t / VAR_REVIEW.arrive, eased = k * k * (3 - 2 * k);
    x = lerp(s.from.x, s.spot.x, eased); z = lerp(s.from.z, s.spot.z, eased); moving = true;
    face = Math.atan2(s.spot.x - s.from.x, s.spot.z - s.from.z);
  } else if (t >= VAR_REVIEW.leave) {
    const k = Math.min(1, (t - VAR_REVIEW.leave) / (5 - VAR_REVIEW.leave));
    x = lerp(s.spot.x, s.to.x, k * k); z = lerp(s.spot.z, s.to.z, k); moving = true;
    face = Math.atan2(s.to.x - s.spot.x, s.to.z - s.spot.z);
  } else face = s.decided ? 0 : Math.atan2(s.monitor.position.x - x, s.monitor.position.z - z);
  ref.root.position.set(x, 0, z);
  ref.root.rotation.y += angDiff(ref.root.rotation.y, face) * Math.min(1, dt * 12);
  s.phase += dt * (moving ? 13 : 2);
  animKid(ref, moving ? 1 : 0, s.phase);
  const [cardArm, freeArm] = ref.arms;
  if (moving && !s.decided) { cardArm.rotation.set(-Math.sin(s.phase) * 0.8, 0, 0); freeArm.rotation.z = 0; }
  else if (!s.decided) {
    // VAR signal: both hands draw the screen rectangle in the air.
    const g = (t - VAR_REVIEW.arrive) * 5;
    cardArm.rotation.set(-1.75 + Math.sin(g) * 0.25, 0, -0.35 + Math.cos(g) * 0.3);
    freeArm.rotation.set(-1.75 + Math.sin(g) * 0.25, 0, 0.35 - Math.cos(g) * 0.3);
  } else {
    cardArm.rotation.set(-2.85 + Math.sin(t * 9) * 0.06, 0, -0.5);
    freeArm.rotation.set(0, 0, 1.45);
  }
  if (!s.reviewed && t >= VAR_REVIEW.arrive) { s.reviewed = true; AudioSys.sfx('whistle'); floatText(x, 3.1, z, 'REVISÃO NO VAR', 'info'); }
  if (!s.decided && t >= VAR_REVIEW.decide) decideVar(s);
  if (s.decided) for (const e of enemies) if (!e.dead && !e.data.expel) startExpel(e, 0);
  if (p.heroT <= dt) {
    for (const e of enemies) if (!e.dead && e.data.expel) killEnemy(e);
    cleanupHeroPower();
  }
}
function updateEmbarrassPower(dt) {
  const p = player, balloon = p.specialRig, t = 5 - p.heroT;
  if (balloon) {
    const pop = Math.min(1, t / 0.2) * (1 + Math.max(0, 0.25 - Math.abs(t - 0.2)) * 0.6);
    balloon.scale.set(2.7 * pop, 1.77 * pop, 1);
    balloon.position.set(p.pos.x + 1.2, 3.6 + Math.sin(game.time * 3) * 0.06, p.pos.z);
    balloon.material.opacity = Math.min(1, p.heroT / 0.35);
  }
  // Everyone in the room, including late arrivals and bosses, stays frozen until the 5s end.
  for (const e of enemies) if (!e.dead && !e.spawning) e.st.embarrass = Math.max(e.st.embarrass, p.heroT);
  if (p.heroT <= dt) cleanupHeroPower();
}
function poseCurse(p, t) {
  const shouting = t < 1.8, shake = shouting ? Math.sin(t * 34) * 0.16 : 0;
  p.rig.arms[1].rotation.set(shouting ? -2.8 + shake : -0.3, 0, shouting ? 0.3 : 0.75);
  p.rig.head.rotation.x = shouting ? -0.2 : 0;
}function updateSkinPower(dt) {
  const p = player; p.specialTick -= dt;
  if (p.specialKind === 'idol') {
    if (p.specialTick <= dt) { p.specialTick = 1.15; AudioSys.sfx('kpop'); }
    for (const victim of p.specialVictims) {
      const e = victim.enemy;
      if (e.dead) continue;
      victim.elapsed += dt; e.st.stun = Math.max(e.st.stun, 0.12); e.rig.body.rotation.y += dt * 13;
      if (victim.elapsed >= 3.8 && !victim.finished) {
        victim.finished = true;
        if (e.def.boss) damageEnemy(e, Math.min(Math.max(0, e.hp - 1), Math.round(e.maxHp * 0.1)), 'special');
        else damageEnemy(e, e.hp + 1, 'special');
      }
    }
    if (Math.random() < 0.5) particle(p.pos.x + rand(-3, 3), 1.5, p.pos.z + rand(-3, 3), 0, 1.3, 0, pick(['#a855f7', '#ff77c8', '#ffd166']), 0.12, 0.5, 1);
  } else if (p.specialKind === 'honey') {
    p.specialRing.position.set(p.pos.x, 0.1, p.pos.z); p.specialRing.scale.setScalar(1 + Math.sin(game.time * 7) * 0.15);
    const pulse = p.specialTick <= dt;
    if (pulse) p.specialTick = 0.75;
    for (const victim of p.specialVictims) {
      const e = victim.enemy;
      if (e.dead) { if (victim.mesh) { scene.remove(victim.mesh); if (!victim.mesh.geometry.userData.shared) victim.mesh.geometry.dispose(); victim.mesh.material.dispose(); victim.mesh = null; } continue; }
      if (victim.mesh) victim.mesh.position.set(e.pos.x, 0.045, e.pos.z);
      e.st.slow = 0.3; e.st.slowAmt = Math.max(e.st.slowAmt, 0.9); e.st.stun = Math.max(e.st.stun, 0.2);
      if (pulse) {
        const damage = e.def.boss ? Math.min(7, Math.max(0, e.hp - 1)) : 8;
        if (damage) playerHit(e, damage, 'special', { knock: 0.4 });
        particle(e.pos.x, 0.8, e.pos.z, 0, 0.8, 0, '#ffbe0b', 0.2, 0.5);
      }
    }
    if (pulse) AudioSys.sfx('honey');
  } else if (p.specialKind === 'skate') {
    const skate = p.specialRig; const t = game.time * 8, radius = 4.5;
    skate.position.set(p.pos.x + Math.cos(t) * radius, 0.8 + Math.sin(t * 2) * 0.25, p.pos.z + Math.sin(t) * radius);
    skate.rotation.set(Math.sin(t) * 0.4, -t, Math.cos(t) * 0.35);
    for (const victim of p.specialVictims) {
      const e = victim.enemy; if (e.dead) continue;
      victim.hitCd -= dt;
      if (victim.hitCd <= 0) {
        playerHit(e, 8, 'special', { knock: 1.5 }); victim.hitCd = 0.65; AudioSys.sfx('skate');
      }
    }
    if (p.specialTick <= 0) {
      p.specialTick = 0.55;
      for (const { enemy } of p.specialVictims) if (!enemy.dead) particle(enemy.pos.x, enemy.r + 0.5, enemy.pos.z, 0, 0.7, 0, '#ffbe0b', 0.13, 0.45);
    }
  } else if (p.specialKind === 'buoy') {
    const buoy = p.specialRig; const t = game.time;
    if (p.japaPool) { p.japaPool.position.set(p.pos.x, 0, p.pos.z); p.japaPool.rotation.y += dt * 0.12; }
    buoy.position.set(p.pos.x + Math.sin(t * 3) * 0.8, 0.35 + Math.sin(t * 7) * 0.12, p.pos.z - 1.5 + Math.cos(t * 3) * 0.8);
    buoy.rotation.x = Math.PI / 2; buoy.rotation.z += dt * 3;
    if (p.heroT < 3.8 && p.heroT > 3.65) { shockRing(p.pos.x, p.pos.z, 6, 0.35, '#4cc9f0'); AudioSys.sfx('splash'); }
    if (p.heroT <= 3.8) {
      for (const victim of p.specialVictims) {
        const e = victim.enemy; if (e.dead) continue;
        e.pos.x += (p.pos.x - e.pos.x) * Math.min(1, dt * 4); e.pos.z += (p.pos.z - e.pos.z) * Math.min(1, dt * 4);
      }
    }
    if (p.specialTick <= 0 && p.heroT < 3.5) {
      p.specialTick = Infinity;
      for (const victim of p.specialVictims) {
        const e = victim.enemy; if (e.dead || Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) > 7.5) continue;
        if (e.def.boss) damageEnemy(e, Math.min(Math.max(0, e.hp - 1), Math.round(e.maxHp * 0.1)), 'special');
        else playerHit(e, 28, 'special', { knock: 3 });
      }
    }
  }
  if (p.heroT <= dt) cleanupHeroPower();
}
function updateSedanPower(dt) {
  const p = player; p.specialTick -= dt;
  p.specialRig.position.set(p.pos.x, 0, p.pos.z); p.specialRig.rotation.y = p.face;
  const ring = p.specialRing; ring.position.set(p.pos.x, 0.13, p.pos.z); ring.scale.setScalar(1 + ((game.time * 1.5) % 1) * 4.5);
  const pulse = p.specialTick <= dt;
  if (pulse) { p.specialTick = 0.72; AudioSys.sfx('engine'); AudioSys.sfx('sonar'); }
  for (const e of enemies) {
    if (e.dead || e.spawning || Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) > 8) continue;
    e.pos.x += (p.pos.x - e.pos.x) * Math.min(1, dt * (e.def.boss ? 0.45 : 1.5));
    e.pos.z += (p.pos.z - e.pos.z) * Math.min(1, dt * (e.def.boss ? 0.45 : 1.5));
    e.root.rotation.y += dt * 11;
    if (pulse) {
      if (e.def.boss) damageEnemy(e, Math.min(Math.max(0, e.hp - 1), 8), 'special');
      else playerHit(e, 7, 'special', { knock: 0.2 });
    }
  }
  if (p.heroT <= dt) cleanupHeroPower();
}
function updateGuitarPower(dt) {
  const p = player; p.specialTick -= dt;
  p.specialRig.position.set(p.pos.x + 0.75, 0, p.pos.z + 0.5); p.specialRig.rotation.y = p.face;
  const seated = Math.hypot(p.vel.x, p.vel.z) < 0.4;
  p.specialRig.visible = seated;
  const guitarRig = p.specialRig.userData.guitarRig;
  if (guitarRig) { guitarRig.arms[0].rotation.x = -1.2 + Math.sin(game.time * 11) * 0.3; guitarRig.body.rotation.y = Math.sin(game.time * 3) * 0.08; }
  const ring = p.specialRing; ring.position.set(p.pos.x, 0.1, p.pos.z); ring.scale.setScalar(1 + Math.sin(game.time * 4) * 0.08);
  const pulse = p.specialTick <= dt;
  if (pulse) {
    p.specialTick = 0.85; AudioSys.sfx('guitar'); shockRing(p.pos.x, p.pos.z, 6, 0.2, '#ffd166');
    for (const e of enemies) {
      if (e.dead || e.spawning) continue;
      if (Math.hypot(p.vel.x, p.vel.z) > 1.5 && Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < e.r + 1.8) {
        if (e.def.boss) damageEnemy(e, Math.min(Math.max(0, e.hp - 1), Math.round(e.maxHp * 0.1)), 'special');
        else damageEnemy(e, e.hp + 1, 'special');
        burst(e.pos.x, 1, e.pos.z, ['#ffd166', '#bd7d3c'], 14, 4, 0.15, 0.5); continue;
      }
      if (e.def.boss) damageEnemy(e, Math.min(Math.max(0, e.hp - 1), 8), 'special');
      else playerHit(e, 10, 'special', { knock: 0.3 });
      e.st.stun = Math.max(e.st.stun, 0.18);
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, l = Math.hypot(dx, dz) || 1;
      e.kb.x += dx / l * 5; e.kb.z += dz / l * 5;
    }
  }
  if (p.heroT <= dt) cleanupHeroPower();
}
function updateJapaPower(dt) {
  const p = player;
  if (!p.japaPool || !p.sharkRig) return;
  p.japaPool.position.set(p.pos.x, 0, p.pos.z);
  p.japaPool.rotation.y += dt * 0.5;
  const shark = p.sharkRig.root;
  shark.position.set(p.pos.x, 0.15 + Math.sin(game.time * 6) * 0.12, p.pos.z);
  shark.rotation.y = p.face;
  animShark(p.sharkRig, game.time);
  for (const e of enemies) {
    if (p.poolVictims.length >= 24) break;
    if (!e.dead && !e.spawning && Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < 5.3 && !p.poolVictims.some((v) => v.enemy === e)) {
      const heart = new THREE.Sprite(heartEyesMaterial);
      heart.scale.set(0.82, 0.62, 1); scene.add(heart);
      p.poolVictims.push({ enemy: e, heart, x: e.pos.x, z: e.pos.z, elapsed: 0, originalScaleY: e.root.scale.y });
    }
  }
  let feeding = null;
  for (let i = p.poolVictims.length - 1; i >= 0; i--) {
    const victim = p.poolVictims[i], e = victim.enemy;
    if (e.dead) { scene.remove(victim.heart); p.poolVictims.splice(i, 1); continue; }
    victim.elapsed += dt;
    const progress = Math.min(1, victim.elapsed / 1.15);
    e.pos.x += (p.pos.x - e.pos.x) * Math.min(1, dt * 2.4);
    e.pos.z += (p.pos.z - e.pos.z) * Math.min(1, dt * 2.4);
    e.root.scale.y = victim.originalScaleY * (1 - progress * 0.82);
    victim.heart.position.set(e.pos.x, 1.8 + e.r, e.pos.z);
    if (!feeding || victim.elapsed > feeding.elapsed) feeding = victim;
    if (progress >= 1) {
      scene.remove(victim.heart);
      p.poolVictims.splice(i, 1);
      if (e.def.boss) {
        damageEnemy(e, Math.min(Math.max(0, e.hp - 1), Math.round(e.maxHp * 0.1)), 'special');
        e.root.scale.y = victim.originalScaleY;
        e.st.stun = Math.max(e.st.stun, 0.65);
      } else damageEnemy(e, e.hp + 1, 'special');
    }
  }
  if (feeding) {
    shark.rotation.y = Math.atan2(feeding.x - p.pos.x, feeding.z - p.pos.z);
    shark.position.x = lerp(p.pos.x, feeding.x, 0.38);
    shark.position.z = lerp(p.pos.z, feeding.z, 0.38);
  }
  if (p.heroT <= dt) cleanupJapaPower();
}

function startDash(inp) {
  const p = player; let dx = inp.x, dz = inp.z;
  if (!dx && !dz) { dx = Math.sin(p.face); dz = Math.cos(p.face); }
  p.dashDir.set(dx, 0, dz); p.dashT = 0.17; p.invuln = Math.max(p.invuln, 0.25);
  p.dashCharges--; p.dashRegen = 0.5; p.dashHit = new Set(); p.face = Math.atan2(dx, dz); p.aimLock = 0; p.ghostT = 0;
  AudioSys.sfx('dash', p.pos.x);
  burst(p.pos.x, 0.2, p.pos.z, '#efe3c8', 8, 3, 0.22, 0.4, -4, 1.5);
  if (P('totes_dash')) dropTote(p.pos.x, p.pos.z);
}
function onDashEnd() {
  const p = player;
  if (P('apito_dash')) {
    shockRing(p.pos.x, p.pos.z, 3, 0.3, '#ffd166'); AudioSys.sfx('stun');
    for (const e of enemies) if (!e.dead && !e.spawning && Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < 3 + e.r) stunEnemy(e, P('apito_dash'));
  }
  if (P('totes_dash')) dropTote(p.pos.x, p.pos.z);
}
function dropTote(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0.15, z);
  const m = new THREE.Mesh(SG.cyl, new THREE.MeshStandardMaterial({ color: '#d62828', flatShading: true })); m.scale.set(0.1, 0.3, 0.1); g.add(m);
  addFx(g, 0.6, (o) => { if (Math.random() < 0.5) particle(x, 0.4, z, rand(-1, 1), 2, rand(-1, 1), '#ffd166', 0.08, 0.2, -5); }, () => explode(x, z, 2, P('totes_dash'), 'totes', '#ffb703'));
}

// damage dealt by the player to an enemy
const SRC_KEY = { attack: 'ataque', special: 'especial', cast: 'trompo' };
function playerHit(e, base, source, o = {}) {
  if (e.dead || e.spawning) return 0;
  let dmg = base;
  if (source === 'attack' || source === 'special') dmg *= stat.weaponMult();
  if (source === 'attack' && HERO_WEAPON_AFFINITY[player.hero] === player.weapon) dmg *= 1 + WEAPON_AFFINITY_BONUS;
  if (source === 'attack') dmg *= 1 + P('chute_forte');
  if (source === 'special') dmg *= 1 + P('especial_forte');
  if (player.hero === 'jorgito' && player.heroT > 0) dmg *= 1.5;
  if (source === 'cast') dmg *= stat.castMult();
  if (e.st.slow > 0 && P('grudento')) dmg *= 1 + P('grudento');
  const crit = Math.random() < stat.crit();
  if (crit) dmg *= 2;
  dmg = Math.max(1, Math.round(dmg));
  damageEnemy(e, dmg, crit ? 'crit' : '');
  const kb = (o.knock ?? 3) * (source === 'attack' ? 1 + P('chute_forte') * 2 : 1);
  if (kb > 0 && !e.dead) {
    let dx = o.kx ?? (e.pos.x - player.pos.x), dz = o.kz ?? (e.pos.z - player.pos.z); const l = Math.hypot(dx, dz) || 1;
    const res = e.def.heavy ? 0.12 : 1; e.kb.x += dx / l * kb * res; e.kb.z += dz / l * kb * res;
  }
  const key = SRC_KEY[source];
  if (key) {
    const aj = P('aji_' + key); if (aj) applyBurn(e, aj);
    const ch = P('chiclete_' + key); if (ch) applySlow(e, ch);
    if (source === 'attack' && P('totes_ataque') && Math.random() < 0.2) { const x = e.pos.x, z = e.pos.z; later(0.1, () => explode(x, z, 1.8, P('totes_ataque'), 'totes', '#ffb703')); }
    if (source === 'special' && P('totes_especial') && Math.random() < 0.35) { const x = e.pos.x, z = e.pos.z; later(0.1, () => explode(x, z, 2.2, P('totes_especial'), 'totes', '#ffb703')); }
  }
  return dmg;
}
function applyBurn(e, dps) { e.st.burn = 3; e.st.burnDps = Math.max(e.st.burnDps || 0, dps); }
function applySlow(e, amt) { e.st.slow = 2.5; e.st.slowAmt = Math.max(e.st.slowAmt || 0, Math.min(0.7, amt)); }
function stunEnemy(e, t) { if (e.def.boss) t *= 0.35; e.st.stun = Math.max(e.st.stun, t); }

function meleeArc(range, arc, dmg, source, knock, anglePadding = 0.2) {
  const p = player; let hits = 0;
  for (const e of enemies) {
    if (e.dead || e.spawning) continue;
    const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, d = Math.hypot(dx, dz);
    if (d > range + e.r) continue;
    if (arc < TAU - 0.01 && d > e.r && Math.abs(angDiff(p.face, Math.atan2(dx, dz))) > arc / 2 + anglePadding) continue;
    playerHit(e, dmg, source, { knock }); hits++;
  }
  for (const pr of projs) {
    if (pr.owner !== 'e' || pr.dead || pr.kind === 'bigball') continue;
    const dx = pr.x - p.pos.x, dz = pr.z - p.pos.z, d = Math.hypot(dx, dz);
    if (d < range && (arc >= TAU - 0.01 || Math.abs(angDiff(p.face, Math.atan2(dx, dz))) < arc / 2)) { pr.dead = true; burst(pr.x, pr.y, pr.z, '#ffffff', 5, 3, 0.12, 0.3); }
  }
  if (hits) { hitstop = Math.max(hitstop, 0.045); addShake(0.14); camKick(Math.sin(p.face), Math.cos(p.face), 0.18); }
  return hits;
}

function explode(x, z, r, dmg, source, color = '#ff9f1c', owner = 'p') {
  burst(x, 0.4, z, [color, '#ffd166', '#ffffff', '#6c757d'], 16 + r * 4, r * 3, 0.3, 0.55, -10, 5);
  shockRing(x, z, r, 0.25, color); addShake(0.2 + r * 0.05); AudioSys.sfx('boom');
  if (owner === 'p') { for (const e of enemies) if (!e.dead && !e.spawning && Math.hypot(e.pos.x - x, e.pos.z - z) < r + e.r) playerHit(e, dmg, source, { knock: 5, kx: e.pos.x - x, kz: e.pos.z - z }); }
  else if (Math.hypot(player.pos.x - x, player.pos.z - z) < r + player.r) hurtPlayer(dmg, x, z);
}

function hurtPlayer(dmg, sx, sz) {
  const p = player;
  if (!p.alive || p.invuln > 0 || p.jumpT > 0 || game.state !== 'play') return false;
  dmg = Math.max(1, Math.round(dmg * stat.dmgTaken() * incomingDamageScale(game.room)));
  const lostPower = p.safeT >= 15;
  p.hp -= dmg; p.safeT = 0; p.invuln = 0.85; p.hurtBlink = 0.85; addShake(0.55); hitstop = 0.08;
  if (sx !== undefined) { const dx = p.pos.x - sx, dz = p.pos.z - sz, l = Math.hypot(dx, dz) || 1; p.vel.x += dx / l * 9; p.vel.z += dz / l * 9; camKick(dx, dz, 0.35); }
  $('hurtFlash').style.opacity = 1; setTimeout(() => ($('hurtFlash').style.opacity = 0), 140);
  AudioSys.sfx('hurt', p.pos.x); AudioSys.duck(0.5, 0.25); floatText(p.pos.x, 2.2, p.pos.z, '-' + dmg, 'hurt');
  if (lostPower) floatText(p.pos.x, 3, p.pos.z, 'poder perdido…', 'burn');
  hudPulse('hp');
  burst(p.pos.x, 1, p.pos.z, ['#ff4d4d', '#ffffff'], 10, 4, 0.18, 0.4);
  if (p.hp <= 0) {
    if (p.revives > 0) {
      p.revives--; p.hp = Math.round(p.maxHp * 0.5); p.invuln = 2; p.hurtBlink = 2;
      toast('📿 A Vó rezou por você! Levanta, mijo!'); AudioSys.sfx('heal');
      burst(p.pos.x, 1, p.pos.z, ['#c77dff', '#ffffff', '#ffd166'], 30, 6, 0.25, 0.9);
      for (const e of enemies) if (!e.dead) { const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, l = Math.hypot(dx, dz) || 1; e.kb.x += dx / l * 14; e.kb.z += dz / l * 14; }
    } else { p.hp = 0; playerDie(); }
  }
  return true;
}
function healPlayer(v) {
  const p = player; const before = p.hp; p.hp = Math.min(p.maxHp, p.hp + Math.round(v));
  if (p.hp > before) floatText(p.pos.x, 2.2, p.pos.z, '+' + (p.hp - before), 'heal');
}

// ================= projectiles / lobs / trompos =================
const projs = [], lobs = [], trompos = [];
const projGeo = { fizz: SPH(1, 6, 5), pebble: ICO(1, 0), cap: CYL(1, 1, 0.4, 10), balloon: SPH(1, 10, 8), spit: ICO(1, 0), tennisball: tennisBallGeometry };
for (const k in projGeo) projGeo[k].userData.shared = true;
function projMesh(kind, r) {
  let m;
  switch (kind) {
    case 'fizz': m = new THREE.Mesh(projGeo.fizz, M(Math.random() < 0.55 ? '#7a4419' : '#f6ead2')); break;
    case 'pebble': m = new THREE.Mesh(projGeo.pebble, M('#9a8f84')); break;
    case 'cap': m = new THREE.Mesh(projGeo.cap, M(pick(['#d62828', '#f2c14e', '#1d3fbb', '#2a9d8f']), { metalness: 0.4, roughness: 0.4 })); break;
    case 'ecap': m = new THREE.Mesh(projGeo.cap, M('#ff3b30', { emissive: '#ff3b30', emissiveIntensity: 0.5 })); break;
    case 'spit': m = new THREE.Mesh(projGeo.spit, M('#9ef01a', { emissive: '#70e000', emissiveIntensity: 0.6 })); break;
    case 'cigarette': {
      m = new THREE.Group();
      const body = new THREE.Mesh(SG.cyl, M('#e7decf')); body.scale.set(0.035, 0.25, 0.035); body.rotation.x = Math.PI / 2; m.add(body);
      const ember = new THREE.Mesh(SG.sph, M('#ff5a36', { emissive: '#ff3b30', emissiveIntensity: 0.8 })); ember.scale.setScalar(0.045); ember.position.z = 0.13; m.add(ember);
      break;
    }
    case 'balloon': m = new THREE.Mesh(projGeo.balloon, M('#4cc9f0', { roughness: 0.2, emissive: '#0077b6', emissiveIntensity: 0.25 })); break;
    case 'tennisball': {
      m = new THREE.Group();
      const ball = new THREE.Mesh(projGeo.tennisball, M('#c8ed54', { roughness: 0.55 }));
      const seam = new THREE.Mesh(tennisSeamGeometry, M('#f4f6df'));
      seam.rotation.x = Math.PI / 2; m.add(ball, seam);
      break;
    }
    case 'chicken': m = weaponMesh('frango'); break;
    case 'bigball': m = new THREE.Mesh(ballGeo, ballMat); break;
    default: m = new THREE.Mesh(projGeo.pebble, M('#fff'));
  }
  if (kind !== 'cigarette') m.scale.setScalar(r * (kind === 'chicken' ? 1.28 : 1));
  m.castShadow = true; scene.add(m); return m;
}
function spawnProj(o) {
  const pr = Object.assign({ y: 0.8, life: 1, pierce: 0, bounce: 0, hit: new Set(), hitAt: new Map(), knock: 2, t: 0, dead: false }, o);
  pr.mesh = projMesh(pr.kind, pr.r); pr.mesh.position.set(pr.x, pr.y, pr.z); projs.push(pr); return pr;
}
function updateProjs(dt) {
  for (let i = projs.length - 1; i >= 0; i--) {
    const pr = projs[i];
    if (!pr.dead) {
      pr.t += dt; pr.life -= dt; pr.x += pr.vx * dt; pr.z += pr.vz * dt;
      if (pr.life <= 0) pr.dead = true;
      if (pr.kind === 'cigarette' && Math.random() < 0.75) particle(pr.x, pr.y + 0.08, pr.z, rand(-0.3, 0.3), 0.6, rand(-0.3, 0.3), '#b9b4ac', 0.07, 0.3, -0.5);
      const pp = { x: pr.x, z: pr.z }; const n = projectileCollide(pp, Math.min(pr.r, 0.4));
      if (n) {
        const ricochet = ricochetVelocity(pr.vx, pr.vz, n.x, n.z, pr.bounce);
        pr.x = pp.x; pr.z = pp.z;
        if (ricochet.type === 'bounce') { pr.vx = ricochet.vx; pr.vz = ricochet.vz; pr.bounce = ricochet.remaining; pr.hit.clear(); }
        else if (ricochet.type === 'exhausted') { pr.dead = true; burst(pr.x, pr.y, pr.z, pr.burning ? '#ff7b32' : '#e9dcc3', 6, 3, 0.14, 0.35); }
      }
      if (!pr.dead) {
        if (pr.owner === 'p') {
          for (const e of enemies) {
            if (e.dead || e.spawning || pr.hit.has(e) || pr.t - (pr.hitAt.get(e) ?? -Infinity) < 0.28) continue;
            const dx = e.pos.x - pr.x, dz = e.pos.z - pr.z, rr = e.r + pr.r;
            if (dx * dx + dz * dz < rr * rr) {
              pr.hit.add(e); pr.hitAt.set(e, pr.t);
              playerHit(e, pr.dmg * (pr.burning ? 1.75 : 1), pr.source, { knock: pr.knock, kx: pr.vx, kz: pr.vz });
              if (pr.kind === 'chicken') serveChicken(e);
              burst(pr.x, pr.y, pr.z, pr.kind === 'fizz' ? ['#7a4419', '#f6ead2'] : '#ffffff', 3, 2.5, 0.12, 0.25);
              if (pr.pierce-- <= 0 && pr.kind !== 'tennisball') { pr.dead = true; break; }
            }
          }
        } else if (player.alive) {
          const dx = player.pos.x - pr.x, dz = player.pos.z - pr.z, rr = player.r * 0.85 + pr.r;
          if (dx * dx + dz * dz < rr * rr && hurtPlayer(pr.dmg, pr.x, pr.z) && pr.kind !== 'bigball') pr.dead = true;
        }
      }
      if (pr.kind === 'bigball') { pr.y = pr.r + Math.abs(Math.sin(pr.t * 4)) * 1.2; pr.mesh.rotation.x += dt * 6; pr.mesh.rotation.z += dt * 3; }
      else pr.mesh.rotation.y += dt * 12;
      if (pr.kind === 'tennisball' && pr.burning && Math.random() < 0.85) particle(pr.x, pr.y, pr.z, rand(-0.5, 0.5), 1.2, rand(-0.5, 0.5), pick(['#ff7b32', '#ffd166', '#d62828']), 0.12, 0.35, -2);
      pr.mesh.position.set(pr.x, pr.y, pr.z);
    }
    function serveChicken(e) {
      if (e.dead) return;
      e.st.poison = Math.max(e.st.poison, 3);
      e.st.poisonDps = Math.max(e.st.poisonDps, 5);
      e.st.food = Math.max(e.st.food, 0.7);
      e.st.stun = Math.max(e.st.stun, 0.7);
      if (!e.data.mealMesh) {
        const meal = weaponMesh('frango'); meal.scale.setScalar(0.42); meal.position.set(0, 1.75, 0.18);
        e.root.add(meal); e.data.mealMesh = meal;
      }
    }
    if (pr.dead) { scene.remove(pr.mesh); projs.splice(i, 1); }
  }
}
function lob(o) {
  const l = Object.assign({ t: 0, h: 3, y0: 1 }, o); if (l.mesh && !l.mesh.parent) scene.add(l.mesh); lobs.push(l); return l;
}
function updateLobs(dt) {
  for (let i = lobs.length - 1; i >= 0; i--) {
    const l = lobs[i]; l.t += dt; const k = Math.min(1, l.t / l.dur);
    const x = lerp(l.fromX, l.toX, k), z = lerp(l.fromZ, l.toZ, k), y = lerp(l.y0, 0.3, k) + l.h * 4 * k * (1 - k);
    if (l.mesh) {
      l.mesh.position.set(x, y, z);
      if (l.mesh.userData.kaiserCan) l.mesh.rotation.y += dt * 1.5;
      else l.mesh.rotation.x += dt * 8;
    }
    if (l.trail && Math.random() < 0.6) particle(x, y, z, 0, 0.5, 0, l.trail, 0.15, 0.4, 0);
    if (k >= 1) {
      if (l.mesh && !l.keep) { scene.remove(l.mesh); disposeOwn(l.mesh); }
      lobs.splice(i, 1); l.onLand(l.toX, l.toZ);
    }
  }
}
function aimTarget(maxD) {
  const p = player; let tx = mouse.world.x, tz = mouse.world.z;
  const dx = tx - p.pos.x, dz = tz - p.pos.z, d = Math.hypot(dx, dz);
  if (d > maxD) { tx = p.pos.x + dx / d * maxD; tz = p.pos.z + dz / d * maxD; }
  return { x: clamp(tx, -W + 0.5, W - 0.5), z: clamp(tz, -D + 0.5, D - 0.5) };
}
function castTrompo() {
  const p = player; const t = aimTarget(9);
  const m = trompoMesh(); m.scale.setScalar(1.3); scene.add(m);
  AudioSys.sfx('swing');
  lob({ fromX: p.pos.x, fromZ: p.pos.z, toX: t.x, toZ: t.z, dur: 0.35, h: 2, mesh: m, keep: true, onLand: (x, z) => {
    trompos.push({ x, z, t: 0, dur: 3, tick: 0, mesh: m, r: 2.1 }); AudioSys.sfx('spin'); burst(x, 0.2, z, '#efe3c8', 8, 3, 0.2, 0.4);
  } });
}
function updateTrompos(dt) {
  for (let i = trompos.length - 1; i >= 0; i--) {
    const tr = trompos[i]; tr.t += dt; tr.tick -= dt;
    tr.mesh.position.set(tr.x + Math.sin(tr.t * 9) * 0.06, 0.48, tr.z + Math.cos(tr.t * 9) * 0.06);
    tr.mesh.rotation.set(Math.sin(tr.t * 5) * 0.12, tr.mesh.rotation.y + dt * 28, 0);
    if (Math.random() < 0.5) { const a = Math.random() * TAU; particle(tr.x + Math.sin(a) * tr.r * 0.8, 0.1, tr.z + Math.cos(a) * tr.r * 0.8, Math.cos(a) * 3, 0.6, -Math.sin(a) * 3, '#efe3c8', 0.14, 0.35, -2); }
    const pull = P('chiclete_trompo');
    for (const e of enemies) {
      if (e.dead || e.spawning) continue;
      const dx = tr.x - e.pos.x, dz = tr.z - e.pos.z, d = Math.hypot(dx, dz);
      if (pull && d < 5 && d > 0.6 && !e.def.heavy) { e.kb.x += dx / d * dt * 22; e.kb.z += dz / d * dt * 22; }
      if (tr.tick <= 0 && d < tr.r + e.r) playerHit(e, 6, 'cast', { knock: 0.4 });
    }
    if (tr.tick <= 0) tr.tick = 0.25;
    if (tr.t >= tr.dur) {
      if (P('totes_trompo')) explode(tr.x, tr.z, 3, P('totes_trompo'), 'totes', '#ffb703');
      burst(tr.x, 0.4, tr.z, ['#e9c46a', '#d62828'], 8, 3, 0.2, 0.5);
      scene.remove(tr.mesh); trompos.splice(i, 1);
    }
  }
}

// ================= weapons =================
function tennisRacketAttack(special = false) {
  const p = player;
  let nearby = null, nearest = 1.9;
  for (const pr of projs) {
    if (pr.dead || pr.kind !== 'tennisball' || pr.owner !== 'p') continue;
    const distance = Math.hypot(pr.x - p.pos.x, pr.z - p.pos.z);
    if (distance < nearest) { nearby = pr; nearest = distance; }
  }
  if (nearby) {
    nearby.vx = Math.sin(p.face) * 25; nearby.vz = Math.cos(p.face) * 25;
    nearby.burning = true;
    nearby.life = Math.max(nearby.life, 2.4); nearby.hit.clear();
    AudioSys.sfx('swing'); burst(nearby.x, nearby.y, nearby.z, ['#ff7b32', '#ffd166'], 12, 4, 0.17, 0.45);
    return special ? 1.0 : 0.24;
  }
  spawnProj({
    owner: 'p', kind: 'tennisball', x: p.pos.x + Math.sin(p.face) * 0.65, z: p.pos.z + Math.cos(p.face) * 0.65,
    y: 0.9, vx: Math.sin(p.face) * 25, vz: Math.cos(p.face) * 25, r: 0.24,
    dmg: special ? 20 : 15, source: special ? 'special' : 'attack', life: 2.4, bounce: 3, pierce: 99, knock: 2.2,
  });
  AudioSys.sfx('shoot');
  p.swingT = 0.14; p.swingSide = 1;
  return special ? 1.0 : 0.24;
}
const WEAPONS = {
  bola: {
    name: 'Bola de Futebol', icon: '⚽',
    desc: 'Chute que quica nas paredes e volta pro pé. Clique de novo para chamar a bola. <b>Especial:</b> Bicicleta — salto com impacto em área.',
    init() {
      const m = new THREE.Mesh(ballGeo, ballMat); m.scale.setScalar(0.28); m.castShadow = true; scene.add(m);
      player.ball = { mesh: m, state: 'held', vx: 0, vz: 0, x: player.pos.x, z: player.pos.z, y: 0.28, t: 0, bounces: 0, hit: new Set() };
    },
    attack() {
      const b = player.ball, p = player;
      if (b.state === 'held') {
        const a = p.face; b.state = 'fly'; b.x = p.pos.x + Math.sin(a) * 0.6; b.z = p.pos.z + Math.cos(a) * 0.6;
        b.vx = Math.sin(a) * 25; b.vz = Math.cos(a) * 25; b.t = 0; b.bounces = 3; b.hit.clear();
        AudioSys.sfx('kick'); p.legKick = 0.15; return 0.22;
      }
      if (b.state === 'fly' && b.t > 0.12) { b.state = 'ret'; b.hit.clear(); }
      return 0.1;
    },
    special() {
      const p = player; p.jumpT = p.jumpDur = 0.42; p.aimLock = 0.5; AudioSys.sfx('dash');
      later(0.42, () => {
        if (!p.alive) return;
        meleeArc(3.5, TAU, 34, 'special', 10); shockRing(p.pos.x, p.pos.z, 3.8, 0.3, '#ffffff');
        burst(p.pos.x, 0.2, p.pos.z, '#efe3c8', 20, 7, 0.3, 0.5, -6, 3); addShake(0.45); AudioSys.sfx('boom');
      });
      return 1.5;
    },
    update(dt) {
      const b = player.ball, p = player; if (!b) return;
      if (b.state === 'held') {
        const a = p.root.rotation.y; b.x = p.pos.x + Math.sin(a) * 0.6; b.z = p.pos.z + Math.cos(a) * 0.6; b.y = 0.28 + p.yOff;
        b.mesh.rotation.x += Math.hypot(p.vel.x, p.vel.z) * dt * 3;
      } else {
        b.t += dt;
        if (b.state === 'fly') {
          b.x += b.vx * dt; b.z += b.vz * dt;
          const pp = { x: b.x, z: b.z }; const n = projectileCollide(pp, 0.3);
          if (n) {
            b.x = pp.x; b.z = pp.z; const dot = b.vx * n.x + b.vz * n.z; if (dot < 0) { b.vx -= 2 * dot * n.x; b.vz -= 2 * dot * n.z; }
            b.bounces--; b.hit.clear(); AudioSys.sfx('kick'); burst(b.x, 0.3, b.z, '#ffffff', 4, 2, 0.12, 0.3);
            if (b.bounces < 0) b.state = 'ret';
          }
          if (b.t > 1.3) b.state = 'ret';
        } else {
          const dx = p.pos.x - b.x, dz = p.pos.z - b.z, d = Math.hypot(dx, dz);
          if (d < 0.9) b.state = 'held';
          else { b.vx = dx / d * 28; b.vz = dz / d * 28; b.x += b.vx * dt; b.z += b.vz * dt; }
        }
        b.y = 0.35 + Math.abs(Math.sin(b.t * 9)) * 0.45; b.mesh.rotation.x += dt * 20; b.mesh.rotation.z += dt * 7;
        if (Math.random() < 0.4) particle(b.x, b.y, b.z, 0, 0.3, 0, '#ffffff', 0.1, 0.25, 0);
        for (const e of enemies) {
          if (e.dead || e.spawning || b.hit.has(e)) continue;
          if (Math.hypot(e.pos.x - b.x, e.pos.z - b.z) < e.r + 0.4) { b.hit.add(e); playerHit(e, b.state === 'ret' ? 10 : 17, 'attack', { knock: 4, kx: b.vx, kz: b.vz }); AudioSys.sfx('kick'); }
        }
      }
      b.mesh.position.set(b.x, b.y, b.z);
    },
  },
  pet: {
    name: 'Garrafa PET de Refri', icon: '🧃',
    desc: 'Segure para chacoalhar e borrifar refri borbulhante em curto alcance. <b>Especial:</b> Foguete de Garrafa PET que explode onde você mirar.',
    attack() {
      const p = player;
      for (let i = 0; i < 3; i++) {
        const a = p.face + rand(-0.3, 0.3), s = rand(15, 19);
        spawnProj({ owner: 'p', x: p.pos.x + Math.sin(p.face) * 0.7, z: p.pos.z + Math.cos(p.face) * 0.7, y: 0.9, vx: Math.sin(a) * s, vz: Math.cos(a) * s, r: rand(0.14, 0.24), dmg: 4, source: 'attack', life: 0.34, pierce: 1, kind: 'fizz', knock: 0.8 });
      }
      AudioSys.sfx('spray'); p.atkSlow = 0.12; return 0.085;
    },
    special() {
      const p = player; const t = aimTarget(11);
      const m = weaponMesh('pet'); m.scale.setScalar(1.4);
      lob({ fromX: p.pos.x, fromZ: p.pos.z, toX: t.x, toZ: t.z, dur: 0.55, h: 4, mesh: m, trail: '#f6ead2', onLand: (x, z) => explode(x, z, 3.0, 40, 'special', '#ff9f1c') });
      teleCircle(t.x, t.z, 3.0, 0.55, '#ffd166'); AudioSys.sfx('shoot');
      return 1.4;
    },
  },
  controle: {
    name: 'Controle de PlayStation', icon: '🎮',
    desc: 'Arremesse o controle como um bumerangue: ele atinge inimigos na ida e na volta. <b>Especial:</b> lançamento reforçado com dano maior.',
    init() {
      player.pad = { mesh: player.wMesh, state: 'held', x: 0, y: 0, z: 0, vx: 0, vz: 0, distance: 0, elapsed: 0, hit: new Set(), special: false };
    },
    launch(special) {
      const p = player, pad = p.pad;
      if (!pad || pad.state !== 'held') {
        if (special && pad?.state === 'out') { pad.state = 'return'; pad.hit.clear(); }
        return special ? 1.1 : 0.14;
      }
      const origin = new THREE.Vector3(); pad.mesh.getWorldPosition(origin);
      pad.mesh.parent.remove(pad.mesh); scene.add(pad.mesh);
      pad.x = origin.x; pad.y = origin.y; pad.z = origin.z;
      pad.vx = Math.sin(p.face) * (special ? 24 : 21);
      pad.vz = Math.cos(p.face) * (special ? 24 : 21);
      pad.distance = 0; pad.elapsed = 0; pad.hit.clear(); pad.special = special; pad.state = 'out';
      pad.mesh.position.set(pad.x, pad.y, pad.z); pad.mesh.rotation.set(0, p.face, 0);
      AudioSys.sfx('shoot');
      burst(pad.x, 0.6, pad.z, ['#5b6575', '#55c1ff', '#ffffff'], 8, 2.5, 0.12, 0.3);
      return special ? 1.1 : 0.24;
    },
    attack() { return this.launch(false); },
    special() { return this.launch(true); },
    update(dt) {
      const p = player, pad = p.pad;
      if (!pad || pad.state === 'held') return;
      const outbound = pad.state === 'out';
      pad.elapsed += dt;
      const startX = pad.x, startZ = pad.z;
      let blocked = false;
      if (outbound) {
        const dx = pad.vx * dt, dz = pad.vz * dt;
        const next = { x: pad.x + dx, z: pad.z + dz };
        blocked = !!projectileCollide(next, 0.28);
        pad.x = next.x; pad.z = next.z; pad.distance += Math.hypot(dx, dz);
      } else {
        const dx = p.pos.x - pad.x, dz = p.pos.z - pad.z, distance = Math.hypot(dx, dz) || 1;
        const step = Math.min(distance, 29 * dt);
        pad.x += dx / distance * step; pad.z += dz / distance * step;
        pad.vx = dx / distance * 29; pad.vz = dz / distance * 29;
      }
      pad.mesh.position.set(pad.x, pad.y + Math.sin(pad.elapsed * 16) * 0.12, pad.z);
      pad.mesh.rotation.y = Math.atan2(pad.vx, pad.vz);
      pad.mesh.rotation.z += dt * (outbound ? 15 : -18);
      const segmentX = pad.x - startX, segmentZ = pad.z - startZ;
      const segmentLengthSq = segmentX * segmentX + segmentZ * segmentZ;
      for (const e of enemies) {
        if (e.dead || e.spawning || pad.hit.has(e)) continue;
        const along = segmentLengthSq ? clamp(((e.pos.x - startX) * segmentX + (e.pos.z - startZ) * segmentZ) / segmentLengthSq, 0, 1) : 0;
        const nearX = startX + segmentX * along, nearZ = startZ + segmentZ * along;
        if (Math.hypot(e.pos.x - nearX, e.pos.z - nearZ) < e.r + 0.42) {
          pad.hit.add(e);
          playerHit(e, pad.special ? (outbound ? 24 : 18) : (outbound ? 16 : 12), pad.special ? 'special' : 'attack', { knock: 3.5, kx: pad.vx, kz: pad.vz });
          AudioSys.sfx('kick');
        }
      }
      if (outbound && (blocked || pad.distance >= 8.5 || pad.elapsed >= 1.15)) {
        pad.state = 'return'; pad.hit.clear();
      } else if (!outbound && Math.hypot(p.pos.x - pad.x, p.pos.z - pad.z) < 0.65) {
        scene.remove(pad.mesh); p.rig.hand.add(pad.mesh);
        pad.mesh.position.set(0, 0, 0); pad.mesh.rotation.set(0, 0, 0); pad.state = 'held';
      }
    },
    reset() {
      const pad = player.pad;
      if (!pad) return;
      scene.remove(pad.mesh); player.rig.hand.add(pad.mesh);
      pad.mesh.position.set(0, 0, 0); pad.mesh.rotation.set(0, 0, 0);
      pad.state = 'held'; pad.hit.clear(); pad.distance = 0; pad.elapsed = 0;
    },
  },
  luvas: {
    name: 'Luvas de Boxe', icon: '🥊',
    desc: 'Combo de socos em arco com alcance marcado; o terceiro golpe é mais forte. <b>Especial:</b> uppercut que abre espaço ao redor.',
    attack() {
      const p = player, big = p.combo === 2, range = big ? 3.0 : 2.5, arc = big ? 2.7 : 2.0;
      meleeArc(range, arc, big ? 25 : 15, 'attack', big ? 6 : 3.5, 0);
      swingArc(p.pos.x, p.pos.z, p.face, range, arc, big ? '#ffd166' : '#ff3b30', 0.28);
      p.swingT = 0.13; p.swingSide = p.combo % 2 ? -1 : 1; p.combo = (p.combo + 1) % 3; p.comboT = 0.55;
      AudioSys.sfx('punch'); lunge(big ? 5 : 2.4); return big ? 0.34 : 0.2;
    },
    special() {
      meleeArc(3.2, 2.8, 38, 'special', 9); shockRing(player.pos.x, player.pos.z, 3.2, 0.3, '#e63946');
      AudioSys.sfx('punch'); return 1.2;
    },
  },
  lata: {
    name: 'Lata Kaiser (Morteiro)', icon: '🥫',
    desc: 'Arremessa uma lata que cai em arco e causa dano em área. <b>Especial:</b> rajada de morteiro mais potente.',
    attack() {
      const target = aimTarget(9), mesh = weaponMesh('lata');
      ownMaterials(mesh);
      mesh.scale.setScalar(0.45);
      lob({ fromX: player.pos.x, fromZ: player.pos.z, toX: target.x, toZ: target.z, dur: 0.72, h: 4.5, y0: 1.1, mesh, trail: '#f4a261', onLand: (x, z) => explode(x, z, 2.8, 24, 'attack', '#f4a261') });
      teleCircle(target.x, target.z, 2.8, 0.72, '#f4a261'); AudioSys.sfx('can'); return 0.6;
    },
    special() {
      const target = aimTarget(11), mesh = weaponMesh('lata'); mesh.scale.setScalar(0.45);
      ownMaterials(mesh);
      lob({ fromX: player.pos.x, fromZ: player.pos.z, toX: target.x, toZ: target.z, dur: 0.62, h: 5.2, y0: 1.1, mesh, trail: '#ffd166', onLand: (x, z) => explode(x, z, 3.8, 42, 'special', '#ff9f1c') });
      teleCircle(target.x, target.z, 3.8, 0.62, '#ffd166'); AudioSys.sfx('can'); return 1.35;
    },
  },
  cauchera: {
    name: 'Cauchera (Estilingue)', icon: '🎯',
    desc: 'Segure para disparar pedrinhas rápidas e certeiras. <b>Especial:</b> leque com 7 tampinhas de garrafa.',
    attack() {
      const p = player, a = p.face;
      spawnProj({ owner: 'p', x: p.pos.x + Math.sin(a) * 0.6, z: p.pos.z + Math.cos(a) * 0.6, y: 0.9, vx: Math.sin(a) * 32, vz: Math.cos(a) * 32, r: 0.16, dmg: 9, source: 'attack', life: 0.7, kind: 'pebble', knock: 1.5 });
      AudioSys.sfx('shoot'); p.atkSlow = 0.15; return 0.17;
    },
    special() {
      const p = player;
      for (let i = -3; i <= 3; i++) {
        const a = p.face + i * 0.14;
        spawnProj({ owner: 'p', x: p.pos.x + Math.sin(a) * 0.6, z: p.pos.z + Math.cos(a) * 0.6, y: 0.9, vx: Math.sin(a) * 24, vz: Math.cos(a) * 24, r: 0.22, dmg: 11, source: 'special', life: 0.55, pierce: 1, kind: 'cap', knock: 3 });
      }
      AudioSys.sfx('kick'); return 1.1;
    },
  },
  raquete: {
    name: 'Raquete de Tênis', icon: '🎾',
    desc: 'Atire bolas que ricocheteiam até 3 vezes. Clique/ataque com uma bola ao alcance do golpe para rebatê-la em chamas, mais forte e sem recuperar ricochetes.',
    attack() { return tennisRacketAttack(false); },
    special() { return tennisRacketAttack(true); },
  },
  frango: {
    name: 'Coxa de Frango', icon: '🍗',
    desc: 'Atire coxas rosadas maiores em cadência mais lenta: o impacto causa dano, o inimigo para brevemente para comer e sofre veneno. <b>Especial:</b> leque com três coxas.',
    attack() {
      const p = player, a = p.face;
      spawnProj({ owner: 'p', kind: 'chicken', x: p.pos.x + Math.sin(a) * 0.65, z: p.pos.z + Math.cos(a) * 0.65, y: 1.0, vx: Math.sin(a) * 19, vz: Math.cos(a) * 19, r: 0.28, dmg: 9, source: 'attack', life: 1, knock: 1.3 });
      AudioSys.sfx('shoot'); p.atkSlow = 0.12; return 0.48;
    },
    special() {
      const p = player;
      for (let i = -1; i <= 1; i++) {
        const a = p.face + i * 0.13;
        spawnProj({ owner: 'p', kind: 'chicken', x: p.pos.x + Math.sin(a) * 0.65, z: p.pos.z + Math.cos(a) * 0.65, y: 1.0, vx: Math.sin(a) * 18, vz: Math.cos(a) * 18, r: 0.3, dmg: 12, source: 'special', life: 1, knock: 1.6 });
      }
      AudioSys.sfx('shoot'); return 1.1;
    },
  },
};
