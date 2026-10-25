import { useState } from 'react';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { initialStudents } from '../../data/students';
import { mockOcr } from '../../utils/mockOcr';

export default function StudentCertificates() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const student = (state.students || []).find(s => s.id === user?.studentId) || (state.students || [])[0] || initialStudents[0];
  const myCerts = (state.certificates || []).filter(c => c.studentId === student?.id);

  // Expiring soon banner
  const expiringSoon = myCerts.filter(c => c.status === 'Expiring soon');

  // Upload & OCR states
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [inlineMsg, setInlineMsg] = useState(null);


  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsProcessing(true);
    setExtractedData(null);
    setIsDuplicate(false);
    setConfirmDuplicate(false);
    setInlineMsg(null);

    // Simulate OCR processing latency
    setTimeout(() => {
      const ocr = mockOcr(file.name);
      setExtractedData({
        title: ocr.title,
        issuer: ocr.issuer,
        issueDate: ocr.issueDate,
        expiryDate: ocr.expiryDate || '',
        skills: [...ocr.skills],
      });

      // Duplicate check
      const duplicateFound = myCerts.some(
        c =>
          c.title.trim().toLowerCase() === ocr.title.trim().toLowerCase() &&
          c.issuer.trim().toLowerCase() === ocr.issuer.trim().toLowerCase() &&
          c.issueDate === ocr.issueDate
      );
      setIsDuplicate(duplicateFound);
      setIsProcessing(false);
    }, 600);
  }

  function handleAddExtractedSkill() {
    const s = newSkillInput.trim();
    if (!s || !extractedData) return;
    if (!extractedData.skills.includes(s)) {
      setExtractedData({ ...extractedData, skills: [...extractedData.skills, s] });
    }
    setNewSkillInput('');
  }

  function handleRemoveExtractedSkill(skillName) {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      skills: extractedData.skills.filter(s => s !== skillName),
    });
  }

  function handleSaveCertificate(e) {
    e.preventDefault();
    if (!extractedData) return;
    if (isDuplicate && !confirmDuplicate) return;

    // Determine status
    let status = 'Valid';
    if (extractedData.expiryDate) {
      const exp = new Date(extractedData.expiryDate);
      const now = new Date('2026-10-09');
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        status = 'Expired';
      } else if (diffDays <= 60) {
        status = 'Expiring soon';
      }
    }

    const newCert = {
      id: `cert_${Date.now()}`,
      studentId: student.id,
      title: extractedData.title,
      issuer: extractedData.issuer,
      issueDate: extractedData.issueDate,
      expiryDate: extractedData.expiryDate || null,
      skills: extractedData.skills,
      status,
      fileName: uploadedFileName,
    };

    dispatch({ type: 'ADD_CERTIFICATE', payload: newCert });

    // Also add skills to student profile skills list with source: 'certificate'
    const existingSkillNames = (student.skills || []).map(s => s.name.toLowerCase());
    const newSkillsToAdd = extractedData.skills
      .filter(sk => !existingSkillNames.includes(sk.toLowerCase()))
      .map(sk => ({ name: sk, level: 'Intermediate', fromCertificate: true }));

    if (newSkillsToAdd.length > 0) {
      dispatch({
        type: 'UPDATE_STUDENT',
        payload: {
          id: student.id,
          skills: [...(student.skills || []), ...newSkillsToAdd],
        },
      });
    }

    setInlineMsg({
      type: 'success',
      text: `Certificate "${newCert.title}" saved successfully. Added ${newSkillsToAdd.length} new skill(s) to profile.`,
    });
    setExtractedData(null);
    setUploadedFileName('');
    setIsDuplicate(false);
    setConfirmDuplicate(false);
  }

  function handleDeleteCertificate(certId) {
    dispatch({ type: 'DELETE_CERTIFICATE', payload: certId });
    setInlineMsg({ type: 'success', text: 'Certificate removed.' });
  }

  const certColumns = [
    { key: 'title', header: 'Certificate Title' },
    { key: 'issuer', header: 'Issuer' },
    { key: 'issueDate', header: 'Issued On' },
    {
      key: 'expiryDate',
      header: 'Expires On',
      render: v => v || 'No Expiry',
    },
    {
      key: 'status',
      header: 'Status',
      render: v => (
        <Badge variant={v === 'Valid' ? 'success' : v === 'Expiring soon' ? 'warning' : 'danger'}>
          {v}
        </Badge>
      ),
    },
    {
      key: 'skills',
      header: 'Extracted Skills',
      render: list => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(list || []).map(sk => (
            <span
              key={sk}
              style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 4,
                background: '#F3F4F6',
                color: '#374151',
                border: '1px solid #E5E7EB',
              }}
            >
              {sk}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <button
          onClick={() => handleDeleteCertificate(row.id)}
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
      ),
    },
  ];

  return (
    <Layout title="Certificates">
      {/* Expiry Reminders Banner */}
      {expiringSoon.length > 0 && (
        <div
          style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 6,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 13,
            color: '#92400E',
          }}
        >
          <strong>Expiry Reminder:</strong> The following certificate(s) expire within 60 days:{' '}
          {expiringSoon.map(c => `${c.title} (expires ${c.expiryDate})`).join(', ')}. Please update your credentials.
        </div>
      )}

      {/* Inline Feedback Bar */}
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

      {/* Upload card */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#111827' }}>
          Upload Certificate
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280' }}>
          Upload PDF, JPG, or PNG. Simulated OCR parses issuer, issue dates, and skill credentials automatically.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            disabled={isProcessing}
            style={{ fontSize: 13, color: '#374151' }}
          />
          {isProcessing && (
            <span style={{ fontSize: 13, color: '#2563EB', fontWeight: 500 }}>
              Processing document with OCR...
            </span>
          )}
        </div>

        {/* Extracted Details Form */}
        {extractedData && (
          <form
            onSubmit={handleSaveCertificate}
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #E5E7EB',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Extracted Details (from {uploadedFileName})
            </h3>

            {/* Duplicate warning */}
            {isDuplicate && (
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 6,
                  padding: '10px 14px',
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#92400E',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Possible duplicate detected</div>
                <div>A certificate with matching title, issuer, and issue date already exists in your records.</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={confirmDuplicate}
                    onChange={e => setConfirmDuplicate(e.target.checked)}
                  />
                  <span>Confirm and save anyway</span>
                </label>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Certificate Title" required>
                <input
                  type="text"
                  required
                  value={extractedData.title}
                  onChange={e => setExtractedData({ ...extractedData, title: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Issuer / Organization" required>
                <input
                  type="text"
                  required
                  value={extractedData.issuer}
                  onChange={e => setExtractedData({ ...extractedData, issuer: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Issue Date" required>
                <input
                  type="date"
                  required
                  value={extractedData.issueDate}
                  onChange={e => setExtractedData({ ...extractedData, issueDate: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Expiry Date (optional)">
                <input
                  type="date"
                  value={extractedData.expiryDate}
                  onChange={e => setExtractedData({ ...extractedData, expiryDate: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
            </div>

            {/* Extracted skills chips */}
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                Extracted Skills:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {extractedData.skills.map(sk => (
                  <span
                    key={sk}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: '#EFF6FF',
                      color: '#1E40AF',
                      border: '1px solid #BFDBFE',
                    }}
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => handleRemoveExtractedSkill(sk)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#1E40AF',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: 12,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, maxWidth: 300 }}>
                <input
                  type="text"
                  placeholder="Add skill tag"
                  value={newSkillInput}
                  onChange={e => setNewSkillInput(e.target.value)}
                  style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={handleAddExtractedSkill}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    background: '#F9FAFB',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Save / Cancel */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setExtractedData(null)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDuplicate && !confirmDuplicate}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: isDuplicate && !confirmDuplicate ? '#9CA3AF' : '#2563EB',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isDuplicate && !confirmDuplicate ? 'not-allowed' : 'pointer',
                }}
              >
                Save certificate
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Certificates Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#111827' }}>
          Verified Certificates ({myCerts.length})
        </h2>
        <DataTable
          columns={certColumns}
          rows={myCerts}
          emptyMessage="No certificates uploaded yet."
        />
      </div>
    </Layout>
  );
}
