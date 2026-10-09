import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Badge, { getBadgeVariant } from '../../components/Badge';
import DataTable from '../../components/DataTable';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { checkEligibility } from '../../utils/eligibility';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const student = state.students.find(s => s.id === user.studentId);
  if (!student) return <Layout title="Dashboard"><p>Student not found.</p></Layout>;

  const myApplications = state.applications.filter(a => a.studentId === student.id);
  const myCerts = state.certificates.filter(c => c.studentId === student.id);
  const myNotifs = state.notifications.filter(n => n.studentId === student.id);

  // ATS score from latest resume version
  const myVersions = state.resumeVersions[student.id] || [];
  const latestAts = myVersions.length > 0 ? myVersions[0].score : null;

  // Upcoming drives eligibility
  const upcomingDrives = state.drives.filter(d => d.status === 'Open' || d.status === 'Upcoming');

  // Expiring soon certs banner
  const expiringSoon = myCerts.filter(c => c.status === 'Expiring soon');

  function handleApply(drive) {
    const alreadyApplied = myApplications.some(a => a.driveId === drive.id);
    if (alreadyApplied) return;

    const newApp = {
      id: `a${Date.now()}`,
      studentId: student.id,
      driveId: drive.id,
      jobId: drive.jobId,
      company: drive.company,
      role: drive.role,
      ctc: drive.ctc,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
      notes: '',
      statusHistory: [{ stage: 'Applied', date: new Date().toISOString().split('T')[0] }],
    };
    dispatch({ type: 'ADD_APPLICATION', payload: newApp });

    // Also add to drive applications
    const newDriveApp = {
      id: `da${Date.now()}`,
      studentId: student.id,
      driveId: drive.id,
      studentName: student.name,
      regNo: student.regNo,
      branch: student.branch,
      cgpa: student.cgpa,
      status: 'Applied',
      shortlisted: false,
      rejected: false,
    };
    dispatch({ type: 'ADD_DRIVE_APPLICATION', payload: newDriveApp });

    // Update drive applicant count
    dispatch({ type: 'UPDATE_DRIVE', payload: { id: drive.id, applicantsCount: (drive.applicantsCount || 0) + 1 } });
  }

  const driveColumns = [
    { key: 'company', header: 'Company' },
    { key: 'role', header: 'Role' },
    { key: 'ctc', header: 'CTC', render: v => `${v} LPA` },
    { key: 'deadline', header: 'Deadline' },
    {
      key: 'id', header: 'Eligibility', render: (_, row) => {
        const { eligible, reason } = checkEligibility(student, row);
        return <Badge variant={eligible ? 'success' : 'danger'}>{eligible ? 'Eligible' : reason}</Badge>;
      }
    },
    {
      key: 'actions', header: '', render: (_, row) => {
        const { eligible } = checkEligibility(student, row);
        const alreadyApplied = myApplications.some(a => a.driveId === row.id);
        return (
          <button
            disabled={!eligible || alreadyApplied}
            onClick={e => { e.stopPropagation(); handleApply(row); }}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: '1px solid #E5E7EB',
              background: alreadyApplied ? '#F9FAFB' : eligible ? '#2563EB' : '#F9FAFB',
              color: alreadyApplied ? '#9CA3AF' : eligible ? '#fff' : '#9CA3AF',
              cursor: eligible && !alreadyApplied ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {alreadyApplied ? 'Applied' : 'Apply'}
          </button>
        );
      }
    },
  ];

  // Skill gap top 3 missing skills for Frontend Developer
  const skillGapPreview = [
    { skill: 'TypeScript', requiredLevel: 3, currentLevel: 0 },
    { skill: 'Redux', requiredLevel: 3, currentLevel: 0 },
    { skill: 'Testing (Jest)', requiredLevel: 2, currentLevel: 0 },
  ];

  return (
    <Layout title="Dashboard">
      {/* Expiring cert banner */}
      {expiringSoon.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          Certificate expiring soon: {expiringSoon.map(c => c.title).join(', ')}. Renew before the deadline.
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Profile Completion" value={`${student.profileCompletion}%`} sub={student.profileStatus} />
        <StatCard label="Applications" value={myApplications.length} sub={`${myApplications.filter(a => a.status === 'Offer').length} offer(s)`} />
        <StatCard label="Resume ATS Score" value={latestAts !== null ? `${latestAts}/100` : 'N/A'} sub="Latest version" />
        <StatCard label="Certificates" value={myCerts.length} sub={`${myCerts.filter(c => c.status === 'Valid').length} valid`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 24 }}>
        {/* Upcoming drives */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Upcoming Drives</h2>
          <DataTable
            columns={driveColumns}
            rows={upcomingDrives}
            emptyMessage="No upcoming drives."
          />
        </div>

        {/* Notifications */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Notifications</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myNotifs.slice(0, 5).map(n => (
              <div
                key={n.id}
                onClick={() => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id })}
                style={{
                  padding: 10,
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: n.read ? '#fff' : '#F0F9FF',
                  borderLeft: n.read ? '1px solid #E5E7EB' : '3px solid #2563EB',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{n.read ? 'Read' : 'Click to mark as read'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skill gap summary */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Skill Gap Summary</h2>
          <Link to="/student/skill-gap" style={{ fontSize: 13, color: '#2563EB' }}>View full analysis</Link>
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Top missing skills for Frontend Developer role:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {skillGapPreview.map(item => (
            <div key={item.skill} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 140, fontSize: 13, color: '#374151' }}>{item.skill}</span>
              <Badge variant="danger">Missing</Badge>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Required level: {item.requiredLevel}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
