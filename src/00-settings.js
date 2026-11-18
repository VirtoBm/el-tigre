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
