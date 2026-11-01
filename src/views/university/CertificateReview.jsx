import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import { 
  Award, CheckCircle2, XCircle, ExternalLink, ShieldCheck, 
  AlertTriangle, Eye, RefreshCw, FileText, Filter, Check, X, User
} from 'lucide-react';

export default function CertificateReview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [remarkInput, setRemarkInput] = useState('');
  const [suspectedForgery, setSuspectedForgery] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Filters
  const [trustFilter, setTrustFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');

  async function loadPendingReviews() {
    setLoading(true);
    try {
      let url = '/api/university/certificates/review';
      const params = new URLSearchParams();
      if (trustFilter !== 'All') params.append('trustLevel', trustFilter);
      if (branchFilter !== 'All') params.append('branch', branchFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { 'x-user-role': 'university' },
      });
      const data = await res.json();
      if (data.certificates) {
        setReviews(data.certificates);
        if (selectedCert) {
          const updatedSelected = data.certificates.find(c => c.id === selectedCert.id);
          setSelectedCert(updatedSelected || null);
        }
      }
    } catch (err) {
      console.error('Error loading certificate reviews:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPendingReviews();
  }, [trustFilter, branchFilter]);

  async function handleDecision(decision) {
    if (!selectedCert) return;
    if (decision === 'reject' && !remarkInput.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter an officer remark explaining the rejection reason.' });
      return;
    }

    setActionLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/university/certificates/${selectedCert.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'university',
        },
        body: JSON.stringify({
          decision,
          remark: remarkInput.trim(),
          suspectedForgery,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setStatusMsg({
        type: 'success',
        text: `Certificate has been ${decision === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });

      setRemarkInput('');
      setSuspectedForgery(false);
      setSelectedCert(null);
      await loadPendingReviews();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Layout title="Certificate Review Queue">
      {/* Header Banner */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: '#EEF2FF', padding: 8, borderRadius: 8, color: '#4F46E5' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  Certificate Verification Queue
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                  Review and audit student credentials flagged or requiring placement cell confirmation before recruiter discovery.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Pending Action: <span style={{ color: '#DC2626', fontWeight: 700 }}>{reviews.length}</span>
            </span>
            <button
              onClick={loadPendingReviews}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                background: '#fff',
                fontSize: 12,
                cursor: 'pointer',
                color: '#374151',
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 16,
          background: statusMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${statusMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          color: statusMsg.type === 'success' ? '#15803D' : '#B91C1C',
          fontSize: 13,
          fontWeight: 500,
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Main Grid: List Table + Detail Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCert ? '1.1fr 1fr' : '1fr', gap: 20 }}>
        {/* Table Column */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
          {/* Filters Bar */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 12, alignItems: 'center', background: '#F9FAFB', flexWrap: 'wrap' }}>
            <Filter size={15} color="#6B7280" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4B5563' }}>Filter:</span>
            <select
              value={trustFilter}
              onChange={e => setTrustFilter(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff' }}
            >
              <option value="All">All Trust Levels</option>
              <option value="Flagged">Flagged Only</option>
              <option value="Unverified">Unverified Only</option>
            </select>

            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff' }}
            >
              <option value="All">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
              Loading certificate review queue...
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#111827' }}>
                All Certificate Reviews Complete
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                There are no pending certificate verifications requiring placement cell review.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '10px 14px' }}>Student</th>
                    <th style={{ padding: '10px 14px' }}>Certificate</th>
                    <th style={{ padding: '10px 14px' }}>Trust Level</th>
                    <th style={{ padding: '10px 14px' }}>Automated Checks</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(cert => {
                    const isSelected = selectedCert?.id === cert.id;
                    const isFlagged = cert.trustLevel === 'Flagged';
                    const checks = cert.checkResults || {};

                    return (
                      <tr
                        key={cert.id}
                        onClick={() => setSelectedCert(cert)}
                        style={{
                          borderBottom: '1px solid #F3F4F6',
                          background: isSelected ? '#EFF6FF' : isFlagged ? '#FEF2F2' : '#fff',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{cert.studentName}</div>
                          <div style={{ fontSize: 11, color: '#6B7280' }}>{cert.studentRegNo} • {cert.studentBranch}</div>
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#111827', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cert.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#6B7280' }}>{cert.issuer}</div>
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: isFlagged ? '#FEE2E2' : '#FEF3C7',
                            color: isFlagged ? '#991B1B' : '#92400E',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}>
                            {isFlagged ? <AlertTriangle size={12} /> : null}
                            {cert.trustLevel}
                          </span>
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {checks.nameMatch === false && (
                              <span style={{ fontSize: 10, background: '#FEE2E2', color: '#B91C1C', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                Name Mismatch
                              </span>
                            )}
                            {checks.pageValid === false && (
                              <span style={{ fontSize: 10, background: '#FEE2E2', color: '#B91C1C', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                Invalid Link
                              </span>
                            )}
                            {checks.source === 'none' && (
                              <span style={{ fontSize: 10, background: '#F3F4F6', color: '#6B7280', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
                                No QR/URL
                              </span>
                            )}
                            {checks.domainNotAllowlisted && (
                              <span style={{ fontSize: 10, background: '#FEF3C7', color: '#B45309', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
                                Third-party Domain
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCert(cert);
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              border: isSelected ? '1px solid #2563EB' : '1px solid #D1D5DB',
                              background: isSelected ? '#2563EB' : '#fff',
                              color: isSelected ? '#fff' : '#374151',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Inspection Drawer */}
        {selectedCert && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #F3F4F6', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                  Verification Audit Details
                </h3>
                <span style={{ fontSize: 12, color: '#6B7280' }}>ID: {selectedCert.id}</span>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Student Comparison Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                  Student Registered Profile
                </div>
                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 13 }}>{selectedCert.studentName}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>Reg No: {selectedCert.studentRegNo}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>Branch: {selectedCert.studentBranch} (CGPA: {selectedCert.studentCgpa || 'N/A'})</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                  Issuer Registry Record
                </div>
                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 13 }}>
                  {selectedCert.checkResults?.extractedHolderName || 'Not extracted / Mismatched'}
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>Title: {selectedCert.checkResults?.extractedTitle || selectedCert.title}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>Issuer: {selectedCert.issuer}</div>
              </div>
            </div>

            {/* Checklist of Automated Results */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase' }}>
                Verification Checks Matrix
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Issuer Registry Page Authenticated', ok: selectedCert.checkResults?.pageValid },
                  { label: 'Recipient Name Exact / Similarity Match', ok: selectedCert.checkResults?.nameMatch },
                  { label: 'Certificate Title Alignment', ok: selectedCert.checkResults?.titleMatch },
                  { label: 'Issue Date Consistency', ok: selectedCert.checkResults?.dateMatch },
                  { label: 'QR Link matches Entered URL', ok: selectedCert.checkResults?.qrUrlMatchesTypedUrl },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: item.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: 4, fontSize: 12 }}>
                    <span style={{ color: item.ok ? '#166534' : '#991B1B', fontWeight: 500 }}>{item.label}</span>
                    {item.ok ? <Check size={14} color="#16A34A" /> : <X size={14} color="#DC2626" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Reasons / Flags */}
            {selectedCert.checkResults?.reasons?.length > 0 && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Audit Findings:</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#B45309' }}>
                  {selectedCert.checkResults.reasons.map((r, idx) => (
                    <li key={idx} style={{ marginBottom: 2 }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Direct Verification Links */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {selectedCert.verificationUrl && (
                <a
                  href={selectedCert.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 6,
                    background: '#0F172A',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={13} />
                  Open Issuer Verification Page
                </a>
              )}

              {selectedCert.fileName && (
                <a
                  href={`/api/certificates/${selectedCert.id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#374151',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <FileText size={13} />
                  View Original Document
                </a>
              )}
            </div>

            {/* Decision Controls */}
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  Officer Review Remark {selectedCert.trustLevel === 'Flagged' && <span style={{ color: '#DC2626' }}>*</span>}
                </label>
                <textarea
                  rows={2}
                  value={remarkInput}
                  onChange={e => setRemarkInput(e.target.value)}
                  placeholder="Enter verification notes or reason for approval/rejection..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <input
                  type="checkbox"
                  id="forgery-check"
                  checked={suspectedForgery}
                  onChange={e => setSuspectedForgery(e.target.checked)}
                  style={{ width: 15, height: 15 }}
                />
                <label htmlFor="forgery-check" style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, cursor: 'pointer' }}>
                  Flag as Suspected Forgery (escalates profile for disciplinary audit)
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDecision('approve')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#16A34A',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={16} />
                  Approve as Placement Cell Verified
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDecision('reject')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#DC2626',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <XCircle size={16} />
                  Reject Certificate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
