import React, { useState } from 'react';
import { getPinHash, hashPin } from '../lib/storage';

export default function PinLock({ onVerified }) {
  const [digits, setDigits] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');

  const press = async (d) => {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    setError('');
    if (next.length === 4) {
      const hash = await hashPin(next);
      if (hash === getPinHash()) {
        onVerified();
      } else {
        setShake(true);
        setError('Wrong PIN');
        setTimeout(() => { setDigits(''); setShake(false); }, 600);
      }
    }
  };

  const backspace = () => {
    setDigits((d) => d.slice(0, -1));
    setError('');
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="pin-screen">
      <div className="pin-card">
        <div className="pin-logo">💰</div>
        <div className="pin-app-name">Family Finance</div>
        <div className="pin-subtitle">Enter your PIN</div>

        <div className={`pin-dots ${shake ? 'shake' : ''}`}>
          {[0,1,2,3].map((i) => (
            <div key={i} className={`pin-dot ${i < digits.length ? 'filled' : ''}`} />
          ))}
        </div>

        {error && <div className="pin-error">{error}</div>}

        <div className="pin-numpad">
          {keys.map((k, i) => (
            k === '' ? (
              <div key={i} />
            ) : k === '⌫' ? (
              <button key={i} className="pin-key pin-key-back" onClick={backspace}>
                {k}
              </button>
            ) : (
              <button key={i} className="pin-key" onClick={() => press(k)}>
                {k}
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
