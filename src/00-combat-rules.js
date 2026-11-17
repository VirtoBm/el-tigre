function ricochetVelocity(vx, vz, nx, nz, remaining) {
  const dot = vx * nx + vz * nz;
  if (dot >= -1e-8) return { type: 'ignore', vx, vz, remaining };
  if (remaining <= 0) return { type: 'exhausted', vx, vz, remaining: 0 };
  return {
    type: 'bounce',
    vx: vx - 2 * dot * nx,
    vz: vz - 2 * dot * nz,
    remaining: remaining - 1,
  };
}

// Hero powers where the hero stands still for the whole effect also lock the player's movement.
const MOVEMENT_LOCKING_SPECIALS = ['var', 'embarrass'];
function specialLocksMovement(kind, remaining) {
  return remaining > 0 && MOVEMENT_LOCKING_SPECIALS.includes(kind);
}

// World direction (camera looks north) towards the closest screen edge, used to send enemies off-screen.
function nearestScreenExit(sx, sy, width, height) {
  const exits = [
    { distance: sx, x: -1, z: 0 },
    { distance: width - sx, x: 1, z: 0 },
    { distance: sy, x: 0, z: -1 },
    { distance: height - sy, x: 0, z: 1 },
  ];
  const best = exits.reduce((a, b) => (b.distance < a.distance ? b : a));
  return { x: best.x, z: best.z };
}