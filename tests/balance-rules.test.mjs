import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const load = (file, names) => vm.runInNewContext(`${readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')}\n({ ${names} })`);
const balance = load('00-balance.js', 'RUN_PLAN, enemyHpScale, incomingDamageScale, nextWaveReady, roomFinished, buildWaves, coinDrop');
const settings = load('00-settings.js', 'SETTINGS_DEFAULTS, sanitizeSettings, volumeCurve');

const seeded = (seed = 7) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

test('run plan has ten stretches ending with boss then army', () => {
  assert.equal(balance.RUN_PLAN.length, 10);
  assert.deepEqual([...balance.RUN_PLAN.slice(-2)], ['boss', 'army']);
});

test('enemy hp scaling leaves bosses and the dummy untouched', () => {
  assert.equal(balance.enemyHpScale(8, { boss: true }), 1);
  assert.equal(balance.enemyHpScale(8, { dummy: true }), 1);
  assert.ok(balance.enemyHpScale(8, {}) > balance.enemyHpScale(8, { elite: true }));
  assert.ok(balance.incomingDamageScale(9) < 1.3);
});

test('first wave waits for an empty room, later waves overlap with one straggler', () => {
  assert.equal(balance.nextWaveReady({ alive: 1, pending: 0, wave: 0, waves: 3, breather: 0 }), false);
  assert.equal(balance.nextWaveReady({ alive: 0, pending: 0, wave: 0, waves: 3, breather: 0 }), true);
  assert.equal(balance.nextWaveReady({ alive: 1, pending: 0, wave: 1, waves: 3, breather: 0 }), true);
  assert.equal(balance.nextWaveReady({ alive: 2, pending: 0, wave: 1, waves: 3, breather: 0 }), false);
  assert.equal(balance.nextWaveReady({ alive: 0, pending: 2, wave: 1, waves: 3, breather: 0 }), false);
  assert.equal(balance.nextWaveReady({ alive: 0, pending: 0, wave: 1, waves: 3, breather: 0.4 }), false);
  assert.equal(balance.nextWaveReady({ alive: 0, pending: 0, wave: 3, waves: 3, breather: 0 }), false);
});

test('room only finishes after every wave is spawned and defeated', () => {
  assert.equal(balance.roomFinished({ alive: 0, pending: 0, wave: 3, waves: 3 }), true);
  assert.equal(balance.roomFinished({ alive: 1, pending: 0, wave: 3, waves: 3 }), false);
  assert.equal(balance.roomFinished({ alive: 0, pending: 0, wave: 2, waves: 3 }), false);
});

test('waves grow along the run and respect the size cap', () => {
  const early = balance.buildWaves(1, seeded()), late = balance.buildWaves(7, seeded());
  assert.equal(early.length, 3);
  assert.equal(late.length, 4);
  const size = (ws) => ws.flat().length;
  assert.ok(size(late) > size(early));
  for (const w of [...early, ...late]) assert.ok(w.length > 0 && w.length <= 18);
  const army = balance.buildWaves(9, seeded());
  assert.ok(army.flat().every((t) => t === 'soldado'));
});

test('coin drops: bosses pay big, dummy never pays', () => {
  assert.equal(balance.coinDrop({ dummy: true }, () => 0), 0);
  assert.equal(balance.coinDrop({ boss: true }), 30);
  assert.ok(balance.coinDrop({ cost: 3 }, () => 0) >= 1);
  assert.equal(balance.coinDrop({ cost: 1 }, () => 0.99), 0);
});

test('settings are sanitized and clamped', () => {
  const s = settings.sanitizeSettings({ master: 3, music: -1, sfx: 'x', shake: 0.5, damageNumbers: false, junk: 1 });
  assert.equal(s.master, 1);
  assert.equal(s.music, 0);
  assert.equal(s.sfx, settings.SETTINGS_DEFAULTS.sfx);
  assert.equal(s.shake, 0.5);
  assert.equal(s.damageNumbers, false);
  assert.equal('junk' in s, false);
  assert.deepEqual({ ...settings.sanitizeSettings(null) }, { ...settings.SETTINGS_DEFAULTS });
  assert.equal(settings.volumeCurve(0), 0);
  assert.equal(settings.volumeCurve(1), 1);
  assert.ok(settings.volumeCurve(0.5) < 0.5);
});

const music = load('00-settings.js', 'COMBAT_TRACK, pickExcerpt, radioProximity');
test('combat excerpts are bar-aligned, avoid intro/outro and recent bars', () => {
  const cfg = music.COMBAT_TRACK, dur = 220, beat = 60 / cfg.bpm, bar = beat * 4;
  const seen = new Set(), recent = [];
  for (let i = 0; i < 200; i++) {
    const ex = music.pickExcerpt(dur, recent, Math.random);
    assert.ok(ex.start >= cfg.introSkip - 0.01, 'skips the intro');
    assert.ok(ex.start + ex.length <= dur - cfg.outroSkip + 0.5, 'skips the outro');
    assert.ok(Math.abs((ex.start - cfg.phase) / bar - ex.bar) < 1e-6, 'starts on a bar line');
    assert.ok(!recent.includes(ex.bar), 'avoids recently played bars');
    recent.push(ex.bar); if (recent.length > 5) recent.shift(); seen.add(ex.bar);
  }
  assert.ok(seen.size > 15, 'uses many different parts of the song');
  const shifted = music.pickExcerpt(dur, [], () => 0.5, cfg, 2);
  assert.ok(Math.abs(shifted.start - (cfg.phase + shifted.bar * bar + 2 * beat)) < 1e-6, 'keeps the beat position when jumping');
  assert.equal(music.pickExcerpt(10, [], Math.random).bar, 0, 'tiny tracks fall back safely');
});

test('radio loudness falls off with distance but never fully vanishes', () => {
  assert.equal(music.radioProximity(0), 1);
  assert.equal(music.radioProximity(2.5), 1);
  assert.ok(music.radioProximity(8) < 1 && music.radioProximity(8) > 0.12);
  assert.equal(music.radioProximity(40), 0.12);
  assert.ok(music.radioProximity(5) > music.radioProximity(10));
});
