import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { useData } from '../../context/DataContext';
import {
  Gift,
  Award,
  CheckCircle2,
  XCircle,
  Coins,
  Search,
  Filter,
  Medal,
  Clock,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

export default function UniversityReferrals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommendations'); // 'recommendations' | 'referrals' | 'ledger'
  const [actionLoading, setActionLoading] = useState(false);
  const [endorseModal, setEndorseModal] = useState(null);
  const [customEndorsement, setCustomEndorsement] = useState('');

  const fetchUniversityReferrals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/university/referrals', {
        headers: { 'x-user-role': 'university' },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching university referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversityReferrals();
  }, []);

  const handleEndorse = async (rec, customNote) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/university/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'university' },
        body: JSON.stringify({
          recommendationId: rec.id,
          status: 'Endorsed',
          endorsement: customNote || 'Officially Endorsed by University Placement Cell & Faculty Council',
        }),
      });
      if (res.ok) {
        setEndorseModal(null);
        fetchUniversityReferrals();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (rec) => {
    if (!confirm('Are you sure you want to decline this recommendation request?')) return;
    setActionLoading(true);
    try {
      await fetch('/api/university/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'university' },
        body: JSON.stringify({
          recommendationId: rec.id,
          status: 'Declined',
          endorsement: 'Declined due to insufficient coursework / project records',
        }),
      });
      fetchUniversityReferrals();
    } finally {
      setActionLoading(false);
    }
  };

  const recommendations = data?.recommendations || [];
  const referrals = data?.referrals || [];
  const ledger = data?.ledger || [];

  return (
    <Layout role="university">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={24} color="#2563EB" />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Faculty Endorsements & Referral Desk</h1>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
                  Review student recommendation requests, verify referral activity, and track reward redemptions.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', background: '#F3F4F6', padding: 4, borderRadius: 8 }}>
            <button
              onClick={() => setActiveTab('recommendations')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'recommendations' ? '#fff' : 'transparent',
                fontWeight: activeTab === 'recommendations' ? 700 : 500,
                color: activeTab === 'recommendations' ? '#111827' : '#6B7280',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Faculty Endorsements ({recommendations.filter(r => r.status === 'Pending').length} Pending)
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'referrals' ? '#fff' : 'transparent',
                fontWeight: activeTab === 'referrals' ? 700 : 500,
                color: activeTab === 'referrals' ? '#111827' : '#6B7280',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Referral Activity ({referrals.length})
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'ledger' ? '#fff' : 'transparent',
                fontWeight: activeTab === 'ledger' ? 700 : 500,
                color: activeTab === 'ledger' ? '#111827' : '#6B7280',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Reward Redemptions ({ledger.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Faculty Recommendations Queue */}
        {activeTab === 'recommendations' && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Student Recommendation Approval Queue</h3>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading requests...</div>
            ) : recommendations.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>No student recommendation requests recorded.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {recommendations.map(rec => (
                  <div key={rec.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, background: rec.status === 'Pending' ? '#FFFBEB' : '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{rec.studentName || rec.studentId}</span>
                          <span style={{ fontSize: 12, color: '#64748B' }}>({rec.branch} • CGPA {rec.cgpa})</span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            background: rec.status === 'Endorsed' ? '#DCFCE7' : rec.status === 'Declined' ? '#FEE2E2' : '#FEF3C7',
                            color: rec.status === 'Endorsed' ? '#15803D' : rec.status === 'Declined' ? '#DC2626' : '#B45309',
                          }}>
                            {rec.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                          Target Faculty: <strong>{rec.facultyName}</strong> ({rec.role})
                        </div>
                        <div style={{ fontSize: 13, color: '#334155', marginTop: 8, fontStyle: 'italic', background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                          "{rec.message}"
                        </div>
                        {rec.endorsement && (
                          <div style={{ marginTop: 8, fontSize: 12, color: '#166534', fontWeight: 600 }}>
                            🎖️ Endorsement Badge: "{rec.endorsement}"
                          </div>
                        )}
                      </div>

                      {rec.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => {
                              setEndorseModal(rec);
                              setCustomEndorsement(`Strongly endorsed by ${rec.facultyName} for excellence in engineering and technical delivery.`);
                            }}
                            style={{ padding: '7px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            ✓ Endorse Badge
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleDecline(rec)}
                            style={{ padding: '7px 12px', background: '#fff', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Referral Activity */}
        {activeTab === 'referrals' && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Student Referral Log</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Referrer</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Referee Email / Student</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Referral Code</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>{r.referrerName || r.referrerId}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {r.refereeName ? `${r.refereeName} (${r.refereeEmail})` : r.refereeEmail}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{r.code}</code>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: r.status === 'Rewarded' ? '#DCFCE7' : r.status === 'Verified' ? '#EFF6FF' : '#FEF3C7',
                          color: r.status === 'Rewarded' ? '#15803D' : r.status === 'Verified' ? '#1D4ED8' : '#B45309',
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748B' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Reward Ledger & Redemptions */}
        {activeTab === 'ledger' && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Student Points & Perks Fulfillment Desk</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Student</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Activity / Perk</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Points</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>
                        {l.userName || l.userId} {l.branch ? `(${l.branch})` : ''}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{l.reason}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: l.points > 0 ? '#059669' : '#DC2626' }}>
                        {l.points > 0 ? `+${l.points}` : l.points} pts
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748B' }}>
                        {new Date(l.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Endorse Modal */}
        {endorseModal && (
          <Modal
            isOpen={Boolean(endorseModal)}
            title={`Endorse Recommendation: ${endorseModal.studentName || endorseModal.studentId}`}
            onClose={() => setEndorseModal(null)}
          >
            <div>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
                This badge will be published to the student's verified dossier and showcased to hiring companies.
              </p>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Official Endorsement Statement:
              </label>
              <textarea
                rows={3}
                value={customEndorsement}
                onChange={e => setCustomEndorsement(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, marginBottom: 16 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEndorseModal(null)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleEndorse(endorseModal, customEndorsement)}
                  style={{ padding: '8px 20px', borderRadius: 6, background: '#059669', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {actionLoading ? 'Saving...' : 'Confirm & Publish Badge'}
                </button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </Layout>
  );
}

