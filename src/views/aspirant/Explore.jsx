import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  Building,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Scale,
  GraduationCap,
  Star,
  MapPin,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Layers,
  Send,
} from 'lucide-react';

export default function CollegeExplorer() {
  const { user } = useAuth();
  const [colleges, setColleges] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [maxFeeFilter, setMaxFeeFilter] = useState('All');
  const [onlyEligible, setOnlyEligible] = useState(false);

  // Comparison State (max 3 colleges)
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Shortlist state (local storage)
  const [shortlistedIds, setShortlistedIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('career_os_shortlisted_colleges');
        return stored ? JSON.parse(stored) : [];
      } catch (_) {}
    }
    return [];
  });

  // Apply Modal state
  const [applyCollege, setApplyCollege] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState(null);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('userId', 'user_aspirant');
      if (locationFilter !== 'All') params.set('location', locationFilter);
      if (maxFeeFilter !== 'All') params.set('maxFee', maxFeeFilter);

      const res = await fetch(`/api/aspirant/colleges?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setColleges(d.colleges || []);
        if (d.studentProfile) setProfile(d.studentProfile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [locationFilter, maxFeeFilter]);

  const toggleShortlist = (id) => {
    setShortlistedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (typeof window !== 'undefined') {
        localStorage.setItem('career_os_shortlisted_colleges', JSON.stringify(next));
      }
      return next;
    });
  };

  const toggleCompare = (col) => {
    setCompareList(prev => {
      if (prev.some(c => c.id === col.id)) {
        return prev.filter(c => c.id !== col.id);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 colleges simultaneously.');
        return prev;
      }
      return [...prev, col];
    });
  };

  const handleOpenApply = (col) => {
    setApplyCollege(col);
    const courses = Array.isArray(col.courses) ? col.courses : [];
    setSelectedCourse(courses[0]?.name || 'B.Tech in Computer Science');
    setApplyFeedback(null);
  };

  const handleSubmitApply = async (e) => {
    e.preventDefault();
    if (!applyCollege || !selectedCourse) return;
    setApplyLoading(true);
    setApplyFeedback(null);
    try {
      const res = await fetch('/api/aspirant/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeId: applyCollege.id,
          course: selectedCourse,
          aspirantId: 'user_aspirant',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application');
      setApplyFeedback({ type: 'success', text: data.message });
      setTimeout(() => {
        setApplyCollege(null);
        setApplyFeedback(null);
      }, 1500);
    } catch (err) {
      setApplyFeedback({ type: 'error', text: err.message });
    } finally {
      setApplyLoading(false);
    }
  };

  const filteredColleges = colleges.filter(c => {
    if (onlyEligible && !c.eligible) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        (c.courses || []).some(crs => (crs.name || '').toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <Layout role="aspirant">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={24} color="#2563EB" />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>College Explorer & Cutoff Eligibility</h1>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
                  Live cutoff engine comparing your {profile?.stream || 'PCM'} marks ({profile?.twelfthPercentage || 89.4}%) against university admissions criteria.
                </p>
              </div>
            </div>
          </div>

          {/* Floating Compare Button */}
          {compareList.length > 0 && (
            <button
              onClick={() => setShowCompareModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                background: '#4F46E5',
                color: '#fff',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
              }}
            >
              <Scale size={16} />
              <span>Compare Selected Colleges ({compareList.length}/3)</span>
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search by college name, city, course..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
            />
          </div>

          <div>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              <option value="All">All Locations</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Vellore">Vellore</option>
              <option value="Manipal">Manipal</option>
              <option value="Trichy">Trichy</option>
              <option value="Delhi">New Delhi</option>
            </select>
          </div>

          <div>
            <select
              value={maxFeeFilter}
              onChange={e => setMaxFeeFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              <option value="All">All Fee Ranges</option>
              <option value="150000">Max ₹1.5 Lakh / yr</option>
              <option value="200000">Max ₹2.0 Lakh / yr</option>
              <option value="250000">Max ₹2.5 Lakh / yr</option>
            </select>
          </div>

          {/* Only Eligible Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151', paddingLeft: 8 }}>
            <input
              type="checkbox"
              checked={onlyEligible}
              onChange={e => setOnlyEligible(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#059669' }}
            />
            <span>Show Eligible Campuses Only</span>
          </label>
        </div>

        {/* Colleges Grid */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>Checking admissions criteria...</div>
        ) : filteredColleges.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <Building size={40} color="#9CA3AF" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>No campuses match your filters</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Try turning off the "Eligible Campuses Only" toggle or increasing the fee filter.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {filteredColleges.map(col => {
              const isShortlisted = shortlistedIds.includes(col.id);
              const isComparing = compareList.some(c => c.id === col.id);
              const cutoff = col.cutoff || {};

              return (
                <div
                  key={col.id}
                  style={{
                    background: '#fff',
                    border: `1px solid ${col.eligible ? '#BBF7D0' : '#E5E7EB'}`,
                    borderRadius: 12,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div>
                    {/* Top Row: Eligibility Badge, Shortlist & Compare Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: col.eligible ? '#DCFCE7' : '#FEF2F2',
                        color: col.eligible ? '#15803D' : '#DC2626',
                        border: `1px solid ${col.eligible ? '#86EFAC' : '#FECACA'}`,
                      }}>
                        {col.eligible ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>{col.eligible ? 'Eligible for Direct Admission' : 'Cutoff Not Met'}</span>
                      </span>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => toggleCompare(col)}
                          style={{
                            background: isComparing ? '#EEF2FF' : '#F8FAFC',
                            border: `1px solid ${isComparing ? '#C7D2FE' : '#E2E8F0'}`,
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            color: isComparing ? '#4F46E5' : '#64748B',
                            cursor: 'pointer',
                          }}
                        >
                          {isComparing ? '✓ Comparing' : '+ Compare'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleShortlist(col.id)}
                          style={{
                            background: isShortlisted ? '#EFF6FF' : '#F8FAFC',
                            border: `1px solid ${isShortlisted ? '#BFDBFE' : '#E2E8F0'}`,
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            color: isShortlisted ? '#2563EB' : '#64748B',
                            cursor: 'pointer',
                          }}
                        >
                          {isShortlisted ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* College Title */}
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 4px', lineHeight: 1.3 }}>
                      {col.name}
                    </h3>
                    <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                      <MapPin size={13} />
                      <span>{col.location} • {col.accreditation} • ⭐ {col.rating}</span>
                    </div>

                    {/* Key Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
                      <div>
                        <div style={{ color: '#64748B', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Annual Tuition</div>
                        <div style={{ fontWeight: 800, color: '#1E293B', fontSize: 14 }}>₹{col.fees?.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748B', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>12th Board Cutoff</div>
                        <div style={{ fontWeight: 700, color: '#2563EB' }}>Min {cutoff.minTwelfthPercent}%</div>
                      </div>
                    </div>

                    {/* Course Offerings Chips */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Popular Course Offerings:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(col.courses || []).map((crs, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: '#F1F5F9', color: '#334155', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                            {crs.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Eligibility Reasons Box */}
                    <div style={{ background: col.eligible ? '#F0FDF4' : '#FFF5F5', padding: '8px 10px', borderRadius: 6, fontSize: 11, color: col.eligible ? '#166534' : '#991B1B', marginBottom: 14 }}>
                      {(col.reasons || []).map((r, idx) => (
                        <div key={idx} style={{ marginTop: 2 }}>• {r}</div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      {col.seats} Total Seats
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenApply(col)}
                      style={{
                        padding: '8px 18px',
                        background: col.eligible ? '#059669' : '#1F2937',
                        color: '#fff',
                        borderRadius: 6,
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>Apply Now</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Side-by-Side Comparison Modal */}
        {showCompareModal && compareList.length > 0 && (
          <Modal
            isOpen={showCompareModal}
            title="Side-by-Side Campus Comparison"
            width={920}
            onClose={() => setShowCompareModal(false)}
          >
            <div style={{ overflowX: 'auto', padding: '10px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#475569', width: '22%' }}>Comparison Attribute</th>
                    {compareList.map(c => (
                      <th key={c.id} style={{ padding: '12px', textAlign: 'left', color: '#1E293B', fontWeight: 700 }}>
                        <div>{c.name}</div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>{c.location}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Eligibility Status</td>
                    {compareList.map(c => (
                      <td key={c.id} style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                          background: c.eligible ? '#DCFCE7' : '#FEE2E2',
                          color: c.eligible ? '#15803D' : '#DC2626'
                        }}>
                          {c.eligible ? 'Eligible ✓' : 'Cutoff Not Met'}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Annual Fees</td>
                    {compareList.map(c => (
                      <td key={c.id} style={{ padding: '10px 12px', fontWeight: 700, color: '#1E293B' }}>
                        ₹{c.fees?.toLocaleString('en-IN')}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>12th Cutoff</td>
                    {compareList.map(c => (
                      <td key={c.id} style={{ padding: '10px 12px', color: '#334155' }}>
                        Min {c.cutoff?.minTwelfthPercent}%
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>JEE Percentile Cutoff</td>
                    {compareList.map(c => (
                      <td key={c.id} style={{ padding: '10px 12px', color: '#334155' }}>
                        {c.cutoff?.minJeePercentile ? `Min ${c.cutoff.minJeePercentile}%` : 'Not Mandatory'}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Accreditation & Rating</td>
                    {compareList.map(c => (
                      <td key={c.id} style={{ padding: '10px 12px', color: '#334155' }}>
                        {c.accreditation} (⭐ {c.rating})
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Seats Available</td>
                    {compareList.map(c => (
                      <td key={c.id} style={{ padding: '10px 12px', color: '#334155' }}>
                        {c.seats} Seats
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Campus Highlights</td>
                    {compareList.map(c => (
                      <td key={c.id} style={{ padding: '10px 12px', fontSize: 11, color: '#475569' }}>
                        {(c.campusFacilities || []).join(' • ')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowCompareModal(false)}
                  style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Close Comparison
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Apply Modal */}
        {applyCollege && (
          <Modal
            isOpen={Boolean(applyCollege)}
            title={`Apply to ${applyCollege.name}`}
            onClose={() => !applyLoading && setApplyCollege(null)}
          >
            <form onSubmit={handleSubmitApply}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{applyCollege.name}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{applyCollege.location} • ₹{applyCollege.fees?.toLocaleString('en-IN')}/yr</div>
              </div>

              {applyFeedback && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 14,
                  background: applyFeedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  color: applyFeedback.type === 'success' ? '#059669' : '#DC2626',
                  border: `1px solid ${applyFeedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                }}>
                  {applyFeedback.text}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Select Course / Specialization *
                </label>
                <select
                  required
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
                >
                  {(applyCollege.courses || []).map((crs, i) => (
                    <option key={i} value={crs.name}>
                      {crs.name} ({crs.duration || '4 Years'}) — {crs.seats || 60} Seats
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 12px', borderRadius: 8, fontSize: 12, color: '#1D4ED8', marginBottom: 18 }}>
                Your verified 12th marks ({profile?.twelfthPercentage || 89.4}%) and JEE exam percentiles will be securely transmitted to the university admissions desk. No document upload fees required.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  disabled={applyLoading}
                  onClick={() => setApplyCollege(null)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyLoading}
                  style={{
                    padding: '8px 22px',
                    borderRadius: 6,
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: applyLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {applyLoading ? 'Submitting Application...' : 'Submit Official Application'}
                </button>
              </div>
            </form>
          </Modal>
        )}

      </div>
    </Layout>
  );
}

