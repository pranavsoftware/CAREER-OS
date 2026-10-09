import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';

export default function UniversityStudents() {
  const navigate = useNavigate();
  const { state } = useData();
  const { students } = state;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [minCgpa, setMinCgpa] = useState('');
  const [backlogFilter, setBacklogFilter] = useState('All'); // 'All' | '0' | '>0'
  const [verificationFilter, setVerificationFilter] = useState('All');

  const filteredStudents = students.filter(s => {
    // Search
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchTerm.toLowerCase());

    // Branch
    const matchBranch = selectedBranch === 'All' || s.branch === selectedBranch;

    // Min CGPA
    const matchCgpa = !minCgpa || s.cgpa >= Number(minCgpa);

    // Backlog
    const matchBacklog =
      backlogFilter === 'All'
        ? true
        : backlogFilter === '0'
        ? s.backlogs === 0
        : s.backlogs > 0;

    // Verification
    const matchVerif =
      verificationFilter === 'All' || s.profileStatus === verificationFilter;

    return matchSearch && matchBranch && matchCgpa && matchBacklog && matchVerif;
  });

  const columns = [
    {
      key: 'name',
      header: 'Student Name',
      render: (v, r) => (
        <div>
          <span style={{ fontWeight: 600, color: '#111827' }}>{v}</span>
          <div style={{ fontSize: 11, color: '#6B7280' }}>{r.email}</div>
        </div>
      ),
    },
    { key: 'regNo', header: 'Reg No' },
    { key: 'branch', header: 'Branch' },
    { key: 'cgpa', header: 'CGPA', render: v => v.toFixed(2) },
    {
      key: 'backlogs',
      header: 'Backlogs',
      render: v => (
        <span style={{ color: v > 0 ? '#DC2626' : '#15803D', fontWeight: v > 0 ? 600 : 400 }}>
          {v}
        </span>
      ),
    },
    {
      key: 'profileStatus',
      header: 'Profile Status',
      render: v => (
        <Badge variant={v === 'Verified' ? 'success' : v === 'Partial' ? 'warning' : 'gray'}>
          {v}
        </Badge>
      ),
    },
    {
      key: 'placementStatus',
      header: 'Placement Status',
      render: v => (
        <Badge variant={v === 'Placed' ? 'success' : v === 'In process' ? 'info' : 'gray'}>
          {v}
        </Badge>
      ),
    },
  ];

  return (
    <Layout title="Student Directory & Profile Verification">
      {/* Filters Bar */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {/* Search */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Search Name/Reg No:</label>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
            />
          </div>

          {/* Branch */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Branch:</label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              <option value="All">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>

          {/* Min CGPA */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Min CGPA:</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              placeholder="e.g. 8.0"
              value={minCgpa}
              onChange={e => setMinCgpa(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
            />
          </div>

          {/* Backlogs */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Backlogs:</label>
            <select
              value={backlogFilter}
              onChange={e => setBacklogFilter(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              <option value="All">All</option>
              <option value="0">No Backlogs (0)</option>
              <option value=">0">Has Backlogs (&gt;0)</option>
            </select>
          </div>

          {/* Verification */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Profile Status:</label>
            <select
              value={verificationFilter}
              onChange={e => setVerificationFilter(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#6B7280' }}>
          <span>Showing {filteredStudents.length} of {students.length} students</span>
          {(searchTerm || selectedBranch !== 'All' || minCgpa || backlogFilter !== 'All' || verificationFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBranch('All');
                setMinCgpa('');
                setBacklogFilter('All');
                setVerificationFilter('All');
              }}
              style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontSize: 12 }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <DataTable
          columns={columns}
          rows={filteredStudents}
          onRowClick={row => navigate(`/university/students/${row.id}`)}
          emptyMessage="No students match the selected filter criteria."
        />
      </div>
    </Layout>
  );
}
