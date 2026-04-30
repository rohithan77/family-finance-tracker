import React, { useState, useEffect } from 'react';
import { getTransactions, addTransaction, deleteTransaction } from '../lib/storage';
import {
  formatCurrency,
  formatDate,
  getTodayDate,
  generateId,
  filterByPeriod,
  getGreeting,
} from '../lib/utils';

function initForm(setup) {
  return {
    date: getTodayDate(),
    person: setup.person1?.name || 'Person 1',
    type: 'expense',
    category: setup.expenseCategories?.[0] || '',
    amount: '',
    notes: '',
  };
}

export default function Dashboard({ setup, onOpenSettings }) {
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState('month');
  const [filters, setFilters] = useState({ person: '', type: '', category: '' });
  const [form, setForm] = useState(() => initForm(setup));
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg) => setToast(msg);

  const upd = (k, v) =>
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'type') {
        const cats =
          v === 'income' ? setup.incomeCategories : setup.expenseCategories;
        next.category = cats?.[0] || '';
      }
      return next;
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) {
      showToast('Enter a valid amount');
      return;
    }
    const tx = {
      id: generateId(),
      date: form.date,
      person: form.person,
      type: form.type,
      category: form.category,
      amount: amt,
      notes: form.notes.trim(),
    };
    const updated = addTransaction(tx);
    setTransactions(updated);
    setForm(initForm(setup));
    setShowForm(false);
    showToast('Transaction added!');
  };

  const handleDelete = (id) => {
    const updated = deleteTransaction(id);
    setTransactions(updated);
    setDeleteId(null);
    showToast('Transaction deleted');
  };

  const currency = setup.currency || 'USD';
  const fmt = (n) => formatCurrency(n, currency);
  const fmtDate = (d) => formatDate(d, setup.dateFormat);
  const people = [setup.person1?.name, setup.person2?.name].filter(Boolean);

  // Period-filtered transactions
  const periodTxns = filterByPeriod(transactions, period);

  // Apply column filters
  const filtered = periodTxns.filter(
    (t) =>
      (!filters.person || t.person === filters.person) &&
      (!filters.type || t.type === filters.type) &&
      (!filters.category || t.category === filters.category)
  );

  const income = periodTxns
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const expense = periodTxns
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  // Category breakdown for Detailed mode
  const expByCat = {};
  const incByCat = {};
  periodTxns.forEach((t) => {
    if (t.type === 'expense')
      expByCat[t.category] = (expByCat[t.category] || 0) + t.amount;
    else incByCat[t.category] = (incByCat[t.category] || 0) + t.amount;
  });
  const topExp = Object.entries(expByCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topInc = Object.entries(incByCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxExp = topExp[0]?.[1] || 1;
  const maxInc = topInc[0]?.[1] || 1;

  const isDetailed = setup.dashboardLayout === 'Detailed';

  const allCategories = [
    ...(setup.incomeCategories || []),
    ...(setup.expenseCategories || []),
  ];

  return (
    <div className="app-layout">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-logo">
          💰 <span>FamilyFinance</span>
        </div>
        <div className="header-right">
          <button className="btn-icon" onClick={onOpenSettings}>
            ⚙️ Settings
          </button>
        </div>
      </header>

      <main className="app-main">
        {/* ── Greeting ── */}
        <div className="dash-greeting">
          <h1>{getGreeting()}, {setup.person1?.name || 'there'}!</h1>
          <p>Here's your family finance overview.</p>
        </div>

        {/* ── Period tabs ── */}
        <div className="period-tabs">
          {[
            { key: 'month', label: 'This Month' },
            { key: '3months', label: '3 Months' },
            { key: 'year', label: 'This Year' },
            { key: 'all', label: 'All Time' },
          ].map((p) => (
            <button
              key={p.key}
              className={`period-tab ${period === p.key ? 'active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Summary cards ── */}
        <div className="summary-cards">
          <div className="summary-card income-card">
            <div className="card-label">Income</div>
            <div className="card-value income-val">{fmt(income)}</div>
            <div className="card-sub">
              {periodTxns.filter((t) => t.type === 'income').length} transactions
            </div>
          </div>

          <div className="summary-card expense-card">
            <div className="card-label">Expenses</div>
            <div className="card-value expense-val">{fmt(expense)}</div>
            <div className="card-sub">
              {periodTxns.filter((t) => t.type === 'expense').length} transactions
            </div>
          </div>

          <div className={`summary-card balance-card ${balance < 0 ? 'negative' : ''}`}>
            <div className="card-label">Net Balance</div>
            <div className={`card-value ${balance >= 0 ? 'income-val' : 'expense-val'}`}>
              {fmt(balance)}
            </div>
            <div className="card-sub">{balance >= 0 ? '✓ Saving money' : '⚠ Over budget'}</div>
          </div>
        </div>

        {/* ── Detailed breakdown ── */}
        {isDetailed && (
          <div className="breakdown-grid">
            <div className="breakdown-card">
              <h3 className="breakdown-title">Top Expenses</h3>
              {topExp.length === 0 ? (
                <p className="empty-hint">No expenses this period</p>
              ) : (
                topExp.map(([cat, val]) => (
                  <div key={cat} className="breakdown-row">
                    <div className="breakdown-info">
                      <span className="breakdown-cat">{cat}</span>
                      <span className="breakdown-val expense">{fmt(val)}</span>
                    </div>
                    <div className="breakdown-bar-bg">
                      <div
                        className="breakdown-bar expense-bar"
                        style={{ width: `${((val / maxExp) * 100).toFixed(1)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="breakdown-card">
              <h3 className="breakdown-title">Income Breakdown</h3>
              {topInc.length === 0 ? (
                <p className="empty-hint">No income this period</p>
              ) : (
                topInc.map(([cat, val]) => (
                  <div key={cat} className="breakdown-row">
                    <div className="breakdown-info">
                      <span className="breakdown-cat">{cat}</span>
                      <span className="breakdown-val income">{fmt(val)}</span>
                    </div>
                    <div className="breakdown-bar-bg">
                      <div
                        className="breakdown-bar income-bar"
                        style={{ width: `${((val / maxInc) * 100).toFixed(1)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="breakdown-card">
              <h3 className="breakdown-title">By Person</h3>
              {people.map((person) => {
                const pIn = periodTxns
                  .filter((t) => t.person === person && t.type === 'income')
                  .reduce((s, t) => s + t.amount, 0);
                const pOut = periodTxns
                  .filter((t) => t.person === person && t.type === 'expense')
                  .reduce((s, t) => s + t.amount, 0);
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

        {/* ── Add Transaction ── */}
        <div className="add-section">
          <button
            className={`add-toggle ${showForm ? 'open' : ''}`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '+ Add Transaction'}
          </button>

          {showForm && (
            <form className="add-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => upd('date', e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Person</label>
                  <select value={form.person} onChange={(e) => upd('person', e.target.value)}>
                    {people.map((p) => <option key={p} value={p}>{p}</option>)}
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Type</label>
                  <div className="type-toggle">
                    <button
                      type="button"
                      className={form.type === 'income' ? 'active income' : ''}
                      onClick={() => upd('type', 'income')}
                    >
                      Income
                    </button>
                    <button
                      type="button"
                      className={form.type === 'expense' ? 'active expense' : ''}
                      onClick={() => upd('type', 'expense')}
                    >
                      Expense
                    </button>
                  </div>
                </div>

                <div className="form-field">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => upd('category', e.target.value)}>
                    {(form.type === 'income'
                      ? setup.incomeCategories
                      : setup.expenseCategories
                    )?.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Amount ({currency})</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => upd('amount', e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-field form-field-wide">
                  <label>Notes (optional)</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => upd('notes', e.target.value)}
                    placeholder="What was this for?"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  Save Transaction
                </button>
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="filter-bar">
          <span className="filter-label">Filter:</span>

          <select
            value={filters.person}
            onChange={(e) => setFilters((f) => ({ ...f, person: e.target.value }))}
          >
            <option value="">All People</option>
            {people.map((p) => <option key={p} value={p}>{p}</option>)}
            <option value="Both">Both</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(filters.person || filters.type || filters.category) && (
            <button
              className="btn-clear"
              onClick={() => setFilters({ person: '', type: '', category: '' })}
            >
              Clear ✕
            </button>
          )}
        </div>

        {/* ── Transaction list ── */}
        <div className="txn-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <div className="empty-title">
                {transactions.length === 0 ? 'No transactions yet' : 'No results'}
              </div>
              <div className="empty-sub">
                {transactions.length === 0
                  ? 'Add your first income or expense above'
                  : 'Try adjusting your filters'}
              </div>
            </div>
          ) : (
            filtered.map((tx) => (
              <div key={tx.id} className={`txn-item ${tx.type}`}>
                <div className={`txn-dot ${tx.type}`} />
                <div className="txn-info">
                  <div className="txn-cat">{tx.category}</div>
                  <div className="txn-meta">
                    {fmtDate(tx.date)} · {tx.person}
                    {tx.notes && <span className="txn-note"> · {tx.notes}</span>}
                  </div>
                </div>
                <div className="txn-right">
                  <div className={`txn-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </div>
                  {deleteId === tx.id ? (
                    <div className="delete-confirm">
                      <button
                        className="btn-delete-confirm"
                        onClick={() => handleDelete(tx.id)}
                      >
                        Delete
                      </button>
                      <button
                        className="btn-delete-cancel"
                        onClick={() => setDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-delete"
                      onClick={() => setDeleteId(tx.id)}
                      title="Delete"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ── Toast ── */}
      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}
