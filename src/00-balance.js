// Pure balance rules (no DOM / three.js) so pacing and scaling can be unit tested.

// The run: each entry is one stretch of the plaza, walked from south to north.
const RUN_PLAN = ['combat', 'combat', 'combat', 'elite', 'combat', 'shop', 'combat', 'rest', 'boss', 'army'];
const ROOM_ICONS = { combat: '⚔️', elite: '💀', shop: '🏪', rest: '⛲', boss: '🐕', army: '🪖' };

// Enemy health grows gently along the run; elites and bosses have hand-tuned pools.
function enemyHpScale(room, def) {
  if (def.boss || def.dummy) return 1;
  if (def.elite) return 1 + room * 0.05;
  return 1 + room * 0.12;
}
// Enemies get a little faster and more aggressive further north.
function enemyPace(room) { return 1 + room * 0.02; }
// Damage the hero takes grows slowly so late rooms stay threatening without one-shots.
function incomingDamageScale(room) { return 1 + room * 0.025; }

// A wave is "almost done" when at most this many ordinary enemies remain:
// the next wave starts early so the fight keeps flowing instead of hunting stragglers.
const WAVE_OVERLAP_ALIVE = 1;
function nextWaveReady({ alive, pending, wave, waves, breather }) {
  if (pending > 0 || breather > 0) return false;
  if (wave >= waves) return false;
  return alive <= (wave === 0 ? 0 : WAVE_OVERLAP_ALIVE);
}
function roomFinished({ alive, pending, wave, waves }) {
  return alive === 0 && pending === 0 && wave >= waves;
}

// Wave budgets: more enemies per wave and per room. Returns the list of enemy type ids.
function buildWaves(room, rng = Math.random) {
  const army = room === 9;
  const n = army ? 3 : room < 2 ? 3 : 4, waves = [];
  const pool = room === 0
    ? [{ t: 'morador', c: 2, min: 0 }, { t: 'idoso', c: 1.5, min: 0 }, { t: 'ciclista', c: 2.5, min: 1 }, { t: 'rato', c: 1, min: 0 }, { t: 'cachorro', c: 2, min: 1 }]
    : army
      ? [{ t: 'soldado', c: 3, min: 0 }]
      : [{ t: 'pombo', c: 1, min: 0 }, { t: 'passarinho', c: 1, min: 0 }, { t: 'gato', c: 1.8, min: 0 }, { t: 'rato', c: 0.9, min: 0 }, { t: 'fumador', c: 3, min: 1 }, { t: 'iguana', c: 3.5, min: 2 }, { t: 'ciclista', c: 2.7, min: 1 }];
  for (let w = 0; w < n; w++) {
    let budget = army ? 26 + w * 8 : 15 + room * 1.7 + w * 4.5;
    const list = [], avail = pool.filter((p) => w >= p.min), cap = army ? 16 : 18;
    while (budget >= 0.9 && list.length < cap) {
      const opts = avail.filter((p) => p.c <= budget); if (!opts.length) break;
      const p = opts[Math.floor(rng() * opts.length)]; list.push(p.t); budget -= p.c;
    }
    waves.push(list);
  }
  return waves;
}

// Small coin drops from defeated enemies keep the economy (and the screen) lively.
function coinDrop(def, rng = Math.random) {
  if (def.dummy) return 0;
  if (def.boss) return 30;
  if (def.elite) return 18;
  const cost = def.cost || 1;
  return rng() < 0.45 + cost * 0.12 ? Math.max(1, Math.round(cost * 0.8)) : 0;
}
