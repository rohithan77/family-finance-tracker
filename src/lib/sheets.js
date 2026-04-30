// Google Apps Script backend — no OAuth required.
// User creates a Google Sheet, pastes the provided Apps Script code,
// deploys as Web App (Execute as: Me, Who has access: Anyone),
// then pastes the deployed URL here.

let SCRIPT_URL = '';

export function setScriptUrl(url) {
  SCRIPT_URL = url;
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

async function parseResponse(resp) {
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
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

async function apiGet(action, params = {}) {
  if (!SCRIPT_URL) throw new Error('no_script_url');
  const qs = new URLSearchParams({ action, ...params }).toString();
  const resp = await fetch(`${SCRIPT_URL}?${qs}`, { redirect: 'follow' });
  return parseResponse(resp);
}

async function apiPost(action, body) {
  if (!SCRIPT_URL) throw new Error('no_script_url');
  // Send as text/plain to avoid CORS preflight (Apps Script allows simple requests)
  const resp = await fetch(`${SCRIPT_URL}?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
    redirect: 'follow',
  });
  return parseResponse(resp);
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function testConnection() {
  const data = await apiGet('test');
  return data; // { ok: true, name: '...' }
}

export async function getSetup() {
  const data = await apiGet('getSetup');
  return data.setup || null;
}

export async function saveSetup(setup) {
  await apiPost('saveSetup', setup);
}

export async function getTransactions() {
  const data = await apiGet('getTransactions');
  return data.transactions || [];
}

export async function appendTransaction(tx) {
  await apiPost('addTransaction', tx);
}

export async function removeTransaction(txId) {
  await apiGet('deleteTransaction', { id: txId });
}
