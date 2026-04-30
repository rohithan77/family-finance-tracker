// Google Sheets backend — uses GIS (Google Identity Services) for OAuth
// and the Sheets REST API v4 directly (no gapi client library needed).
//
// Setup: create a Google Cloud project, enable Google Sheets API,
// create an OAuth 2.0 Client ID (Web application type), add your domain
// to "Authorized JavaScript origins", then set REACT_APP_GOOGLE_CLIENT_ID.

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const API = 'https://sheets.googleapis.com/v4';

let tokenClient = null;
let accessToken = null;
let tokenExpiry = 0;

function waitFor(check) {
  return new Promise((resolve) => {
    if (check()) { resolve(); return; }
    const id = setInterval(() => { if (check()) { clearInterval(id); resolve(); } }, 150);
  });
}

export async function initSheets() {
  if (!CLIENT_ID) {
    console.warn('REACT_APP_GOOGLE_CLIENT_ID not set — offline mode only');
    return;
  }
  await waitFor(() => typeof window.google !== 'undefined');
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: () => {},
  });
}

export function isSignedIn() {
  return !!accessToken && Date.now() < tokenExpiry - 5000;
}

export function signIn() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) { reject(new Error('Google not initialized')); return; }
    tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
      accessToken = resp.access_token;
      tokenExpiry = Date.now() + (resp.expires_in || 3600) * 1000;
      resolve();
    };
    tokenClient.requestAccessToken({ prompt: isSignedIn() ? '' : '' });
  });
}

export function signOut() {
  if (accessToken) {
    window.google?.accounts.oauth2.revoke(accessToken, () => {});
    accessToken = null;
    tokenExpiry = 0;
  }
}

// ── HTTP helpers ────────────────────────────────────────────────────────────

async function req(method, path, body = null) {
  if (!isSignedIn()) throw new Error('not_signed_in');
  const opts = {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
  };
  if (body !== null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const resp = await fetch(`${API}${path}`, opts);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${resp.status}`;
    if (resp.status === 401) throw new Error('not_signed_in');
    throw new Error(msg);
  }
  return resp.json();
}

const R = (range) => encodeURIComponent(range);

// ── Sheet setup ─────────────────────────────────────────────────────────────

const TXN_HEADERS = [
  'id', 'date', 'type', 'category', 'amount',
  'personName', 'accountName', 'notes', 'rawInput', 'createdAt',
];

export async function createFamilySheet(familyName = 'Family Finance') {
  const data = await req('POST', '/spreadsheets', {
    properties: { title: `${familyName} — Finance` },
    sheets: [
      { properties: { title: 'Setup', index: 0 } },
      { properties: { title: 'Transactions', index: 1 } },
    ],
  });
  const sheetId = data.spreadsheetId;
  await req('PUT', `/spreadsheets/${sheetId}/values/${R('Transactions!A1:J1')}?valueInputOption=RAW`, {
    values: [TXN_HEADERS],
  });
  return sheetId;
}

export async function validateSheet(sheetId) {
  try {
    const data = await req('GET', `/spreadsheets/${sheetId}`);
    const sheets = data.sheets || [];
    const hasTxn = sheets.some(s => s.properties.title === 'Transactions');
    if (!hasTxn) {
      const addReqs = [];
      if (!sheets.some(s => s.properties.title === 'Setup')) {
        addReqs.push({ addSheet: { properties: { title: 'Setup' } } });
      }
      addReqs.push({ addSheet: { properties: { title: 'Transactions' } } });
      await req('POST', `/spreadsheets/${sheetId}:batchUpdate`, { requests: addReqs });
      await req('PUT', `/spreadsheets/${sheetId}/values/${R('Transactions!A1:J1')}?valueInputOption=RAW`, {
        values: [TXN_HEADERS],
      });
    }
    return { ok: true, title: data.properties?.title || 'Sheet' };
  } catch (e) {
    if (e.message === 'not_signed_in') return { ok: false, error: 'not_signed_in' };
    return { ok: false, error: e.message };
  }
}

// ── Setup ───────────────────────────────────────────────────────────────────

export async function getSetup(sheetId) {
  const data = await req('GET', `/spreadsheets/${sheetId}/values/${R('Setup!A1')}`);
  const val = data.values?.[0]?.[0];
  return val ? JSON.parse(val) : null;
}

export async function saveSetup(sheetId, setup) {
  await req('PUT', `/spreadsheets/${sheetId}/values/${R('Setup!A1')}?valueInputOption=RAW`, {
    values: [[JSON.stringify(setup)]],
  });
}

// ── Transactions ────────────────────────────────────────────────────────────

export async function getTransactions(sheetId) {
  const data = await req('GET', `/spreadsheets/${sheetId}/values/${R('Transactions!A:J')}`);
  const rows = data.values || [];
  if (rows.length <= 1) return [];
  return rows.slice(1)
    .filter(r => r[0])
    .map(row => ({
      id: row[0] || '',
      date: row[1] || '',
      type: row[2] || 'expense',
      category: row[3] || '',
      amount: parseFloat(row[4]) || 0,
      personName: row[5] || '',
      accountName: row[6] || '',
      notes: row[7] || '',
      rawInput: row[8] || '',
      createdAt: row[9] || '',
    }));
}

export async function appendTransaction(sheetId, tx) {
  const row = TXN_HEADERS.map(h => String(tx[h] ?? ''));
  await req(
    'POST',
    `/spreadsheets/${sheetId}/values/${R('Transactions!A:J')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { values: [row] }
  );
}

export async function removeTransaction(sheetId, txId) {
  const idsData = await req('GET', `/spreadsheets/${sheetId}/values/${R('Transactions!A:A')}`);
  const ids = idsData.values || [];
  const rowIndex = ids.findIndex(r => r[0] === txId);
  if (rowIndex === -1) return;

  const sheetData = await req('GET', `/spreadsheets/${sheetId}`);
  const txnSheet = sheetData.sheets?.find(s => s.properties.title === 'Transactions');
  if (!txnSheet) return;

  await req('POST', `/spreadsheets/${sheetId}:batchUpdate`, {
    requests: [{
      deleteDimension: {
        range: {
          sheetId: txnSheet.properties.sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    }],
  });
}
