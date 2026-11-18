// Player settings (volumes, feedback toggles). Pure helpers so they can be unit tested.
const SETTINGS_KEY = 'eltigre_settings_v1';
const SETTINGS_DEFAULTS = Object.freeze({ master: 0.8, music: 0.55, sfx: 0.9, shake: 1, damageNumbers: true, aimAssist: true, muted: false });
const SETTINGS_RANGES = { master: [0, 1], music: [0, 1], sfx: [0, 1], shake: [0, 1.5] };
function sanitizeSettings(raw) {
  const out = { ...SETTINGS_DEFAULTS };
  if (!raw || typeof raw !== 'object') return out;
  for (const key of Object.keys(SETTINGS_DEFAULTS)) {
    const value = raw[key], def = SETTINGS_DEFAULTS[key];
    if (typeof def === 'boolean') { if (typeof value === 'boolean') out[key] = value; continue; }
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const [lo, hi] = SETTINGS_RANGES[key];
    out[key] = Math.min(hi, Math.max(lo, value));
  }
  return out;
}
// Perceptual volume: sliders feel linear when the gain follows a curve.
function volumeCurve(v) { return v <= 0 ? 0 : Math.pow(v, 1.6); }

// ---- music timing ----
// "Mi Nombre Es Jorge" (combat) runs at ~100 BPM; its beat grid starts 0.282s in.
const COMBAT_TRACK = Object.freeze({ bpm: 100.05, phase: 0.282, introSkip: 6, outroSkip: 16, segBars: 8, fade: 0.45 });
// Picks a random bar-aligned excerpt start (in seconds), avoiding the intro/outro and recently used bars.
// `beatInBar` keeps the groove aligned when jumping from a mid-bar position.
function pickExcerpt(duration, recent = [], rng = Math.random, cfg = COMBAT_TRACK, beatInBar = 0) {
  const beat = 60 / cfg.bpm, bar = beat * 4, len = cfg.segBars * bar + cfg.fade + 0.3;
  const first = Math.ceil((cfg.introSkip - cfg.phase) / bar), last = Math.floor((duration - cfg.outroSkip - len - cfg.phase) / bar);
  if (last < first) return { bar: 0, start: cfg.phase, length: Math.max(1, duration - cfg.phase - 1) };
  const all = []; for (let b = first; b <= last; b++) all.push(b);
  const pool = all.filter((b) => !recent.includes(b));
  const choices = pool.length ? pool : all;
  const b = choices[Math.floor(rng() * choices.length)];
  return { bar: b, start: cfg.phase + b * bar + beatInBar * beat, length: len };
}
// Radio loudness (0..1) from the hero's distance to the radio: audible across the yard, clear up close.
function radioProximity(dist, near = 2.5, far = 16) {
  if (dist <= near) return 1;
  if (dist >= far) return 0.12;
  const k = (dist - near) / (far - near);
  return 0.12 + 0.88 * Math.pow(1 - k, 2);
}
