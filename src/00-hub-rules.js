// Pure rules for the training-yard hub stations (kept DOM/three.js free so they can be unit tested).
function metaUpgradeStatus(level, max, cost, canicas) {
  if (level >= max) return 'maxed';
  return canicas >= cost ? 'available' : 'poor';
}
function buyMetaUpgrade(meta, upgrade) {
  const level = meta.up[upgrade.id] || 0, cost = upgrade.cost(level);
  const status = metaUpgradeStatus(level, upgrade.max, cost, meta.canicas);
  if (status !== 'available') return { status, level, cost };
  meta.canicas -= cost;
  meta.up[upgrade.id] = level + 1;
  return { status: 'bought', level: level + 1, cost };
}
function skinStationAction(meta, hero, skin) {
  if (!skin) return 'none';
  if (meta.unlockedSkins?.[skin.id]) return meta.equippedSkins?.[hero] === skin.id ? 'unequip' : 'equip';
  return meta.canicas >= skin.cost ? 'buy' : 'poor';
}
function applySkinStation(meta, hero, skin) {
  const action = skinStationAction(meta, hero, skin);
  if (action === 'buy') {
    meta.canicas -= skin.cost;
    meta.unlockedSkins[skin.id] = true;
    meta.equippedSkins[hero] = skin.id;
  } else if (action === 'equip') meta.equippedSkins[hero] = skin.id;
  else if (action === 'unequip') meta.equippedSkins[hero] = 'base';
  return action;
}