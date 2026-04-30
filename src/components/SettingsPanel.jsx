import React, { useState } from 'react';
import './SettingsPanel.css';

export default function SettingsPanel({ setup, onSave, onClose }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(setup);

  const handleSave = () => {
    localStorage.setItem('financeSetup', JSON.stringify(formData));
    onSave(formData);
    setEditMode(false);
  };

  const handleAddCategory = (type, value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [`${type}Categories`]: [...prev[`${type}Categories`], value]
      }));
    }
  };

  const handleRemoveCategory = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Categories`]: prev[`${type}Categories`].filter((_, i) => i !== index)
    }));
  };

  const handleRenameCategory = (type, index, newName) => {
    setFormData(prev => {
      const categories = [...prev[`${type}Categories`]];
      categories[index] = newName;
      return {
        ...prev,
        [`${type}Categories`]: categories
      };
    });
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
        <button onClick={onClose} className="btn-close">✕</button>
      </div>

      {!editMode ? (
        // VIEW MODE
        <div className="settings-view">
          <section className="setting-section">
            <h3>👤 Family Members</h3>
            <div className="info-row">
              <span className="label">Member 1:</span>
              <span className="value">{formData.person1.name} ({formData.person1.bank})</span>
            </div>
            <div className="info-row">
              <span className="label">Member 2:</span>
              <span className="value">{formData.person2.name} ({formData.person2.bank})</span>
            </div>
          </section>

          <section className="setting-section">
            <h3>💱 Preferences</h3>
            <div className="info-row">
              <span className="label">Currency:</span>
              <span className="value">{formData.currency}</span>
            </div>
            <div className="info-row">
              <span className="label">Date Format:</span>
              <span className="value">{formData.dateFormat}</span>
            </div>
            <div className="info-row">
              <span className="label">Dashboard:</span>
              <span className="value">{formData.dashboardLayout}</span>
            </div>
          </section>

          <section className="setting-section">
            <h3>📂 Your Categories</h3>
            <div className="category-preview">
              <div className="category-group">
                <h4>Expenses</h4>
                <ul>
                  {formData.expenseCategories.map((cat, i) => (
                    <li key={i}>{cat}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <button onClick={() => setEditMode(true)} className="btn btn-edit">✏️ Edit Settings</button>
        </div>
      ) : (
        // EDIT MODE
        <div className="settings-edit">
          <form>
            <fieldset className="form-section">
              <legend>👤 Family Members</legend>
              <input
                type="text"
                value={formData.person1.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  person1: { ...prev.person1, name: e.target.value }
                }))}
                placeholder="Member 1 Name"
              />
              <input
                type="text"
                value={formData.person1.bank}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  person1: { ...prev.person1, bank: e.target.value }
                }))}
                placeholder="Bank Name"
              />
              <input
                type="text"
                value={formData.person2.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  person2: { ...prev.person2, name: e.target.value }
                }))}
                placeholder="Member 2 Name"
              />
              <input
                type="text"
                value={formData.person2.bank}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  person2: { ...prev.person2, bank: e.target.value }
                }))}
                placeholder="Bank Name"
              />
            </fieldset>

            <fieldset className="form-section">
              <legend>💱 Preferences</legend>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  currency: e.target.value
                }))}
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="AUD">AUD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
              <select
                value={formData.dateFormat}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dateFormat: e.target.value
                }))}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
              <select
                value={formData.dashboardLayout}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dashboardLayout: e.target.value
                }))}
              >
                <option value="Simple (Income/Expenses only)">Simple (Income/Expenses only)</option>
                <option value="Detailed (with charts & budgets)">Detailed (with charts & budgets)</option>
              </select>
            </fieldset>

            <fieldset className="form-section">
              <legend>📂 Expense Categories</legend>
              <ul className="category-edit-list">
                {formData.expenseCategories.map((cat, idx) => (
                  <li key={idx} className="category-item">
                    <input
                      type="text"
                      value={cat}
                      onChange={(e) => handleRenameCategory('expense', idx, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory('expense', idx)}
                      className="btn-remove"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>

              <div className="add-category-input">
                <input
                  type="text"
                  placeholder="Add new category"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory('expense', e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </fieldset>
          </form>

          <div className="settings-actions">
            <button onClick={handleSave} className="btn btn-primary">✅ Save Changes</button>
            <button onClick={() => setEditMode(false)} className="btn btn-secondary">❌ Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
