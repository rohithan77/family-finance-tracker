import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import SettingsPanel from './SettingsPanel';

export default function Dashboard({ setup, onSettingsUpdate }) {
  const [showSettings, setShowSettings] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    person: setup.person1.name,
    type: 'Expense',
    category: setup.expenseCategories[0],
    amount: '',
    notes: ''
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = () => {
    const saved = localStorage.getItem('transactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.date) {
      alert('Please fill in date and amount');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      ...formData,
      amount: parseFloat(formData.amount)
    };

    const updated = [...transactions, newTransaction];
    setTransactions(updated);
    localStorage.setItem('transactions', JSON.stringify(updated));

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      person: setup.person1.name,
      type: 'Expense',
      category: setup.expenseCategories[0],
      amount: '',
      notes: ''
    });
  };

  const handleDeleteTransaction = (id) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem('transactions', JSON.stringify(updated));
  };

  // Calculate summaries
  const income = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  const categoryBreakdown = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const isSimpleLayout = setup.dashboardLayout === 'Simple (Income/Expenses only)';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>💰 Family Finance Tracker</h1>
          <p>
            {setup.person1.name} & {setup.person2.name} • {setup.currency}
          </p>
        </div>
        <button 
          onClick={() => setShowSettings(true)} 
          className="btn-settings"
          title="Edit setup"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <div className="settings-overlay">
          <SettingsPanel
            setup={setup}
            onSave={(updatedSetup) => {
              onSettingsUpdate(updatedSetup);
              setShowSettings(false);
              // Update form categories if needed
              setFormData(prev => ({
                ...prev,
                category: updatedSetup.expenseCategories[0]
              }));
            }}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="summary-cards">
        <div className="card income-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <span className="card-label">Income</span>
            <span className="card-value">
              {setup.currency} {income.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="card expense-card">
          <div className="card-icon">📉</div>
          <div className="card-content">
            <span className="card-label">Expenses</span>
            <span className="card-value">
              {setup.currency} {expenses.toFixed(2)}
            </span>
          </div>
        </div>

        <div className={`card balance-card ${balance >= 0 ? 'positive' : 'negative'}`}>
          <div className="card-icon">💵</div>
          <div className="card-content">
            <span className="card-label">Balance</span>
            <span className="card-value">
              {setup.currency} {balance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="form-section">
        <h2>Add Transaction</h2>
        <form onSubmit={handleAddTransaction}>
          <div className="form-row">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
            <select
              value={formData.person}
              onChange={(e) => setFormData(prev => ({ ...prev, person: e.target.value }))}
            >
              <option value={setup.person1.name}>{setup.person1.name}</option>
              <option value={setup.person2.name}>{setup.person2.name}</option>
            </select>
          </div>

          <div className="form-row">
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            >
              {(formData.type === 'Expense' ? setup.expenseCategories : setup.incomeSources).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <input
              type="number"
              placeholder="Amount"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <button type="submit" className="btn btn-add">➕ Add Transaction</button>
        </form>
      </div>

      {/* DETAILED LAYOUT - CHARTS & BREAKDOWN */}
      {!isSimpleLayout && (
        <div className="detailed-section">
          <h2>Expense Breakdown</h2>
          <div className="category-breakdown">
            {Object.entries(categoryBreakdown).map(([category, amount]) => (
              <div key={category} className="breakdown-item">
                <span className="category-name">{category}</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill"
                    style={{ width: `${(amount / expenses) * 100}%` }}
                  ></div>
                </div>
                <span className="amount">{setup.currency} {amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRANSACTION LIST */}
      <div className="transactions-section">
        <h2>Recent Transactions ({transactions.length})</h2>
        {transactions.length === 0 ? (
          <p className="empty-state">No transactions yet. Add one above! 👆</p>
        ) : (
          <div className="transaction-list">
            {transactions.slice().reverse().map(t => (
              <div key={t.id} className="transaction-row">
                <div className="transaction-info">
                  <div className="transaction-header">
                    <span className="person">{t.person}</span>
                    <span className={`type ${t.type.toLowerCase()}`}>{t.type}</span>
                  </div>
                  <div className="category-note">
                    {t.category} {t.notes && `• ${t.notes}`}
                  </div>
                </div>
                <div className="transaction-amount">
                  <span className={t.type === 'Income' ? 'income' : 'expense'}>
                    {t.type === 'Income' ? '+' : '-'}{setup.currency} {t.amount.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTransaction(t.id)}
                  className="btn-delete"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
