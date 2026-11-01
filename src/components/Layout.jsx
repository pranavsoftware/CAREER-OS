import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, LogOut, LayoutDashboard, User, FileText, Briefcase, Award,
  TrendingUp, Mic, Users, BookMarked, Mail, PieChart, BookOpen, Bot, Video,
  GraduationCap, Gift, Database, Building, Lock, KeyRound, AlertTriangle, ArrowRight
} from 'lucide-react';
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
  { to: '/student/higher-education', label: 'Higher Education', icon: GraduationCap, badge: 'MS' },
  { to: '/student/referrals', label: 'Referrals & Rewards', icon: Gift, badge: 'Perks' },
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
  { to: '/university/records-import', label: 'Registrar Sync', icon: Database, badge: 'Auto' },
  { to: '/university/referrals', label: 'Endorsements & Perks', icon: Award },
  { to: '/university/admissions', label: 'Admissions Desk', icon: GraduationCap, badge: '12th' },
];

const companyNav = [
  { to: '/company/dashboard', label: 'Dashboard', icon: PieChart },
  { to: '/company/calls', label: 'Call History & Schedule', icon: Video, badge: 'Meet' },
  { to: '/company/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/company/candidates', label: 'Candidates', icon: Users },
  { to: '/company/pipeline', label: 'Pipeline', icon: TrendingUp },
  { to: '/company/university-insights', label: 'University Insights', icon: GraduationCap, badge: 'Rank' },
];

const aspirantNav = [
  { to: '/aspirant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/aspirant/profile', label: 'Academic & Entrance', icon: User },
  { to: '/aspirant/explore', label: 'College Explorer', icon: Building, badge: 'Cutoffs' },
  { to: '/aspirant/applications', label: 'My Applications', icon: FileText, badge: 'Live' },
];

const NAV_BY_ROLE = {
  student: studentNav,
  university: universityNav,
  company: companyNav,
  aspirant: aspirantNav,
};

function PasswordResetModal({ user, onComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, email: user?.email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 14,
        padding: 32,
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <KeyRound size={24} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
          Action Required: Reset Temporary Password
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: '0 0 20px' }}>
          Welcome to CAREER-OS! Your placement officer initialized your account with a temporary password. Please set your permanent private password to continue.
        </p>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              New Permanent Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '11px',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Saving...' : 'Set Password & Proceed'}
          </button>
        </form>
      </div>
    </div>
  );
}

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth();
  const { state } = useData();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user?.role] || [];

  const currentStudent = user?.role === 'student'
    ? ((state.students || []).find(s => s.id === user?.studentId) || (state.students || [])[0])
    : null;

  const isProfileComplete = Boolean(
    !currentStudent ||
    currentStudent.profileStatus === 'Verified' ||
    (currentStudent.profileCompletion || 0) >= 70 ||
    (
      Array.isArray(currentStudent.skills) && currentStudent.skills.length >= 2 &&
      Array.isArray(currentStudent.projects) && currentStudent.projects.length >= 1
    )
  );

  const isStudentProfileIncomplete = user?.role === 'student' && !isProfileComplete;

  function handleLogout() {
    logout();
    navigate('/login');
    if (onClose) onClose();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100dvh' }}>
      {/* Logo */}
      <div style={{ padding: 'max(20px, env(safe-area-inset-top, 20px)) 20px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
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
      <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isProfileRoute = item.to === '/student/profile';
          const isLocked = isStudentProfileIncomplete && !isProfileRoute;

          return (
            <NavLink
              key={item.to}
              to={isLocked ? '/student/profile' : item.to}
              onClick={(e) => {
                if (isLocked) {
                  e.preventDefault();
                  navigate('/student/profile');
                }
                if (onClose) onClose();
              }}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                marginBottom: 3,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                color: isLocked ? '#9CA3AF' : isActive ? '#4F46E5' : '#374151',
                background: isActive && !isLocked ? '#EEF2FF' : 'transparent',
                opacity: isLocked ? 0.65 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isLocked ? <Lock size={15} color="#9CA3AF" /> : <Icon size={16} />}
                <span>{item.label}</span>
              </div>
              {isLocked ? (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: '#F3F4F6',
                    color: '#9CA3AF',
                    padding: '2px 6px',
                    borderRadius: 9999,
                    border: '1px solid #E5E7EB',
                  }}
                >
                  Locked
                </span>
              ) : isProfileRoute && isStudentProfileIncomplete ? (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: '#FEF3C7',
                    color: '#B45309',
                    padding: '2px 7px',
                    borderRadius: 9999,
                    border: '1px solid #FCD34D',
                  }}
                >
                  Required
                </span>
              ) : item.badge ? (
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
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom user info + actions (Padded for iPhone home bar) */}
      <div style={{ borderTop: '1px solid #E5E7EB', padding: '12px 10px calc(16px + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }}>
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
  const { user, updateUser } = useAuth();
  const { state } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const currentStudent = user?.role === 'student'
    ? ((state.students || []).find(s => s.id === user?.studentId) || (state.students || [])[0])
    : null;

  const isProfileComplete = Boolean(
    !currentStudent ||
    currentStudent.profileStatus === 'Verified' ||
    (currentStudent.profileCompletion || 0) >= 70 ||
    (
      Array.isArray(currentStudent.skills) && currentStudent.skills.length >= 2 &&
      Array.isArray(currentStudent.projects) && currentStudent.projects.length >= 1
    )
  );

  const isStudentProfileIncomplete = user?.role === 'student' && !isProfileComplete;
  const isProfilePage = location.pathname === '/student/profile';

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#F8F9FA' }}>

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
              width: 290, maxWidth: '85vw',
              height: '100dvh',
              maxHeight: '100dvh',
              background: '#fff',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
              zIndex: 9999,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
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

        {/* Mobile topbar with iPhone Dynamic Island / Notch Inset Padding */}
        <header
          className="mobile-only"
          style={{
            minHeight: 'calc(56px + env(safe-area-inset-top, 0px))',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            background: '#fff',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
            paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            flexShrink: 0,
            boxSizing: 'border-box',
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

        {/* Page content with iPhone Home Bar Padding */}
        <main
          style={{
            flex: 1,
            padding: 16,
            paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
            paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
            paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Forced Password Reset on First Login */}
            {user?.mustResetPassword && (
              <PasswordResetModal
                user={user}
                onComplete={() => updateUser({ mustResetPassword: false })}
              />
            )}

            {/* Profile Completion Gatekeeper: If profile is incomplete and not on profile view, render locked screen */}
            {isStudentProfileIncomplete && !isProfilePage ? (
              <div style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: '40px 24px',
                textAlign: 'center',
                maxWidth: 620,
                margin: '40px auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Lock size={32} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
                  Placement Features Locked
                </h2>
                <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, margin: '0 0 20px' }}>
                  University placement cell rules require all registered students to complete their verified Profile details (Personal contact info, Technical skills, and Portfolio projects) before participating in campus recruitment drives, mock interviews, or submitting job applications.
                </p>
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16, marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    <span>Profile Completion Status</span>
                    <span style={{ color: '#2563EB' }}>{currentStudent?.profileCompletion || 20}%</span>
                  </div>
                  <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${currentStudent?.profileCompletion || 20}%`, height: '100%', background: '#2563EB', borderRadius: 4 }} />
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: '#6B7280' }}>
                    Required to unlock: Add contact info, at least 2 technical skills, and 1 verified project in your profile.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/student/profile')}
                  style={{
                    background: '#2563EB',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 28px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  Go to Profile Section <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                {/* When on profile page and incomplete, show notification alert */}
                {isStudentProfileIncomplete && isProfilePage && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#92400E' }}>
                        Profile Activation Required
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#B45309', lineHeight: 1.5 }}>
                        Please complete your profile sections below (Personal Info, Technical Skills, and Projects). Other campus placement features remain locked until your profile is completed.
                      </p>
                    </div>
                  </div>
                )}
                {children}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
