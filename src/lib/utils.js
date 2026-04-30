// ─── Currency ──────────────────────────────────────────────────────────────
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

// ─── Date ──────────────────────────────────────────────────────────────────
export const toISODate = (d) => {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const getTodayDate = () => toISODate(new Date());

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

// ─── ID generation ─────────────────────────────────────────────────────────
export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ─── Period filter ─────────────────────────────────────────────────────────
export const filterByPeriod = (txns, period) => {
  if (period === 'all') return txns;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return txns.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date + 'T00:00:00');
    if (period === 'month') return d.getFullYear() === y && d.getMonth() === m;
    if (period === '3months') return d >= new Date(y, m - 2, 1);
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

// ─── Constants ─────────────────────────────────────────────────────────────
export const DEFAULT_INCOME_CATS = [
  'Salary', 'Freelance', 'Business Income', 'Investments',
  'Rental Income', 'Government Benefits', 'Tax Refund',
  'Gift / Inheritance', 'Other Income',
];

export const DEFAULT_EXPENSE_CATS = [
  'Housing / Rent', 'Groceries', 'Dining Out', 'Transport / Fuel',
  'Utilities', 'Internet & Phone', 'Healthcare', 'Insurance',
  'Shopping / Clothing', 'Entertainment', 'Education', 'Travel',
  'Gym & Fitness', 'Personal Care', 'Subscriptions', 'Remittance',
  'Savings / Investments', 'Gifts & Donations', 'Other',
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
  'Salary (full-time)', 'Freelance / Contract', 'Business Income',
  'Investments / Dividends', 'Rental Income', 'Government Benefits',
  'Gig Work (Uber, DoorDash, etc.)', 'Side Project / Online Income', 'Other',
];

export const QUICK_DEFAULTS = {
  people: [
    {
      id: 'p1',
      name: 'Partner 1',
      accounts: [{ id: 'a1', name: 'Main Bank', balance: 0 }],
    },
    {
      id: 'p2',
      name: 'Partner 2',
      accounts: [{ id: 'a2', name: 'Main Bank', balance: 0 }],
    },
  ],
  currency: 'USD',
  country: 'US',
  dateFormat: 'MM/DD/YYYY',
  lifestyle: 'Moderate',
  dashboardLayout: 'Simple',
  incomeCategories: [...DEFAULT_INCOME_CATS],
  expenseCategories: [...DEFAULT_EXPENSE_CATS],
  incomeSources: ['Salary (full-time)'],
};

// ─── Category emojis ───────────────────────────────────────────────────────
export const CATEGORY_EMOJIS = {
  'Groceries': '🛒',
  'Dining Out': '🍽️',
  'Transport / Fuel': '🚗',
  'Housing / Rent': '🏠',
  'Utilities': '💡',
  'Internet & Phone': '📱',
  'Healthcare': '🏥',
  'Insurance': '🛡️',
  'Shopping / Clothing': '👗',
  'Entertainment': '🎬',
  'Education': '📚',
  'Travel': '✈️',
  'Gym & Fitness': '💪',
  'Personal Care': '💆',
  'Subscriptions': '📺',
  'Remittance': '💸',
  'Savings / Investments': '📈',
  'Gifts & Donations': '🎁',
  'Other': '📌',
  'Salary': '💼',
  'Freelance': '💻',
  'Business Income': '🏢',
  'Investments': '📊',
  'Rental Income': '🏘️',
  'Government Benefits': '🏛️',
  'Tax Refund': '💰',
  'Gift / Inheritance': '🎁',
  'Other Income': '💵',
};

// ─── Saving streak ────────────────────────────────────────────────────────
export function computeStreak(transactions) {
  if (!transactions.length) return { current: 0, best: 0 };
  const byMonth = {};
  transactions.forEach(t => {
    if (!t.date) return;
    const key = t.date.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 };
    if (t.type === 'income') byMonth[key].income += t.amount;
    else byMonth[key].expense += t.amount;
  });
  const months = Object.keys(byMonth).sort();
  let streak = 0, best = 0;
  for (const m of months) {
    if (byMonth[m].income > byMonth[m].expense) { streak++; best = Math.max(best, streak); }
    else streak = 0;
  }
  return { current: streak, best };
}

// ─── Rule-based coaching insights ─────────────────────────────────────────
export function generateInsights(transactions, setup) {
  const insights = [];
  const now = new Date();
  const thisKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastKey  = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;

  const thisTxns = transactions.filter(t => t.date?.startsWith(thisKey));
  const lastTxns = transactions.filter(t => t.date?.startsWith(lastKey));

  const sum = (arr, type) => arr.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);
  const thisInc = sum(thisTxns, 'income');
  const thisExp = sum(thisTxns, 'expense');
  const lastExp = sum(lastTxns, 'expense');

  const fmt = (n) => formatCurrency(n, setup?.currency || 'USD');

  if (thisInc > 0) {
    const rate = Math.round(((thisInc - thisExp) / thisInc) * 100);
    if (rate >= 20) insights.push({ type: 'positive', emoji: '🎉', text: `You're saving ${rate}% of income this month. Great work!` });
    else if (rate > 0) insights.push({ type: 'info', emoji: '💡', text: `Savings rate: ${rate}% this month. Aim for 20%+ for a healthy buffer.` });
    else insights.push({ type: 'warning', emoji: '⚠️', text: `Spending exceeds income by ${fmt(thisExp - thisInc)} this month.` });
  }

  if (lastExp > 0 && thisExp > 0) {
    const pct = Math.round(((thisExp - lastExp) / lastExp) * 100);
    if (pct > 20) insights.push({ type: 'warning', emoji: '📈', text: `Expenses up ${pct}% vs last month (+${fmt(thisExp - lastExp)}).` });
    else if (pct < -10) insights.push({ type: 'positive', emoji: '📉', text: `Expenses down ${Math.abs(pct)}% vs last month — saved ${fmt(lastExp - thisExp)} extra!` });
  }

  const expByCat = {};
  thisTxns.filter(t => t.type === 'expense').forEach(t => { expByCat[t.category] = (expByCat[t.category] || 0) + t.amount; });
  const topCat = Object.entries(expByCat).sort((a, b) => b[1] - a[1])[0];
  if (topCat && thisExp > 0) {
    const pct = Math.round((topCat[1] / thisExp) * 100);
    insights.push({ type: 'info', emoji: '🔍', text: `${topCat[0] || 'Uncategorised'} is your top expense at ${pct}% of spending (${fmt(topCat[1])}).` });
  }

  if (lastTxns.length > 0) {
    const lastExpByCat = {};
    lastTxns.filter(t => t.type === 'expense').forEach(t => { lastExpByCat[t.category] = (lastExpByCat[t.category] || 0) + t.amount; });
    for (const [cat, thisAmt] of Object.entries(expByCat)) {
      const lastAmt = lastExpByCat[cat] || 0;
      if (lastAmt > 0 && thisAmt > lastAmt * 1.5 && thisAmt > 30) {
        const pct = Math.round(((thisAmt - lastAmt) / lastAmt) * 100);
        insights.push({ type: 'warning', emoji: '🚨', text: `${cat} jumped ${pct}% vs last month (${fmt(lastAmt)} → ${fmt(thisAmt)}).` });
        break;
      }
    }
  }

  const catTargets = setup?.targets?.categories || {};
  for (const [cat, target] of Object.entries(catTargets)) {
    if (!target) continue;
    const spent = expByCat[cat] || 0;
    const pct = Math.round((spent / target) * 100);
    if (pct >= 100) { insights.push({ type: 'warning', emoji: '🚫', text: `${cat} budget exceeded: ${fmt(spent)} of ${fmt(target)}.` }); break; }
    else if (pct >= 80) { insights.push({ type: 'warning', emoji: '⚡', text: `${cat} at ${pct}% of budget — ${fmt(target - spent)} left.` }); break; }
  }

  return insights.slice(0, 4);
}

// ─── Natural Language Parser ───────────────────────────────────────────────

export const CATEGORY_KEYWORDS = {
  // Expenses
  'Groceries': [
    'grocery', 'groceries', 'supermarket', 'walmart', 'costco', 'whole foods',
    'trader joe', 'aldi', 'woolworths', 'coles', 'iga', 'tesco', 'asda', 'lidl',
    'dmart', 'reliance fresh', 'big bazaar', 'vegetables', 'fruits', 'chicken',
    'spices', 'eggs', 'milk', 'bread', 'rice', 'dal', 'meat', 'fish', 'produce',
  ],
  'Dining Out': [
    'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'kfc', 'dominos',
    'pizza hut', 'subway', 'burger', 'sushi', 'dining', 'dinner out', 'lunch out',
    'brunch', 'takeaway', 'takeout', 'uber eats', 'doordash', 'zomato', 'swiggy',
    'grubhub', 'dine', 'ate out', 'food delivery', 'dessert', 'bakery',
  ],
  'Transport / Fuel': [
    'fuel', 'petrol', 'gas station', 'shell', 'bp', 'uber', 'lyft', 'ola', 'taxi',
    'cab', 'bus ticket', 'train ticket', 'metro', 'toll', 'parking', 'transport',
    'commute', 'car service', 'rapido',
  ],
  'Housing / Rent': [
    'rent', 'mortgage', 'landlord', 'lease', 'apartment', 'house payment',
  ],
  'Utilities': [
    'electricity', 'power bill', 'water bill', 'gas bill', 'utility', 'utilities',
    'agl', 'origin energy', 'ausnet',
  ],
  'Internet & Phone': [
    'internet', 'wifi', 'broadband', 'mobile plan', 'phone bill', 'optus',
    'telstra', 'vodafone', 'jio', 'airtel', 'bsnl', 'prepaid recharge', 'data plan',
  ],
  'Healthcare': [
    'doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'health', 'dental',
    'dentist', 'clinic', 'prescription', 'chemist', 'bulk bill', 'specialist',
  ],
  'Insurance': [
    'insurance', 'policy premium', 'car insurance', 'health insurance',
    'life insurance', 'home insurance',
  ],
  'Shopping / Clothing': [
    'shopping', 'clothes', 'clothing', 'shoes', 'amazon', 'flipkart', 'zara',
    'h&m', 'uniqlo', 'dress', 'shirt', 'pants', 'jacket', 'online shopping',
  ],
  'Entertainment': [
    'movie', 'cinema', 'netflix', 'spotify', 'disney', 'hulu', 'prime video',
    'gaming', 'game', 'concert', 'event', 'ticket', 'play', 'show',
  ],
  'Education': [
    'school', 'college', 'university', 'course', 'tuition', 'udemy', 'coursera',
    'books', 'training', 'workshop', 'coaching', 'fees',
  ],
  'Travel': [
    'flight', 'hotel', 'airbnb', 'holiday', 'vacation', 'trip', 'travel',
    'booking.com', 'expedia', 'visa fee', 'passport',
  ],
  'Gym & Fitness': [
    'gym', 'fitness', 'yoga', 'workout', 'gym membership', 'pilates', 'crossfit',
  ],
  'Personal Care': [
    'haircut', 'salon', 'spa', 'beauty', 'grooming', 'barber', 'wax',
  ],
  'Subscriptions': [
    'subscription', 'monthly plan', 'annual plan', 'icloud', 'google one',
    'adobe', 'microsoft 365',
  ],
  'Remittance': [
    'remit', 'send money', 'sent to india', 'sent to family', 'western union',
    'wise', 'remitly', 'transferwise', 'sending home', 'family support',
  ],
  'Gifts & Donations': [
    'gift', 'donation', 'charity', 'birthday gift', 'present', 'ngo',
  ],
  // Income
  'Salary': [
    'salary', 'paycheck', 'payday', 'wage', 'monthly pay', 'fortnightly pay',
    'weekly pay', 'got paid', 'employer payment', 'job income',
  ],
  'Freelance': [
    'freelance', 'contract payment', 'client paid', 'invoice paid',
    'project payment', 'consulting fee', 'freelancer income',
  ],
  'Business Income': [
    'business income', 'sales revenue', 'sold product', 'customer payment',
    'business earnings', 'snack sales', 'sold items',
  ],
  'Investments': [
    'dividend', 'interest earned', 'investment return', 'capital gain',
    'stock sale', 'mutual fund', 'shares',
  ],
  'Rental Income': [
    'rent received', 'rental income', 'tenant paid', 'property income',
  ],
  'Government Benefits': [
    'centrelink', 'welfare', 'benefit', 'pension', 'government payment',
    'allowance', 'jobseeker', 'family payment',
  ],
  'Tax Refund': [
    'tax refund', 'ato refund', 'irs refund', 'tax return', 'got tax back',
  ],
  'Gift / Inheritance': [
    'gift received', 'birthday money', 'inheritance', 'received gift',
    'family gave', 'parents gave',
  ],
  'Other Income': [
    'cashback', 'reimbursement', 'refund received', 'bonus', 'overtime',
    'allowance received',
  ],
};

function detectType(lower) {
  const incomeSignals = [
    'received', 'earned', 'salary', 'income', 'got paid', 'payment received',
    'tax refund', 'dividend', 'interest earned', 'bonus', 'reimbursed',
    'refund received', 'credited', 'deposited', 'got salary', 'my salary',
    'rent received', 'sold', 'cashback', 'got money',
  ];
  const expenseSignals = [
    'paid', 'bought', 'spent', 'cost', 'bill', 'rent', 'subscription',
    'fee', 'purchased', 'ordered', 'charged', 'sent', 'send', 'paying',
    'spending', 'transfer out', 'withdrew',
  ];

  const iScore = incomeSignals.filter((k) => lower.includes(k)).length;
  const eScore = expenseSignals.filter((k) => lower.includes(k)).length;
  return iScore > eScore ? 'income' : 'expense';
}

function extractAmount(text) {
  // Match $X, X$, X dollars, just a plain number
  const patterns = [
    /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*\$?(?=\s|$)/,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:dollars?|usd|aud|inr|gbp|eur|cad)/i,
    /rs\.?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i, // Indian Rs. format
    /₹\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (n > 0) return n;
    }
  }
  return null;
}

function extractDate(lower) {
  const today = new Date();
  if (lower.includes('yesterday')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return toISODate(d);
  }
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    if (lower.includes(`last ${dayNames[i]}`)) {
      const d = new Date(today);
      const diff = ((today.getDay() - i) + 7) % 7 || 7;
      d.setDate(d.getDate() - diff);
      return toISODate(d);
    }
  }
  if (lower.includes('last week')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    return toISODate(d);
  }
  if (lower.includes('last month')) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return toISODate(d);
  }
  // Try to match a date pattern in text
  const isoM = lower.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (isoM) return `${isoM[1]}-${isoM[2].padStart(2,'0')}-${isoM[3].padStart(2,'0')}`;
  const shortM = lower.match(/(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
  if (shortM) {
    const yr = shortM[3]
      ? (shortM[3].length === 2 ? `20${shortM[3]}` : shortM[3])
      : today.getFullYear();
    return `${yr}-${shortM[1].padStart(2,'0')}-${shortM[2].padStart(2,'0')}`;
  }
  return toISODate(today);
}

function matchCategory(lower, categories) {
  let best = null;
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!categories.includes(cat)) continue;
    const score = keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return best || categories[0] || '';
}

/**
 * Parse a natural-language transaction statement into structured fields.
 * Returns a partial transaction object; caller should let user confirm/edit.
 */
export function parseNLStatement(text, setup) {
  if (!text.trim() || !setup) return null;
  const lower = text.toLowerCase();

  const type = detectType(lower);
  const amount = extractAmount(text);
  const date = extractDate(lower);
  const categories = type === 'income' ? setup.incomeCategories : setup.expenseCategories;
  const category = matchCategory(lower, categories);

  // Match person from setup people list
  let personName = setup.people?.[0]?.name || '';
  let accountName = setup.people?.[0]?.accounts?.[0]?.name || '';
  for (const person of setup.people || []) {
    if (lower.includes(person.name.toLowerCase())) {
      personName = person.name;
      accountName = person.accounts?.[0]?.name || '';
      break;
    }
    // Also match account names
    for (const acc of person.accounts || []) {
      if (lower.includes(acc.name.toLowerCase())) {
        personName = person.name;
        accountName = acc.name;
        break;
      }
    }
  }

  // Build a clean notes string from original text (trimmed)
  const notes = text.trim();

  return { type, amount, date, category, personName, accountName, notes };
}
