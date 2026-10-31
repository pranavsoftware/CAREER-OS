import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const { state } = useData();

  const myCompany = user?.company || 'Infosys';

  // Company's jobs
  const myJobs = state.jobs.filter(j => j.company === myCompany);
  const openJobs = myJobs.filter(j => j.status === 'Active' || j.status === 'Open');

  // Applications for this company
  const myApplications = state.applications.filter(a => a.company === myCompany);

  const totalApplicants = myApplications.length;
  const shortlistedCount = myApplications.filter(a => a.status === 'Online Test' || a.status === 'Interview').length;
  const offersMade = myApplications.filter(a => a.status === 'Offer').length;

  // Hiring Funnel data for Recharts BarChart
  const funnelData = [
    { stage: 'Applied', count: totalApplicants },
    { stage: 'Screened', count: myApplications.filter(a => a.status !== 'Rejected').length },
    { stage: 'Interview', count: myApplications.filter(a => a.status === 'Interview' || a.status === 'Offer').length },
    { stage: 'Offer', count: offersMade },
  ];

  const applicantColumns = [
    {
      key: 'studentId',
      header: 'Applicant',
      render: (v, r) => {
        const student = state.students.find(s => s.id === v);
        return (
          <div>
            <span style={{ fontWeight: 600, color: '#111827' }}>{student?.name || 'Applicant'}</span>
            <div style={{ fontSize: 11, color: '#6B7280' }}>{student?.regNo || ''} {student?.branch ? `• ${student.branch}` : ''}</div>
          </div>
        );
      },
    },
    { key: 'role', header: 'Applied Role' },
    { key: 'ctc', header: 'CTC', render: v => `${v} LPA` },
    { key: 'appliedDate', header: 'Date' },
    {
      key: 'status',
      header: 'Current Stage',
      render: v => (
        <Badge variant={v === 'Offer' ? 'success' : v === 'Rejected' ? 'danger' : 'info'}>
          {v}
        </Badge>
      ),
    },
  ];

  return (
    <Layout title={`${myCompany} Recruitment Dashboard`}>
      {/* Stat cards */}
      <div className="grid-stats-responsive-4">
        <StatCard label="Active Job Postings" value={openJobs.length} sub={`${myJobs.length} total roles`} />
        <StatCard label="Total Applicants" value={totalApplicants} sub="Across active postings" />
        <StatCard label="In Interview / Shortlist" value={shortlistedCount} sub="Under active review" />
        <StatCard label="Offers Extended" value={offersMade} sub="Pending acceptance" />
      </div>

      {/* Grid: Hiring Funnel & Quick Action */}
      <div className="grid-split-responsive-2" style={{ alignItems: 'stretch' }}>
        {/* Hiring Funnel Bar Chart */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
            Hiring Funnel Progression
          </h2>
          <div style={{ flex: 1, minHeight: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#4B5563' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4B5563' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Candidate Sourcing Card */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Campus Talent Search
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
              Browse pre-verified candidates from VIT Chennai & Vellore with matched skill scores, accredited project portfolios, and university placement clearance.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: '8px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }}>
                Verified Candidates Available: <strong>{state.students.filter(s => s.profileStatus === 'Verified').length}</strong>
              </div>
              <div style={{ padding: '8px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }}>
                High CGPA Pool (&ge; 8.0): <strong>{state.students.filter(s => s.cgpa >= 8.0 && s.profileStatus === 'Verified').length}</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <Link
              to="/company/candidates"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: 6,
                background: '#2563EB',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Search verified candidates
            </Link>
            <Link
              to="/company/pipeline"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                background: '#fff',
                color: '#374151',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Open interview pipeline
            </Link>
          </div>
        </div>
      </div>

      {/* Recent applicants table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
            Recent Applicants ({myCompany})
          </h2>
          <Link to="/company/pipeline" style={{ fontSize: 13, color: '#2563EB' }}>
            Manage in pipeline
          </Link>
        </div>
        <DataTable
          columns={applicantColumns}
          rows={myApplications}
          emptyMessage="No applicants recorded for this company yet."
        />
      </div>
    </Layout>
  );
}
