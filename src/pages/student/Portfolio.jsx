import { useState } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export default function StudentPortfolio() {
  const { user } = useAuth();
  const { state } = useData();

  const student = state.students.find(s => s.id === user.studentId);
  const myCerts = state.certificates.filter(c => c.studentId === student?.id && c.status === 'Valid');

  const [copied, setCopied] = useState(false);

  if (!student) return <Layout title="Portfolio"><p>Student not found.</p></Layout>;

  function handleCopy() {
    navigator.clipboard?.writeText(`https://career-os.vit.ac.in/p/${student.regNo.toLowerCase()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Layout title="Public Portfolio Preview">
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          Live public profile generated dynamically from your verified student profile data.
        </div>
        <button
          onClick={handleCopy}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid #2563EB',
            background: copied ? '#EFF6FF' : '#2563EB',
            color: copied ? '#2563EB' : '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {copied ? 'Link copied!' : 'Copy shareable link'}
        </button>
      </div>

      {/* Portfolio Card */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 32, maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 20, marginBottom: 24 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#111827' }}>
            {student.name}
          </h1>
          <div style={{ fontSize: 14, color: '#4B5563', marginBottom: 8 }}>
            {student.degree} in {student.branch} • VIT Vellore (Batch {student.batch})
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6B7280' }}>
            <span>CGPA: <strong>{student.cgpa}</strong> / 10.0</span>
            {student.links?.github && <span>GitHub: {student.links.github}</span>}
            {student.links?.linkedin && <span>LinkedIn: {student.links.linkedin}</span>}
          </div>
        </div>

        {/* Skills */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
            Technical Expertise
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(student.skills || []).map(sk => (
              <span
                key={sk.name}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                }}
              >
                {sk.name}
              </span>
            ))}
          </div>
        </div>

        {/* Projects */}
        {student.projects && student.projects.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
              Featured Projects
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {student.projects.map(p => (
                <div key={p.id} style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{p.title}</span>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{p.year}</span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: '#4B5563', lineHeight: 1.4 }}>
                    {p.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(p.technologies || []).map(t => (
                      <span key={t} style={{ fontSize: 11, background: '#EFF6FF', color: '#1E40AF', padding: '1px 6px', borderRadius: 4 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {myCerts.length > 0 && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
              Accredited Certifications
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {myCerts.map(c => (
                <div key={c.id} style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{c.issuer}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Issued: {c.issueDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
