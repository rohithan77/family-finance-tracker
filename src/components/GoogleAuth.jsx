import React, { useState } from 'react';
import { signIn, createFamilySheet, validateSheet } from '../lib/sheets';

const GOOGLE_SVG = (
  <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default function GoogleAuth({ onConnect }) {
  const [phase, setPhase] = useState('sign_in'); // sign_in | choose | creating | joining | error
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [familyName, setFamilyName] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn();
      setPhase('choose');
    } catch (e) {
      setError(e.message === 'popup_closed_by_user'
        ? 'Sign-in was cancelled.'
        : 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    setPhase('creating');
    try {
      const sheetId = await createFamilySheet(familyName.trim() || 'My Family');
      onConnect(sheetId, true);
    } catch (e) {
      setError('Could not create sheet: ' + e.message);
      setPhase('choose');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const id = joinId.trim();
    if (!id) { setError('Enter a Sheet ID'); return; }
    setLoading(true);
    setError('');
    try {
      // Extract sheet ID from a full URL if pasted
      const match = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      const sheetId = match ? match[1] : id;
      const result = await validateSheet(sheetId);
      if (!result.ok) {
        setError(result.error === 'not_signed_in'
          ? 'Session expired — sign in again'
          : `Can't access that sheet: ${result.error}`);
      } else {
        onConnect(sheetId, false);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-logo">💰</div>
          <h1 className="auth-title">Family Finance</h1>
          <div className="auth-setup-notice">
            <p><strong>Setup required:</strong> Set <code>REACT_APP_GOOGLE_CLIENT_ID</code> in your <code>.env</code> file.</p>
            <p>See <code>.env.example</code> for instructions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">💰</div>
        <h1 className="auth-title">Family Finance</h1>
        <p className="auth-tagline">Track together. Sync via Google Sheets.<br />Your data, your sheet, your control.</p>

        {phase === 'sign_in' && (
          <>
            <button className="google-btn" onClick={handleSignIn} disabled={loading}>
              {GOOGLE_SVG}
              {loading ? 'Signing in…' : 'Sign in with Google'}
            </button>
            <p className="auth-privacy">🔒 We only access the specific sheet you connect — nothing else.</p>
          </>
        )}

        {(phase === 'choose' || phase === 'creating' || phase === 'joining') && (
          <div className="auth-choose">
            <div className="auth-paths">
              <div className="auth-path">
                <div className="auth-path-icon">✨</div>
                <div className="auth-path-label">Create new sheet</div>
                <input
                  className="auth-input"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Your family name (optional)"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button
                  className="btn-primary"
                  onClick={handleCreate}
                  disabled={loading}
                >
                  {loading && phase === 'creating' ? 'Creating…' : 'Create & Start'}
                </button>
              </div>

              <div className="auth-divider-v">or</div>

              <div className="auth-path">
                <div className="auth-path-icon">🔗</div>
                <div className="auth-path-label">Connect existing sheet</div>
                <input
                  className="auth-input"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  placeholder="Paste Sheet ID or URL"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                <button
                  className="btn-secondary"
                  onClick={handleJoin}
                  disabled={loading}
                >
                  {loading && phase === 'joining' ? 'Connecting…' : 'Connect'}
                </button>
              </div>
            </div>
            <p className="auth-share-hint">
              💡 To share with family: connect the same sheet. Share the sheet in Google Drive with their email.
            </p>
          </div>
        )}

        {(phase === 'creating' || phase === 'joining') && !error && (
          <div className="auth-spinner-row">
            <div className="spinner" />
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}
      </div>
    </div>
  );
}
