import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const { dispatch } = useData();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }


  const displayRole = user?.displayRole || (user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : '');

  return (
    <header
      style={{
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>{title}</h1>

      {/* User menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            padding: '6px 12px',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {/* Avatar */}
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#EFF6FF',
              color: '#2563EB',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {user?.avatar || user?.name?.charAt(0)}
          </span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 500, color: '#111827', fontSize: 13 }}>{user?.name}</div>
            <div style={{ color: '#6B7280', fontSize: 11 }}>{displayRole}</div>
          </div>
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: 4,
              width: 160,
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 6,
              boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
              zIndex: 100,
            }}
          >
            <button
              onClick={handleLogout}
              style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#DC2626' }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}
