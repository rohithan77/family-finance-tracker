import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  formatCurrency, formatDate, generateId,
  filterByPeriod, getGreeting, parseNLStatement, parseNLQuery, CATEGORY_EMOJIS,
  computeStreak, generateInsights,
} from '../lib/utils';

// ── NL Input ────────────────────────────────────────────────────────────────
function NLInput({ setup, transactions, onSave, onToast }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const textareaRef = useRef(null);

  const fmt    = (n) => formatCurrency(n, setup.currency || 'USD');
  const fmtDt  = (d) => formatDate(d, setup.dateFormat);

  const allAccounts = (personName) => {
    const p = (setup.people || []).find((p) => p.name === personName);
    return p?.accounts || [];
  };

  const handleParse = () => {
    if (!text.trim()) { onToast('Type a transaction or ask a question'); return; }
    // Try query first
    const qr = parseNLQuery(text, setup, transactions);
    if (qr) { setQueryResult(qr); setPreview(null); setEditForm(null); return; }
    // Otherwise treat as transaction entry
    setQueryResult(null);
    const parsed = parseNLStatement(text, setup);
    if (!parsed) return;
    setPreview(parsed);
    setEditForm({
      date: parsed.date,
      personName: parsed.personName,
      accountName: parsed.accountName,
      type: parsed.type,
      category: parsed.category,
      amount: parsed.amount != null ? String(parsed.amount) : '',
      notes: parsed.notes,
    });
  };

  const updEdit = (k, v) =>
    setEditForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'type') {
        next.category = (v === 'income' ? setup.incomeCategories : setup.expenseCategories)?.[0] || '';
      }
      if (k === 'personName') {
        next.accountName = allAccounts(v)[0]?.name || '';
      }
      return next;
    });

  const clearQuery = () => { setQueryResult(null); setText(''); textareaRef.current?.focus(); };

  const handleSave = () => {
    const amt = parseFloat(editForm?.amount);
    if (!amt || amt <= 0) { onToast('Enter a valid amount'); return; }
    onSave({
      id: generateId(),
      date: editForm.date,
      personName: editForm.personName,
      accountName: editForm.accountName,
      type: editForm.type,
      category: editForm.category,
      amount: amt,
      notes: editForm.notes.trim(),
      rawInput: text,
    });
    setText('');
    setPreview(null);
    setEditForm(null);
    setQueryResult(null);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleParse(); }
  };

  const EXAMPLES = [
    'paid $45 for groceries yesterday',
    'got salary $3500 today',
    'electricity bill $120',
    'total groceries from 1st to 15th',
    'how much did I spend this month?',
  ];

  return (
    <div className={`nl-wrap ${preview ? 'has-preview' : ''}`}>
      <div className="nl-input-box">
        <div className="nl-label">
          💬 What happened?
          <span className="nl-shortcut">Ctrl+Enter to parse</span>
        </div>
        <div className="nl-examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="nl-example" onClick={() => { setText(ex); textareaRef.current?.focus(); }}>
              {ex}
            </button>
          ))}
        </div>
        <div className="nl-row">
          <textarea
            ref={textareaRef}
            className="nl-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. paid $89 at Woolworths yesterday   or   total groceries from 1st to 15th"
            rows={2}
          />
          <button className="nl-parse-btn" onClick={handleParse} disabled={!text.trim()}>
            Parse ↗
          </button>
        </div>
      </div>

      {queryResult && (
        <div className="query-answer">
          <div className="query-answer-main">
            <span className="query-answer-icon">🔍</span>
            <span className="query-answer-text">{queryResult.answer}</span>
          </div>
          {queryResult.filtered.length > 0 && (
            <div className="query-txn-list">
              {queryResult.filtered.slice(0, 6).map((t, i) => (
                <div key={i} className="query-txn-row">
                  <span className="query-txn-date">{fmtDt(t.date)}</span>
                  <span className="query-txn-cat">{CATEGORY_EMOJIS[t.category] || '📌'} {t.category}</span>
                  {t.notes && t.notes !== t.rawInput && <span className="query-txn-note">{t.notes}</span>}
                  <span className={`query-txn-amt ${t.type}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</span>
                </div>
              ))}
              {queryResult.filtered.length > 6 && (
                <div className="query-more">…and {queryResult.filtered.length - 6} more</div>
              )}
            </div>
          )}
          <button className="query-clear" onClick={clearQuery}>Clear ✕</button>
        </div>
      )}

      {preview && editForm && (
        <div className="nl-preview">
          <div className="nl-preview-header">
            <span className="nl-preview-label">✦ Review & confirm — edit anything below</span>
          </div>
          <div className="nl-preview-grid">
            <div className="nl-field">
              <label>Type</label>
              <div className="type-toggle">
                <button type="button" className={editForm.type === 'income' ? 'active income' : ''} onClick={() => updEdit('type', 'income')}>Income</button>
                <button type="button" className={editForm.type === 'expense' ? 'active expense' : ''} onClick={() => updEdit('type', 'expense')}>Expense</button>
              </div>
            </div>
            <div className="nl-field">
              <label>Category</label>
              <select value={editForm.category} onChange={(e) => updEdit('category', e.target.value)}>
                {(editForm.type === 'income' ? setup.incomeCategories : setup.expenseCategories)?.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="nl-field">
              <label>Amount</label>
              <input
                type="number" value={editForm.amount} onChange={(e) => updEdit('amount', e.target.value)}
                placeholder="0.00" min="0.01" step="0.01"
                className={!editForm.amount ? 'missing' : ''}
              />
            </div>
            <div className="nl-field">
              <label>Person</label>
              <select value={editForm.personName} onChange={(e) => updEdit('personName', e.target.value)}>
                {(setup.people || []).map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                <option value="Both">Both</option>
              </select>
            </div>
            {allAccounts(editForm.personName).length > 0 && (
              <div className="nl-field">
                <label>Account</label>
                <select value={editForm.accountName} onChange={(e) => updEdit('accountName', e.target.value)}>
                  {allAccounts(editForm.personName).map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
            )}
            <div className="nl-field">
              <label>Date</label>
              <input type="date" value={editForm.date} onChange={(e) => updEdit('date', e.target.value)} />
            </div>
            <div className="nl-field nl-field-wide">
              <label>Notes</label>
              <input type="text" value={editForm.notes} onChange={(e) => updEdit('notes', e.target.value)} placeholder="Additional notes..." />
            </div>
          </div>
          <div className="nl-preview-actions">
            <button className="nl-save-btn" onClick={handleSave}>✓ Save Transaction</button>
            <button className="nl-discard-btn" onClick={() => { setPreview(null); setEditForm(null); }}>Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({
  setup, transactions, onSave, onDelete, onSync, syncing, syncError, onOpenSettings, onOpenCSV,
}) {
  const [period, setPeriod] = useState('month');
  const [filters, setFilters] = useState({ person: '', type: '', category: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg) => setToast(msg);

  const handleSave = (tx) => { onSave(tx); showToast('Transaction saved!'); };
  const handleDelete = (id) => { onDelete(id); setDeleteId(null); showToast('Deleted'); };

  const currency = setup.currency || 'USD';
  const fmt = (n) => formatCurrency(n, currency);
  const fmtDate = (d) => formatDate(d, setup.dateFormat);
  const people = (setup.people || []).map((p) => p.name);

  const periodTxns = filterByPeriod(transactions, period);
  const filtered = periodTxns.filter(
    (t) =>
      (!filters.person || t.personName === filters.person) &&
      (!filters.type || t.type === filters.type) &&
      (!filters.category || t.category === filters.category)
  );

  const income = periodTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = periodTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Running balance = all-time cumulative (carries forward across months)
  const allIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = allIncome - allExpense;
  const periodNet = income - expense;

  const expByCat = {}, incByCat = {};
  periodTxns.forEach((t) => {
    if (t.type === 'expense') expByCat[t.category] = (expByCat[t.category] || 0) + t.amount;
    else incByCat[t.category] = (incByCat[t.category] || 0) + t.amount;
  });
  const topExp = Object.entries(expByCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topInc = Object.entries(incByCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxExp = topExp[0]?.[1] || 1;
  const maxInc = topInc[0]?.[1] || 1;

  const isDetailed = setup.dashboardLayout === 'Detailed';
  const allCategories = [...new Set([...(setup.incomeCategories || []), ...(setup.expenseCategories || [])])];

  const streak   = useMemo(() => computeStreak(transactions), [transactions]);
  const insights = useMemo(() => generateInsights(transactions, setup), [transactions, setup]);

  const catTargets = setup.targets?.categories || {};
  const hasTargets = Object.keys(catTargets).some(k => catTargets[k] > 0);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-logo">💰 <span>Family Finance</span></div>
        <div className="header-right">
          <button className={`sync-btn ${syncing ? 'syncing' : ''}`} onClick={onSync} title="Sync with Google Sheets">
            {syncing ? <><div className="spinner" /> Syncing…</> : '⟳ Sync'}
          </button>
          <button className="btn-csv" onClick={onOpenCSV} title="Import bank CSV">↑ CSV</button>
          <button className="btn-settings" onClick={onOpenSettings}>⚙ Settings</button>
        </div>
      </header>

      {syncError && (
        <div className="sync-error-banner" onClick={() => onSync()}>
          ⚠ {syncError} — tap to retry
        </div>
      )}

      <main className="app-main">
        <div className="dash-greeting">
          <h1>{getGreeting()}, {setup.people?.[0]?.name || 'there'}!</h1>
          <p>Just describe what happened — I'll figure out the rest.</p>
        </div>

        <NLInput setup={setup} transactions={transactions} onSave={handleSave} onToast={showToast} />

        <div className="period-tabs" style={{ marginTop: 24 }}>
          {[
            { key: 'month', label: 'This Month' },
            { key: '3months', label: '3 Months' },
            { key: 'year', label: 'This Year' },
            { key: 'all', label: 'All Time' },
          ].map((p) => (
            <button key={p.key} className={`period-tab ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="summary-cards">
          <div className="summary-card income-card">
            <div className="card-label">Income</div>
            <div className="card-value income-val">{fmt(income)}</div>
            <div className="card-sub">{periodTxns.filter((t) => t.type === 'income').length} transactions</div>
          </div>
          <div className="summary-card expense-card">
            <div className="card-label">Expenses</div>
            <div className="card-value expense-val">{fmt(expense)}</div>
            <div className="card-sub">{periodTxns.filter((t) => t.type === 'expense').length} transactions</div>
          </div>
          <div className={`summary-card balance-card ${balance < 0 ? 'negative' : ''}`}>
            <div className="card-label">Running Balance</div>
            <div className={`card-value ${balance >= 0 ? 'income-val' : 'expense-val'}`}>{fmt(balance)}</div>
            <div className="card-sub">
              {period !== 'all'
                ? `${periodNet >= 0 ? '+' : ''}${fmt(periodNet)} this period`
                : balance >= 0 ? '✓ Saving money' : '⚠ Spending more than earning'}
            </div>
          </div>
        </div>

        {/* ── Streak + Insights ── */}
        {transactions.length > 0 && (
          <div className="insights-row">
            {streak.current > 0 && (
              <div className="streak-badge">
                <span className="streak-fire">🔥</span>
                <div>
                  <div className="streak-count">{streak.current} month{streak.current !== 1 ? 's' : ''}</div>
                  <div className="streak-label">saving streak{streak.best > streak.current ? ` · best: ${streak.best}` : ''}</div>
                </div>
              </div>
            )}
            {insights.length > 0 && (
              <div className="insights-panel">
                {insights.map((ins, i) => (
                  <div key={i} className={`insight-item ${ins.type}`}>
                    <span className="insight-emoji">{ins.emoji}</span>
                    <span className="insight-text">{ins.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Budget targets progress ── */}
        {hasTargets && (
          <div className="targets-section">
            <div className="targets-title">Monthly Budgets</div>
            <div className="targets-grid">
              {Object.entries(catTargets).filter(([, v]) => v > 0).map(([cat, target]) => {
                const spent = expByCat[cat] || 0;
                const pct = Math.min(100, Math.round((spent / target) * 100));
                const over = spent > target;
                return (
                  <div key={cat} className="target-row">
                    <div className="target-info">
                      <span className="target-cat">{CATEGORY_EMOJIS[cat] || '📌'} {cat}</span>
                      <span className={`target-vals ${over ? 'over' : ''}`}>{fmt(spent)} / {fmt(target)}</span>
                    </div>
                    <div className="target-bar-bg">
                      <div className={`target-bar ${over ? 'over' : pct >= 80 ? 'warn' : 'ok'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isDetailed && (
          <div className="breakdown-grid">
            <div className="breakdown-card">
              <h3 className="breakdown-title">Top Expenses</h3>
              {topExp.length === 0 ? <p className="empty-hint">No expenses this period</p> : topExp.map(([cat, val]) => (
                <div key={cat} className="breakdown-row">
                  <div className="breakdown-info">
                    <span className="breakdown-cat">{CATEGORY_EMOJIS[cat] || '📌'} {cat}</span>
                    <span className="breakdown-val expense">{fmt(val)}</span>
                  </div>
                  <div className="breakdown-bar-bg">
                    <div className="breakdown-bar expense-bar" style={{ width: `${((val / maxExp) * 100).toFixed(1)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="breakdown-card">
              <h3 className="breakdown-title">Income Breakdown</h3>
              {topInc.length === 0 ? <p className="empty-hint">No income this period</p> : topInc.map(([cat, val]) => (
                <div key={cat} className="breakdown-row">
                  <div className="breakdown-info">
                    <span className="breakdown-cat">{CATEGORY_EMOJIS[cat] || '💵'} {cat}</span>
                    <span className="breakdown-val income">{fmt(val)}</span>
                  </div>
                  <div className="breakdown-bar-bg">
                    <div className="breakdown-bar income-bar" style={{ width: `${((val / maxInc) * 100).toFixed(1)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="breakdown-card">
              <h3 className="breakdown-title">By Person</h3>
              {people.map((person) => {
                const pIn = periodTxns.filter((t) => t.personName === person && t.type === 'income').reduce((s, t) => s + t.amount, 0);
                const pOut = periodTxns.filter((t) => t.personName === person && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                return (
                  <div key={person} className="person-row">
                    <span className="person-name">{person}</span>
                    <div className="person-vals">
                      <span className="income">+{fmt(pIn)}</span>
                      <span className="expense">-{fmt(pOut)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="filter-bar">
          <span className="filter-label">Filter:</span>
          <select value={filters.person} onChange={(e) => setFilters((f) => ({ ...f, person: e.target.value }))}>
            <option value="">All People</option>
            {people.map((p) => <option key={p} value={p}>{p}</option>)}
            <option value="Both">Both</option>
          </select>
          <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
            <option value="">All Categories</option>
            {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {(filters.person || filters.type || filters.category) && (
            <button className="btn-clear" onClick={() => setFilters({ person: '', type: '', category: '' })}>Clear ✕</button>
          )}
        </div>

        <div className="txn-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <div className="empty-title">{transactions.length === 0 ? 'No transactions yet' : 'No results'}</div>
              <div className="empty-sub">
                {transactions.length === 0
                  ? 'Describe a transaction above — e.g. "paid $45 for groceries"'
                  : 'Try adjusting your filters'}
              </div>
            </div>
          ) : (
            filtered.map((tx) => (
              <div key={tx.id} className={`txn-item ${tx.type}`}>
                <div className="txn-emoji">{CATEGORY_EMOJIS[tx.category] || (tx.type === 'income' ? '💵' : '📌')}</div>
                <div className="txn-info">
                  <div className="txn-cat">{tx.category}</div>
                  <div className="txn-meta">
                    {fmtDate(tx.date)} · {tx.personName}
                    {tx.accountName && <span> · {tx.accountName}</span>}
                    {tx.notes && tx.notes !== tx.rawInput && <span className="txn-note"> · {tx.notes}</span>}
                  </div>
                </div>
                <div className="txn-right">
                  <div className={`txn-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </div>
                  {deleteId === tx.id ? (
                    <div className="delete-confirm">
                      <button className="btn-delete-confirm" onClick={() => handleDelete(tx.id)}>Delete</button>
                      <button className="btn-delete-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn-delete" onClick={() => setDeleteId(tx.id)} title="Delete">🗑</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}
