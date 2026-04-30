import React, { useState } from 'react';
import {
  COUNTRIES,
  INCOME_SOURCES,
  DEFAULT_INCOME_CATS,
  DEFAULT_EXPENSE_CATS,
  QUICK_DEFAULTS,
  generateId,
} from '../lib/utils';

const LIFESTYLE_OPTS = [
  { v: 'Basic', desc: 'Essentials only, tight budget' },
  { v: 'Moderate', desc: 'Comfortable everyday spending' },
  { v: 'Luxury', desc: 'Premium lifestyle, frequent extras' },
];

const TOTAL_STEPS = 6;
const STEP_LABELS = ['People', 'Accounts', 'Income', 'Location', 'Preferences', 'Categories'];

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);

  // People — [{id, name}]
  const [people, setPeople] = useState([{ id: generateId(), name: '' }]);
  const [newPersonName, setNewPersonName] = useState('');

  // Accounts per person — {personId: [{id, name, balance}]}
  const [accounts, setAccounts] = useState({});
  const [newAccount, setNewAccount] = useState({}); // {personId: {name, balance}}

  const [incomeSources, setIncomeSources] = useState(['Salary (full-time)']);
  const [country, setCountry] = useState('US');
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [lifestyle, setLifestyle] = useState('Moderate');
  const [dashboardLayout, setDashboardLayout] = useState('Simple');
  const [expenseCats, setExpenseCats] = useState([...DEFAULT_EXPENSE_CATS]);
  const [newExpCat, setNewExpCat] = useState('');
  const [errors, setErrors] = useState({});

  // ── People helpers ──────────────────────────────────────
  const addPerson = () => {
    const name = newPersonName.trim();
    if (!name) return;
    if (people.some((p) => p.name.toLowerCase() === name.toLowerCase())) return;
    setPeople((ps) => [...ps, { id: generateId(), name }]);
    setNewPersonName('');
  };

  const removePerson = (id) => {
    if (people.length === 1) return;
    setPeople((ps) => ps.filter((p) => p.id !== id));
    setAccounts((a) => { const next = { ...a }; delete next[id]; return next; });
  };

  const updatePersonName = (id, name) => {
    setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  // ── Account helpers ─────────────────────────────────────
  const getAccounts = (personId) => accounts[personId] || [];

  const addAccount = (personId) => {
    const na = newAccount[personId] || {};
    const name = (na.name || '').trim();
    if (!name) return;
    const acc = { id: generateId(), name, balance: parseFloat(na.balance) || 0 };
    setAccounts((a) => ({ ...a, [personId]: [...(a[personId] || []), acc] }));
    setNewAccount((n) => ({ ...n, [personId]: { name: '', balance: '' } }));
  };

  const removeAccount = (personId, accId) => {
    setAccounts((a) => ({
      ...a,
      [personId]: (a[personId] || []).filter((ac) => ac.id !== accId),
    }));
  };

  const updNewAccount = (personId, field, value) => {
    setNewAccount((n) => ({ ...n, [personId]: { ...(n[personId] || {}), [field]: value } }));
  };

  // ── Validate ────────────────────────────────────────────
  const validate = () => {
    if (step === 1) {
      const named = people.filter((p) => p.name.trim());
      if (named.length === 0) { setErrors({ people: 'Add at least one person' }); return false; }
    }
    setErrors({});
    return true;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  const handleCountry = (code) => {
    setCountry(code);
    const c = COUNTRIES.find((c) => c.code === code);
    if (c) setCurrency(c.currency);
  };

  const toggleSrc = (src) =>
    setIncomeSources((ss) =>
      ss.includes(src) ? ss.filter((s) => s !== src) : [...ss, src]
    );

  const addExpCat = () => {
    const cat = newExpCat.trim();
    if (!cat || expenseCats.includes(cat)) return;
    setExpenseCats((cs) => [...cs, cat]);
    setNewExpCat('');
  };

  const finish = () => {
    const namedPeople = people.filter((p) => p.name.trim());
    const setupPeople = namedPeople.map((p) => ({
      id: p.id,
      name: p.name.trim(),
      accounts:
        getAccounts(p.id).length > 0
          ? getAccounts(p.id)
          : [{ id: generateId(), name: 'Main Bank', balance: 0 }],
    }));

    onComplete({
      people: setupPeople,
      currency,
      country,
      dateFormat,
      lifestyle,
      dashboardLayout,
      incomeCategories: [...DEFAULT_INCOME_CATS],
      expenseCategories: expenseCats,
      incomeSources,
    });
  };

  // ── Welcome ─────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="ob-screen">
        <div className="ob-box ob-welcome">
          <div className="ob-logo">💰</div>
          <h1>Family Finance Tracker</h1>
          <p className="ob-tagline">
            Just say what happened — it auto-categorizes everything.
            <br />
            <strong>All data stays private on your device.</strong>
          </p>
          <div className="ob-paths">
            <div className="ob-path" onClick={() => onComplete(QUICK_DEFAULTS)}>
              <div className="ob-path-icon">⚡</div>
              <div className="ob-path-body">
                <div className="ob-path-title">Quick Start</div>
                <div className="ob-path-sub">30 seconds · generic defaults · customize anytime</div>
              </div>
              <div className="ob-path-arrow">→</div>
            </div>
            <div className="ob-path ob-path-outline" onClick={() => setStep(1)}>
              <div className="ob-path-icon">⚙️</div>
              <div className="ob-path-body">
                <div className="ob-path-title">Full Setup</div>
                <div className="ob-path-sub">~2 min · your names, banks, currency, categories</div>
              </div>
              <div className="ob-path-arrow">→</div>
            </div>
          </div>
          <p className="ob-privacy">🔒 No account · No cloud · Your data stays in this browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ob-screen">
      <div className="ob-box ob-setup">
        {/* Step indicator */}
        <div className="ob-steps">
          {STEP_LABELS.map((label, i) => (
            <div
              key={i}
              className={`ob-step-dot ${i + 1 < step ? 'done' : i + 1 === step ? 'active' : ''}`}
            >
              <div className="dot-circle">{i + 1 < step ? '✓' : i + 1}</div>
              <div className="dot-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="ob-step-body">
          {/* ── Step 1: People ── */}
          {step === 1 && (
            <div className="ob-step">
              <h2>Who's tracking finances?</h2>
              <p className="ob-step-desc">
                Add everyone in your family. You can add as many people as you need.
              </p>

              {/* Existing people */}
              <div className="ob-people-list">
                {people.map((p, i) => (
                  <div key={p.id} className="ob-person-row">
                    <span className="ob-person-num">{i + 1}</span>
                    <input
                      className="ob-person-input"
                      value={p.name}
                      onChange={(e) => updatePersonName(p.id, e.target.value)}
                      placeholder={`Person ${i + 1} name`}
                      autoFocus={i === 0}
                    />
                    {people.length > 1 && (
                      <button className="ob-remove-btn" onClick={() => removePerson(p.id)}>×</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add another person */}
              <div className="ob-cat-add" style={{ marginTop: 14 }}>
                <input
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Add another person..."
                  onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                />
                <button onClick={addPerson}>+ Add</button>
              </div>
              {errors.people && <div className="field-error" style={{ marginTop: 8 }}>{errors.people}</div>}
            </div>
          )}

          {/* ── Step 2: Accounts ── */}
          {step === 2 && (
            <div className="ob-step">
              <h2>Bank Accounts</h2>
              <p className="ob-step-desc">
                Add bank accounts for each person. Each person can have multiple accounts.
              </p>

              {people.filter((p) => p.name.trim()).map((person) => (
                <div key={person.id} className="ob-person-block">
                  <div className="ob-person-label">{person.name}</div>

                  {/* Existing accounts */}
                  {getAccounts(person.id).map((acc) => (
                    <div key={acc.id} className="ob-account-row">
                      <span className="ob-account-name">{acc.name}</span>
                      <span className="ob-account-bal">
                        Opening: {acc.balance > 0 ? acc.balance.toFixed(2) : '—'}
                      </span>
                      <button
                        className="ob-remove-btn"
                        onClick={() => removeAccount(person.id, acc.id)}
                      >×</button>
                    </div>
                  ))}

                  {/* Add account row */}
                  <div className="ob-add-account-row">
                    <input
                      value={newAccount[person.id]?.name || ''}
                      onChange={(e) => updNewAccount(person.id, 'name', e.target.value)}
                      placeholder="Account name (e.g. Chase, NAB)"
                      onKeyDown={(e) => e.key === 'Enter' && addAccount(person.id)}
                      className="ob-acc-name-input"
                    />
                    <input
                      type="number"
                      value={newAccount[person.id]?.balance || ''}
                      onChange={(e) => updNewAccount(person.id, 'balance', e.target.value)}
                      placeholder="Opening balance"
                      className="ob-acc-bal-input"
                      min="0"
                      step="0.01"
                    />
                    <button className="ob-add-acc-btn" onClick={() => addAccount(person.id)}>
                      + Add
                    </button>
                  </div>
                </div>
              ))}
              <p className="ob-step-skip">Don't have this info? Skip — you can add accounts anytime in Settings.</p>
            </div>
          )}

          {/* ── Step 3: Income Sources ── */}
          {step === 3 && (
            <div className="ob-step">
              <h2>Income Sources</h2>
              <p className="ob-step-desc">Select all that apply to your household.</p>
              <div className="ob-check-grid">
                {INCOME_SOURCES.map((src) => (
                  <label key={src} className="ob-check-item">
                    <input
                      type="checkbox"
                      checked={incomeSources.includes(src)}
                      onChange={() => toggleSrc(src)}
                    />
                    <span className="ob-check-label">{src}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Location ── */}
          {step === 4 && (
            <div className="ob-step">
              <h2>Location &amp; Currency</h2>
              <p className="ob-step-desc">Sets your currency symbol and date format.</p>
              <div className="ob-field">
                <label>Country</label>
                <select value={country} onChange={(e) => handleCountry(e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="ob-two-col">
                <div className="ob-field">
                  <label>Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {['USD', 'INR', 'AUD', 'GBP', 'EUR', 'CAD'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="ob-field">
                  <label>Date Format</label>
                  <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Preferences ── */}
          {step === 5 && (
            <div className="ob-step">
              <h2>Preferences</h2>
              <p className="ob-step-desc">Customize your dashboard experience.</p>
              <div className="ob-pref-section">
                <div className="ob-pref-label">Lifestyle Type</div>
                <div className="ob-pref-opts">
                  {LIFESTYLE_OPTS.map((opt) => (
                    <div
                      key={opt.v}
                      className={`ob-pref-opt ${lifestyle === opt.v ? 'selected' : ''}`}
                      onClick={() => setLifestyle(opt.v)}
                    >
                      <div className="ob-pref-opt-title">{opt.v}</div>
                      <div className="ob-pref-opt-desc">{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ob-pref-section" style={{ marginTop: 20 }}>
                <div className="ob-pref-label">Dashboard Layout</div>
                <div className="ob-pref-opts two">
                  {[
                    { v: 'Simple', desc: 'Summary cards + transaction list' },
                    { v: 'Detailed', desc: 'Full breakdown by category & person' },
                  ].map((opt) => (
                    <div
                      key={opt.v}
                      className={`ob-pref-opt ${dashboardLayout === opt.v ? 'selected' : ''}`}
                      onClick={() => setDashboardLayout(opt.v)}
                    >
                      <div className="ob-pref-opt-title">{opt.v}</div>
                      <div className="ob-pref-opt-desc">{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6: Categories ── */}
          {step === 6 && (
            <div className="ob-step">
              <h2>Expense Categories</h2>
              <p className="ob-step-desc">Remove what you don't need or add custom ones.</p>
              <div className="ob-cat-chips">
                {expenseCats.map((cat) => (
                  <div key={cat} className="ob-cat-chip">
                    <span>{cat}</span>
                    <button
                      className="ob-cat-remove"
                      onClick={() => setExpenseCats((cs) => cs.filter((c) => c !== cat))}
                    >×</button>
                  </div>
                ))}
              </div>
              <div className="ob-cat-add">
                <input
                  value={newExpCat}
                  onChange={(e) => setNewExpCat(e.target.value)}
                  placeholder="Add custom category..."
                  onKeyDown={(e) => e.key === 'Enter' && addExpCat()}
                />
                <button onClick={addExpCat}>+ Add</button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="ob-nav">
          <button className="ob-btn-back" onClick={back}>← Back</button>
          <span className="ob-step-count">{step} / {TOTAL_STEPS}</span>
          {step < TOTAL_STEPS ? (
            <button className="ob-btn-next" onClick={next}>Next →</button>
          ) : (
            <button className="ob-btn-next" onClick={finish}>Finish →</button>
          )}
        </div>
      </div>
    </div>
  );
}
