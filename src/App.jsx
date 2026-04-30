import React, { useState, useEffect, useCallback } from 'react';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import GoogleAuth from './components/GoogleAuth';
import PinLock from './components/PinLock';
import {
  setScriptUrl,
  getSetup as fetchSetup,
  saveSetup as pushSetup,
  getTransactions as fetchTransactions,
  appendTransaction,
  removeTransaction,
} from './lib/sheets';
import {
  getScriptUrl, saveScriptUrl,
  getPinHash,
  getCachedSetup, cacheSetup,
  getCachedTransactions, cacheTransactions,
  clearAll,
} from './lib/storage';

// phase: 'boot' | 'auth' | 'pin' | 'app'
export default function App() {
  const [phase, setPhase] = useState('boot');
  const [scriptUrl, setScriptUrlState] = useState(null);
  const [setup, setSetup] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Boot: check for saved script URL then decide phase
  useEffect(() => {
    const url = getScriptUrl();
    if (!url) { setPhase('auth'); return; }

    setScriptUrl(url);
    setScriptUrlState(url);
    setSetup(getCachedSetup());
    setTransactions(getCachedTransactions());

    if (getPinHash()) {
      setPhase('pin');
      return;
    }

    setPhase('app');
    doSync(url);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doSync = useCallback(async (url) => {
    if (!url) return;
    setSyncing(true);
    setSyncError('');
    try {
      // allSettled so a broken setup doesn't block transaction loading
      const [setupRes, txnRes] = await Promise.allSettled([
        fetchSetup(),
        fetchTransactions(),
      ]);
      if (setupRes.status === 'fulfilled' && setupRes.value) {
        setSetup(setupRes.value);
        cacheSetup(setupRes.value);
      }
      if (txnRes.status === 'fulfilled') {
        const sorted = [...(txnRes.value || [])].sort(
          (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
        );
        setTransactions(sorted);
        cacheTransactions(sorted);
      }
      const errs = [setupRes, txnRes]
        .filter(r => r.status === 'rejected')
        .map(r => r.reason?.message || 'error');
      if (errs.length) setSyncError(errs.join(' | '));
    } catch (e) {
      setSyncError(e.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, []);

  // ── Auth callbacks ──────────────────────────────────────────────────────────

  const handleConnect = (url) => {
    saveScriptUrl(url);
    setScriptUrl(url);
    setScriptUrlState(url);
    setSetup(null);
    setTransactions([]);
    setPhase('app');
    doSync(url);
  };

  const handlePinVerified = () => {
    setPhase('app');
    doSync(scriptUrl);
  };

  // ── Setup / onboarding ──────────────────────────────────────────────────────

  const handleSetupComplete = async (newSetup) => {
    setSetup(newSetup);
    cacheSetup(newSetup);
    try {
      await pushSetup(newSetup);
    } catch {
      setSyncError('Setup saved locally — will sync next time');
    }
  };

  // ── Transaction CRUD ────────────────────────────────────────────────────────

  const handleSave = async (tx) => {
    const txWithMeta = { ...tx, createdAt: new Date().toISOString() };
    const updated = [txWithMeta, ...transactions];
    setTransactions(updated);
    cacheTransactions(updated);
    try {
      await appendTransaction(txWithMeta);
    } catch {
      setSyncError('Saved locally — sheet sync failed');
    }
  };

  const handleDelete = async (id) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    cacheTransactions(updated);
    try {
      await removeTransaction(id);
    } catch {
      setSyncError('Deleted locally — sheet sync failed');
    }
  };

  // ── Settings ────────────────────────────────────────────────────────────────

  const handleSettingsSave = async (updatedSetup) => {
    setSetup(updatedSetup);
    cacheSetup(updatedSetup);
    setShowSettings(false);
    try {
      await pushSetup(updatedSetup);
    } catch {
      setSyncError('Settings saved locally — sheet sync failed');
    }
  };

  const handleDisconnect = () => {
    clearAll();
    window.location.reload();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (phase === 'boot') {
    return (
      <div className="boot-screen">
        <div className="boot-logo">💰</div>
        <div className="boot-name">Family Finance</div>
        <div className="spinner" />
      </div>
    );
  }

  if (phase === 'auth') {
    return <GoogleAuth onConnect={handleConnect} />;
  }

  if (phase === 'pin') {
    return <PinLock onVerified={handlePinVerified} />;
  }

  // phase === 'app'
  if (!setup) {
    return <OnboardingFlow onComplete={handleSetupComplete} />;
  }

  return (
    <>
      <Dashboard
        setup={setup}
        transactions={transactions}
        onSave={handleSave}
        onDelete={handleDelete}
        onSync={() => doSync(scriptUrl)}
        syncing={syncing}
        syncError={syncError}
        onOpenSettings={() => setShowSettings(true)}
      />
      {showSettings && (
        <SettingsPanel
          setup={setup}
          scriptUrl={scriptUrl}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
          onDisconnect={handleDisconnect}
        />
      )}
    </>
  );
}
