export const CURRENCIES = {
  USD: { locale: 'en-US' },
  INR: { locale: 'en-IN' },
  AUD: { locale: 'en-AU' },
  GBP: { locale: 'en-GB' },
  EUR: { locale: 'de-DE' },
  CAD: { locale: 'en-CA' },
};

export const formatCurrency = (amount, currency = 'USD') => {
  const c = CURRENCIES[currency] || CURRENCIES.USD;
  return new Intl.NumberFormat(c.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr, fmt = 'MM/DD/YYYY') => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  if (fmt === 'DD/MM/YYYY') return `${dd}/${mm}/${yyyy}`;
  if (fmt === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
  return `${mm}/${dd}/${yyyy}`;
};

export const getTodayDate = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const filterByPeriod = (txns, period) => {
  if (period === 'all') return txns;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return txns.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date + 'T00:00:00');
    if (period === 'month') return d.getFullYear() === y && d.getMonth() === m;
    if (period === '3months') {
      const cutoff = new Date(y, m - 2, 1);
      return d >= cutoff;
    }
    if (period === 'year') return d.getFullYear() === y;
    return true;
  });
};

export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const DEFAULT_INCOME_CATS = [
  'Salary',
  'Freelance',
  'Business Income',
  'Investments',
  'Rental Income',
  'Government Benefits',
  'Tax Refund',
  'Gift / Inheritance',
  'Other Income',
];

export const DEFAULT_EXPENSE_CATS = [
  'Housing / Rent',
  'Groceries',
  'Dining Out',
  'Transport / Fuel',
  'Utilities',
  'Internet & Phone',
  'Healthcare',
  'Insurance',
  'Shopping / Clothing',
  'Entertainment',
  'Education',
  'Travel',
  'Gym & Fitness',
  'Personal Care',
  'Subscriptions',
  'Remittance',
  'Savings / Investments',
  'Gifts & Donations',
  'Other',
];

export const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'OTHER', name: 'Other', currency: 'USD' },
];

export const INCOME_SOURCES = [
  'Salary (full-time)',
  'Freelance / Contract',
  'Business Income',
  'Investments / Dividends',
  'Rental Income',
  'Government Benefits',
  'Gig Work (Uber, DoorDash, etc.)',
  'Side Project / Online Income',
  'Other',
];

export const QUICK_DEFAULTS = {
  person1: { name: 'Partner 1', bank: 'Main Bank', balance: 0 },
  person2: { name: 'Partner 2', bank: 'Main Bank', balance: 0 },
  country: 'US',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  lifestyle: 'Moderate',
  dashboardLayout: 'Simple',
  incomeCategories: [...DEFAULT_INCOME_CATS],
  expenseCategories: [...DEFAULT_EXPENSE_CATS],
  incomeSources: ['Salary (full-time)'],
};
