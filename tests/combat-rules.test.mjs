import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/00-combat-rules.js', import.meta.url), 'utf8');
const rules = vm.runInNewContext(`${source}\n({ ricochetVelocity, specialLocksMovement, nearestScreenExit })`);

test('tennis ball consumes exactly three incoming wall contacts', () => {
  let vx = 10, vz = 0, remaining = 3;
  for (let contact = 0; contact < 3; contact++) {
    const hit = rules.ricochetVelocity(vx, vz, -Math.sign(vx), 0, remaining);
    assert.equal(hit.type, 'bounce');
    vx = hit.vx;
    vz = hit.vz;
    remaining = hit.remaining;
  }
  assert.equal(remaining, 0);
  assert.equal(rules.ricochetVelocity(vx, vz, -Math.sign(vx), 0, remaining).type, 'exhausted');
});

test('repeated overlap after a rebound does not spend another ricochet', () => {
  const hit = rules.ricochetVelocity(-10, 0, -1, 0, 2);
  assert.equal(hit.type, 'ignore');
  assert.equal(hit.remaining, 2);
});

test('standing hero powers (VAR and embarrassment) lock movement only while active', () => {
  assert.equal(rules.specialLocksMovement('var', 4.2), true);
  assert.equal(rules.specialLocksMovement('embarrass', 0.1), true);
  assert.equal(rules.specialLocksMovement('var', 0), false);
  for (const kind of ['tiger', 'bees', 'japa-base', 'sedan', 'guitar', 'idol', 'honey', 'skate', 'buoy', '']) {
    assert.equal(rules.specialLocksMovement(kind, 5), false, kind);
  }
});

test('expelled enemies leave through the closest screen edge', () => {
  assert.deepEqual({ ...rules.nearestScreenExit(40, 500, 1600, 900) }, { x: -1, z: 0 });
  assert.deepEqual({ ...rules.nearestScreenExit(1500, 420, 1600, 900) }, { x: 1, z: 0 });
  assert.deepEqual({ ...rules.nearestScreenExit(800, 30, 1600, 900) }, { x: 0, z: -1 });
  assert.deepEqual({ ...rules.nearestScreenExit(760, 880, 1600, 900) }, { x: 0, z: 1 });
});