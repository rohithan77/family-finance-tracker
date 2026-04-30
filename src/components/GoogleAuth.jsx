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
    if (action === 'getTransactions') {
      const sheet = ensureSheet(ss,'Transactions');
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return respond({ transactions: [] });
      const txns = data.slice(1).filter(r => r[0]).map(r => {
        const t = {}; HEADERS.forEach((h,i) => { t[h] = r[i]===undefined?'':r[i]; });
        t.amount = parseFloat(t.amount)||0; return t;
      });
      return respond({ transactions: txns });
    }
    if (action === 'deleteTransaction') {
      const id = e.parameter.id;
      const sheet = ensureSheet(ss,'Transactions');
      const ids = sheet.getRange(1,1,sheet.getLastRow(),1).getValues();
      for (let i=1;i<ids.length;i++) { if(ids[i][0]===id){sheet.deleteRow(i+1);return respond({ok:true});} }
      return respond({ ok: false });
    }
    return respond({ error: 'Unknown: '+action });
  } catch(err) { return respond({ error: err.toString() }); }
}
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e.parameter.action||'').trim();
    const body = JSON.parse(e.postData.contents);
    if (action==='saveSetup') { ensureSheet(ss,'Setup').getRange('A1').setValue(JSON.stringify(body)); return respond({ok:true}); }
    if (action==='addTransaction') {
      const sheet = ensureSheet(ss,'Transactions');
      if(sheet.getLastRow()===0) sheet.appendRow(HEADERS);
      sheet.appendRow(HEADERS.map(h=>body[h]!==undefined?String(body[h]):''));
      return respond({ok:true});
    }
    return respond({ error: 'Unknown: '+action });
  } catch(err) { return respond({ error: err.toString() }); }
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
      setError('Could not connect. Check the URL and make sure you deployed with "Anyone" access. ' + e.message);
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
