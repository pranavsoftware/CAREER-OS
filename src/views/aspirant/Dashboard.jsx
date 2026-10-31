import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Sparkles,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Compass,
  Award,
} from 'lucide-react';

export default function AspirantDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, cRes, aRes] = await Promise.all([
          fetch('/api/aspirant/profile?userId=user_aspirant'),
          fetch('/api/aspirant/colleges?userId=user_aspirant'),
          fetch('/api/aspirant/applications?userId=user_aspirant'),
        ]);
        if (pRes.ok) {
          const d = await pRes.json();
          setProfile(d.profile);
        }
        if (cRes.ok) {
          const d = await cRes.json();
          setColleges(d.colleges || []);
        }
        if (aRes.ok) {
          const d = await aRes.json();
          setApplications(d.applications || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const eligibleColleges = colleges.filter(c => c.eligible);

  return (
    <Layout role="aspirant">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)',
          borderRadius: 16,
          padding: '32px 28px',
          color: '#fff',
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                <Sparkles size={14} /> Class 12th Pass-Out • College Selection Hub
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                Welcome, {profile?.name || user?.name || 'Aspirant'}!
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0, maxWidth: 650, lineHeight: 1.5 }}>
                Your academic eligibility engine is ready. Explore top engineering and technology colleges tailored to your {profile?.stream || 'PCM'} background, 12th marks ({profile?.twelfthPercentage || 89}%), and entrance scores.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Link
                to="/aspirant/explore"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 10,
                  background: '#fff',
                  color: '#1D4ED8',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <span>Explore Colleges</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>12th Board Score</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1E293B', marginTop: 4 }}>
              {profile?.twelfthPercentage || 89.4}%
            </div>
            <div style={{ fontSize: 12, color: '#059669', marginTop: 2 }}>{profile?.board || 'CBSE'} • {profile?.stream || 'PCM'}</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Eligible Campuses</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#2563EB', marginTop: 4 }}>
              {eligibleColleges.length} / {colleges.length}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Based on your marks & cutoffs</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Applications</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#7C3AED', marginTop: 4 }}>
              {applications.length}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>In admissions review</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Admissions Status</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#059669', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={20} color="#059669" />
              <span>Offer Issued!</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>1 provisional admission letter</div>
          </div>

        </div>

        {/* Two Columns: Top Eligible Colleges & Active Applications */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>

          {/* Left: Top Eligible College Matches */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Top Eligible Engineering Colleges</h3>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>Where your 12th marks and JEE percentile clear admission criteria</p>
              </div>
              <Link to="/aspirant/explore" style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>
                View All ({colleges.length}) →
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Loading recommendations...</div>
            ) : eligibleColleges.length === 0 ? (
              <div style={{ padding: 20, background: '#F8FAFC', borderRadius: 8, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                Update your academic profile to see eligible institutes.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {eligibleColleges.slice(0, 3).map(col => (
                  <div key={col.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, background: '#FAFAFA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 3px' }}>{col.name}</h4>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{col.location} • {col.accreditation}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                        Eligible ✓
                      </span>
                    </div>

                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: '#334155' }}>
                        Annual Tuition: <strong>₹{col.fees.toLocaleString('en-IN')}</strong>
                      </div>
                      <Link
                        to="/aspirant/explore"
                        style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}
                      >
                        Apply / Compare →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Application Status Tracker */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>My Application Tracker</h3>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>Real-time admission status from university desks</p>
              </div>
              <Link to="/aspirant/applications" style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>
                Full Tracker →
              </Link>
            </div>

            {applications.length === 0 ? (
              <div style={{ padding: 30, background: '#F8FAFC', borderRadius: 8, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                No college applications submitted yet. Visit the College Explorer to shortlist and apply.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {applications.map(app => (
                  <div key={app.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{app.collegeName}</div>
                        <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, marginTop: 2 }}>{app.course}</div>
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: app.status === 'Accepted' ? '#DCFCE7' : app.status === 'Under Review' ? '#FEF3C7' : '#EFF6FF',
                        color: app.status === 'Accepted' ? '#15803D' : app.status === 'Under Review' ? '#B45309' : '#1D4ED8',
                      }}>
                        {app.status}
                      </span>
                    </div>
                    {app.remarks && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#475569', background: '#F8FAFC', padding: '6px 10px', borderRadius: 6 }}>
                        "{app.remarks}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
}

