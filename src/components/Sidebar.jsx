import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Nav configs per role
const studentNav = [
  { to: '/student/dashboard', label: 'Dashboard' },
  { to: '/student/calls', label: 'Call Section (Live Meet)', badge: 'Meet' },
  { to: '/student/portfolio', label: 'Projects & Portfolio' },
  { to: '/student/profile', label: 'Profile' },
  { to: '/student/resume', label: 'Resume Builder' },
  { to: '/student/applications', label: 'Applications' },
  { to: '/student/certificates', label: 'Certificates' },
  { to: '/student/materials', label: 'Courses & Materials', badge: 'New' },
  { to: '/student/higher-education', label: 'Higher Education', badge: 'MS' },
  { to: '/student/referrals', label: 'Referrals & Rewards', badge: 'Perks' },
  { to: '/student/skill-gap', label: 'Skill Gap' },
  { to: '/student/interview-prep', label: 'Interview Prep' },
];

const universityNav = [
  { to: '/university/dashboard', label: 'Dashboard' },
  { to: '/university/students', label: 'Students' },
  { to: '/university/drives', label: 'Drives' },
  { to: '/university/mail-filter', label: 'Mail Filter' },
  { to: '/university/records-import', label: 'Registrar Sync', badge: 'Auto' },
  { to: '/university/referrals', label: 'Endorsements & Perks' },
  { to: '/university/admissions', label: 'Admissions Desk', badge: '12th' },
];

const companyNav = [
  { to: '/company/dashboard', label: 'Dashboard' },
  { to: '/company/calls', label: 'Call History & Schedule', badge: 'Meet' },
  { to: '/company/jobs', label: 'Jobs' },
  { to: '/company/candidates', label: 'Candidates' },
  { to: '/company/pipeline', label: 'Pipeline' },
  { to: '/company/university-insights', label: 'University Insights', badge: 'Rank' },
];

const aspirantNav = [
  { to: '/aspirant/dashboard', label: 'Aspirant Home' },
  { to: '/aspirant/profile', label: 'Academic & Entrance' },
  { to: '/aspirant/explore', label: 'College Explorer', badge: 'Cutoffs' },
  { to: '/aspirant/applications', label: 'My Applications', badge: 'Live' },
];

const NAV_BY_ROLE = {
  student: studentNav,
  university: universityNav,
  company: companyNav,
  aspirant: aspirantNav,
};

export default function Sidebar() {
  const { user } = useAuth();
  const navItems = NAV_BY_ROLE[user?.role] || [];

  return (
    <aside
      style={{ width: 240, minHeight: '100vh', background: '#fff', borderRight: '1px solid #E5E7EB' }}
      className="flex flex-col flex-shrink-0"
    >
      {/* Logo / App name */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #E5E7EB' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#2563EB', letterSpacing: '-0.5px' }}>
          CAREER-OS
        </span>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Placement management platform</div>
      </div>

      {/* Nav links */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              marginBottom: 2,
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              color: isActive ? '#2563EB' : '#374151',
              background: isActive ? '#EFF6FF' : 'transparent',
            })}
          >
            <span>{item.label}</span>
            {item.badge && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: '#ECFDF5',
                  color: '#059669',
                  padding: '2px 6px',
                  borderRadius: 9999,
                  border: '1px solid #A7F3D0',
                }}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* About Leadership link */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid #E5E7EB' }}>
        <a
          href="/about"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            fontWeight: 500,
            color: '#4B5563',
            textDecoration: 'none',
            padding: '6px 0',
          }}
        >
          <span>About Leadership</span>
          <span style={{ color: '#4F46E5', fontSize: 11, fontWeight: 700 }}>Team →</span>
        </a>
      </div>

      {/* Role badge at bottom */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {user?.role} portal
        </div>
      </div>
    </aside>
  );
}
