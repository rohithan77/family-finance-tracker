import React, { useState } from 'react';
import {
  COUNTRIES,
  INCOME_SOURCES,
  DEFAULT_INCOME_CATS,
  DEFAULT_EXPENSE_CATS,
  QUICK_DEFAULTS,
} from '../lib/utils';

const LIFESTYLE_OPTS = [
  { v: 'Basic', desc: 'Essentials only, tight budget' },
  { v: 'Moderate', desc: 'Comfortable everyday spending' },
  { v: 'Luxury', desc: 'Premium lifestyle, frequent extras' },
];

const TOTAL_STEPS = 6;
const STEP_LABELS = ['Family', 'Banks', 'Income', 'Location', 'Preferences', 'Categories'];

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    p1Name: '',
    p1Bank: '',
    p1Balance: '',
    p2Name: '',
    p2Bank: '',
    p2Balance: '',
    incomeSources: ['Salary (full-time)'],
    country: 'US',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    lifestyle: 'Moderate',
    dashboardLayout: 'Simple',
    incomeCategories: [...DEFAULT_INCOME_CATS],
    expenseCategories: [...DEFAULT_EXPENSE_CATS],
  });
  const [newExpCat, setNewExpCat] = useState('');
  const [errors, setErrors] = useState({});

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCountry = (code) => {
    const c = COUNTRIES.find((c) => c.code === code);
    upd('country', code);
    if (c) upd('currency', c.currency);
  };

  const toggleSrc = (src) => {
    setForm((f) => ({
      ...f,
      incomeSources: f.incomeSources.includes(src)
        ? f.incomeSources.filter((s) => s !== src)
        : [...f.incomeSources, src],
    }));
  };

  const removeExpCat = (cat) => {
    setForm((f) => ({ ...f, expenseCategories: f.expenseCategories.filter((c) => c !== cat) }));
  };

  const addExpCat = () => {
    const cat = newExpCat.trim();
    if (!cat) return;
    setForm((f) => ({ ...f, expenseCategories: [...f.expenseCategories, cat] }));
    setNewExpCat('');
  };

  const validate = () => {
    if (step === 1 && !form.p1Name.trim()) {
      setErrors({ p1Name: 'Enter at least one name' });
      return false;
    }
    setErrors({});
    return true;
  };

  const next = () => {
    if (!validate()) return;
    setStep((s) => s + 1);
  };

  const back = () => setStep((s) => s - 1);

  const finish = () => {
    const setup = {
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
      country: form.country,
      currency: form.currency,
      dateFormat: form.dateFormat,
      lifestyle: form.lifestyle,
      dashboardLayout: form.dashboardLayout,
      incomeCategories: [...DEFAULT_INCOME_CATS],
      expenseCategories: form.expenseCategories,
      incomeSources: form.incomeSources,
    };
    onComplete(setup);
  };

  // ── Welcome ─────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="ob-screen">
        <div className="ob-box ob-welcome">
          <div className="ob-logo">💰</div>
          <h1>Family Finance Tracker</h1>
          <p className="ob-tagline">
            Track income, expenses, and savings together.
            <br />
            <strong>All data stays private on your device.</strong>
          </p>

          <div className="ob-paths">
            <div className="ob-path" onClick={() => onComplete(QUICK_DEFAULTS)}>
              <div className="ob-path-icon">⚡</div>
              <div className="ob-path-body">
                <div className="ob-path-title">Quick Start</div>
                <div className="ob-path-sub">30 seconds · sensible defaults · customize anytime</div>
              </div>
              <div className="ob-path-arrow">→</div>
            </div>

            <div className="ob-path ob-path-outline" onClick={() => setStep(1)}>
              <div className="ob-path-icon">⚙️</div>
              <div className="ob-path-body">
                <div className="ob-path-title">Full Setup</div>
                <div className="ob-path-sub">~2 min · names, banks, currencies, categories</div>
              </div>
              <div className="ob-path-arrow">→</div>
            </div>
          </div>

          <p className="ob-privacy">🔒 No account needed · Works offline · Your data, your device</p>
        </div>
      </div>
    );
  }

  // ── Setup wizard ─────────────────────────────────────────
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
          {/* Step 1 – Family Members */}
          {step === 1 && (
            <div className="ob-step">
              <h2>Who's in the family?</h2>
              <p className="ob-step-desc">Names used across the dashboard and transactions.</p>
              <div className="ob-field">
                <label>Person 1 Name *</label>
                <input
                  className={errors.p1Name ? 'error' : ''}
                  value={form.p1Name}
                  onChange={(e) => { upd('p1Name', e.target.value); setErrors({}); }}
                  placeholder="e.g. Sarah"
                  autoFocus
                />
                {errors.p1Name && <div className="field-error">{errors.p1Name}</div>}
              </div>
              <div className="ob-field">
                <label>
                  Person 2 Name <span className="optional">(optional)</span>
                </label>
                <input
                  value={form.p2Name}
                  onChange={(e) => upd('p2Name', e.target.value)}
                  placeholder="e.g. James"
                />
              </div>
            </div>
          )}

          {/* Step 2 – Banks & Balances */}
          {step === 2 && (
            <div className="ob-step">
              <h2>Banks &amp; Opening Balances</h2>
              <p className="ob-step-desc">Track which accounts you're using. Skip or update later.</p>

              <div className="ob-person-block">
                <div className="ob-person-label">{form.p1Name || 'Person 1'}</div>
                <div className="ob-two-col">
                  <div className="ob-field">
                    <label>Bank Name</label>
                    <input
                      value={form.p1Bank}
                      onChange={(e) => upd('p1Bank', e.target.value)}
                      placeholder="e.g. Chase"
                    />
                  </div>
                  <div className="ob-field">
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

              {form.p2Name && (
                <div className="ob-person-block">
                  <div className="ob-person-label">{form.p2Name}</div>
                  <div className="ob-two-col">
                    <div className="ob-field">
                      <label>Bank Name</label>
                      <input
                        value={form.p2Bank}
                        onChange={(e) => upd('p2Bank', e.target.value)}
                        placeholder="e.g. Wells Fargo"
                      />
                    </div>
                    <div className="ob-field">
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
              )}
            </div>
          )}

          {/* Step 3 – Income Sources */}
          {step === 3 && (
            <div className="ob-step">
              <h2>Income Sources</h2>
              <p className="ob-step-desc">Select all that apply to your household.</p>
              <div className="ob-check-grid">
                {INCOME_SOURCES.map((src) => (
                  <label key={src} className="ob-check-item">
                    <input
                      type="checkbox"
                      checked={form.incomeSources.includes(src)}
                      onChange={() => toggleSrc(src)}
                    />
                    <span className="ob-check-label">{src}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 – Location & Currency */}
          {step === 4 && (
            <div className="ob-step">
              <h2>Location &amp; Currency</h2>
              <p className="ob-step-desc">Sets your currency symbol and date format defaults.</p>
              <div className="ob-field">
                <label>Country</label>
                <select value={form.country} onChange={(e) => handleCountry(e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="ob-two-col">
                <div className="ob-field">
                  <label>Currency</label>
                  <select value={form.currency} onChange={(e) => upd('currency', e.target.value)}>
                    {['USD', 'INR', 'AUD', 'GBP', 'EUR', 'CAD'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="ob-field">
                  <label>Date Format</label>
                  <select value={form.dateFormat} onChange={(e) => upd('dateFormat', e.target.value)}>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 5 – Preferences */}
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
                      className={`ob-pref-opt ${form.lifestyle === opt.v ? 'selected' : ''}`}
                      onClick={() => upd('lifestyle', opt.v)}
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
                      className={`ob-pref-opt ${form.dashboardLayout === opt.v ? 'selected' : ''}`}
                      onClick={() => upd('dashboardLayout', opt.v)}
                    >
                      <div className="ob-pref-opt-title">{opt.v}</div>
                      <div className="ob-pref-opt-desc">{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6 – Categories */}
          {step === 6 && (
            <div className="ob-step">
              <h2>Expense Categories</h2>
              <p className="ob-step-desc">Remove what you don't need or add custom ones.</p>
              <div className="ob-cat-chips">
                {form.expenseCategories.map((cat) => (
                  <div key={cat} className="ob-cat-chip">
                    <span>{cat}</span>
                    <button className="ob-cat-remove" onClick={() => removeExpCat(cat)}>×</button>
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
