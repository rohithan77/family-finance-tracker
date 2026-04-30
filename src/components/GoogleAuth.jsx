import React, { useState } from 'react';
import { setScriptUrl, testConnection } from '../lib/sheets';
import { saveScriptUrl } from '../lib/storage';

const APPS_SCRIPT_CODE = `const HEADERS = ['id','date','type','category','amount','personName','accountName','notes','rawInput','createdAt'];

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e.parameter.action || '').trim();
    if (action === 'test') return respond({ ok: true, name: ss.getName() });
    if (action === 'getSetup') {
      const s = ss.getSheetByName('Setup');
      const val = s ? s.getRange('A1').getValue() : '';
      return respond({ setup: val ? JSON.parse(val) : null });
    }
    if (action === 'saveSetup') {
      ensureSheet(ss,'Setup').getRange('A1').setValue(e.parameter.data || '');
      return respond({ ok: true });
    }
    if (action === 'getTransactions') {
      return respond({ transactions: readTransactions(ss) });
    }
    if (action === 'addTransaction') {
      const tx = JSON.parse(e.parameter.data || '{}');
      const sheet = ensureSheet(ss,'Transactions');
      if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
      sheet.appendRow(HEADERS.map(h => tx[h] !== undefined ? String(tx[h]) : ''));
      return respond({ ok: true });
    }
    if (action === 'deleteTransaction') {
      const id = e.parameter.id;
      const sheet = ss.getSheetByName('Transactions');
      if (!sheet || sheet.getLastRow() === 0) return respond({ ok: false });
      const ids = sheet.getRange(1,1,sheet.getLastRow(),1).getValues();
      for (let i = 1; i < ids.length; i++) {
        if (String(ids[i][0]) === id) { sheet.deleteRow(i + 1); return respond({ ok: true }); }
      }
      return respond({ ok: false });
    }
    return respond({ error: 'Unknown: ' + action });
  } catch(err) { return respond({ error: err.toString() }); }
}

function readTransactions(ss) {
  // 1. Prefer 'Transactions' tab; fall back to first non-Setup sheet with data
  let sheet = ss.getSheetByName('Transactions');
  if (!sheet || sheet.getLastRow() === 0) {
    const others = ss.getSheets().filter(s => s.getName() !== 'Setup' && s.getLastRow() > 0);
    if (others.length) sheet = others[0];
  }
  if (!sheet || sheet.getLastRow() === 0) return [];

  const nRows = sheet.getLastRow();
  const nCols = Math.max(sheet.getLastColumn(), 1);
  const data = sheet.getRange(1, 1, nRows, nCols).getValues();
  if (!data.length) return [];

  // 2. Detect whether first row is a header row
  const HEADER_WORDS = ['id','date','type','category','amount','person','account','notes',
    'description','memo','debit','credit','narration','particulars','merchant','balance',
    'transaction','rawinput','createdat','name','label','tag'];
  const firstRowLower = data[0].map(v => String(v).toLowerCase().trim());
  const isHeader = firstRowLower.filter(v => v && HEADER_WORDS.some(w => v.includes(w))).length >= 1;
  const headers = isHeader ? firstRowLower : null;
  const rows = isHeader ? data.slice(1) : data;

  // 3. Find column index by possible names
  function col(names) {
    if (!headers) return -1;
    for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return i; }
    // partial match
    for (const n of names) { const i = headers.findIndex(h => h.includes(n)); if (i >= 0) return i; }
    return -1;
  }
  const C = {
    id:      col(['id']),
    date:    col(['date','transaction date','txn date','posting date','value date','trans date']),
    amount:  col(['amount','debit','credit','value','sum','inr','usd','gbp','aud','eur']),
    type:    col(['type','transaction type','kind','dr/cr','cr/dr']),
    cat:     col(['category','label','tag','group','head']),
    notes:   col(['notes','description','memo','details','merchant','narration','particulars','name','rawinput','raw']),
    person:  col(['person','personname','member','who','paid by','by']),
    account: col(['account','accountname','bank','card','source','wallet']),
    created: col(['createdat','created','timestamp','time','createdon']),
  };

  // Positional guesses when no headers
  const noHeader = !headers;

  const tz = Session.getScriptTimeZone();
  const results = [];

  rows.forEach((r, i) => {
    if (!r.some(v => v !== '' && v !== null && v !== undefined)) return; // skip blank rows

    const get = (col, posIdx) => {
      const idx = col >= 0 ? col : (noHeader ? posIdx : -1);
      return (idx >= 0 && r[idx] !== undefined) ? r[idx] : '';
    };

    // Date
    let rawDate = get(C.date, 0);
    let dateStr = '';
    if (rawDate instanceof Date) {
      try { dateStr = Utilities.formatDate(rawDate, tz, 'yyyy-MM-dd'); } catch(e) { dateStr = ''; }
    } else {
      dateStr = String(rawDate).trim();
    }

    // Amount
    let rawAmt = parseFloat(String(get(C.amount, noHeader ? 1 : -1)).replace(/[^0-9.\-]/g,'')) || 0;
    const negative = rawAmt < 0;
    rawAmt = Math.abs(rawAmt);

    // Type
    let typeRaw = String(get(C.type, -1)).toLowerCase().trim();
    let txType = 'expense';
    if (typeRaw.match(/income|credit|receipt|cr|in\b/)) txType = 'income';
    else if (negative) txType = 'expense';

    const notes = String(get(C.notes, noHeader ? 2 : -1)).trim();
    const category = String(get(C.cat, -1)).trim();
    const id = String(get(C.id, -1)).trim() || ('row-' + (i + (isHeader ? 2 : 1)));

    if (!dateStr && rawAmt === 0 && !notes) return; // truly empty

    results.push({
      id: id,
      date: dateStr,
      type: txType,
      category: category,
      amount: rawAmt,
      personName: String(get(C.person, -1)).trim(),
      accountName: String(get(C.account, -1)).trim(),
      notes: notes,
      rawInput: notes,
      createdAt: String(get(C.created, -1)).trim() || dateStr || new Date().toISOString(),
    });
  });

  return results;
}

function ensureSheet(ss, name) {
  const s = ss.getSheetByName(name); if (s) return s;
  const ns = ss.insertSheet(name);
  if (name === 'Transactions') ns.appendRow(HEADERS);
  return ns;
}
function respond(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }`;

export default function SheetConnect({ onConnect }) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleConnect = async () => {
    const trimmed = url.trim();
    if (!trimmed) { setError('Paste your Web App URL above'); return; }
    setTesting(true);
    setError('');
    try {
      setScriptUrl(trimmed);
      const result = await testConnection();
      if (!result.ok) throw new Error('Script returned an unexpected response');
      saveScriptUrl(trimmed);
      onConnect(trimmed);
    } catch (e) {
      setScriptUrl('');
      const msg = e.message || '';
      setError(msg.includes('warming up')
        ? msg
        : `Could not connect — check the URL and make sure "Who has access" is set to Anyone. (${msg})`
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="connect-card">
        <div className="auth-logo">💰</div>
        <h1 className="auth-title">Family Finance</h1>
        <p className="auth-tagline">Your data lives in your own Google Sheet — no logins, no verification.</p>

        <div className="connect-steps">
          {/* Step 1 */}
          <div className="connect-step">
            <div className="step-num">1</div>
            <div className="step-body">
              <div className="step-title">Create a Google Sheet</div>
              <div className="step-desc">
                Open{' '}
                <a className="step-link" href="https://sheets.new" target="_blank" rel="noreferrer">
                  sheets.new
                </a>{' '}
                to create a new sheet. Give it any name you like.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="connect-step">
            <div className="step-num">2</div>
            <div className="step-body">
              <div className="step-title">Open Apps Script</div>
              <div className="step-desc">
                In your sheet, click <strong>Extensions → Apps Script</strong>. Delete any existing code, then paste the script below:
              </div>
              <div className="code-block-wrap">
                <pre className="code-block">{APPS_SCRIPT_CODE}</pre>
                <button className="copy-btn" onClick={handleCopy}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="connect-step">
            <div className="step-num">3</div>
            <div className="step-body">
              <div className="step-title">Deploy as Web App</div>
              <div className="step-desc">
                Click <strong>Deploy → New deployment</strong>. Choose type <strong>Web app</strong>. Set:
                <ul className="step-list">
                  <li><strong>Execute as:</strong> Me</li>
                  <li><strong>Who has access:</strong> Anyone</li>
                </ul>
                Click <strong>Deploy</strong> and authorize when prompted. Copy the <strong>Web app URL</strong>.
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="connect-step">
            <div className="step-num">4</div>
            <div className="step-body">
              <div className="step-title">Paste your Web App URL</div>
              <input
                className="auth-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/…/exec"
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
              <button
                className="btn-primary connect-btn"
                onClick={handleConnect}
                disabled={testing}
              >
                {testing ? 'Connecting…' : 'Test & Connect'}
              </button>
              {error && <div className="auth-error">{error}</div>}
            </div>
          </div>
        </div>

        <p className="auth-privacy">
          🔒 This app only calls your own script URL — your data never leaves your Google Sheet.
        </p>
      </div>
    </div>
  );
}
