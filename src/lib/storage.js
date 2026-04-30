const SETUP_KEY = 'ff_setup_v2';
const TXN_KEY = 'ff_transactions_v2';

const parse = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const getSetup = () => parse(SETUP_KEY, null);

export const saveSetup = (setup) =>
  localStorage.setItem(SETUP_KEY, JSON.stringify(setup));

export const getTransactions = () => parse(TXN_KEY, []);

export const saveTransactions = (txns) =>
  localStorage.setItem(TXN_KEY, JSON.stringify(txns));

export const addTransaction = (tx) => {
  const txns = [tx, ...getTransactions()];
  saveTransactions(txns);
  return txns;
};

export const deleteTransaction = (id) => {
  const txns = getTransactions().filter((t) => t.id !== id);
  saveTransactions(txns);
  return txns;
};

export const clearAll = () => {
  localStorage.removeItem(SETUP_KEY);
  localStorage.removeItem(TXN_KEY);
};
