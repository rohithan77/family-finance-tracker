import React, { useState } from 'react';

export default function SettingsPanel({ setup, onSave, onClose }) {
  const [form, setForm] = useState({
    p1Name: setup.person1?.name || '',
    p1Bank: setup.person1?.bank || '',
    p1Balance: String(setup.person1?.balance ?? 0),
    p2Name: setup.person2?.name || '',
    p2Bank: setup.person2?.bank || '',
    p2Balance: String(setup.person2?.balance ?? 0),
    currency: setup.currency || 'USD',
    dateFormat: setup.dateFormat || 'MM/DD/YYYY',
    lifestyle: setup.lifestyle || 'Moderate',
    dashboardLayout: setup.dashboardLayout || 'Simple',
    incomeCategories: [...(setup.incomeCategories || [])],
    expenseCategories: [...(setup.expenseCategories || [])],
  });

  const [newIncCat, setNewIncCat] = useState('');
  const [newExpCat, setNewExpCat] = useState('');
  const [showDanger, setShowDanger] = useState(false);
  const [saved, setSaved] = useState(false);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addCat = (type) => {
    const raw = type === 'income' ? newIncCat : newExpCat;
    const cat = raw.trim();
    if (!cat) return;
    const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
    setForm((f) => ({ ...f, [key]: [...f[key], cat] }));
    if (type === 'income') setNewIncCat('');
    else setNewExpCat('');
  };

  const removeCat = (type, cat) => {
    const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
    setForm((f) => ({ ...f, [key]: f[key].filter((c) => c !== cat) }));
  };

  const handleSave = () => {
    const updated = {
      person1: {
        name: form.p1Name.trim() || 'Partner 1',
        bank: form.p1Bank.trim() || 'Main Bank',
        balance: parseFloat(form.p1Balance) || 0,
      },
      person2: {
        name: form.p2Name.trim() || 'Partner 2',
        bank: form.p2Bank.trim() || 'Main Bank',
        balance: parseFloat(form.p2Balance) || 0,
      },
      country: setup.country,
      currency: form.currency,
      dateFormat: form.dateFormat,
      lifestyle: form.lifestyle,
      dashboardLayout: form.dashboardLayout,
      incomeCategories: form.incomeCategories,
      expenseCategories: form.expenseCategories,
      incomeSources: setup.incomeSources || [],
    };
    setSaved(true);
    setTimeout(() => {
      onSave(updated);
    }, 300);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'This will permanently delete all your transactions and settings. Continue?'
      )
    ) {
      localStorage.removeItem('ff_setup_v2');
      localStorage.removeItem('ff_transactions_v2');
      window.location.reload();
    }
  };

  return (
    <div
      className="settings-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="settings-panel">
        {/* ── Header ── */}
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="settings-body">
          {/* Family Members */}
          <div className="settings-section">
            <h3>Family Members</h3>

            <div className="settings-person">
              <div className="settings-person-label">Person 1</div>
              <div className="settings-fields">
                <div className="s-field">
                  <label>Name</label>
                  <input
                    value={form.p1Name}
                    onChange={(e) => upd('p1Name', e.target.value)}
                    placeholder="Partner 1"
                  />
                </div>
                <div className="s-field">
                  <label>Bank</label>
                  <input
                    value={form.p1Bank}
                    onChange={(e) => upd('p1Bank', e.target.value)}
                    placeholder="Main Bank"
                  />
                </div>
                <div className="s-field">
                  <label>Opening Balance</label>
                  <input
                    type="number"
                    value={form.p1Balance}
                    onChange={(e) => upd('p1Balance', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="settings-person">
              <div className="settings-person-label">Person 2</div>
              <div className="settings-fields">
                <div className="s-field">
                  <label>Name</label>
                  <input
                    value={form.p2Name}
                    onChange={(e) => upd('p2Name', e.target.value)}
                    placeholder="Partner 2"
                  />
                </div>
                <div className="s-field">
                  <label>Bank</label>
                  <input
                    value={form.p2Bank}
                    onChange={(e) => upd('p2Bank', e.target.value)}
                    placeholder="Main Bank"
                  />
                </div>
                <div className="s-field">
                  <label>Opening Balance</label>
                  <input
                    type="number"
                    value={form.p2Balance}
                    onChange={(e) => upd('p2Balance', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="settings-section">
            <h3>Preferences</h3>
            <div className="settings-fields">
              <div className="s-field">
                <label>Currency</label>
                <select value={form.currency} onChange={(e) => upd('currency', e.target.value)}>
                  {['USD', 'INR', 'AUD', 'GBP', 'EUR', 'CAD'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="s-field">
                <label>Date Format</label>
                <select value={form.dateFormat} onChange={(e) => upd('dateFormat', e.target.value)}>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div className="s-field">
                <label>Dashboard</label>
                <select
                  value={form.dashboardLayout}
                  onChange={(e) => upd('dashboardLayout', e.target.value)}
                >
                  <option value="Simple">Simple</option>
                  <option value="Detailed">Detailed</option>
                </select>
              </div>
              <div className="s-field">
                <label>Lifestyle</label>
                <select value={form.lifestyle} onChange={(e) => upd('lifestyle', e.target.value)}>
                  <option>Basic</option>
                  <option>Moderate</option>
                  <option>Luxury</option>
                </select>
              </div>
            </div>
          </div>

          {/* Income Categories */}
          <div className="settings-section">
            <h3>Income Categories</h3>
            <div className="s-cat-chips">
              {form.incomeCategories.map((cat) => (
                <div key={cat} className="s-chip income-chip">
                  {cat}
                  <button onClick={() => removeCat('income', cat)}>×</button>
                </div>
              ))}
              {form.incomeCategories.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>No categories yet</p>
              )}
            </div>
            <div className="s-cat-add">
              <input
                value={newIncCat}
                onChange={(e) => setNewIncCat(e.target.value)}
                placeholder="Add income category..."
                onKeyDown={(e) => e.key === 'Enter' && addCat('income')}
              />
              <button onClick={() => addCat('income')}>+ Add</button>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="settings-section">
            <h3>Expense Categories</h3>
            <div className="s-cat-chips">
              {form.expenseCategories.map((cat) => (
                <div key={cat} className="s-chip expense-chip">
                  {cat}
                  <button onClick={() => removeCat('expense', cat)}>×</button>
                </div>
              ))}
              {form.expenseCategories.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>No categories yet</p>
              )}
            </div>
            <div className="s-cat-add">
              <input
                value={newExpCat}
                onChange={(e) => setNewExpCat(e.target.value)}
                placeholder="Add expense category..."
                onKeyDown={(e) => e.key === 'Enter' && addCat('expense')}
              />
              <button onClick={() => addCat('expense')}>+ Add</button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-section danger-zone">
            <h3>Danger Zone</h3>
            {!showDanger ? (
              <button className="btn-danger-toggle" onClick={() => setShowDanger(true)}>
                Show danger options
              </button>
            ) : (
              <>
                <p className="danger-warning">
                  These actions are permanent and cannot be undone.
                </p>
                <button className="btn-danger" onClick={handleReset}>
                  🗑 Reset App (delete all data)
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="settings-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saved}
            style={{ opacity: saved ? 0.7 : 1 }}
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
