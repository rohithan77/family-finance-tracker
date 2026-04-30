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
      const val = ensureSheet(ss,'Setup').getRange('A1').getValue();
      return respond({ setup: val ? JSON.parse(val) : null });
    }
    if (action === 'saveSetup') {
      const setup = JSON.parse(e.parameter.data || 'null');
      ensureSheet(ss,'Setup').getRange('A1').setValue(JSON.stringify(setup));
      return respond({ ok: true });
    }
    if (action === 'getTransactions') {
      const sheet = findDataSheet(ss);
      if (!sheet || sheet.getLastRow() === 0) return respond({ transactions: [] });
      const nRows = sheet.getLastRow();
      const nCols = Math.max(sheet.getLastColumn(), HEADERS.length);
      const data = sheet.getRange(1, 1, nRows, nCols).getValues();
      // Detect header row: first row contains at least one of our header names
      const firstRow = data[0].map(v => String(v).trim());
      const hasHeader = HEADERS.some(h => firstRow.indexOf(h) >= 0);
      const rows = hasHeader ? data.slice(1) : data;
      // Build column index map (use positional fallback if no header)
      const colIdx = {};
      if (hasHeader) {
        HEADERS.forEach(h => { const i = firstRow.indexOf(h); if (i >= 0) colIdx[h] = i; });
      } else {
        HEADERS.forEach((h, i) => { colIdx[h] = i; });
      }
      const txns = rows.filter(r => r[colIdx['id'] >= 0 ? colIdx['id'] : 0]).map((r, i) => {
        const t = {};
        HEADERS.forEach(h => { const idx = colIdx[h]; t[h] = (idx !== undefined && r[idx] !== undefined) ? r[idx] : ''; });
        t.amount = parseFloat(t.amount) || 0;
        if (!t.id) t.id = 'row-' + i;
        if (!t.type) t.type = 'expense';
        if (!t.createdAt) t.createdAt = t.date || new Date().toISOString();
        return t;
      });
      return respond({ transactions: txns });
    }
    if (action === 'addTransaction') {
      const tx = JSON.parse(e.parameter.data || '{}');
      const sheet = ensureSheet(ss,'Transactions');
      if(sheet.getLastRow()===0) sheet.appendRow(HEADERS);
      sheet.appendRow(HEADERS.map(h=>tx[h]!==undefined?String(tx[h]):''));
      return respond({ ok: true });
    }
    if (action === 'deleteTransaction') {
      const id = e.parameter.id;
      const sheet = ensureSheet(ss,'Transactions');
      if(sheet.getLastRow()===0) return respond({ ok: false });
      const ids = sheet.getRange(1,1,sheet.getLastRow(),1).getValues();
      for (let i=1;i<ids.length;i++) { if(String(ids[i][0])===id){sheet.deleteRow(i+1);return respond({ok:true});} }
      return respond({ ok: false });
    }
    return respond({ error: 'Unknown: '+action });
  } catch(err) { return respond({ error: err.toString() }); }
}
function findDataSheet(ss) {
  // Prefer 'Transactions' tab; fall back to first non-Setup sheet that has rows
  const txn = ss.getSheetByName('Transactions');
  if (txn && txn.getLastRow() > 0) return txn;
  const fallback = ss.getSheets().filter(s => s.getName() !== 'Setup' && s.getLastRow() > 0);
  return fallback.length ? fallback[0] : (txn || null);
}
function ensureSheet(ss,name) {
  const s=ss.getSheetByName(name); if(s) return s;
  const ns=ss.insertSheet(name); if(name==='Transactions') ns.appendRow(HEADERS); return ns;
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
