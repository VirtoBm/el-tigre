import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/00-hub-rules.js', import.meta.url), 'utf8');
const rules = vm.runInNewContext(`${source}\n({ buyMetaUpgrade, applySkinStation, skinStationAction })`);
const vitamina = { id: 'forca', max: 2, cost: (level) => 15 + level * 12 };
const idol = { id: 'idol', cost: 120 };

test('upgrade station spends marbles and stops at the max level', () => {
  const meta = { canicas: 50, up: { forca: 0 } };
  assert.equal(rules.buyMetaUpgrade(meta, vitamina).status, 'bought');
  assert.equal(meta.canicas, 35);
  assert.equal(rules.buyMetaUpgrade(meta, vitamina).status, 'bought');
  assert.deepEqual({ canicas: meta.canicas, level: meta.up.forca }, { canicas: 8, level: 2 });
  assert.equal(rules.buyMetaUpgrade(meta, vitamina).status, 'maxed');
  assert.equal(meta.canicas, 8);
});

test('upgrade station refuses purchases the player cannot afford', () => {
  const meta = { canicas: 14, up: { forca: 0 } };
  assert.equal(rules.buyMetaUpgrade(meta, vitamina).status, 'poor');
  assert.deepEqual({ canicas: meta.canicas, level: meta.up.forca }, { canicas: 14, level: 0 });
});

test('wardrobe buys and equips a locked skin, then toggles it', () => {
  const meta = { canicas: 130, unlockedSkins: {}, equippedSkins: {} };
  assert.equal(rules.applySkinStation(meta, 'jorgito', idol), 'buy');
  assert.deepEqual({ canicas: meta.canicas, unlocked: meta.unlockedSkins.idol, equipped: meta.equippedSkins.jorgito }, { canicas: 10, unlocked: true, equipped: 'idol' });
  assert.equal(rules.applySkinStation(meta, 'jorgito', idol), 'unequip');
  assert.equal(meta.equippedSkins.jorgito, 'base');
  assert.equal(rules.applySkinStation(meta, 'jorgito', idol), 'equip');
  assert.equal(meta.canicas, 10);
});

test('wardrobe keeps locked skins locked without enough marbles', () => {
  const meta = { canicas: 119, unlockedSkins: {}, equippedSkins: {} };
  assert.equal(rules.applySkinStation(meta, 'jorgito', idol), 'poor');
  assert.equal(meta.unlockedSkins.idol, undefined);
  assert.equal(rules.skinStationAction(meta, 'vitao', undefined), 'none');
});