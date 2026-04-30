import React, { useState } from 'react';
import { generateId } from '../lib/utils';
import { getPinHash, savePinHash, clearPinHash, hashPin } from '../lib/storage';

export default function SettingsPanel({ setup, sheetId, onSave, onClose, onDisconnect }) {
  const [people, setPeople] = useState(
    () => (setup.people || []).map((p) => ({ ...p, accounts: (p.accounts || []).map((a) => ({ ...a })) }))
  );
  const [newPersonName, setNewPersonName] = useState('');
  const [newAccount, setNewAccount] = useState({});
  const [currency, setCurrency] = useState(setup.currency || 'USD');
  const [dateFormat, setDateFormat] = useState(setup.dateFormat || 'MM/DD/YYYY');
  const [dashboardLayout, setDashboardLayout] = useState(setup.dashboardLayout || 'Simple');
  const [lifestyle, setLifestyle] = useState(setup.lifestyle || 'Moderate');
  const [incCats, setIncCats] = useState([...(setup.incomeCategories || [])]);
  const [expCats, setExpCats] = useState([...(setup.expenseCategories || [])]);
  const [newIncCat, setNewIncCat] = useState('');
  const [newExpCat, setNewExpCat] = useState('');
  const [showDanger, setShowDanger] = useState(false);
  const [saved, setSaved] = useState(false);

  // PIN state
  const [pinEnabled, setPinEnabled] = useState(!!getPinHash());
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  // ── People helpers ──────────────────────────────────────────────────────────
  const addPerson = () => {
    const name = newPersonName.trim();
    if (!name) return;
    setPeople((ps) => [...ps, { id: generateId(), name, accounts: [{ id: generateId(), name: 'Main Bank', balance: 0 }] }]);
    setNewPersonName('');
  };
  const removePerson = (id) => { if (people.length > 1) setPeople((ps) => ps.filter((p) => p.id !== id)); };
  const updatePersonField = (id, field, value) =>
    setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  // ── Account helpers ─────────────────────────────────────────────────────────
  const addAccount = (personId) => {
    const na = newAccount[personId] || {};
    const name = (na.name || '').trim();
    if (!name) return;
    const acc = { id: generateId(), name, balance: parseFloat(na.balance) || 0 };
    setPeople((ps) => ps.map((p) => p.id === personId ? { ...p, accounts: [...p.accounts, acc] } : p));
    setNewAccount((n) => ({ ...n, [personId]: { name: '', balance: '' } }));
  };
  const removeAccount = (personId, accId) =>
    setPeople((ps) => ps.map((p) => p.id === personId ? { ...p, accounts: p.accounts.filter((a) => a.id !== accId) } : p));
  const updateAccountField = (personId, accId, field, value) =>
    setPeople((ps) => ps.map((p) =>
      p.id === personId ? { ...p, accounts: p.accounts.map((a) => a.id === accId ? { ...a, [field]: value } : a) } : p
    ));
  const updNewAcc = (personId, field, value) =>
    setNewAccount((n) => ({ ...n, [personId]: { ...(n[personId] || {}), [field]: value } }));

  // ── Category helpers ────────────────────────────────────────────────────────
  const addCat = (type) => {
    const raw = type === 'income' ? newIncCat : newExpCat;
    const cat = raw.trim();
    if (!cat) return;
    if (type === 'income') { setIncCats((cs) => [...cs, cat]); setNewIncCat(''); }
    else { setExpCats((cs) => [...cs, cat]); setNewExpCat(''); }
  };
  const removeCat = (type, cat) => {
    if (type === 'income') setIncCats((cs) => cs.filter((c) => c !== cat));
    else setExpCats((cs) => cs.filter((c) => c !== cat));
  };

  // ── PIN helpers ─────────────────────────────────────────────────────────────
  const handleSetPin = async () => {
    if (!/^\d{4}$/.test(newPin)) { setPinMsg('PIN must be exactly 4 digits'); return; }
    const hash = await hashPin(newPin);
    savePinHash(hash);
    setPinEnabled(true);
    setNewPin('');
    setPinMsg('PIN set successfully!');
    setTimeout(() => setPinMsg(''), 2500);
  };
  const handleRemovePin = () => {
    clearPinHash();
    setPinEnabled(false);
    setNewPin('');
    setPinMsg('PIN removed');
    setTimeout(() => setPinMsg(''), 2000);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const updated = {
      people: people.map((p) => ({
        ...p,
        name: p.name.trim() || 'Person',
        accounts: p.accounts.length > 0 ? p.accounts : [{ id: generateId(), name: 'Main Bank', balance: 0 }],
      })),
      country: setup.country,
      currency, dateFormat, lifestyle, dashboardLayout,
      incomeCategories: incCats,
      expenseCategories: expCats,
      incomeSources: setup.incomeSources || [],
    };
    setSaved(true);
    setTimeout(() => onSave(updated), 200);
  };

  const handleReset = () => {
    if (window.confirm('Delete all data and disconnect the sheet?')) {
      onDisconnect();
    }
  };

  const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : null;

  return (
    <div className="settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">

          {/* ── Google Sheet ── */}
          <div className="settings-section">
            <h3>📊 Google Sheet</h3>
            <div className="sheet-info">
              <div className="sheet-id-box">
                <span className="sheet-id-label">ID:</span>
                <span>{sheetId || '—'}</span>
              </div>
              <div className="sheet-actions">
                {sheetUrl && (
                  <a className="btn-open-sheet" href={sheetUrl} target="_blank" rel="noreferrer">
                    Open in Sheets ↗
                  </a>
                )}
                <button className="btn-disconnect" onClick={() => { if (window.confirm('Disconnect this sheet? Your local cache will be cleared.')) onDisconnect(); }}>
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* ── PIN Lock ── */}
          <div className="settings-section">
            <h3>🔒 PIN Lock</h3>
            <div className="pin-status">
              <span>App lock</span>
              <span className={`pin-badge ${pinEnabled ? 'on' : 'off'}`}>{pinEnabled ? 'ON' : 'OFF'}</span>
            </div>
            <div className="pin-set-form">
              <label className="pin-set-label">{pinEnabled ? 'Change PIN — enter new 4-digit PIN' : 'Set a 4-digit PIN to lock the app'}</label>
              <input
                className="pin-set-input"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                onKeyDown={(e) => e.key === 'Enter' && handleSetPin()}
              />
              <div className="pin-actions">
                <button className="btn-set-pin" onClick={handleSetPin}>{pinEnabled ? 'Change PIN' : 'Set PIN'}</button>
                {pinEnabled && <button className="btn-remove-pin" onClick={handleRemovePin}>Remove PIN</button>}
              </div>
              {pinMsg && <div className="pin-msg">{pinMsg}</div>}
            </div>
          </div>

          {/* ── People & Accounts ── */}
          <div className="settings-section">
            <h3>👥 People &amp; Accounts</h3>
            {people.map((person, pIdx) => (
              <div key={person.id} className="settings-person">
                <div className="s-person-header">
                  <input
                    className="s-person-name-input"
                    value={person.name}
                    onChange={(e) => updatePersonField(person.id, 'name', e.target.value)}
                    placeholder={`Person ${pIdx + 1}`}
                  />
                  {people.length > 1 && (
                    <button className="s-remove-person" onClick={() => removePerson(person.id)}>Remove</button>
                  )}
                </div>
                <div className="s-accounts">
                  {person.accounts.map((acc) => (
                    <div key={acc.id} className="s-account-row">
                      <input className="s-acc-name" value={acc.name} onChange={(e) => updateAccountField(person.id, acc.id, 'name', e.target.value)} placeholder="Account name" />
                      <input type="number" className="s-acc-bal" value={acc.balance} onChange={(e) => updateAccountField(person.id, acc.id, 'balance', parseFloat(e.target.value) || 0)} placeholder="Balance" min="0" step="0.01" />
                      <button className="s-acc-remove" onClick={() => removeAccount(person.id, acc.id)}>×</button>
                    </div>
                  ))}
                  <div className="s-add-account">
                    <input className="s-acc-name" value={newAccount[person.id]?.name || ''} onChange={(e) => updNewAcc(person.id, 'name', e.target.value)} placeholder="New account name…" onKeyDown={(e) => e.key === 'Enter' && addAccount(person.id)} />
                    <input type="number" className="s-acc-bal" value={newAccount[person.id]?.balance || ''} onChange={(e) => updNewAcc(person.id, 'balance', e.target.value)} placeholder="Balance" min="0" step="0.01" />
                    <button className="s-acc-add-btn" onClick={() => addAccount(person.id)}>+ Add</button>
                  </div>
                </div>
              </div>
            ))}
            <div className="s-add-person">
              <input value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} placeholder="Add another person…" onKeyDown={(e) => e.key === 'Enter' && addPerson()} />
              <button onClick={addPerson}>+ Add Person</button>
            </div>
          </div>

          {/* ── Preferences ── */}
          <div className="settings-section">
            <h3>⚙️ Preferences</h3>
            <div className="settings-fields">
              <div className="s-field">
                <label>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {['USD','INR','AUD','GBP','EUR','CAD'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="s-field">
                <label>Date Format</label>
                <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div className="s-field">
                <label>Dashboard</label>
                <select value={dashboardLayout} onChange={(e) => setDashboardLayout(e.target.value)}>
                  <option value="Simple">Simple</option>
                  <option value="Detailed">Detailed</option>
                </select>
              </div>
              <div className="s-field">
                <label>Lifestyle</label>
                <select value={lifestyle} onChange={(e) => setLifestyle(e.target.value)}>
                  <option>Basic</option>
                  <option>Moderate</option>
                  <option>Luxury</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Income Categories ── */}
          <div className="settings-section">
            <h3>Income Categories</h3>
            <div className="s-cat-chips">
              {incCats.map((cat) => (
                <div key={cat} className="s-chip income-chip">
                  {cat}<button onClick={() => removeCat('income', cat)}>×</button>
                </div>
              ))}
            </div>
            <div className="s-cat-add">
              <input value={newIncCat} onChange={(e) => setNewIncCat(e.target.value)} placeholder="Add income category…" onKeyDown={(e) => e.key === 'Enter' && addCat('income')} />
              <button onClick={() => addCat('income')}>+ Add</button>
            </div>
          </div>

          {/* ── Expense Categories ── */}
          <div className="settings-section">
            <h3>Expense Categories</h3>
            <div className="s-cat-chips">
              {expCats.map((cat) => (
                <div key={cat} className="s-chip expense-chip">
                  {cat}<button onClick={() => removeCat('expense', cat)}>×</button>
                </div>
              ))}
            </div>
            <div className="s-cat-add">
              <input value={newExpCat} onChange={(e) => setNewExpCat(e.target.value)} placeholder="Add expense category…" onKeyDown={(e) => e.key === 'Enter' && addCat('expense')} />
              <button onClick={() => addCat('expense')}>+ Add</button>
            </div>
          </div>

          {/* ── Danger Zone ── */}
          <div className="settings-section danger-zone">
            <h3>Danger Zone</h3>
            {!showDanger ? (
              <button className="btn-danger-toggle" onClick={() => setShowDanger(true)}>Show danger options</button>
            ) : (
              <>
                <p className="danger-warning">These actions are permanent and cannot be undone.</p>
                <button className="btn-danger" onClick={handleReset}>🗑 Reset &amp; Disconnect</button>
              </>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saved}>
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
