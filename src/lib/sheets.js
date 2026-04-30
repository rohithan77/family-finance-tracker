// Google Apps Script backend — no OAuth required.
// All operations use GET requests with query params to avoid the
// POST-redirect-to-GET issue with Google Apps Script web apps.

let SCRIPT_URL = '';

export function setScriptUrl(url) {
  SCRIPT_URL = url;
}

// ── HTTP helper ──────────────────────────────────────────────────────────────

async function apiGet(action, params = {}) {
  if (!SCRIPT_URL) throw new Error('no_script_url');
  const qs = new URLSearchParams({ action, ...params }).toString();
  const resp = await fetch(`${SCRIPT_URL}?${qs}`, { redirect: 'follow' });
  const text = await resp.text();
  try {
    const data = JSON.parse(text);
    if (data.error) throw new Error(data.error);
    return data;
  } catch (parseErr) {
    const trimmed = text.trim();
    if (trimmed === 'Ready' || trimmed === '') {
      throw new Error('Script is warming up — click "Test & Connect" again in a moment.');
    }
    throw new Error(`Script returned unexpected response: "${trimmed.slice(0, 60)}"`);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function testConnection() {
  return apiGet('test');
}

export async function getSetup() {
  const data = await apiGet('getSetup');
  return data.setup || null;
}

export async function saveSetup(setup) {
  await apiGet('saveSetup', { data: JSON.stringify(setup) });
}

export async function getTransactions() {
  const data = await apiGet('getTransactions');
  return data.transactions || [];
}

export async function appendTransaction(tx) {
  await apiGet('addTransaction', { data: JSON.stringify(tx) });
}

export async function removeTransaction(txId) {
  await apiGet('deleteTransaction', { id: txId });
}
