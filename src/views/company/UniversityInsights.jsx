import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import {
  Award,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  GraduationCap,
  Sparkles,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

export default function UniversityInsights() {
  const { state } = useData();
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchRanking = async (role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/company/university-ranking?role=${encodeURIComponent(role)}`, {
        headers: { 'x-user-role': 'company' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || 'Failed to fetch university insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking(selectedRole);
  }, [selectedRole]);

  const universities = data?.universities || [];
  const filteredUniversities = universities.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.city?.toLowerCase().includes(search.toLowerCase())
  );

  const topRecommended = universities.filter(u => !u.insufficientSample).slice(0, 2);

  // Prepare chart data
  const chartData = universities.map(u => ({
    name: u.name.length > 18 ? u.name.slice(0, 16) + '...' : u.name,
    Score: u.score,
    SkillMatch: u.metrics?.skillAlignment || 0,
    VerifiedRate: u.metrics?.profileVerification || 0,
    PlacementRate: u.metrics?.placementRate || 0,
  }));

  const COLORS = ['#2563EB', '#059669', '#7C3AED', '#D97706'];

  return (
    <Layout role="company">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={24} color="#2563EB" />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>University Talent Insights</h1>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
                  Institutional benchmarking based strictly on verified student credentials, skill mastery, and placement history.
                </p>
              </div>
            </div>
          </div>

          {/* Role Filter Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Target Role Benchmark:</span>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                background: '#fff',
                fontSize: 13,
                fontWeight: 600,
                color: '#1F2937',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {(data?.availableRoles && data.availableRoles.length > 0 ? data.availableRoles : [
                'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer'
              ]).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recommended universities for this job panel */}
        {topRecommended.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)', border: '1px solid #BFDBFE', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={18} color="#2563EB" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1E3A8A' }}>
                Recommended Campuses for {selectedRole} Hiring
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {topRecommended.map((u, i) => (
                <div key={u.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: 20 }}>{u.logo}</span>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '4px 0 2px' }}>{u.name}</h4>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{u.city} • {u.sampleSize} Verified Candidates</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#2563EB' }}>{u.score}</span>
                      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>INDEX SCORE</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {u.strengths?.map((s, idx) => (
                      <span key={idx} style={{ fontSize: 11, padding: '2px 8px', background: '#F1F5F9', color: '#334155', borderRadius: 4, fontWeight: 500 }}>
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts & Benchmarks Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
          {/* Bar Chart */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Institutional Composite Benchmark Score</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>40% Skill Match + 20% Verified Share + 20% Cert Density + 10% AI Score + 10% Placement</div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-10} textAnchor="end" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ background: '#1E293B', color: '#fff', borderRadius: 6, fontSize: 12, border: 'none' }}
                    formatter={(val) => [`${val} / 100`, 'Composite Score']}
                  />
                  <Bar dataKey="Score" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metric Distribution */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Role Benchmark Skills Required</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Target skills evaluated for {selectedRole}:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {(data?.targetSkills || ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'System Design']).map((sk, i) => (
                <span key={i} style={{ padding: '4px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                  {sk}
                </span>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Minimum Sample Size Safeguard:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
                <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                <span>Universities with fewer than <strong>20 verified candidates</strong> are flagged with an insufficient sample size warning to prevent statistical bias.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Table Header */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Ranked University Leaderboard</h3>
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 9 }} />
              <input
                type="text"
                placeholder="Search campus or city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Calculating university talent metrics...</div>
          ) : error ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#DC2626', background: '#FEF2F2', borderRadius: 8, fontSize: 13 }}>{error}</div>
          ) : filteredUniversities.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>No universities match your search query.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>Rank & Institution</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>City</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>Composite Score</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>Skill Alignment</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>Verified Pool</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>Placement Rate</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>Sample Size</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUniversities.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 11,
                            background: u.rank === 1 ? '#FEF3C7' : u.rank === 2 ? '#F1F5F9' : '#FFF7ED',
                            color: u.rank === 1 ? '#D97706' : u.rank === 2 ? '#475569' : '#C2410C',
                            border: '1px solid #E2E8F0'
                          }}>
                            {u.rank}
                          </span>
                          <span style={{ fontSize: 18 }}>{u.logo}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1E293B' }}>{u.name}</div>
                            {u.insufficientSample && (
                              <span style={{ fontSize: 10, color: '#D97706', background: '#FEF3C7', padding: '1px 6px', borderRadius: 4, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <AlertTriangle size={10} /> Limited sample ({u.sampleSize} verified)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>{u.city}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#2563EB' }}>
                          {u.score}
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}> / 100</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${u.metrics?.skillAlignment || 0}%`, height: '100%', background: '#2563EB' }} />
                          </div>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{u.metrics?.skillAlignment}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#ECFDF5', color: '#059669' }}>
                          {u.metrics?.profileVerification}% Verified
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>
                        {u.metrics?.placementRate}%
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>
                        {u.sampleSize} of {u.totalStudents} students
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

