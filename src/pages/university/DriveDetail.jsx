import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';
import { downloadCSV } from '../../utils/csv';

export default function UniversityDriveDetail() {
  const { id } = useParams();
  const { state, dispatch } = useData();

  const drive = state.drives.find(d => d.id === id);
  const applicants = state.driveApplications.filter(a => a.driveId === id);

  if (!drive) {
    return (
      <Layout title="Drive Detail">
        <p>Drive not found.</p>
        <Link to="/university/drives" style={{ color: '#2563EB' }}>Back to drives</Link>
      </Layout>
    );
  }

  function handleShortlist(appId) {
    dispatch({
      type: 'UPDATE_DRIVE_APPLICATION',
      payload: { id: appId, shortlisted: true, rejected: false, status: 'Shortlisted' },
    });
  }

  function handleReject(appId) {
    dispatch({
      type: 'UPDATE_DRIVE_APPLICATION',
      payload: { id: appId, shortlisted: false, rejected: true, status: 'Rejected' },
    });
  }

  function handleExportCsv() {
    const exportData = applicants.map(a => ({
      'Student Name': a.studentName,
      'Registration No': a.regNo,
      'Branch': a.branch,
      'CGPA': a.cgpa,
      'Status': a.shortlisted ? 'Shortlisted' : a.rejected ? 'Rejected' : a.status || 'Applied',
    }));
    downloadCSV(exportData, `${drive.company}_${drive.role}_applicants.csv`);
  }

  const columns = [
    { key: 'studentName', header: 'Student Name' },
    { key: 'regNo', header: 'Registration No' },
    { key: 'branch', header: 'Branch' },
    { key: 'cgpa', header: 'CGPA', render: v => v.toFixed(2) },
    {
      key: 'status',
      header: 'Review Status',
      render: (_, r) => {
        if (r.shortlisted) return <Badge variant="success">Shortlisted</Badge>;
        if (r.rejected) return <Badge variant="danger">Rejected</Badge>;
        return <Badge variant="info">Under Review</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            disabled={r.shortlisted}
            onClick={() => handleShortlist(r.id)}
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              border: 'none',
              background: r.shortlisted ? '#F3F4F6' : '#16A34A',
              color: r.shortlisted ? '#9CA3AF' : '#fff',
              fontSize: 12,
              fontWeight: 500,
              cursor: r.shortlisted ? 'default' : 'pointer',
            }}
          >
            {r.shortlisted ? 'Shortlisted' : 'Shortlist'}
          </button>
          <button
            disabled={r.rejected}
            onClick={() => handleReject(r.id)}
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              border: '1px solid #FCA5A5',
              background: r.rejected ? '#F3F4F6' : '#FEF2F2',
              color: r.rejected ? '#9CA3AF' : '#DC2626',
              fontSize: 12,
              fontWeight: 500,
              cursor: r.rejected ? 'default' : 'pointer',
            }}
          >
            {r.rejected ? 'Rejected' : 'Reject'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout title={`Drive Details: ${drive.company} — ${drive.role}`}>
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/university/drives" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none' }}>
          ← Back to Drives List
        </Link>
      </div>

      {/* Drive Overview Header Card */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {drive.company} — {drive.role}
            </h1>
            <div style={{ fontSize: 13, color: '#4B5563', marginBottom: 8 }}>
              Package: <strong>{drive.ctc} LPA</strong> • Registration Deadline: <strong>{drive.deadline}</strong>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              Eligibility: Branches ({(drive.eligibleBranches || []).join(', ')}) • Min CGPA: {drive.minCgpa} • Max Backlogs: {drive.maxBacklogs}
            </div>
          </div>
          <div>
            <Badge variant={drive.status === 'Open' ? 'success' : drive.status === 'Upcoming' ? 'info' : 'gray'}>
              {drive.status}
            </Badge>
          </div>
        </div>

        {drive.description && (
          <p style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
            {drive.description}
          </p>
        )}
      </div>

      {/* Applicants Section */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
              Registered Applicants ({applicants.length})
            </h2>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              Shortlisted: {applicants.filter(a => a.shortlisted).length} • Rejected: {applicants.filter(a => a.rejected).length}
            </div>
          </div>
          <button
            disabled={applicants.length === 0}
            onClick={handleExportCsv}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              background: applicants.length === 0 ? '#F9FAFB' : '#fff',
              color: applicants.length === 0 ? '#9CA3AF' : '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: applicants.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Export CSV
          </button>
        </div>

        <DataTable
          columns={columns}
          rows={applicants}
          emptyMessage="No applicants registered for this drive yet."
        />
      </div>
    </Layout>
  );
}
