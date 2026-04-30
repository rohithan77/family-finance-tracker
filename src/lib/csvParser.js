import { generateId, toISODate } from './utils';

// ── Exported so Dashboard can re-use for category matching ───────────────────
export const CATEGORY_KEYWORDS = {
  'Groceries': ['grocery','groceries','supermarket','walmart','costco','whole foods','trader joe','aldi','woolworths','coles','tesco','asda','lidl','dmart','reliance fresh','big bazaar','vegetables','fruits','chicken','eggs','milk','bread','rice','dal','meat','fish','produce','iga'],
  'Dining Out': ['restaurant','cafe','coffee','starbucks','mcdonalds','kfc','dominos','pizza hut','subway','burger','sushi','dining','dinner out','lunch out','brunch','takeaway','takeout','uber eats','doordash','zomato','swiggy','grubhub','dine','ate out','food delivery','dessert','bakery'],
  'Transport / Fuel': ['fuel','petrol','gas station','shell','bp','uber','lyft','ola','taxi','cab','bus ticket','train ticket','metro','toll','parking','transport','commute','car service','rapido'],
  'Housing / Rent': ['rent','mortgage','landlord','lease','apartment','house payment'],
  'Utilities': ['electricity','power bill','water bill','gas bill','utility','utilities','agl','origin energy'],
  'Internet & Phone': ['internet','wifi','broadband','mobile plan','phone bill','optus','telstra','vodafone','jio','airtel','bsnl','prepaid recharge','data plan'],
  'Healthcare': ['doctor','hospital','medicine','pharmacy','medical','health','dental','dentist','clinic','prescription','chemist','bulk bill','specialist'],
  'Insurance': ['insurance','policy premium','car insurance','health insurance','life insurance','home insurance'],
  'Shopping / Clothing': ['shopping','clothes','clothing','shoes','amazon','flipkart','zara','h&m','uniqlo','dress','shirt','pants','jacket','online shopping'],
  'Entertainment': ['movie','cinema','netflix','spotify','disney','hulu','prime video','gaming','game','concert','event','ticket','play','show'],
  'Education': ['school','college','university','course','tuition','udemy','coursera','books','training','workshop','coaching','fees'],
  'Travel': ['flight','hotel','airbnb','holiday','vacation','trip','travel','booking.com','expedia','visa fee','passport'],
  'Gym & Fitness': ['gym','fitness','yoga','workout','gym membership','pilates','crossfit'],
  'Personal Care': ['haircut','salon','spa','beauty','grooming','barber','wax'],
  'Subscriptions': ['subscription','monthly plan','annual plan','icloud','google one','adobe','microsoft 365'],
  'Remittance': ['remit','send money','sent to india','sent to family','western union','wise','remitly','transferwise','sending home','family support'],
  'Gifts & Donations': ['gift','donation','charity','birthday gift','present','ngo'],
  'Salary': ['salary','paycheck','payday','wage','monthly pay','fortnightly pay','weekly pay','got paid','employer payment'],
  'Freelance': ['freelance','contract payment','client paid','invoice paid','project payment','consulting fee'],
  'Business Income': ['business income','sales revenue','sold product','customer payment','business earnings'],
  'Investments': ['dividend','interest earned','investment return','capital gain','stock sale','mutual fund','shares'],
  'Rental Income': ['rent received','rental income','tenant paid','property income'],
  'Government Benefits': ['centrelink','welfare','benefit','pension','government payment','allowance','jobseeker','family payment'],
  'Tax Refund': ['tax refund','ato refund','irs refund','tax return','got tax back'],
  'Gift / Inheritance': ['gift received','birthday money','inheritance','received gift','family gave','parents gave'],
  'Other Income': ['cashback','reimbursement','refund received','bonus','overtime','allowance received'],
};

// ── CSV text → 2D array ──────────────────────────────────────────────────────
function parseRows(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const row = [];
    let field = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') { field += '"'; i++; }
        else inQuote = !inQuote;
      } else if ((c === ',' || c === '\t' || c === ';') && !inQuote) {
        row.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    row.push(field.trim());
    if (row.some(f => f)) rows.push(row);
  }
  return rows;
}

// ── Date string → ISO yyyy-MM-dd ─────────────────────────────────────────────
function parseDate(str) {
  if (!str) return '';
  str = String(str).trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) return str;  // already ISO

  // D-Mon-YY or D Mon YYYY  (17-Apr-25, 17 Apr 2025)
  const monMatch = str.match(/(\d{1,2})[\s-]([A-Za-z]{3,})[\s-](\d{2,4})/);
  if (monMatch) {
    const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
    const m = MONTHS[monMatch[2].toLowerCase().slice(0, 3)];
    if (m) {
      const yr = monMatch[3].length === 2 ? `20${monMatch[3]}` : monMatch[3];
      return `${yr}-${String(m).padStart(2,'0')}-${monMatch[1].padStart(2,'0')}`;
    }
  }

  // MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY
  const parts = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (parts) {
    let [, a, b, yr] = parts;
    if (yr.length === 2) yr = `20${yr}`;
    // If first part > 12 it must be DD; otherwise default MM/DD (US)
    if (parseInt(a) > 12) return `${yr}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`;
    return `${yr}-${a.padStart(2,'0')}-${b.padStart(2,'0')}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) return toISODate(d);
  return '';
}

// ── Amount string → number (negative = debit/expense) ───────────────────────
function parseAmount(str) {
  if (str === '' || str === null || str === undefined) return null;
  str = String(str).trim();
  if (!str) return null;
  const negative = str.startsWith('-') || (str.startsWith('(') && str.endsWith(')'));
  str = str.replace(/[()]/g, '').replace(/[^0-9.,]/g, '');
  // European format: 1.234,56
  if (/\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(str)) str = str.replace(/\./g, '').replace(',', '.');
  else str = str.replace(/,/g, '');
  const val = parseFloat(str);
  if (isNaN(val)) return null;
  return negative ? -val : val;
}

// ── Match a description to a category ───────────────────────────────────────
export function matchCategory(text, categories) {
  if (!text) return '';
  const lower = text.toLowerCase();
  let best = null, bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (categories && !categories.includes(cat)) continue;
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best || '';
}

// ── Main export ──────────────────────────────────────────────────────────────
export function parseCSVFile(text, setup) {
  const rows = parseRows(text);
  if (!rows.length) return { transactions: [], count: 0 };

  const HEADER_WORDS = ['date','amount','debit','credit','description','narration','memo',
    'category','type','balance','merchant','particulars','transaction','withdrawal','deposit'];
  const firstLower = rows[0].map(v => String(v).toLowerCase().trim());
  const isHeader = firstLower.some(v => HEADER_WORDS.some(w => v.includes(w)));
  const headers = isHeader ? firstLower : null;
  const dataRows = isHeader ? rows.slice(1) : rows;

  const col = (names) => {
    if (!headers) return -1;
    for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return i; }
    for (const n of names) { const i = headers.findIndex(h => h.includes(n)); if (i >= 0) return i; }
    return -1;
  };

  const C = {
    date:   col(['date','transaction date','txn date','posting date','value date','trans date','dated']),
    amount: col(['amount','value','sum']),
    debit:  col(['debit','withdrawal','dr','withdrawals','paid out']),
    credit: col(['credit','deposit','cr','deposits','paid in']),
    desc:   col(['description','narration','particulars','memo','details','merchant','name','remarks','transaction details','reference']),
    cat:    col(['category','type','label','transaction type']),
  };

  const allExpCats = setup?.expenseCategories || [];
  const allIncCats = setup?.incomeCategories || [];
  const allCats = [...allExpCats, ...allIncCats];

  const INCOME_HINTS = ['salary','income','deposit','refund','dividend','interest','received',
    'transfer in','credit','cashback','bonus','reimbursement','tax refund','rent received'];

  const transactions = [];

  dataRows.forEach((r) => {
    if (!r.some(v => v !== '')) return;

    const get = (colIdx, posIdx) => {
      const idx = colIdx >= 0 ? colIdx : (headers ? -1 : posIdx);
      return idx >= 0 ? (r[idx] ?? '') : '';
    };

    const dateStr = parseDate(get(C.date, 0));

    // Determine amount and type
    let amount = 0;
    let txType = 'expense';

    if (C.debit >= 0 || C.credit >= 0) {
      const debit  = parseAmount(get(C.debit, -1));
      const credit = parseAmount(get(C.credit, -1));
      if (credit && credit > 0) { amount = credit; txType = 'income'; }
      else if (debit && debit > 0) { amount = debit; txType = 'expense'; }
      else if (credit && credit < 0) { amount = Math.abs(credit); txType = 'expense'; }
      else if (debit && debit < 0) { amount = Math.abs(debit); txType = 'income'; }
    } else {
      const raw = parseAmount(get(C.amount, headers ? -1 : 1));
      if (raw === null) return;
      amount = Math.abs(raw);
      txType = raw < 0 ? 'expense' : 'expense'; // default; refine below
    }

    if (amount === 0) return;

    const desc = String(get(C.desc, headers ? -1 : 2)).trim();
    const catRaw = String(get(C.cat, -1)).trim();
    const descLower = (desc + ' ' + catRaw).toLowerCase();

    // Refine income vs expense from description
    if (INCOME_HINTS.some(h => descLower.includes(h))) txType = 'income';

    const cats = txType === 'income' ? allIncCats : allExpCats;
    const category = catRaw || matchCategory(desc, cats.length ? cats : allCats);

    transactions.push({
      id: generateId(),
      date: dateStr,
      type: txType,
      category,
      amount,
      personName: setup?.people?.[0]?.name || '',
      accountName: setup?.people?.[0]?.accounts?.[0]?.name || '',
      notes: desc,
      rawInput: desc,
      createdAt: new Date().toISOString(),
    });
  });

  return { transactions, count: transactions.length };
}
