// Local storage keys
const SCRIPT_KEY = 'ff_script_url';
const PIN_KEY    = 'ff_pin_hash';
const SETUP_KEY  = 'ff_setup_v3';
const TXN_KEY    = 'ff_txns_v3';

const parse = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// ── Script URL ──────────────────────────────────────────────────────────────
export const getScriptUrl = () => localStorage.getItem(SCRIPT_KEY) || null;
export const saveScriptUrl = (url) => localStorage.setItem(SCRIPT_KEY, url);
export const clearScriptUrl = () => localStorage.removeItem(SCRIPT_KEY);

// ── PIN ─────────────────────────────────────────────────────────────────────
export const getPinHash = () => localStorage.getItem(PIN_KEY) || null;
export const savePinHash = (hash) => localStorage.setItem(PIN_KEY, hash);
export const clearPinHash = () => localStorage.removeItem(PIN_KEY);

export async function hashPin(pin) {
  const data = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Local cache (fast load while syncing) ───────────────────────────────────
export const getCachedSetup = () => parse(SETUP_KEY, null);
export const cacheSetup = (setup) => localStorage.setItem(SETUP_KEY, JSON.stringify(setup));

export const getCachedTransactions = () => parse(TXN_KEY, []);
export const cacheTransactions = (txns) => localStorage.setItem(TXN_KEY, JSON.stringify(txns));

// ── Danger zone ─────────────────────────────────────────────────────────────
export const clearAll = () => {
  [SCRIPT_KEY, PIN_KEY, SETUP_KEY, TXN_KEY].forEach(k => localStorage.removeItem(k));
};
