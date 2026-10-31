import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import {
  GraduationCap,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  BookOpen,
  Award,
  UserCheck,
  Send,
  Plus,
} from 'lucide-react';

export default function UniversityAdmissions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'colleges'
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Accepted');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdmissionsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/university/admissions', {
        headers: { 'x-user-role': 'university' },
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissionsData();
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/university/admissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'university' },
        body: JSON.stringify({
          applicationId: reviewModal.id,
          status: reviewStatus,
          remarks: reviewRemarks || `Application status updated to ${reviewStatus} by institutional admissions committee.`,
        }),
      });
      if (res.ok) {
        setReviewModal(null);
        fetchAdmissionsData();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const applications = data?.applications || [];
  const colleges = data?.colleges || [];

  return (
    <Layout role="university">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={24} color="#2563EB" />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>University Admissions & 12th Enrollment Desk</h1>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
                  Manage undergraduate course offerings, review Class 12th applicant submissions, and issue provisional offer letters.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', background: '#F3F4F6', padding: 4, borderRadius: 8 }}>
            <button
              onClick={() => setActiveTab('applications')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'applications' ? '#fff' : 'transparent',
                fontWeight: activeTab === 'applications' ? 700 : 500,
                color: activeTab === 'applications' ? '#111827' : '#6B7280',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Applicant Review Queue ({applications.length})
            </button>
            <button
              onClick={() => setActiveTab('colleges')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'colleges' ? '#fff' : 'transparent',
                fontWeight: activeTab === 'colleges' ? 700 : 500,
                color: activeTab === 'colleges' ? '#111827' : '#6B7280',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Colleges & Course Seats ({colleges.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Applications Queue */}
        {activeTab === 'applications' && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Undergraduate Applicant Queue</h3>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading applicant applications...</div>
            ) : applications.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>No student applications received yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {applications.map(app => (
                  <div key={app.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, background: app.status === 'Under Review' ? '#FFFBEB' : '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{app.aspirantName || app.aspirantId}</span>
                          <span style={{ fontSize: 12, color: '#64748B' }}>({app.board} • {app.stream} • 12th Marks: <strong>{app.twelfthPercentage}%</strong>)</span>
                          <span style={{
                            padding: '2px 10px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            background: app.status === 'Accepted' ? '#DCFCE7' : app.status === 'Under Review' ? '#FEF3C7' : app.status === 'Rejected' ? '#FEE2E2' : '#EFF6FF',
                            color: app.status === 'Accepted' ? '#15803D' : app.status === 'Under Review' ? '#B45309' : app.status === 'Rejected' ? '#DC2626' : '#1D4ED8',
                          }}>
                            {app.status}
                          </span>
                        </div>

                        <div style={{ fontSize: 13, color: '#2563EB', fontWeight: 600, marginTop: 4 }}>
                          Applying For: {app.course} ({app.collegeName})
                        </div>

                        {app.remarks && (
                          <div style={{ marginTop: 8, fontSize: 12, color: '#475569', background: '#fff', padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                            <strong>Official Remarks:</strong> "{app.remarks}"
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setReviewModal(app);
                          setReviewStatus(app.status || 'Accepted');
                          setReviewRemarks(app.remarks || 'Verified 12th marksheet and entrance criteria. Provisional admission confirmed.');
                        }}
                        style={{
                          padding: '7px 16px',
                          background: '#2563EB',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Review & Decision →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Colleges & Course Seats */}
        {activeTab === 'colleges' && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Registered College Campuses & Course Quotas</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
              {colleges.map(col => (
                <div key={col.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, background: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 2px' }}>{col.name}</h4>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{col.location} • {col.accreditation}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>
                      {col.seats} Seats
                    </span>
                  </div>

                  <div style={{ marginTop: 12, borderTop: '1px solid #E2E8F0', paddingTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Active Courses & Annual Fees:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {(col.courses || []).map((crs, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#334155' }}>
                          <span>• {crs.name}</span>
                          <span style={{ fontWeight: 600 }}>₹{(crs.annualFee || col.fees).toLocaleString('en-IN')}/yr</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewModal && (
          <Modal
            isOpen={Boolean(reviewModal)}
            title={`Review Application: ${reviewModal.aspirantName || reviewModal.aspirantId}`}
            onClose={() => setReviewModal(null)}
          >
            <form onSubmit={handleUpdateStatus}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{reviewModal.aspirantName} ({reviewModal.board} {reviewModal.stream})</div>
                <div style={{ fontSize: 13, color: '#2563EB', fontWeight: 600, marginTop: 4 }}>
                  Applied Course: {reviewModal.course}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  12th Marks: <strong>{reviewModal.twelfthPercentage}%</strong>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Admissions Committee Decision *
                </label>
                <select
                  value={reviewStatus}
                  onChange={e => setReviewStatus(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
                >
                  <option value="Accepted">Accepted (Issue Provisional Admission Offer)</option>
                  <option value="Under Review">Under Review (Document Verification in Progress)</option>
                  <option value="Waitlisted">Waitlisted (Next Cutoff Counseling Round)</option>
                  <option value="Rejected">Rejected (Does Not Meet Stream Cutoff)</option>
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Official Remarks / Offer Instructions *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setReviewModal(null)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    background: reviewStatus === 'Accepted' ? '#059669' : '#2563EB',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionLoading ? 'Saving...' : 'Confirm Decision & Update Student'}
                </button>
              </div>
            </form>
          </Modal>
        )}

      </div>
    </Layout>
  );
}

