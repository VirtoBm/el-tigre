// ================= models =================
const SG = { sph: SPH(1, 12, 10), box: BOX(1, 1, 1), cyl: CYL(1, 1, 1, 10), cone: CONE(1, 1, 8), ico: ICO(1, 0), glasses: new THREE.TorusGeometry(0.105, 0.018, 6, 14) };
for (const k in SG) SG[k].userData.shared = true;
const racketHoop = new THREE.TorusGeometry(0.34, 0.045, 8, 24);
racketHoop.userData.shared = true;
const tennisBallGeometry = new THREE.SphereGeometry(1, 14, 12);
tennisBallGeometry.userData.shared = true;
const tennisSeamGeometry = new THREE.TorusGeometry(0.78, 0.035, 5, 24);
tennisSeamGeometry.userData.shared = true;
const checkeredShirtMaterial = (() => {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d7efff'; ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 32) for (let x = 0; x < 128; x += 32) {
    ctx.fillStyle = (x + y) % 64 === 0 ? '#91c9ef' : '#f2faff';
    ctx.fillRect(x, y, 32, 32);
  }
  ctx.strokeStyle = '#5798c5'; ctx.lineWidth = 3;
  for (let p = 0; p <= 128; p += 32) {
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(128, p); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.88, flatShading: true });
  material.userData.shared = true; return material;
})();
const varScreenMaterial = (() => {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#121820'; ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = '#ffdb2e'; ctx.fillRect(0, 26, 512, 58);
  ctx.fillStyle = '#171a20'; ctx.font = '900 54px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('VAR', 256, 55);
  ctx.fillStyle = '#e9f4f3'; ctx.font = '900 170px Arial'; ctx.fillText('▶', 256, 204);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.userData.shared = true;
  const material = new THREE.MeshBasicMaterial({ map: texture }); material.userData.shared = true; return material;
})();
const varScreenGeometry = new THREE.PlaneGeometry(1.58, 0.92);
varScreenGeometry.userData.shared = true;
function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.userData.shared = true;
  return texture;
}
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}
function drawRedCard(ctx, x, y, w, h, angle = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  roundedRect(ctx, -w / 2, -h / 2, w, h, w * 0.12);
  ctx.fillStyle = '#e01e2b'; ctx.fill(); ctx.lineWidth = Math.max(3, w * 0.07); ctx.strokeStyle = '#fff8e7'; ctx.stroke();
  ctx.restore();
}
const varDecisionTexture = canvasTexture(512, 320, (ctx) => {
  ctx.fillStyle = '#121820'; ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = '#ffdb2e'; ctx.fillRect(0, 26, 512, 58);
  ctx.fillStyle = '#171a20'; ctx.font = '900 46px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('DECISÃO: VAR', 256, 56);
  drawRedCard(ctx, 140, 205, 96, 140, -0.14);
  ctx.fillStyle = '#ffffff'; ctx.font = '900 70px Arial'; ctx.fillText('FORA!', 340, 208);
});
const redCardSpriteMaterial = (() => {
  const material = new THREE.SpriteMaterial({ map: canvasTexture(80, 112, (ctx) => drawRedCard(ctx, 40, 56, 60, 88, 0.1)), transparent: true, depthTest: false });
  material.userData.shared = true; return material;
})();
// Embarrassed face covering the mouth (like 🤭), drawn with shapes so it does not depend on emoji fonts.
const embarrassedSpriteMaterial = (() => {
  const texture = canvasTexture(128, 128, (ctx) => {
    ctx.beginPath(); ctx.arc(64, 62, 52, 0, TAU); ctx.fillStyle = '#ffd93b'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#7a4b12'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,92,140,0.8)';
    for (const x of [30, 98]) { ctx.beginPath(); ctx.ellipse(x, 66, 12, 8, 0, 0, TAU); ctx.fill(); }
    ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = '#3b2a1a';
    for (const x of [44, 84]) { ctx.beginPath(); ctx.arc(x, 50, 10, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    ctx.save(); ctx.translate(70, 94); ctx.rotate(-0.55);
    ctx.fillStyle = '#f2b277'; ctx.strokeStyle = '#7a4b12'; ctx.lineWidth = 4;
    for (const [y, len] of [[-21, 34], [-7, 40], [7, 38], [20, 30]]) { roundedRect(ctx, -46, y - 6, len + 6, 13, 6.5); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(6, 0, 24, 27, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  });
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  material.userData.shared = true; return material;
})();
const curseBalloonTexture = canvasTexture(320, 210, (ctx) => {
  ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = '#1b1b1b'; ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(92, 150); ctx.lineTo(48, 204); ctx.lineTo(140, 160); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(160, 88, 148, 78, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(96, 146); ctx.lineTo(134, 154); ctx.lineWidth = 12; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.font = '900 92px Impact, "Arial Black", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 8; ctx.strokeStyle = '#1b1b1b'; ctx.strokeText('$&#*', 160, 92);
  ctx.fillStyle = '#e63946'; ctx.fillText('$&#*', 160, 92);
});
function part(geo, color, sx, sy, sz, x, y, z, parent) {
  const m = new THREE.Mesh(SG[geo], typeof color === 'string' ? M(color) : color);
  m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.castShadow = true;
  parent.add(m); return m;
}
function ownMaterials(root) {
  const mats = [];
  root.traverse((o) => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone(); o.userData.ownMat = true; mats.push(...(Array.isArray(o.material) ? o.material : [o.material])); } });
  return mats;
}
function disposeOwn(root) { root.traverse((o) => { if (o.userData.ownMat && o.material) for (const material of Array.isArray(o.material) ? o.material : [o.material]) material.dispose(); }); }
const kaiserCanGeometry = new THREE.CylinderGeometry(1, 1, 1, 32, 1);
kaiserCanGeometry.userData.shared = true;
const kaiserShoulderGeometry = new THREE.CylinderGeometry(0.14, 0.19, 0.05, 24, 1);
kaiserShoulderGeometry.userData.shared = true;

const jerseyNumberMap = (() => {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d'); ctx.font = '900 94px Trebuchet MS, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#111111'; ctx.fillText('10', 64, 67);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
})();
const kaiserCanTexture = (() => {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const metal = ctx.createLinearGradient(0, 0, canvas.width, 0);
  metal.addColorStop(0, '#69747c'); metal.addColorStop(0.14, '#e3e8eb'); metal.addColorStop(0.34, '#aeb8bf');
  metal.addColorStop(0.5, '#f5f7f8'); metal.addColorStop(0.72, '#9ca7ae'); metal.addColorStop(0.9, '#e6eaed'); metal.addColorStop(1, '#68737b');
  ctx.fillStyle = metal; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(192, 0, 40, canvas.height); ctx.fillRect(772, 0, 20, canvas.height);
  for (const [baseX, baseY, baseR] of [[55,70,7],[135,390,5],[420,96,6],[460,330,8],[72,280,4],[340,435,5],[180,54,4],[302,102,3],[112,465,6],[446,210,4]]) {
    const x = baseX * 2, y = baseY * 2, r = baseR * 2;
    const drop = ctx.createRadialGradient(x-r*0.3,y-r*0.35,1,x,y,r);
    drop.addColorStop(0,'rgba(255,255,255,0.9)'); drop.addColorStop(0.35,'rgba(202,226,239,0.68)'); drop.addColorStop(1,'rgba(42,59,69,0.55)');
    ctx.fillStyle = drop; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  ctx.beginPath(); ctx.ellipse(512, 512, 212, 448, 0, 0, Math.PI * 2);
  const red = ctx.createLinearGradient(300, 0, 724, 0);
  red.addColorStop(0, '#710d16'); red.addColorStop(0.18, '#b51724'); red.addColorStop(0.52, '#d62836'); red.addColorStop(0.82, '#a8111f'); red.addColorStop(1, '#650a13');
  ctx.fillStyle = red; ctx.fill();
  ctx.lineWidth = 14; ctx.strokeStyle = '#d5a63b'; ctx.stroke();
  ctx.beginPath(); ctx.arc(512, 190, 96, 0, Math.PI * 2); ctx.fillStyle = '#d6a53a'; ctx.fill();
  ctx.lineWidth = 10; ctx.strokeStyle = '#f6df91'; ctx.stroke();
  ctx.fillStyle = '#87121c'; ctx.font = '900 170px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('K', 512, 190);
  ctx.save(); ctx.translate(512, 544); ctx.scale(1.35, 3.2);
  ctx.font = '900 72px Trebuchet MS, sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#591018'; ctx.strokeText('KAISER', 0, 0);
  ctx.fillStyle = '#f6f1dc'; ctx.fillText('KAISER', 0, 0); ctx.restore();
  ctx.strokeStyle = '#d7aa4a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(378, 820); ctx.lineTo(646, 820); ctx.stroke();
  ctx.fillStyle = '#f2d47c'; ctx.font = 'bold 34px Trebuchet MS, sans-serif'; ctx.fillText('CERVEJA LAGER', 512, 890);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.userData.shared = true; return texture;
})();
const kaiserCanMaterial = new THREE.MeshStandardMaterial({ map: kaiserCanTexture, metalness: 0.72, roughness: 0.28 });
kaiserCanMaterial.userData.shared = true;
const kaiserCanEndMaterial = new THREE.MeshStandardMaterial({ color: '#b5bcc1', metalness: 0.8, roughness: 0.25 });
kaiserCanEndMaterial.userData.shared = true;

function buildKid(o = {}) {
  const c = Object.assign({ skin: '#c68642', shirt: '#ffd23f', shorts: '#1d3fbb', socks: '#d62828', shoes: '#f8f9fa', sole: null, pants: null, hair: '#2b1b10', beard: null, mustache: null, smallGoatee: false, sparseChinBeard: false, polo: false, number10: false, jersey: false, wide: 1, slim: false, cap: null, capBack: false, strawHat: false, country: false, backpackIronBars: false, checkeredShirt: false, longFace: false, roundEyes: false, shortHair: false, headForward: 0, stripe: '#1d3fbb', verticalStripes: null, glasses: false, glassesRect: false, sidePart: false, shortWavy: false, longMessyHair: false, scar: false, narrowEyes: false, idol: false, beeCostume: false, swimGoggles: false, skateHelmet: false }, o);
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const legs = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0.14 * s * c.wide, 0.52, 0); body.add(piv);
    part('cyl', c.pants || c.skin, c.pants ? 0.1 : 0.08, c.pants ? 0.44 : 0.3, c.pants ? 0.1 : 0.08, 0, c.pants ? -0.22 : -0.15, 0, piv);
    part('cyl', c.socks, 0.095, 0.17, 0.095, 0, -0.36, 0, piv);
    part('box', c.shoes, 0.2, 0.12, 0.32, 0, -0.47, 0.05, piv);
    if (c.sole) part('box', c.sole, 0.21, 0.045, 0.33, 0, -0.54, 0.05, piv);
    legs.push(piv);
  }
  part('cyl', c.pants || c.shorts, 0.29 * c.wide, 0.22, 0.25 * c.wide, 0, 0.56, 0, body);
  const torso = part('cyl', c.checkeredShirt ? checkeredShirtMaterial : c.shirt, 0.3 * c.wide * (c.slim ? 0.78 : 1), 0.42, 0.25 * c.wide * (c.slim ? 0.82 : 1), 0, 0.84, 0, body);
  if (c.pants) {
    part('cyl', '#493b32', 0.3 * c.wide, 0.065, 0.262 * c.wide, 0, 0.68, 0, body);
    part('box', '#d2a84e', 0.12, 0.1, 0.035, 0, 0.68, 0.27 * c.wide, body);
  }
  if (c.jersey) {
    for (const back of [false, true]) {
      const stripe = part('box', c.stripe, 0.11, 0.44, 0.025, back ? 0.02 : -0.02, 0.84, back ? -0.252 : 0.252, body);
      stripe.rotation.z = back ? -0.48 : 0.48;
    }
    if (c.number10) {
      const number = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.15), new THREE.MeshBasicMaterial({ map: jerseyNumberMap, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      number.position.set(0, 0.86, -0.268); number.rotation.y = Math.PI; body.add(number);
    }
  } else if (!c.checkeredShirt) {
    part('cyl', c.stripe, 0.305 * c.wide, 0.07, 0.255 * c.wide, 0, 0.9, 0, body);
    if (c.verticalStripes) for (const z of [-0.258, 0.258]) for (const s of [-1, 0, 1]) {
      part('box', c.verticalStripes, 0.035, 0.39, 0.018, s * 0.14, 0.84, z, body);
    }
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0.36 * s * c.wide, 1.0, 0); body.add(piv);
    part('sph', c.shirt, 0.13, 0.13, 0.13, 0, 0, 0, piv);
    part('cyl', c.skin, 0.065, 0.32, 0.065, 0, -0.2, 0, piv);
    part('sph', c.skin, 0.085, 0.085, 0.085, 0, -0.38, 0, piv);
    arms.push(piv);
  }
  if (c.polo) {
    const collar = part('box', '#f2d5a0', 0.16, 0.09, 0.06, 0, 1.04, 0.19, body);
    collar.rotation.z = 0.2;
  }
  const hand = new THREE.Group(); hand.position.set(0, -0.4, 0.02); arms[0].add(hand);
  const head = new THREE.Group(); head.position.set(0, 1.42, 0); body.add(head);
  part('sph', c.skin, c.longFace ? 0.36 : 0.42, c.longFace ? 0.47 : 0.4, c.longFace ? 0.38 : 0.4, 0, 0, 0, head);
  part('sph', c.hair, 0.44, 0.3, 0.42, 0, 0.12, -0.04, head);
  part('box', c.hair, 0.55, 0.1, 0.2, 0, 0.2, 0.27, head).rotation.x = 0.3;
  if (c.shortHair) {
    part('sph', c.hair, 0.43, c.longFace ? 0.21 : 0.17, 0.4, 0, c.longFace ? 0.31 : 0.24, -0.03, head);
    for (const s of [-1, 1]) part('box', c.hair, 0.08, 0.2, 0.12, s * 0.35, 0.05, 0.16, head);
  } else if (c.shortWavy) {
    for (const x of [-0.2, -0.1, 0, 0.1, 0.2]) {
      const curl = part('sph', c.hair, 0.11, 0.12, 0.12, x, 0.31 + Math.cos(x * 12) * 0.025, 0.02, head);
      curl.rotation.z = x * 0.5;
    }
  } else if (c.sidePart) {
    const swept = part('sph', c.hair, 0.34, 0.11, 0.2, 0.13, 0.24, 0.24, head);
    swept.rotation.z = -0.22;
  } else for (const s of [-1, 0, 1]) { const t = part('cone', c.hair, 0.09, 0.22, 0.09, s * 0.13, 0.42, -0.02, head); t.rotation.z = -s * 0.5; }
  if (c.longMessyHair) {
    for (const s of [-1, 1]) {
      for (const [y, z, scale, tilt] of [[-0.18, 0, 1, 0.08], [-0.38, -0.02, 0.92, -0.12], [-0.2, -0.22, 0.9, 0.1]]) {
        const lock = part('sph', c.hair, 0.17 * scale, 0.36 * scale, 0.19 * scale, s * (0.32 + (z < -0.1 ? -0.02 : 0)), y, z, head);
        lock.rotation.z = s * tilt;
      }
    }
    const fringe = part('sph', c.hair, 0.3, 0.1, 0.16, -0.07, 0.29, 0.24, head);
    fringe.rotation.z = -0.18;
    for (const [x, y, z, rotation] of [[-0.13, -0.48, -0.2, -0.2], [0.13, -0.5, -0.17, 0.18], [0, -0.42, -0.28, 0]]) {
      const lock = part('sph', c.hair, 0.14, 0.34, 0.16, x, y, z, head);
      lock.rotation.z = rotation;
    }
  }
  if (c.idol) {
    const fringe = part('sph', '#b55cff', 0.26, 0.07, 0.12, -0.08, 0.28, 0.3, head); fringe.rotation.z = 0.12;
    for (let i = 0; i < 3; i++) part('sph', i === 0 ? '#a855f7' : '#2b1b10', 0.44 - i * 0.09, 0.035, 0.42 - i * 0.08, 0, 0.38 + i * 0.025, -0.04, head);
  }
  for (const s of [-1, 1]) {
    part('sph', '#1b1b1b', c.roundEyes ? 0.075 : 0.06, c.narrowEyes ? 0.045 : c.roundEyes ? 0.075 : 0.095, 0.04, s * 0.14, -0.02, 0.37, head);
    part('sph', '#ffffff', 0.022, 0.022, 0.02, s * 0.14 + 0.02, 0.02, 0.4, head);
    part('sph', c.skin, 0.08, 0.1, 0.06, s * 0.41, 0, 0, head);
    part('sph', '#e76f51', 0.06, 0.035, 0.02, s * 0.23, -0.13, 0.34, head);
  }
  if (c.glasses || c.glassesRect || c.swimGoggles) {
    const frames = M('#302b32');
    if (c.swimGoggles) {
      for (const s of [-1, 1]) {
        const lens = new THREE.Mesh(SG.glasses, M('#168aad')); lens.position.set(s * 0.14, 0.005, 0.405); lens.scale.set(1.35, 1.15, 1); head.add(lens);
      }
      part('box', '#168aad', 0.12, 0.035, 0.03, 0, 0.005, 0.405, head);
    } else if (c.glassesRect) {
      for (const s of [-1, 1]) {
        const x = s * 0.14;
        part('box', frames, 0.19, 0.025, 0.025, x, 0.06, 0.405, head);
        part('box', frames, 0.19, 0.025, 0.025, x, -0.055, 0.405, head);
        part('box', frames, 0.025, 0.13, 0.025, x - 0.08, 0, 0.405, head);
        part('box', frames, 0.025, 0.13, 0.025, x + 0.08, 0, 0.405, head);
      }
    } else for (const s of [-1, 1]) {
      const lens = new THREE.Mesh(SG.glasses, frames); lens.position.set(s * 0.14, 0.005, 0.405); head.add(lens);
    }
    part('box', frames, 0.12, 0.025, 0.025, 0, 0.005, 0.405, head);
    for (const s of [-1, 1]) part('box', frames, 0.1, 0.018, 0.018, s * 0.28, 0.015, 0.385, head);
  }
  if (c.beard) {
    if (c.sparseChinBeard) {
      part('sph', c.beard, 0.075, 0.045, 0.045, 0, -0.34, 0.34, head);
      part('cone', c.beard, 0.045, 0.1, 0.04, 0, -0.39, 0.33, head).rotation.x = Math.PI;
    } else if (c.smallGoatee) {
      part('sph', c.beard, 0.085, 0.065, 0.06, 0, -0.32, 0.34, head);
    } else {
      part('sph', c.beard, 0.19, 0.13, 0.16, 0, -0.27, 0.28, head);
      const goatee = part('cone', c.beard, 0.09, 0.2, 0.08, 0, -0.38, 0.3, head); goatee.rotation.x = Math.PI;
    }
  }
  if (c.mustache) for (const s of [-1, 1]) {
    const tip = part('sph', c.mustache, 0.16, 0.055, 0.075, s * 0.11, -0.12, 0.37, head);
    tip.rotation.z = -s * 0.2;
  }
  if (c.scar) {
    const mark = part('box', '#a74442', 0.19, 0.025, 0.02, 0.12, 0.25, 0.34, head);
    mark.rotation.z = -0.55;
  }
  if (c.cap) {
    part('cyl', c.cap, 0.44, 0.14, 0.44, 0, 0.24, 0, head);
    part('box', c.cap, 0.4, 0.04, 0.3, 0, 0.2, c.capBack ? -0.45 : 0.45, head);
  }
  if (c.strawHat) {
    const brim = part('cyl', '#d9b66f', 0.58, 0.055, 0.58, 0, 0.3, 0, head);
    brim.material = M('#d9b66f');
    const crown = part('cyl', '#caa45e', 0.3, 0.25, 0.3, 0, 0.43, 0, head);
    crown.material = M('#caa45e');
    part('cyl', '#8b5e3c', 0.31, 0.045, 0.31, 0, 0.4, 0, head);
  }
  if (c.skateHelmet) {
    part('sph', '#24272d', 0.47, 0.22, 0.43, 0, 0.25, 0, head);
    for (const s of [-1, 1]) part('box', '#3a3f46', 0.035, 0.15, 0.035, s * 0.33, 0.08, 0.1, head);
  }
  if (c.beeCostume) {
    for (const s of [-1, 1]) {
      const wing = part('sph', '#f8f9fa', 0.22, 0.11, 0.28, s * 0.34, 0.96, -0.2, body); wing.rotation.y = s * 0.4;
      const antenna = part('cyl', '#252525', 0.025, 0.27, 0.025, s * 0.14, 0.47, 0, head); antenna.rotation.z = s * 0.25;
      part('sph', '#252525', 0.06, 0.06, 0.06, s * 0.18, 0.6, 0, head);
    }
    if (c.backpackIronBars) {
      const pack = part('box', '#79513b', 0.48, 0.48, 0.24, 0, 0.9, -0.3, body);
      pack.material = M('#79513b');
      for (const x of [-0.16, 0, 0.16]) {
        const bar = part('cyl', '#737b83', 0.035, 0.94, 0.035, x, 1.28, -0.31, body);
        bar.material = M('#737b83', { metalness: 0.75, roughness: 0.32 });
        part('cyl', '#a8afb7', 0.05, 0.06, 0.05, x, 1.77, -0.31, body);
      }
      for (const s of [-1, 1]) {
        const strap = part('box', '#6b4226', 0.07, 0.57, 0.035, s * 0.22, 0.91, 0.19, body);
        strap.rotation.z = s * 0.15;
      }
    }
    if (c.country) {
      const kerchief = part('cone', '#b52d34', 0.12, 0.18, 0.12, 0, 1.08, 0.18, body);
      kerchief.rotation.x = Math.PI;
      for (const s of [-1, 1]) {
        const cuff = part('cyl', '#7b5636', 0.105, 0.12, 0.105, s * 0.36, 0.78, 0, body);
        cuff.rotation.z = Math.PI / 2;
      }
    }
    part('box', '#252525', 0.53, 0.08, 0.04, 0, 0.82, 0.245, body);
  }
  if (c.swimGoggles) {
    const snorkel = part('cyl', '#f8f9fa', 0.035, 0.42, 0.035, 0.33, 0.2, 0.28, head); snorkel.rotation.z = -0.25;
  }
  const tigerMask = new THREE.Group(); tigerMask.position.set(0, 0.02, 0.39); tigerMask.visible = false; head.add(tigerMask);
  part('sph', '#e88324', 0.35, 0.23, 0.12, 0, 0.05, 0, tigerMask);
  for (const s of [-1, 1]) {
    const stripe = part('box', '#3b2a1a', 0.045, 0.17, 0.025, s * 0.19, 0.07, 0.1, tigerMask); stripe.rotation.z = s * 0.42;
    part('sph', '#fff8e7', 0.075, 0.035, 0.025, s * 0.12, 0.02, 0.11, tigerMask);
  }
  const neck = new THREE.Group(); neck.position.set(0, 1.18, 0); body.add(neck);
  const neckMesh = part('cyl', c.skin, 0.075, 0.24, 0.075, 0, 0.12, 0, neck);
  neckMesh.rotation.x = Math.PI / 2;
  head.position.set(0, 0.24, c.headForward); body.remove(head); neck.add(head);
  return { root, body, legs, arms, head, hand, torso, tigerMask, neck, neckMesh };
}
function animKid(rig, amt, phase) {
  const s = Math.sin(phase) * amt;
  rig.legs[0].rotation.x = s * 0.9; rig.legs[1].rotation.x = -s * 0.9;
  rig.arms[1].rotation.x = s * 0.7;
  rig.body.position.y = Math.abs(Math.sin(phase)) * 0.07 * amt;
}
function animSamba(rig, amt, phase) {
  const step = Math.sin(phase), sway = Math.sin(phase * 2);
  rig.legs[0].rotation.x = step * 0.82 * amt; rig.legs[1].rotation.x = -step * 0.82 * amt;
  rig.legs[0].rotation.z = 0.18 * sway * amt; rig.legs[1].rotation.z = 0.18 * sway * amt;
  rig.arms[1].rotation.x = -0.35 + Math.sin(phase + 0.7) * 0.4 * amt;
  rig.body.rotation.z = 0.12 * sway * amt; rig.body.rotation.y = Math.sin(phase) * 0.14 * amt;
  rig.body.position.y = Math.abs(step) * 0.06 * amt;
}
function animThiagao(rig, amt, phase) {
  animKid(rig, amt, phase);
  rig.body.rotation.z = Math.sin(phase * 0.5) * 0.045 * amt;
  rig.head.rotation.z = Math.sin(phase * 0.5 + 0.4) * 0.025 * amt;
}
function animJapa(rig, amt, phase) {
  const glide = Math.sin(phase * 0.72);
  rig.legs[0].rotation.x = -0.1 + Math.max(0, glide) * 0.12;
  rig.legs[1].rotation.x = -0.1 + Math.max(0, -glide) * 0.12;
  rig.legs[0].rotation.z = Math.sin(phase * 0.72) * 0.035;
  rig.legs[1].rotation.z = -Math.sin(phase * 0.72) * 0.035;
  rig.arms[0].rotation.x = -0.12 + Math.sin(phase * 0.72 + 0.8) * 0.08 * amt;
  rig.arms[1].rotation.x = -0.12 + Math.sin(phase * 0.72 - 0.8) * 0.08 * amt;
  rig.body.position.y = Math.sin(phase * 1.44) * 0.025 * amt;
  rig.body.rotation.z = Math.sin(phase * 0.72) * 0.035 * amt;
}

function buildShark() {
  const root = new THREE.Group();
  part('sph', '#536c7d', 0.62, 0.42, 1.08, 0, 0.65, 0, root);
  part('sph', '#e5e9e9', 0.48, 0.22, 0.82, 0, 0.48, 0.12, root);
  const dorsal = part('cone', '#435968', 0.3, 0.55, 0.28, 0, 1.06, -0.18, root); dorsal.rotation.x = 0.15;
  const tail = new THREE.Group(); tail.position.set(0, 0.7, -0.95); root.add(tail);
  const tailFin = part('cone', '#435968', 0.3, 0.62, 0.22, 0, 0.3, -0.05, tail); tailFin.rotation.x = Math.PI;
  for (const s of [-1, 1]) {
    const fin = part('cone', '#435968', 0.2, 0.46, 0.25, s * 0.48, 0.43, -0.08, root); fin.rotation.z = s * 0.8;
    part('sph', '#13232d', 0.045, 0.05, 0.035, s * 0.31, 0.79, 0.72, root);
  }
  part('box', '#13232d', 0.58, 0.09, 0.1, 0, 0.49, 0.91, root);
  for (let i = 0; i < 5; i++) {
    const tooth = part('cone', '#fff8e7', 0.055, 0.11, 0.055, -0.22 + i * 0.11, 0.56, 0.93, root);
    tooth.rotation.x = Math.PI;
  }
  root.scale.setScalar(1.05);
  return { root, tail };
}
function animShark(rig, phase) {
  rig.tail.rotation.y = Math.sin(phase * 8) * 0.48;
}

function buildPigeon(scale = 1, tint = '#9aa5b1') {
  const root = new THREE.Group(); const body = new THREE.Group(); body.scale.setScalar(scale); root.add(body);
  part('sph', tint, 0.32, 0.28, 0.45, 0, 0.45, 0, body);
  part('sph', shade(tint, 0.75), 0.18, 0.2, 0.18, 0, 0.7, 0.28, body);
  part('sph', '#4f9d8a', 0.18, 0.09, 0.15, 0, 0.66, 0.3, body);
  part('sph', shade(tint, 0.85), 0.16, 0.16, 0.17, 0, 0.86, 0.36, body);
  part('cone', '#e09f3e', 0.05, 0.14, 0.05, 0, 0.83, 0.56, body).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    part('sph', '#ff7b00', 0.035, 0.035, 0.035, s * 0.1, 0.89, 0.46, body);
    part('cyl', '#e07a5f', 0.025, 0.2, 0.025, s * 0.1, 0.12, 0.02, body);
  }
  const wings = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0.28 * s, 0.58, 0); body.add(piv);
    part('box', shade(tint, 0.8), 0.06, 0.22, 0.55, 0.04 * s, -0.05, -0.05, piv);
    part('box', '#3d4651', 0.065, 0.06, 0.3, 0.04 * s, -0.12, -0.2, piv);
    wings.push(piv);
  }
  part('box', '#5c6670', 0.22, 0.05, 0.32, 0, 0.42, -0.5, body);
  return { root, body, wings };
}
function buildBee() {
  const root = new THREE.Group();
  part('sph', '#f7c948', 0.18, 0.15, 0.25, 0, 0.18, 0, root);
  for (const z of [-0.06, 0.1]) part('box', '#252525', 0.2, 0.16, 0.055, 0, 0.18, z, root);
  part('cone', '#252525', 0.08, 0.2, 0.08, 0, 0.18, 0.27, root).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    const wing = part('sph', M('#effaff', { transparent: true, opacity: 0.7, roughness: 0.2, depthWrite: false }), 0.13, 0.035, 0.18, s * 0.12, 0.3, -0.02, root);
    wing.rotation.z = s * 0.35;
  }
  return root;
}
function buildDog(col = '#c8894a', spot = '#8a5a2b', scale = 1, collar = '#d62828') {
  const root = new THREE.Group(); const body = new THREE.Group(); body.scale.setScalar(scale); root.add(body);
  part('box', col, 0.55, 0.45, 1.0, 0, 0.75, 0, body);
  part('box', spot, 0.57, 0.22, 0.38, 0, 0.88, -0.18, body);
  const head = new THREE.Group(); head.position.set(0, 1.05, 0.55); body.add(head);
  part('box', col, 0.44, 0.4, 0.42, 0, 0, 0, head);
  part('box', '#e8c39e', 0.26, 0.2, 0.3, 0, -0.08, 0.3, head);
  part('box', '#222', 0.12, 0.09, 0.06, 0, -0.01, 0.46, head);
  for (const s of [-1, 1]) {
    const ear = part('box', spot, 0.13, 0.24, 0.08, s * 0.18, 0.24, -0.05, head); ear.rotation.z = s * 0.35;
    part('sph', '#111', 0.045, 0.055, 0.03, s * 0.11, 0.07, 0.21, head);
  }
  part('box', collar, 0.47, 0.08, 0.2, 0, 0.88, 0.45, body);
  const legs = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const piv = new THREE.Group(); piv.position.set(sx * 0.18, 0.58, sz * 0.36); body.add(piv);
    part('cyl', col, 0.08, 0.5, 0.08, 0, -0.25, 0, piv);
    part('box', '#f1dcc0', 0.13, 0.08, 0.17, 0, -0.52, 0.03, piv);
    legs.push(piv);
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.92, -0.5); tail.rotation.x = -0.9; body.add(tail);
  part('cyl', col, 0.05, 0.45, 0.05, 0, 0.22, 0, tail);
  return { root, body, legs, tail, head };
}
function buildIguana(col = '#6a994e', scale = 1, crown = false) {
  const root = new THREE.Group(); const body = new THREE.Group(); body.scale.setScalar(scale); root.add(body);
  part('sph', col, 0.38, 0.28, 0.75, 0, 0.38, 0, body);
  const head = new THREE.Group(); head.position.set(0, 0.48, 0.8); body.add(head);
  part('box', col, 0.32, 0.26, 0.46, 0, 0, 0, head);
  part('sph', '#f4a261', 0.08, 0.17, 0.16, 0, -0.17, 0.02, head);
  for (const s of [-1, 1]) part('sph', '#ffd60a', 0.05, 0.05, 0.05, s * 0.16, 0.06, 0.08, head);
  if (crown) for (let i = 0; i < 5; i++) part('cone', '#ffd166', 0.05, 0.18, 0.05, (i - 2) * 0.07, 0.22, -0.05, head);
  for (let i = 0; i < 7; i++) part('cone', '#386641', 0.05, 0.2, 0.05, 0, 0.7 - Math.abs(i - 3) * 0.02, 0.6 - i * 0.2, body);
  const tail = []; let p = body;
  for (let i = 0; i < 5; i++) {
    const piv = new THREE.Group(); piv.position.set(0, i ? 0 : 0.36, i ? -0.45 : -0.7); p.add(piv);
    part('box', i % 2 ? '#4f772d' : col, 0.22 - i * 0.035, 0.15 - i * 0.02, 0.5, 0, 0, -0.22, piv);
    tail.push(piv); p = piv;
  }
  const legs = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const piv = new THREE.Group(); piv.position.set(sx * 0.32, 0.3, sz * 0.35); body.add(piv);
    const l = part('box', col, 0.32, 0.1, 0.12, sx * 0.14, -0.08, 0, piv); l.rotation.z = sx * 0.6;
    legs.push(piv);
  }
  return { root, body, tail, legs, head };
}

// soccer ball geometry: dark faces around the 12 icosahedron vertices
const ballGeo = (() => {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const base = new THREE.IcosahedronGeometry(1, 0).attributes.position; const dirs = [];
  for (let i = 0; i < base.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(base, i).normalize(); if (!dirs.some((d) => d.distanceTo(v) < 1e-3)) dirs.push(v); }
  const pos = g.attributes.position; const cols = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    const cen = a.add(b).add(c).normalize(); let m = -1; for (const d of dirs) m = Math.max(m, cen.dot(d));
    const k = m > 0.9 ? 0.06 : 0.95; for (let j = 0; j < 3; j++) cols.push(k, k, k);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.userData.shared = true; return g;
})();
const ballMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.55 });

function weaponMesh(kind) {
  const g = new THREE.Group();
  if (kind === 'pet') {
    const b = part('cyl', M('#7dd87d', { transparent: true, opacity: 0.75, roughness: 0.2 }), 0.13, 0.55, 0.13, 0, 0, 0.3, g); b.rotation.x = Math.PI / 2;
    const liq = part('cyl', '#7a4419', 0.11, 0.35, 0.11, 0, 0, 0.22, g); liq.rotation.x = Math.PI / 2;
    const nk = part('cone', M('#7dd87d', { transparent: true, opacity: 0.75 }), 0.13, 0.18, 0.13, 0, 0, 0.66, g); nk.rotation.x = Math.PI / 2;
    const cap = part('cyl', '#d62828', 0.06, 0.07, 0.06, 0, 0, 0.77, g); cap.rotation.x = Math.PI / 2;
    part('cyl', '#e63946', 0.135, 0.14, 0.135, 0, 0, 0.35, g).rotation.x = Math.PI / 2;
  } else if (kind === 'controle') {
    const shell = '#303743';
    part('box', shell, 0.66, 0.14, 0.4, 0, 0, 0.12, g);
    for (const s of [-1, 1]) {
      const grip = part('sph', shell, 0.2, 0.17, 0.3, s * 0.27, -0.07, -0.06, g);
      grip.rotation.x = -0.25;
      part('cyl', '#11161c', 0.065, 0.035, 0.065, s * 0.18, 0.085, 0.12, g);
      part('sph', '#11161c', 0.055, 0.035, 0.055, s * 0.3, 0.095, 0.24, g);
    }
    part('box', '#11161c', 0.22, 0.045, 0.055, -0.2, 0.1, 0.24, g);
    part('box', '#11161c', 0.055, 0.045, 0.22, -0.2, 0.1, 0.24, g);
    for (const [x, z, color] of [[0.2, 0.29, '#3ba3ff'], [0.31, 0.19, '#ef476f'], [0.09, 0.19, '#06d6a0'], [0.2, 0.09, '#ffd166']]) {
      part('sph', color, 0.045, 0.035, 0.045, x, 0.1, z, g);
    }
    part('box', '#b9c1cb', 0.12, 0.035, 0.08, 0, 0.1, -0.01, g);
  } else if (kind === 'luvas') {
    for (const s of [-1, 1]) {
      const glove = part('sph', '#d62828', 0.22, 0.2, 0.25, s * 0.17, 0, 0.38, g);
      glove.rotation.x = -0.2;
      part('box', '#f8f9fa', 0.12, 0.1, 0.1, s * 0.17, -0.16, 0.43, g);
    }
  } else if (kind === 'lata') {
    const body = new THREE.Mesh(kaiserCanGeometry, [kaiserCanMaterial, kaiserCanEndMaterial, kaiserCanEndMaterial]);
    body.scale.set(0.19, 0.63, 0.19); body.position.set(0, 0.35, 0.35); body.rotation.y = Math.PI; body.castShadow = true; g.add(body);
    const shoulder = new THREE.Mesh(kaiserShoulderGeometry, kaiserCanEndMaterial);
    shoulder.position.set(0, 0.685, 0.35); shoulder.castShadow = true; g.add(shoulder);
    part('cyl', '#a8afb7', 0.14, 0.03, 0.14, 0, 0.7, 0.35, g);
    part('cyl', '#a8afb7', 0.18, 0.03, 0.18, 0, 0.035, 0.35, g);
    g.scale.setScalar(0.45);
    g.userData.kaiserCan = true;
  } else if (kind === 'cauchera') {
    const h = part('cyl', '#8b5a2b', 0.045, 0.4, 0.045, 0, 0, 0.18, g); h.rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) { const p = part('cyl', '#8b5a2b', 0.035, 0.32, 0.035, s * 0.1, 0, 0.48, g); p.rotation.set(Math.PI / 2, 0, 0); p.rotation.z = 0; p.position.x = s * 0.1; }
    part('box', '#c1121f', 0.2, 0.03, 0.03, 0, 0, 0.64, g);
  } else if (kind === 'raquete') {
    const hoop = new THREE.Mesh(racketHoop, M('#e9eef2', { metalness: 0.35, roughness: 0.45 }));
    hoop.position.set(0, 0.05, 0.83); hoop.scale.set(1, 1.2, 1); g.add(hoop);
    const shaft = part('cyl', '#516c80', 0.045, 0.52, 0.045, 0, 0, 0.47, g); shaft.rotation.x = Math.PI / 2;
    const grip = part('cyl', '#c94b55', 0.052, 0.23, 0.052, 0, 0, 0.2, g); grip.rotation.x = Math.PI / 2;
    for (let i = -2; i <= 2; i++) {
      part('box', '#c9d2d9', 0.012, 0.76, 0.012, i * 0.1, 0.05, 0.84, g);
      part('box', '#c9d2d9', 0.58, 0.012, 0.012, 0, i * 0.11, 0.84, g);
    }
    shaft.material = M('#516c80'); grip.material = M('#c94b55');
  } else if (kind === 'frango') {
    const meat = part('sph', '#ee9eaa', 0.22, 0.24, 0.38, 0, 0.02, 0.22, g); meat.rotation.x = -0.55;
    const bone = part('cyl', '#fff1df', 0.055, 0.42, 0.055, 0, -0.03, 0.62, g); bone.rotation.x = Math.PI / 2;
    for (const x of [-0.08, 0.08]) part('sph', '#fff1df', 0.085, 0.085, 0.085, x, -0.03, 0.82, g);
    meat.material = M('#ee9eaa'); bone.material = M('#fff1df');
  }
  return g;
}
function buildSedan() {
  const root = new THREE.Group();
  part('box', '#f8f9fa', 2.3, 0.65, 4.1, 0, 0.72, 0, root);
  part('box', '#f8f9fa', 1.8, 0.58, 2.15, 0, 1.2, -0.05, root);
  part('box', '#83b9cc', 1.68, 0.42, 0.88, 0, 1.27, 0.61, root);
  part('box', '#83b9cc', 1.68, 0.42, 0.92, 0, 1.27, -0.67, root);
  for (const x of [-1, 1]) for (const z of [-1.25, 1.25]) {
    const wheel = part('cyl', '#22252a', 0.32, 0.18, 0.32, x * 0.92, 0.42, z, root);
    wheel.rotation.z = Math.PI / 2;
    part('cyl', '#adb5bd', 0.16, 0.19, 0.16, x * 0.92, 0.42, z, root).rotation.z = Math.PI / 2;
  }
  for (const x of [-0.76, 0.76]) {
    part('box', '#ffd166', 0.38, 0.16, 0.04, x, 0.81, 2.08, root);
    part('box', '#e63946', 0.38, 0.16, 0.04, x, 0.81, -2.08, root);
  }
  return root;
}
// Pitch-side VAR monitor on a pole; the screen swaps to the decision texture after the review.
function buildVarTV() {
  const root = new THREE.Group();
  part('cyl', '#2b2f35', 0.42, 0.08, 0.42, 0, 0.04, 0, root);
  part('cyl', '#3a3f46', 0.06, 1.4, 0.06, 0, 0.74, 0, root);
  part('box', '#252a30', 1.85, 1.25, 0.28, 0, 2.05, 0, root);
  part('box', '#ffdb2e', 1.85, 0.16, 0.3, 0, 1.36, 0, root);
  const screen = new THREE.Mesh(varScreenGeometry, varScreenMaterial);
  screen.position.set(0, 2.06, 0.146); root.add(screen);
  root.userData.screen = screen;
  return root;
}
// Referee in Flamengo's red-and-black hooped shirt, with whistle and a hidden red card in the hand.
function buildReferee() {
  const rig = buildKid({ skin: '#a86b3c', shirt: '#d62828', stripe: '#d62828', shorts: '#f8f9fa', socks: '#151719', shoes: '#151719', hair: '#1b1b1b', shortHair: true });
  for (const y of [0.69, 0.79, 0.89, 0.99]) part('cyl', '#151719', 0.308, 0.05, 0.258, 0, y, 0, rig.body);
  for (const s of [-1, 1]) part('cyl', '#151719', 0.135, 0.04, 0.135, s * 0.36, 0.96, 0, rig.body);
  const whistle = part('cyl', '#c9d2d9', 0.035, 0.11, 0.035, 0.03, -0.13, 0.43, rig.head);
  whistle.rotation.x = Math.PI / 2;
  const card = part('box', '#e01e2b', 0.28, 0.38, 0.03, 0, -0.3, 0.05, rig.hand);
  card.visible = false;
  return { ...rig, card, whistle };
}
function buildChairGuitar() {
  const root = new THREE.Group();
  for (const x of [-0.34, 0.34]) {
    part('box', '#744c32', 0.07, 0.72, 0.07, x, 0.38, -0.18, root);
    part('box', '#744c32', 0.07, 0.45, 0.07, x, 0.23, 0.18, root);
  }
  part('box', '#986b45', 0.82, 0.09, 0.7, 0, 0.78, 0, root);
  part('box', '#986b45', 0.82, 0.72, 0.09, 0, 1.18, -0.28, root);
  const guitar = new THREE.Group(); guitar.position.set(0.38, 1.25, 0.35); guitar.rotation.x = -0.3; root.add(guitar);
  part('sph', '#bd7d3c', 0.34, 0.48, 0.15, 0, 0, 0, guitar);
  part('sph', '#e0aa66', 0.21, 0.3, 0.16, 0, 0.14, 0.02, guitar);
  const neck = part('box', '#754c29', 0.12, 0.78, 0.1, 0, 0.62, 0, guitar); neck.rotation.z = -0.25;
  part('cyl', '#5a3a22', 0.13, 0.08, 0.13, -0.1, 1.02, 0, guitar);
  return { root, guitar };
}
function buildSkateboard() {
  const root = new THREE.Group();
  part('box', '#d62828', 0.62, 0.12, 1.55, 0, 0, 0, root);
  for (const z of [-0.48, 0.48]) {
    part('box', '#adb5bd', 0.46, 0.08, 0.12, 0, -0.1, z, root);
    for (const x of [-0.24, 0.24]) part('cyl', '#292d32', 0.13, 0.1, 0.13, x, -0.2, z, root).rotation.z = Math.PI / 2;
  }
  return root;
}
function buildLifebuoy() {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.2, 8, 18), M('#f8f9fa'));
  for (let i = 0; i < 4; i++) {
    const patch = part('box', '#e63946', 0.25, 0.36, 0.18, Math.cos(i * Math.PI / 2) * 0.7, 0, Math.sin(i * Math.PI / 2) * 0.7, ring);
    patch.rotation.y = -i * Math.PI / 2;
  }
  return ring;
}
function trompoMesh() {
  const g = new THREE.Group();
  const body = part('cone', '#e9c46a', 0.3, 0.5, 0.3, 0, 0, 0, g); body.rotation.x = Math.PI;
  part('cyl', '#d62828', 0.31, 0.07, 0.31, 0, 0.17, 0, g);
  part('cyl', '#1d3fbb', 0.27, 0.05, 0.27, 0, 0.08, 0, g);
  part('cyl', '#aaa', 0.03, 0.15, 0.03, 0, -0.3, 0, g);
  part('sph', '#6b4226', 0.09, 0.08, 0.09, 0, 0.28, 0, g);
  return g;
}

// ================= FX =================
const PMAX = 700;
const pMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), PMAX);
pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pMesh.frustumCulled = false; scene.add(pMesh);
const parts = [];
{ const c = new THREE.Color(1, 1, 1); const z = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < PMAX; i++) { parts.push({ life: 0 }); pMesh.setColorAt(i, c); pMesh.setMatrixAt(i, z); } }
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _col = new THREE.Color();
let pIdx = 0;
function particle(x, y, z, vx, vy, vz, color, size, life, grav = -14, drag = 2) {
  pIdx = (pIdx + 1) % PMAX; const p = parts[pIdx];
  p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.size = size; p.life = life; p.max = life; p.grav = grav; p.drag = drag;
  p.rx = Math.random() * 6; p.spin = rand(-8, 8);
  _col.set(color); pMesh.setColorAt(pIdx, _col); pMesh.instanceColor.needsUpdate = true;
}
function burst(x, y, z, color, n = 10, spd = 5, size = 0.18, life = 0.5, grav = -14, up = 3) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = spd * rand(0.3, 1);
    particle(x, y, z, Math.sin(a) * s, rand(0.3, 1) * up, Math.cos(a) * s, Array.isArray(color) ? pick(color) : color, size * rand(0.6, 1.25), life * rand(0.6, 1.2), grav);
  }
}
function updateParticles(dt) {
  for (let i = 0; i < PMAX; i++) {
    const p = parts[i];
    if (p.life <= 0) { if (p.max) { p.max = 0; _m4.makeScale(0, 0, 0); pMesh.setMatrixAt(i, _m4); } continue; }
    p.life -= dt; p.vy += p.grav * dt; const k = Math.exp(-p.drag * dt); p.vx *= k; p.vz *= k;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.y < 0.05) { p.y = 0.05; p.vy *= -0.3; p.vx *= 0.7; p.vz *= 0.7; }
    p.rx += p.spin * dt;
    const s = p.size * Math.min(1, Math.max(0, p.life / p.max) * 1.5);
    _e.set(p.rx, p.rx * 0.7, 0); _q.setFromEuler(_e); _s.set(s, s, s); _p.set(p.x, p.y, p.z);
    _m4.compose(_p, _q, _s); pMesh.setMatrixAt(i, _m4);
  }
  pMesh.instanceMatrix.needsUpdate = true;
}

const fxObjs = [];
const circGeo = new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2); circGeo.userData.shared = true;
const ringGeo = new THREE.RingGeometry(0.88, 1, 48).rotateX(-Math.PI / 2); ringGeo.userData.shared = true;
function addFx(mesh, dur, update, onEnd) { fxRoot.add(mesh); const o = { mesh, t: 0, dur, update, onEnd }; fxObjs.push(o); return o; }
function basicMat(color, opacity) { return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }); }
function teleCircle(x, z, r, dur, color = '#ff3b30') {
  const g = new THREE.Group(); g.position.set(x, 0.05, z);
  const m1 = basicMat(color, 0.16), m2 = basicMat(color, 0.45);
  const outer = new THREE.Mesh(circGeo, m1); outer.scale.setScalar(r);
  const inner = new THREE.Mesh(circGeo, m2); inner.scale.setScalar(0.01); inner.position.y = 0.01;
  const edge = new THREE.Mesh(ringGeo, m2); edge.scale.setScalar(r);
  g.add(outer, inner, edge);
  return addFx(g, dur, (o) => { inner.scale.setScalar(Math.max(0.01, r * Math.min(1, o.t / o.dur))); });
}
function teleRect(x, z, ang, len, wid, dur, color = '#ff3b30') {
  const g = new THREE.Group(); g.position.set(x, 0.05, z); g.rotation.y = ang;
  const geo = new THREE.PlaneGeometry(wid, 1).rotateX(-Math.PI / 2).translate(0, 0, 0.5);
  const m1 = basicMat(color, 0.16), m2 = basicMat(color, 0.4);
  const outer = new THREE.Mesh(geo, m1); outer.scale.z = len;
  const inner = new THREE.Mesh(geo, m2); inner.scale.z = 0.01; inner.position.y = 0.01;
  g.add(outer, inner);
  return addFx(g, dur, (o) => { inner.scale.z = Math.max(0.01, len * Math.min(1, o.t / o.dur)); }, () => geo.dispose());
}
function shockRing(x, z, maxR, dur, color = '#ffffff') {
  const m = basicMat(color, 0.8); const mesh = new THREE.Mesh(ringGeo, m); mesh.position.set(x, 0.08, z);
  return addFx(mesh, dur, (o) => { const k = o.t / o.dur; mesh.scale.setScalar(0.2 + maxR * k); m.opacity = 0.8 * (1 - k); });
}
function swingArc(x, z, face, range, arc, color = '#ffffff', dur = 0.18) {
  const geo = new THREE.RingGeometry(range * 0.35, range, 28, 1, -Math.PI / 2 - arc / 2, arc).rotateX(-Math.PI / 2);
  const m = basicMat(color, 0.7); m.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, 0.45, z); mesh.rotation.y = face;
  return addFx(mesh, dur, (o) => { const k = o.t / o.dur; m.opacity = 0.7 * (1 - k); mesh.scale.setScalar(0.9 + k * 0.15); }, () => geo.dispose());
}
function updateFx(dt) {
  for (let i = fxObjs.length - 1; i >= 0; i--) {
    const o = fxObjs[i]; o.t += dt;
    if (o.update) o.update(o, dt);
    if (o.t >= o.dur) {
      fxRoot.remove(o.mesh);
      o.mesh.traverse((m) => { if (m.material) m.material.dispose(); });
      if (o.onEnd) o.onEnd();
      fxObjs.splice(i, 1);
    }
  }
}
function clearFx() { for (const o of fxObjs) { fxRoot.remove(o.mesh); o.mesh.traverse((m) => { if (m.material) m.material.dispose(); }); } fxObjs.length = 0; for (const p of parts) p.life = 0; }

// floating text & world labels
const labelsEl = $('labels'); const floaters = []; const worldLabels = [];
function floatText(x, y, z, text, cls = '') {
  if (floaters.length > 45) { const f = floaters.shift(); f.el.remove(); }
  const el = document.createElement('div'); el.className = 'ft ' + cls; el.textContent = text; labelsEl.appendChild(el);
  floaters.push({ el, x, y, z, t: 0, vx: rand(-0.7, 0.7) });
}
function updateFloaters(dt) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]; f.t += dt; f.y += dt * 1.8; f.x += f.vx * dt;
    const s = toScreen(f.x, f.y, f.z); const sc = f.t < 0.12 ? 1 + (0.12 - f.t) * 5 : 1;
    f.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%) scale(${sc})`;
    f.el.style.opacity = f.t > 0.6 ? Math.max(0, 1 - (f.t - 0.6) / 0.3) : 1;
    if (f.t > 0.9) { f.el.remove(); floaters.splice(i, 1); }
  }
}
function makeLabel(html, x, y, z) {
  const el = document.createElement('div'); el.className = 'wl'; el.innerHTML = html; labelsEl.appendChild(el);
  const l = { el, x, y, z, visible: true }; worldLabels.push(l); return l;
}
function removeLabel(l) { if (!l) return; l.el.remove(); const i = worldLabels.indexOf(l); if (i >= 0) worldLabels.splice(i, 1); }
const LABEL_ANCHORS = { top: 'translate(-50%,-100%)', left: 'translate(calc(-100% - 46px),-50%)', right: 'translate(46px,-50%)' };
function updateLabels() {
  for (const l of worldLabels) {
    if (!l.visible) { l.el.style.display = 'none'; continue; }
    l.el.style.display = '';
    const s = toScreen(l.x, l.y, l.z);
    const transform = `translate(${Math.round(s.x)}px,${Math.round(s.y)}px) ${LABEL_ANCHORS[l.anchor] || LABEL_ANCHORS.top}`;
    if (l.transform !== transform) { l.el.style.transform = transform; l.transform = transform; }
  }
}
function clearLabels() { for (const l of worldLabels) l.el.remove(); worldLabels.length = 0; for (const f of floaters) f.el.remove(); floaters.length = 0; }

let shakeAmt = 0, hitstop = 0;
function addShake(a) { shakeAmt = Math.min(1.2, shakeAmt + a); }
