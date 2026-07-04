import React, { useState } from 'react';
import { api } from '../api';
import { GoogleLogin } from '@react-oauth/google';

export function AuthPage({ onAuth }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.googleLogin(credentialResponse.credential);
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
          <p>Sign in to your workspace</p>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Signing you in...</p>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In failed')}
              theme="filled_black"
              shape="circle"
              text="signin_with"
            />
          )}
        </div>
      </div>
    </div>
  );
}
