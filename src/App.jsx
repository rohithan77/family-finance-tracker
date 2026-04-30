import React, { useState, useEffect, useCallback } from 'react';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import GoogleAuth from './components/GoogleAuth';
import PinLock from './components/PinLock';
import {
  initSheets, isSignedIn, signIn, signOut,
  getSetup as fetchSetup,
  saveSetup as pushSetup,
  getTransactions as fetchTransactions,
  appendTransaction,
  removeTransaction,
} from './lib/sheets';
import {
  getSheetId, saveSheetId,
  getPinHash,
  getCachedSetup, cacheSetup,
  getCachedTransactions, cacheTransactions,
  clearAll,
} from './lib/storage';

// phase: 'boot' | 'auth' | 'pin' | 'app'
export default function App() {
  const [phase, setPhase] = useState('boot');
  const [sheetId, setSheetId] = useState(null);
  const [setup, setSetup] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Boot: init Google Identity Services then decide phase
  useEffect(() => {
    (async () => {
      await initSheets().catch(() => {}); // non-fatal if no client ID

      const sid = getSheetId();
      if (!sid) { setPhase('auth'); return; }

      setSheetId(sid);
      // Show cached data immediately so the app feels instant
      setSetup(getCachedSetup());
      setTransactions(getCachedTransactions());

      if (getPinHash()) {
        setPhase('pin');
        return;
      }

      setPhase('app');
      doSync(sid);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doSync = useCallback(async (sid) => {
    if (!sid) return;
    setSyncing(true);
    setSyncError('');
    try {
      if (!isSignedIn()) await signIn();
      const [remoteSetup, remoteTxns] = await Promise.all([
        fetchSetup(sid),
        fetchTransactions(sid),
      ]);
      if (remoteSetup) {
        setSetup(remoteSetup);
        cacheSetup(remoteSetup);
      }
      // Remote transactions sorted newest first
      const sorted = [...(remoteTxns || [])].sort(
        (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );
      setTransactions(sorted);
      cacheTransactions(sorted);
    } catch (e) {
      setSyncError(e.message === 'not_signed_in' ? 'Sign in to sync' : e.message);
    } finally {
      setSyncing(false);
    }
  }, []);

  // ── Auth callbacks ─────────────────────────────────────────────────────────

  const handleConnect = (sid, isNew) => {
    saveSheetId(sid);
    setSheetId(sid);
    if (isNew) {
      setSetup(null);
      setTransactions([]);
    }
    setPhase('app');
    if (!isNew) doSync(sid);
  };

  const handlePinVerified = () => {
    setPhase('app');
    doSync(sheetId);
  };

  // ── Setup / onboarding ─────────────────────────────────────────────────────

  const handleSetupComplete = async (newSetup) => {
    setSetup(newSetup);
    cacheSetup(newSetup);
    if (sheetId) {
      try {
        if (!isSignedIn()) await signIn();
        await pushSetup(sheetId, newSetup);
      } catch {
        setSyncError('Setup saved locally — will sync next time');
      }
    }
  };

  // ── Transaction CRUD ───────────────────────────────────────────────────────

  const handleSave = async (tx) => {
    const txWithMeta = { ...tx, createdAt: new Date().toISOString() };
    const updated = [txWithMeta, ...transactions];
    setTransactions(updated);
    cacheTransactions(updated);
    if (sheetId) {
      try {
        if (!isSignedIn()) await signIn();
        await appendTransaction(sheetId, txWithMeta);
      } catch (e) {
        setSyncError('Saved locally — sheet sync failed');
      }
    }
  };

  const handleDelete = async (id) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    cacheTransactions(updated);
    if (sheetId) {
      try {
        if (!isSignedIn()) await signIn();
        await removeTransaction(sheetId, id);
      } catch {
        setSyncError('Deleted locally — sheet sync failed');
      }
    }
  };

  // ── Settings ───────────────────────────────────────────────────────────────

  const handleSettingsSave = async (updatedSetup) => {
    setSetup(updatedSetup);
    cacheSetup(updatedSetup);
    setShowSettings(false);
    if (sheetId) {
      try {
        if (!isSignedIn()) await signIn();
        await pushSetup(sheetId, updatedSetup);
      } catch {
        setSyncError('Settings saved locally — sheet sync failed');
      }
    }
  };

  const handleDisconnect = () => {
    signOut();
    clearAll();
    window.location.reload();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

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
        onSync={() => doSync(sheetId)}
        syncing={syncing}
        syncError={syncError}
        onOpenSettings={() => setShowSettings(true)}
      />
      {showSettings && (
        <SettingsPanel
          setup={setup}
          sheetId={sheetId}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
          onDisconnect={handleDisconnect}
        />
      )}
    </>
  );
}
