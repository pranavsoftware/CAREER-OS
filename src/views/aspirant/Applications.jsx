import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  FileText,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  Award,
  Sparkles,
} from 'lucide-react';

export default function AspirantApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/aspirant/applications?userId=user_aspirant');
      if (res.ok) {
        const d = await res.json();
        setApplications(d.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApps = applications.filter(a =>
    a.collegeName?.toLowerCase().includes(search.toLowerCase()) ||
    a.course?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout role="aspirant">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} color="#2563EB" />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>My College Applications Tracker</h1>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
                  Track admissions review, remarks, and provisional offer letters from university desks.
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/aspirant/explore"
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              background: '#2563EB',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            + Apply to More Campuses
          </Link>
        </div>

        {/* Search Bar */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Filter your applications by college or course name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
            />
          </div>
        </div>

        {/* Application Cards List */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>Loading your application statuses...</div>
        ) : filteredApps.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <FileText size={40} color="#9CA3AF" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>No applications submitted yet</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Browse eligible colleges and submit your first application.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredApps.map(app => (
              <div
                key={app.id}
                style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{app.collegeName}</span>
                      <span style={{ fontSize: 12, color: '#64748B' }}>({app.location})</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2563EB', marginTop: 4 }}>
                      Course Applied: {app.course}
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 14px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    background: app.status === 'Accepted' ? '#DCFCE7' : app.status === 'Under Review' ? '#FEF3C7' : app.status === 'Rejected' ? '#FEE2E2' : '#EFF6FF',
                    color: app.status === 'Accepted' ? '#15803D' : app.status === 'Under Review' ? '#B45309' : app.status === 'Rejected' ? '#DC2626' : '#1D4ED8',
                    border: '1px solid currentColor',
                  }}>
                    ● Status: {app.status}
                  </span>
                </div>

                {/* Remarks from Admissions */}
                {app.remarks && (
                  <div style={{ marginTop: 14, background: '#F8FAFC', borderLeft: '3px solid #2563EB', padding: '10px 14px', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>
                      Admissions Desk Feedback & Instructions:
                    </div>
                    <div style={{ fontSize: 13, color: '#334155' }}>
                      "{app.remarks}"
                    </div>
                  </div>
                )}

                {/* Footer details */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748B' }}>
                  <div>
                    Application ID: <code>{app.id}</code> • Submitted: {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    Annual Fee: <strong>₹{app.fees?.toLocaleString('en-IN')}</strong> • {app.accreditation}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}

