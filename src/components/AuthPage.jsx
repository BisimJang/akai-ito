import React, { useState } from 'react';
import { api } from '../api';

export function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login'); // login | signup
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    try {
      let data;
      if (mode === 'signup') {
        data = await api.signup(username.trim(), email.trim() || undefined);
      } else {
        data = await api.login(username.trim());
      }
      localStorage.setItem('ai_user', JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-dot" />
          <h1>Akai Ito</h1>
          <p>{mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}</p>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-form-group">
            <label className="input-label">Username</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. j.doe"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          {mode === 'signup' && (
            <div className="auth-form-group">
              <label className="input-label">Email (optional)</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>No account? <button onClick={() => { setMode('signup'); setError(''); }}>Create one</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
