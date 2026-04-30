import React, { useState, useEffect } from 'react';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import { getSetup, saveSetup } from './lib/storage';

export default function App() {
  const [setup, setSetup] = useState(undefined);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setSetup(getSetup());
  }, []);

  const handleSetupComplete = (newSetup) => {
    saveSetup(newSetup);
    setSetup(newSetup);
  };

  const handleSettingsSave = (updatedSetup) => {
    saveSetup(updatedSetup);
    setSetup(updatedSetup);
    setShowSettings(false);
  };

  if (setup === undefined) {
    return <div className="loading">Loading…</div>;
  }

  if (!setup) {
    return <OnboardingFlow onComplete={handleSetupComplete} />;
  }

  return (
    <>
      <Dashboard setup={setup} onOpenSettings={() => setShowSettings(true)} />
      {showSettings && (
        <SettingsPanel
          setup={setup}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
