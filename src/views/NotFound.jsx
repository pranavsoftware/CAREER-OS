import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: '#E5E7EB', marginBottom: 8 }}>404</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Page not found</div>
        <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>The page you are looking for does not exist.</div>
        <Link to="/" style={{ color: '#2563EB', fontSize: 14 }}>Return to home</Link>
      </div>
    </div>
  );
}
