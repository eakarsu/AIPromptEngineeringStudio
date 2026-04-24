import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAutoFill = () => {
    setEmail('admin@promptstudio.com');
    setPassword('admin123');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    cardWrapper: {
      padding: 2,
      borderRadius: 18,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
      boxShadow: '0 20px 60px rgba(99, 102, 241, 0.25)',
    },
    card: {
      background: '#1e293b',
      borderRadius: 16,
      padding: '48px 40px',
      width: 400,
      maxWidth: '90vw',
    },
    logoContainer: {
      textAlign: 'center',
      marginBottom: 32,
    },
    logoIcon: {
      width: 56,
      height: 56,
      borderRadius: 14,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 26,
      marginBottom: 16,
      boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
    },
    logoTitle: {
      fontSize: 22,
      fontWeight: 700,
      color: '#f1f5f9',
      marginBottom: 4,
      letterSpacing: '-0.02em',
    },
    logoSubtitle: {
      fontSize: 13,
      color: '#64748b',
      fontWeight: 400,
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    },
    fieldGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: 600,
      color: '#94a3b8',
      letterSpacing: '0.02em',
    },
    input: {
      padding: '12px 14px',
      borderRadius: 10,
      border: '1px solid #334155',
      background: '#0f172a',
      color: '#f1f5f9',
      fontSize: 14,
      outline: 'none',
      transition: 'border-color 0.2s',
    },
    inputFocus: {
      borderColor: '#6366f1',
    },
    error: {
      background: 'rgba(239, 68, 68, 0.12)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 10,
      padding: '10px 14px',
      color: '#f87171',
      fontSize: 13,
      textAlign: 'center',
    },
    buttonRow: {
      display: 'flex',
      gap: 10,
      marginTop: 4,
    },
    autoFillBtn: {
      padding: '12px 18px',
      borderRadius: 10,
      border: '1px solid #334155',
      background: 'transparent',
      color: '#94a3b8',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap',
    },
    loginBtn: {
      flex: 1,
      padding: '12px 20px',
      borderRadius: 10,
      border: 'none',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#fff',
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
      letterSpacing: '0.01em',
    },
    loginBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    footer: {
      textAlign: 'center',
      marginTop: 24,
      fontSize: 12,
      color: '#475569',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.cardWrapper}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div style={styles.logoTitle}>AI Prompt Engineering Studio</div>
            <div style={styles.logoSubtitle}>Sign in to your workspace</div>
          </div>

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.buttonRow}>
              <button
                type="button"
                onClick={handleAutoFill}
                style={styles.autoFillBtn}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.color = '#a5b4fc';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#334155';
                  e.target.style.color = '#94a3b8';
                }}
              >
                Auto Fill
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.loginBtn,
                  ...(loading ? styles.loginBtnDisabled : {}),
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.35)';
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div style={styles.footer}>
            Powered by AI Prompt Engineering Studio
          </div>
        </div>
      </div>
    </div>
  );
}
