import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASHBOARDS = {
  student: '/student/dashboard',
  university: '/university/dashboard',
  company: '/company/dashboard',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!userId.trim() || !password) {
      setError('User ID and password are required.');
      return;
    }

    setLoading(true);
    // Simulate brief authentication latency
    await new Promise(r => setTimeout(r, 350));

    const result = login(userId.trim(), password);
    setLoading(false);

    if (result.success) {
      // Automatically redirect to the respective role dashboard
      navigate(ROLE_DASHBOARDS[result.user.role] || '/');
    } else {
      setError(result.error || 'Invalid User ID or password.');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8F9FA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: 380,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 6,
          padding: 32,
        }}
      >
        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <Link to="/" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none' }}>
            ← Back to Platform Overview
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2563EB', letterSpacing: '-0.5px' }}>
            CAREER-OS
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Placement management platform
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#B91C1C',
            }}
          >
            {error}
          </div>
        )}

        {/* Form: Only User ID and Password */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              User ID / Email
            </label>
            <input
              type="text"
              required
              autoFocus
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="Enter your user ID or email"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                fontSize: 14,
                color: '#111827',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                fontSize: 14,
                color: '#111827',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: loading ? '#93C5FD' : '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
