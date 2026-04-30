import React, { useState, useRef } from 'react';
import { parseCSVFile } from '../lib/csvParser';
import { formatCurrency, formatDate } from '../lib/utils';

export default function CSVUpload({ setup, onImport, onClose }) {
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const fmt    = (n) => formatCurrency(n, setup.currency || 'USD');
  const fmtDt  = (d) => formatDate(d, setup.dateFormat);

  const processFile = (file) => {
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { transactions: txns } = parseCSVFile(e.target.result, setup);
        if (!txns.length) {
          setError('No transactions found. Make sure the file has date and amount columns.');
          return;
        }
        setTransactions(txns);
        setStep('preview');
      } catch (err) {
        setError('Could not parse file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    setStep('importing');
    setProgress(0);
    for (let i = 0; i < transactions.length; i++) {
      await onImport(transactions[i]);
      setProgress(Math.round(((i + 1) / transactions.length) * 100));
    }
    setStep('done');
  };

  const income  = transactions.filter(t => t.type === 'income').length;
  const expense = transactions.filter(t => t.type === 'expense').length;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="csv-modal">
        <div className="csv-modal-header">
          <h2>📂 Import Bank CSV</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        {step === 'upload' && (
          <div className="csv-upload-body">
            <div
              className="csv-drop-zone"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
            >
              <div className="csv-drop-icon">📄</div>
              <div className="csv-drop-title">Drop your bank CSV here</div>
              <div className="csv-drop-sub">or click to browse · .csv or .txt</div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.txt"
                style={{ display: 'none' }}
                onChange={(e) => processFile(e.target.files[0])}
              />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <div className="csv-hint">
              Works with CommBank, ANZ, Westpac, NAB, HDFC, ICICI, SBI, Chase, and most banks.
              Export your statement as CSV from your bank's website or app.
            </div>
          </div>
        )}

        {step === 'preview' && (
          <>
            <div className="csv-summary-row">
              Found <strong>{transactions.length}</strong> transactions —
              <span className="income-text"> {income} income</span> ·
              <span className="expense-text"> {expense} expenses</span>
            </div>
            <div className="csv-table-wrap">
              <table className="csv-table">
                <thead>
                  <tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map((t, i) => (
                    <tr key={i}>
                      <td className="csv-td-date">{fmtDt(t.date) || '—'}</td>
                      <td className="csv-td-desc">{t.notes || '—'}</td>
                      <td>{t.category || '—'}</td>
                      <td><span className={`type-badge ${t.type}`}>{t.type}</span></td>
                      <td className={`csv-amt ${t.type}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length > 20 && (
                <div className="csv-more">…and {transactions.length - 20} more rows</div>
              )}
            </div>
            <div className="csv-actions">
              <button className="btn-cancel" onClick={() => setStep('upload')}>← Back</button>
              <button className="btn-primary" onClick={handleImport}>
                Import {transactions.length} transactions
              </button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div className="csv-progress-body">
            <div className="csv-progress-icon">⏳</div>
            <div className="csv-progress-title">Importing…</div>
            <div className="csv-progress-bar-wrap">
              <div className="csv-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="csv-progress-pct">{progress}%</div>
          </div>
        )}

        {step === 'done' && (
          <div className="csv-done-body">
            <div className="csv-done-icon">✅</div>
            <div className="csv-done-title">Import complete!</div>
            <div className="csv-done-sub">{transactions.length} transactions added successfully.</div>
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
