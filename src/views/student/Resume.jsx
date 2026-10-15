import { useState } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { computeAtsScore } from '../../utils/atsScore';

export default function StudentResume() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const student = state.students.find(s => s.id === user.studentId);
  const myCerts = state.certificates.filter(c => c.studentId === student?.id && c.status === 'Valid');
  const myVersions = state.resumeVersions[student?.id] || [];

  const [template, setTemplate] = useState('Classic');
  const [includeSections, setIncludeSections] = useState({
    projects: true,
    experience: true,
    certificates: true,
  });
  const [jobDescription, setJobDescription] = useState(
    'Looking for a Frontend / Full Stack Engineer skilled in React, JavaScript, HTML, CSS, Git, REST APIs, responsive design and automated testing.'
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [versionName, setVersionName] = useState('');
  const [inlineMsg, setInlineMsg] = useState(null);

  if (!student) return <Layout title="Resume Builder"><p>Student not found.</p></Layout>;

  function handleAnalyze() {
    setIsAnalyzing(true);
    setInlineMsg(null);
    setTimeout(() => {
      const result = computeAtsScore(jobDescription, student, includeSections);
      setAtsResult(result);
      setIsAnalyzing(false);
    }, 450);
  }

  function handleSaveVersion() {
    const name = versionName.trim() || `Resume v${myVersions.length + 1} (${template})`;
    const score = atsResult ? atsResult.overall : computeAtsScore(jobDescription, student, includeSections).overall;
    const newVersion = {
      id: `v_${Date.now()}`,
      name,
      date: new Date().toISOString().split('T')[0],
      score,
      template,
      includeSections: { ...includeSections },
      jobDescription,
    };
    dispatch({
      type: 'SAVE_RESUME_VERSION',
      payload: { studentId: student.id, version: newVersion },
    });
    setVersionName('');
    setInlineMsg({ type: 'success', text: `Saved version "${name}" with ATS score ${score}/100.` });
  }

  function handleRestoreVersion(ver) {
    setTemplate(ver.template || 'Classic');
    if (ver.includeSections) setIncludeSections(ver.includeSections);
    if (ver.jobDescription) setJobDescription(ver.jobDescription);
    const result = computeAtsScore(ver.jobDescription || jobDescription, student, ver.includeSections || includeSections);
    setAtsResult(result);
    setInlineMsg({ type: 'success', text: `Restored settings from "${ver.name}".` });
  }

  function handleDeleteVersion(verId) {
    dispatch({
      type: 'DELETE_RESUME_VERSION',
      payload: { studentId: student.id, versionId: verId },
    });
    setInlineMsg({ type: 'success', text: 'Resume version deleted.' });
  }

  const versionColumns = [
    { key: 'name', header: 'Version Name' },
    { key: 'date', header: 'Date' },
    {
      key: 'score',
      header: 'ATS Score',
      render: v => <Badge variant={v >= 75 ? 'success' : v >= 55 ? 'warning' : 'danger'}>{v}/100</Badge>,
    },
    { key: 'template', header: 'Template' },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleRestoreVersion(row)}
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              border: '1px solid #E5E7EB',
              background: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Restore
          </button>
          <button
            onClick={() => handleDeleteVersion(row.id)}
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              border: '1px solid #FCA5A5',
              background: '#FEF2F2',
              color: '#B91C1C',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout title="Resume Builder">
      {inlineMsg && (
        <div
          style={{
            padding: '8px 16px',
            marginBottom: 16,
            borderRadius: 6,
            background: inlineMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${inlineMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            color: inlineMsg.type === 'success' ? '#15803D' : '#B91C1C',
            fontSize: 13,
          }}
        >
          {inlineMsg.text}
        </div>
      )}

      {/* Top action bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 6,
          padding: '12px 16px',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Template:</label>
          <select
            value={template}
            onChange={e => setTemplate(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              fontSize: 13,
              background: '#fff',
            }}
          >
            <option value="Classic">Classic</option>
            <option value="Compact">Compact</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              background: '#fff',
              color: '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24, alignItems: 'start' }}>
        {/* Left column: Controls & ATS Analyzer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Section toggles card */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Include Sections
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeSections.projects}
                  onChange={e => setIncludeSections({ ...includeSections, projects: e.target.checked })}
                />
                Projects ({student.projects?.length || 0})
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeSections.experience}
                  onChange={e => setIncludeSections({ ...includeSections, experience: e.target.checked })}
                />
                Experience & Internships ({student.experience?.length || 0})
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeSections.certificates}
                  onChange={e => setIncludeSections({ ...includeSections, certificates: e.target.checked })}
                />
                Valid Certifications ({myCerts.length})
              </label>
            </div>
          </div>

          {/* Job description input */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Target Job Description
            </h2>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6B7280' }}>
              Paste requirements to analyze ATS keyword match and relevance score.
            </p>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                fontSize: 13,
                fontFamily: 'inherit',
                marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                disabled={isAnalyzing}
                onClick={handleAnalyze}
                style={{
                  padding: '7px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#2563EB',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isAnalyzing ? 'wait' : 'pointer',
                }}
              >
                {isAnalyzing ? 'Analyzing ATS score...' : 'Analyze ATS score'}
              </button>
            </div>
          </div>

          {/* ATS Analysis Output */}
          {atsResult && (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>ATS Evaluation</h2>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Deterministic keyword & structure scoring</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: atsResult.overall >= 70 ? '#15803D' : atsResult.overall >= 50 ? '#D97706' : '#DC2626' }}>
                    {atsResult.overall}<span style={{ fontSize: 14, fontWeight: 500, color: '#9CA3AF' }}>/100</span>
                  </div>
                </div>
              </div>

              {/* Breakdown table */}
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <tr>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#4B5563' }}>Category</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#4B5563', width: 60 }}>Score</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#4B5563' }}>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atsResult.breakdown.map(item => (
                      <tr key={item.category} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 500, color: '#374151' }}>{item.category}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{item.score}%</td>
                        <td style={{ padding: '6px 10px', color: '#6B7280' }}>{item.feedback}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Matched & missing keywords */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Matched Keywords ({atsResult.matchedKeywords.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {atsResult.matchedKeywords.length === 0 ? (
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>None matched</span>
                  ) : (
                    atsResult.matchedKeywords.map(k => (
                      <Badge key={k} variant="success">{k}</Badge>
                    ))
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Missing Keywords ({atsResult.missingKeywords.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {atsResult.missingKeywords.length === 0 ? (
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>None</span>
                  ) : (
                    atsResult.missingKeywords.map(k => (
                      <Badge key={k} variant="danger">{k}</Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Save Version input */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12, display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Version name (optional)"
                  value={versionName}
                  onChange={e => setVersionName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: 13,
                  }}
                />
                <button
                  onClick={handleSaveVersion}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid #2563EB',
                    background: '#2563EB',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Save version
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Live A4 Resume Preview */}
        <div>
          <div
            id="resume-preview"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 6,
              padding: template === 'Compact' ? '20px 24px' : '32px 36px',
              minHeight: 650,
              boxShadow: 'none',
              color: '#111827',
              fontFamily: 'inherit',
            }}
          >
            {/* Resume Header */}
            <div style={{ borderBottom: '2px solid #E5E7EB', paddingBottom: template === 'Compact' ? 10 : 16, marginBottom: template === 'Compact' ? 12 : 16 }}>
              <h1 style={{ margin: '0 0 4px', fontSize: template === 'Compact' ? 18 : 22, fontWeight: 700, color: '#111827' }}>
                {student.name}
              </h1>
              <div style={{ fontSize: 12, color: '#4B5563', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <span>{student.email}</span>
                <span>•</span>
                <span>{student.phone}</span>
                <span>•</span>
                <span>Reg: {student.regNo}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, display: 'flex', gap: 12 }}>
                {(student.github || student.links?.github) && <span>GitHub: {student.github || student.links?.github}</span>}
                {(student.linkedin || student.links?.linkedin) && <span>LinkedIn: {student.linkedin || student.links?.linkedin}</span>}
              </div>
            </div>

            {/* Education */}
            <div style={{ marginBottom: template === 'Compact' ? 12 : 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#1E3A8A', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', paddingBottom: 2, marginBottom: 6 }}>
                Education
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Vellore Institute of Technology, Chennai</span>
                  <span>Batch {student.batch}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span>{student.degree} in {student.branch}</span>
                  <span>CGPA: {student.cgpa} / 10.0</span>
                </div>
                {student.education && (
                  <div style={{ marginTop: 4, color: '#6B7280', fontSize: 11 }}>
                    12th Standard: {student.education.twelfthPercent}% ({student.education.twelfthSchool}) • 10th Standard: {student.education.tenthPercent}%
                  </div>
                )}
              </div>
            </div>

            {/* Technical Skills */}
            <div style={{ marginBottom: template === 'Compact' ? 12 : 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#1E3A8A', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', paddingBottom: 2, marginBottom: 6 }}>
                Technical Skills
              </div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                {(student.skills || []).map(s => s.name).join(' • ')}
              </div>
            </div>

            {/* Projects (if included) */}
            {includeSections.projects && student.projects && student.projects.length > 0 && (
              <div style={{ marginBottom: template === 'Compact' ? 12 : 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#1E3A8A', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', paddingBottom: 2, marginBottom: 6 }}>
                  Key Projects
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: template === 'Compact' ? 8 : 10 }}>
                  {student.projects.map((p, idx) => (
                    <div key={idx} style={{ fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{p.title}</span>
                        <span style={{ color: '#6B7280', fontSize: 11 }}>
                          {(Array.isArray(p.technologies) ? p.technologies : typeof p.technologies === 'string' ? p.technologies.split(',').map(s => s.trim()) : []).join(', ')}
                        </span>
                      </div>
                      <div style={{ color: '#4B5563', marginTop: 2, lineHeight: 1.4 }}>
                        {p.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience (if included) */}
            {includeSections.experience && student.experience && student.experience.length > 0 && (
              <div style={{ marginBottom: template === 'Compact' ? 12 : 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#1E3A8A', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', paddingBottom: 2, marginBottom: 6 }}>
                  Experience & Internships
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: template === 'Compact' ? 8 : 10 }}>
                  {student.experience.map((exp, idx) => (
                    <div key={idx} style={{ fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{exp.role} - {exp.company}</span>
                        <span style={{ color: '#6B7280', fontSize: 11 }}>{exp.duration}</span>
                      </div>
                      <div style={{ color: '#4B5563', marginTop: 2, lineHeight: 1.4 }}>
                        {exp.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications (if included) */}
            {includeSections.certificates && myCerts.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#1E3A8A', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', paddingBottom: 2, marginBottom: 6 }}>
                  Certifications
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {myCerts.map(cert => (
                    <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span><strong>{cert.title}</strong> — {cert.issuer}</span>
                      <span style={{ color: '#6B7280', fontSize: 11 }}>Issued: {cert.issueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version history table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#111827' }}>
          Saved Resume Versions
        </h2>
        <DataTable
          columns={versionColumns}
          rows={myVersions}
          emptyMessage="No saved resume versions yet."
        />
      </div>
    </Layout>
  );
}
