import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, User, FileText, Briefcase, Award, TrendingUp, Mic, Users, BookMarked, Mail, PieChart, BookOpen, Bot, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Topbar from './Topbar';
import NetworkStatusIndicator, { NetworkBadge } from './NetworkStatusIndicator';

const studentNav = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/calls', label: 'Call Section (Live Meet)', icon: Video, badge: 'Meet' },
  { to: '/student/mail', label: 'Mailbox', icon: Mail },
  { to: '/student/profile', label: 'Profile', icon: User },
  { to: '/student/resume', label: 'Resume Builder', icon: FileText },
  { to: '/student/applications', label: 'Applications', icon: Briefcase },
  { to: '/student/certificates', label: 'Certificates', icon: Award },
  { to: '/student/materials', label: 'Study Materials', icon: BookOpen },
  { to: '/student/skill-gap', label: 'Skill Gap', icon: TrendingUp },
  { to: '/student/interview-prep', label: 'Interview Prep', icon: Mic },
  { to: '/student/ai-interview', label: 'AI Interview', icon: Bot },
];

const universityNav = [
  { to: '/university/dashboard', label: 'Dashboard', icon: PieChart },
  { to: '/university/students', label: 'Students', icon: Users },
  { to: '/university/drives', label: 'Drives', icon: BookMarked },
  { to: '/university/materials', label: 'Class Materials', icon: BookOpen },
  { to: '/university/mail-filter', label: 'Mail Filter', icon: Mail },
];

const companyNav = [
  { to: '/company/dashboard', label: 'Dashboard', icon: PieChart },
  { to: '/company/calls', label: 'Call History & Schedule', icon: Video, badge: 'Meet' },
  { to: '/company/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/company/candidates', label: 'Candidates', icon: Users },
  { to: '/company/pipeline', label: 'Pipeline', icon: TrendingUp },
];

const NAV_BY_ROLE = {
  student: studentNav,
  university: universityNav,
  company: companyNav,
};

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth();
  const { dispatch } = useData();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user?.role] || [];

  function handleLogout() {
    logout();
    navigate('/login');
    if (onClose) onClose();
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.04em' }}>CAREER-OS</span>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Placement platform</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            aria-label="Close menu"
          >
            <X size={18} color="#374151" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                marginBottom: 3,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                color: isActive ? '#4F46E5' : '#374151',
                background: isActive ? '#EEF2FF' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={16} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: '#ECFDF5',
                    color: '#059669',
                    padding: '2px 7px',
                    borderRadius: 9999,
                    border: '1px solid #A7F3D0',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom user info + actions */}
      <div style={{ borderTop: '1px solid #E5E7EB', padding: '12px 10px', flexShrink: 0 }}>
        <div style={{ padding: '8px 12px', marginBottom: 6, borderRadius: 8, background: '#F9FAFB' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{user?.role} portal</div>
        </div>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#DC2626', textAlign: 'left' }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}

export default function Layout({ title, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA' }}>

      {/* ── Desktop Sidebar (hidden on mobile via CSS class) ── */}
      <aside
        className="desktop-flex"
        style={{ width: 240, minHeight: '100vh', background: '#fff', borderRight: '1px solid #E5E7EB', flexShrink: 0, flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile: Right-side drawer overlay ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(17,24,39,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
            }}
          />
          {/* Drawer panel sliding in from right */}
          <div
            className="animate-slide-in-right"
            style={{
              position: 'fixed', top: 0, right: 0,
              width: 280, maxWidth: '85vw', height: '100vh',
              background: '#fff',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
              zIndex: 9999,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      {/* ── Main content column ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Real-time Network Indicator Banner (Offline / Mobile 3G / Reconnected) */}
        <NetworkStatusIndicator />

        {/* Mobile topbar (shows on mobile, hidden on desktop) */}
        <header
          className="mobile-only"
          style={{
            height: 56,
            background: '#fff',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.04em' }}>CAREER-OS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NetworkBadge />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{title}</span>
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              aria-label="Open navigation menu"
            >
              <Menu size={20} color="#374151" />
            </button>
          </div>
        </header>

        {/* Desktop topbar (hidden on mobile) */}
        <div className="desktop-only">
          <Topbar title={title} />
        </div>

        {/* Page content */}
        <main style={{ flex: 1, padding: 16, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
