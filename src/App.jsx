import React, { useState, useEffect } from 'react';
import './App.css';
import OnboardingFlow from './OnboardingFlow';
import Dashboard from './Dashboard';

export default function App() {
  const [setup, setSetup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load setup from localStorage
    const saved = localStorage.getItem('financeSetup');
    if (saved) {
      try {
        setSetup(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load setup:', e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loader">
          <h1>💰 Finance Tracker</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If no setup, show onboarding
  if (!setup) {
    return (
      <div className="app">
        <OnboardingFlow
          onComplete={(setupData) => {
            setSetup(setupData);
          }}
        />
      </div>
    );
  }

  // Show dashboard with ability to update settings
  return (
    <div className="app">
      <Dashboard
        setup={setup}
        onSettingsUpdate={(updatedSetup) => {
          setSetup(updatedSetup);
        }}
      />
    </div>
  );
}
