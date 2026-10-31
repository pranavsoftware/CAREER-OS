import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Coins,
  Medal,
  ChevronRight,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function StudentReferrals() {
  const { user } = useAuth();
  const { state } = useData();
  const currentStudent = state.students.find(s => s.id === user?.studentId) || state.students[0];

  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  // Recommendation modal state
  const [showRecModal, setShowRecModal] = useState(false);
  const [recFaculty, setRecFaculty] = useState('');
  const [recRole, setRecRole] = useState('Department Placement Coordinator');
  const [recMsg, setRecMsg] = useState('');
  const [recSubmitting, setRecSubmitting] = useState(false);
  const [recFeedback, setRecFeedback] = useState(null);

  // Redeem perk state
  const [redeemLoading, setRedeemLoading] = useState(null);
  const [redeemMsg, setRedeemMsg] = useState(null);

  const fetchReferralData = async () => {
    if (!currentStudent?.id) return;
    try {
      const res = await fetch(`/api/student/referrals?studentId=${currentStudent.id}`);
      if (res.ok) {
        const d = await res.json();
        setReferralData(d);
      }
    } catch (err) {
      console.error('Error fetching referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, [currentStudent?.id]);

  const handleCopyCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    setInviteMsg(null);
    try {
      const res = await fetch('/api/student/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          studentId: currentStudent.id,
          email: inviteEmail,
          code: referralData?.referralCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch invitation');
      setInviteMsg({ type: 'success', text: data.message });
      setInviteEmail('');
      fetchReferralData();
    } catch (err) {
      setInviteMsg({ type: 'error', text: err.message });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRequestRecommendation = async (e) => {
    e.preventDefault();
    setRecSubmitting(true);
    setRecFeedback(null);
    try {
      const res = await fetch('/api/student/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_recommendation',
          studentId: currentStudent.id,
          facultyName: recFaculty,
          role: recRole,
          message: recMsg,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit recommendation request');
      setRecFeedback({ type: 'success', text: data.message });
      setTimeout(() => {
        setShowRecModal(false);
        setRecFeedback(null);
        setRecFaculty('');
        setRecMsg('');
        fetchReferralData();
      }, 1500);
    } catch (err) {
      setRecFeedback({ type: 'error', text: err.message });
    } finally {
      setRecSubmitting(false);
    }
  };

  const handleRedeemPerk = async (perk) => {
    if (!referralData || referralData.totalPoints < perk.pointsCost) {
      alert(`You need ${perk.pointsCost} points to redeem this benefit.`);
      return;
    }
    setRedeemLoading(perk.id);
    setRedeemMsg(null);
    try {
      const res = await fetch('/api/student/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem',
          studentId: currentStudent.id,
          perkId: perk.id,
          pointsCost: perk.pointsCost,
          perkTitle: perk.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Redemption failed');
      setRedeemMsg({ type: 'success', text: data.message });
      fetchReferralData();
    } catch (err) {
      setRedeemMsg({ type: 'error', text: err.message });
    } finally {
      setRedeemLoading(null);
    }
  };

  const totalPoints = referralData?.totalPoints || 0;
  const referralsList = referralData?.referrals || [];
  const ledgerList = referralData?.ledger || [];
  const recommendations = referralData?.recommendations || [];
  const perks = referralData?.perks || [];

  return (
    <Layout role="student">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={24} color="#2563EB" />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Referrals & Recommendation Benefits</h1>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
                  Invite peers, earn placement credits on verified profiles, and secure faculty endorsements for your portfolio.
                </p>
              </div>
            </div>
          </div>

          {/* Points Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FEF3C7', border: '1px solid #FDE68A', padding: '8px 16px', borderRadius: 10 }}>
            <Coins size={22} color="#D97706" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>Available Balance</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#78350F' }}>{totalPoints} Points</div>
            </div>
          </div>
        </div>

        {/* Top Section: Referral Card & Anti-abuse banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
          
          {/* Card 1: Unique Referral Code & Invite Form */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Your Unique Referral Code</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Share this code with your classmates. 100 points rewarded when their profile is verified by the registrar.</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: '10px 14px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8, fontSize: 16, fontWeight: 800, color: '#1E293B', letterSpacing: 1.5, textAlign: 'center' }}>
                {referralData?.referralCode || 'REF-LOADING'}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  background: copied ? '#059669' : '#2563EB',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleSendInvite} style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Send Direct Invite via Email:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  required
                  placeholder="classmate@vitstudent.ac.in"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                />
                <button
                  type="submit"
                  disabled={inviteLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    background: '#1F2937',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: inviteLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Send size={13} />
                  <span>{inviteLoading ? 'Sending...' : 'Invite'}</span>
                </button>
              </div>

              {inviteMsg && (
                <div style={{ marginTop: 10, fontSize: 12, color: inviteMsg.type === 'success' ? '#059669' : '#DC2626', background: inviteMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2', padding: '6px 10px', borderRadius: 6 }}>
                  {inviteMsg.text}
                </div>
              )}
            </form>
          </div>

          {/* Card 2: Anti-Abuse & Faculty Endorsements */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Faculty Recommendation & Endorsements</div>
              <button
                type="button"
                onClick={() => setShowRecModal(true)}
                style={{
                  padding: '6px 12px',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#2563EB',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Request Recommendation
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 14px' }}>
              Approved faculty recommendations appear as an official verified endorsement badge on your public portfolio and company dossier.
            </p>

            {/* Existing Recommendations List */}
            {recommendations.length === 0 ? (
              <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: 8, fontSize: 12, color: '#64748B', textAlign: 'center' }}>
                No faculty endorsements requested yet. Request one from your project guide or HOD.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recommendations.map(r => (
                  <div key={r.id} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, background: r.status === 'Endorsed' ? '#F0FDF4' : '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>{r.facultyName}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{r.role}</div>
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        background: r.status === 'Endorsed' ? '#DCFCE7' : '#FEF3C7',
                        color: r.status === 'Endorsed' ? '#15803D' : '#B45309',
                      }}>
                        {r.status}
                      </span>
                    </div>
                    {r.endorsement && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#166534', fontWeight: 600 }}>
                        🎖️ "{r.endorsement}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Anti-abuse rule banner */}
            <div style={{ marginTop: 16, padding: '10px 12px', background: '#F1F5F9', borderRadius: 8, fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
              <span><strong>Anti-Abuse Safeguards Active:</strong> Points awarded strictly upon registrar verification of referred candidate. Self-referrals blocked. 10 invites/month per user cap enforced.</span>
            </div>
          </div>
        </div>

        {/* Perks Redemption Catalog */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Placement Cell Perks & Redemption Catalog</h3>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>Redeem your earned placement points for priority training, review sessions, and interview perks.</p>
            </div>
            {redeemMsg && (
              <span style={{ fontSize: 12, fontWeight: 600, color: redeemMsg.type === 'success' ? '#059669' : '#DC2626' }}>
                {redeemMsg.text}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {perks.map(p => {
              const canAfford = totalPoints >= p.pointsCost;
              return (
                <div key={p.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, background: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', background: '#E2E8F0', padding: '2px 6px', borderRadius: 4 }}>
                        {p.category}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#D97706' }}>
                        {p.pointsCost} Points
                      </span>
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 10px', lineHeight: 1.3 }}>
                      {p.title}
                    </h4>
                  </div>

                  <button
                    type="button"
                    disabled={!canAfford || redeemLoading === p.id}
                    onClick={() => handleRedeemPerk(p)}
                    style={{
                      marginTop: 10,
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: canAfford ? '#059669' : '#E5E7EB',
                      color: canAfford ? '#fff' : '#9CA3AF',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {redeemLoading === p.id ? 'Redeeming...' : canAfford ? 'Redeem Benefit' : `Need ${p.pointsCost - totalPoints} more pts`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ledger & History Table */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>Reward Points Ledger History</h3>
          {ledgerList.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No reward point transactions yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Description / Event</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Points Change</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerList.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', color: '#64748B' }}>
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#1E293B', fontWeight: 500 }}>
                        {row.reason}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: row.points > 0 ? '#059669' : '#DC2626' }}>
                        {row.points > 0 ? `+${row.points}` : row.points} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Request Recommendation Modal */}
        {showRecModal && (
          <Modal
            isOpen={showRecModal}
            title="Request Official Faculty Recommendation"
            onClose={() => !recSubmitting && setShowRecModal(false)}
          >
            <form onSubmit={handleRequestRecommendation}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Faculty / Officer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Ramanathan"
                  value={recFaculty}
                  onChange={e => setRecFaculty(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Designation / Role *
                </label>
                <input
                  type="text"
                  required
                  value={recRole}
                  onChange={e => setRecRole(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Note to Faculty (Courses taken, projects built, target roles) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Respected Sir, request your recommendation based on my Capstone project work and Operating Systems performance..."
                  value={recMsg}
                  onChange={e => setRecMsg(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                />
              </div>

              {recFeedback && (
                <div style={{ marginBottom: 14, fontSize: 12, color: recFeedback.type === 'success' ? '#059669' : '#DC2626', background: recFeedback.type === 'success' ? '#ECFDF5' : '#FEF2F2', padding: '8px 12px', borderRadius: 6 }}>
                  {recFeedback.text}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  disabled={recSubmitting}
                  onClick={() => setShowRecModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recSubmitting}
                  style={{ padding: '8px 20px', borderRadius: 6, background: '#2563EB', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {recSubmitting ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </form>
          </Modal>
        )}

      </div>
    </Layout>
  );
}

