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

export default function UniversityDashboard() {
  const { state } = useData();
  const { students, drives } = state;

  const totalStudents = students.length;
  const verifiedProfiles = students.filter(s => s.profileStatus === 'Verified').length;
  const activeDrives = drives.filter(d => d.status === 'Open' || d.status === 'Upcoming').length;
  const placedStudents = students.filter(s => s.placementStatus === 'Placed').length;
  const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

  // Placements by branch
  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'];
  const branchData = branches.map(br => {
    const totalInBranch = students.filter(s => s.branch === br).length;
    const placedInBranch = students.filter(s => s.branch === br && s.placementStatus === 'Placed').length;
    return {
      branch: br,
      Placed: placedInBranch,
      Total: totalInBranch,
    };
  });

  const driveColumns = [
    {
      key: 'company',
      header: 'Company',
      render: (v, r) => (
        <Link to={`/university/drives/${r.id}`} style={{ color: '#2563EB', fontWeight: 500 }}>
          {v}
        </Link>
      ),
    },
    { key: 'role', header: 'Role' },
    { key: 'ctc', header: 'CTC', render: v => `${v} LPA` },
    { key: 'deadline', header: 'Deadline' },
    {
      key: 'status',
      header: 'Status',
      render: v => (
        <Badge variant={v === 'Open' ? 'success' : v === 'Upcoming' ? 'info' : 'gray'}>
          {v}
        </Badge>
      ),
    },
    { key: 'applicantsCount', header: 'Applicants' },
  ];

  return (
    <Layout title="Placement Cell Overview">
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Students" value={totalStudents} sub="Batch 2026" />
        <StatCard label="Verified Profiles" value={verifiedProfiles} sub={`${Math.round((verifiedProfiles / totalStudents) * 100)}% verified`} />
        <StatCard label="Active Drives" value={activeDrives} sub="Open / Upcoming" />
        <StatCard label="Students Placed" value={placedStudents} sub="Accepted offers" />
        <StatCard label="Placement Rate" value={`${placementRate}%`} sub="Target: 95%" />
      </div>

      {/* Grid: Bar chart & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, alignItems: 'stretch' }}>
        {/* Placements by branch chart */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
            Placements by Branch
          </h2>
          <div style={{ flex: 1, minHeight: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={branchData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="branch" tick={{ fontSize: 11, fill: '#4B5563' }} />
                <YAxis tick={{ fontSize: 11, fill: '#4B5563' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="Placed" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Total" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Alert & Drive Summary */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Pending Profile Actions
            </h2>
            <Link to="/university/students" style={{ fontSize: 13, color: '#2563EB' }}>View all students</Link>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280' }}>
            {students.filter(s => s.profileStatus !== 'Verified').length} students have pending profile section verifications required for company recruitment eligibility.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {students.filter(s => s.profileStatus !== 'Verified').slice(0, 4).map(st => (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  background: '#F9FAFB',
                }}
              >
                <div>
                  <Link to={`/university/students/${st.id}`} style={{ fontWeight: 600, fontSize: 13, color: '#111827', textDecoration: 'none' }}>
                    {st.name}
                  </Link>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{st.regNo} • {st.branch} • CGPA {st.cgpa}</div>
                </div>
                <Link
                  to={`/university/students/${st.id}`}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#2563EB',
                    fontSize: 12,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Verify
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent drive activity */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
            Recent Drive Activity
          </h2>
          <Link to="/university/drives" style={{ fontSize: 13, color: '#2563EB' }}>
            Manage all drives
          </Link>
        </div>
        <DataTable
          columns={driveColumns}
          rows={drives}
          emptyMessage="No drive activity found."
        />
      </div>
    </Layout>
  );
}
