import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password);
    if (result.success) navigate('/dashboard');
  };

  const cardStyle = {
    background: 'white', borderRadius: '20px', padding: '2.5rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)', width: '100%', maxWidth: '420px',
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
    border: '1px solid var(--color-border)', fontSize: '1rem',
    outline: 'none', fontFamily: 'inherit',
  };

  const btnStyle = {
    width: '100%', padding: '0.85rem', borderRadius: '10px', border: 'none',
    background: 'var(--color-primary-600)', color: 'white',
    fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.05) 100%)',
      padding: '1rem',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px',
          }}>⚙</div>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-primary-700)' }}>DocMind AI</span>
        </div>

        <div style={cardStyle}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Sign in to your account to continue</p>

          {error && (
            <div style={{
              background: 'var(--color-error-light)', color: 'var(--color-error)',
              padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem',
              fontSize: '0.9rem',
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required style={inputStyle} />
            </div>
            <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--color-primary-600)', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
