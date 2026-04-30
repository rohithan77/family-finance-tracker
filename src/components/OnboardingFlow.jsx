import React, { useState } from 'react';
import './OnboardingFlow.css';

const PRESET_CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Bonus', 'Other Income'],
  expenses: ['Food & Groceries', 'Transport', 'Utilities', 'Entertainment', 'Health & Medical', 'Shopping', 'Subscriptions', 'Rent/Mortgage', 'Savings', 'Debt Payment'],
};

const CURRENCIES = ['USD', 'INR', 'AUD', 'GBP', 'EUR', 'CAD'];
const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
const LIFESTYLE_TYPES = ['Basic', 'Moderate', 'Luxury'];
const DASHBOARD_LAYOUTS = ['Simple (Income/Expenses only)', 'Detailed (with charts & budgets)'];

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState('choice'); // choice, quick, full, categories, review, done
  const [setupData, setSetupData] = useState({
    person1: { name: '', bank: '', balance: '' },
    person2: { name: '', bank: '', balance: '' },
    country: '',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    lifestyle: 'Moderate',
    dashboardLayout: 'Simple (Income/Expenses only)',
    incomeCategories: [...PRESET_CATEGORIES.income],
    expenseCategories: [...PRESET_CATEGORIES.expenses],
    incomeSources: [],
    customExpenses: [],
  });

  const handleQuickStart = () => {
    const defaultSetup = {
      ...setupData,
      person1: { name: 'You', bank: 'Bank Account', balance: '0' },
      person2: { name: 'Spouse', bank: 'Bank Account', balance: '0' },
      country: 'USA',
      incomeSources: ['Salary'],
      customExpenses: [],
    };
    setSetupData(defaultSetup);
    setStep('categories');
  };

  const handleFullSetup = () => {
    setStep('full');
  };

  const handleFullSetupSubmit = (e) => {
    e.preventDefault();
    setStep('categories');
  };

  const handleCategoryAdd = (type, category) => {
    if (type === 'expense') {
      setSetupData(prev => ({
        ...prev,
        customExpenses: [...prev.customExpenses, category],
      }));
    }
  };

  const handleCategoryRemove = (type, index) => {
    if (type === 'expense') {
      setSetupData(prev => ({
        ...prev,
        expenseCategories: prev.expenseCategories.filter((_, i) => i !== index),
      }));
    }
  };

  const handleCategoryRename = (type, index, newName) => {
    if (type === 'expense') {
      setSetupData(prev => {
        const newCategories = [...prev.expenseCategories];
        newCategories[index] = newName;
        return { ...prev, expenseCategories: newCategories };
      });
    }
  };

  const handleComplete = () => {
    // Save to localStorage
    localStorage.setItem('financeSetup', JSON.stringify(setupData));
    // Trigger completion callback
    onComplete(setupData);
  };

  return (
    <div className="onboarding-container">
      {/* CHOICE SCREEN */}
      {step === 'choice' && (
        <div className="onboarding-screen choice-screen">
          <h1>Setup Your Family Finance Tracker</h1>
          <p>Get started in seconds or customize everything.</p>

          <div className="button-group">
            <button className="btn btn-quick" onClick={handleQuickStart}>
              ⚡ Quick Start
              <small>Get going now with defaults</small>
            </button>
            <button className="btn btn-full" onClick={handleFullSetup}>
              🎯 Full Setup
              <small>Answer questions, customize everything</small>
            </button>
          </div>
        </div>
      )}

      {/* FULL SETUP FORM */}
      {step === 'full' && (
        <div className="onboarding-screen full-setup-screen">
          <h2>Tell Us About Yourself</h2>
          <form onSubmit={handleFullSetupSubmit}>
            {/* Section 1: Personal Info */}
            <fieldset className="form-section">
              <legend>👤 Your Info</legend>
              <input
                type="text"
                placeholder="Your Name"
                value={setupData.person1.name}
                onChange={(e) => setSetupData(prev => ({
                  ...prev,
                  person1: { ...prev.person1, name: e.target.value }
                }))}
              />
              <input
                type="text"
                placeholder="Spouse/Partner Name"
                value={setupData.person2.name}
                onChange={(e) => setSetupData(prev => ({
                  ...prev,
                  person2: { ...prev.person2, name: e.target.value }
                }))}
              />
              <select
                value={setupData.country}
                onChange={(e) => setSetupData(prev => ({
                  ...prev,
                  country: e.target.value,
                  currency: e.target.value === 'USA' ? 'USD' : e.target.value === 'India' ? 'INR' : 'AUD',
                }))}
              >
                <option value="">Select Country</option>
                <option value="USA">USA</option>
                <option value="India">India</option>
                <option value="Australia">Australia</option>
                <option value="UK">UK</option>
                <option value="Canada">Canada</option>
                <option value="Other">Other</option>
              </select>
            </fieldset>

            {/* Section 2: Banks & Opening Balance */}
            <fieldset className="form-section">
              <legend>🏦 Banks & Opening Balance</legend>
              <div className="dual-input">
                <div>
                  <label>Your Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Chase, Commonwealth Bank"
                    value={setupData.person1.bank}
                    onChange={(e) => setSetupData(prev => ({
                      ...prev,
                      person1: { ...prev.person1, bank: e.target.value }
                    }))}
                  />
                  <label>Opening Balance</label>
                  <input
                    type="number"
                    placeholder="e.g., 5000"
                    value={setupData.person1.balance}
                    onChange={(e) => setSetupData(prev => ({
                      ...prev,
                      person1: { ...prev.person1, balance: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label>Spouse/Partner Bank</label>
                  <input
                    type="text"
                    placeholder="e.g., Wells Fargo"
                    value={setupData.person2.bank}
                    onChange={(e) => setSetupData(prev => ({
                      ...prev,
                      person2: { ...prev.person2, bank: e.target.value }
                    }))}
                  />
                  <label>Opening Balance</label>
                  <input
                    type="number"
                    placeholder="e.g., 3000"
                    value={setupData.person2.balance}
                    onChange={(e) => setSetupData(prev => ({
                      ...prev,
                      person2: { ...prev.person2, balance: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </fieldset>

            {/* Section 3: Income Sources */}
            <fieldset className="form-section">
              <legend>💰 Income Sources</legend>
              <div className="checkbox-group">
                {PRESET_CATEGORIES.income.map(source => (
                  <label key={source}>
                    <input
                      type="checkbox"
                      checked={setupData.incomeSources.includes(source)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSetupData(prev => ({
                            ...prev,
                            incomeSources: [...prev.incomeSources, source]
                          }));
                        } else {
                          setSetupData(prev => ({
                            ...prev,
                            incomeSources: prev.incomeSources.filter(s => s !== source)
                          }));
                        }
                      }}
                    />
                    {source}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Section 4: Lifestyle & Preferences */}
            <fieldset className="form-section">
              <legend>🎨 Preferences</legend>
              <div className="dual-select">
                <div>
                  <label>Lifestyle Type</label>
                  <select
                    value={setupData.lifestyle}
                    onChange={(e) => setSetupData(prev => ({
                      ...prev,
                      lifestyle: e.target.value
                    }))}
                  >
                    {LIFESTYLE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Dashboard Layout</label>
                  <select
                    value={setupData.dashboardLayout}
                    onChange={(e) => setSetupData(prev => ({
                      ...prev,
                      dashboardLayout: e.target.value
                    }))}
                  >
                    {DASHBOARD_LAYOUTS.map(layout => (
                      <option key={layout} value={layout}>{layout}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dual-select">
                <div>
                  <label>Currency</label>
                  <select
                    value={setupData.currency}
                    onChange={(e) => setSetupData(prev => ({
                      ...prev,
                      currency: e.target.value
                    }))}
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Date Format</label>
                  <select
                    value={setupData.dateFormat}
                    onChange={(e) => setSetupData(prev => ({
                      ...prev,
                      dateFormat: e.target.value
                    }))}
                  >
                    {DATE_FORMATS.map(fmt => (
                      <option key={fmt} value={fmt}>{fmt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            <button type="submit" className="btn btn-primary">Next: Customize Categories</button>
          </form>
        </div>
      )}

      {/* CATEGORY CUSTOMIZATION */}
      {step === 'categories' && (
        <div className="onboarding-screen categories-screen">
          <h2>Customize Your Categories</h2>
          <p>Add, remove, or rename categories. You can change these anytime.</p>

          <div className="categories-container">
            <div className="category-column">
              <h3>💵 Expense Categories</h3>
              <ul className="category-list">
                {setupData.expenseCategories.map((cat, idx) => (
                  <li key={idx} className="category-item">
                    <input
                      type="text"
                      value={cat}
                      onChange={(e) => handleCategoryRename('expense', idx, e.target.value)}
                    />
                    <button onClick={() => handleCategoryRemove('expense', idx)} className="btn-remove">✕</button>
                  </li>
                ))}
              </ul>

              <div className="add-category">
                <input
                  type="text"
                  placeholder="Add custom expense"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleCategoryAdd('expense', e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <button onClick={handleComplete} className="btn btn-primary">✅ Complete Setup</button>
        </div>
      )}

      {/* SUMMARY */}
      {step === 'done' && (
        <div className="onboarding-screen summary-screen">
          <h2>✅ All Set!</h2>
          <p>Your family finance tracker is ready.</p>
          <button onClick={() => onComplete(setupData)} className="btn btn-primary">Start Tracking</button>
        </div>
      )}
    </div>
  );
}
