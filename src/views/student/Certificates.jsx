import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import FormField from '../../components/FormField';
import Modal from '../../components/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { initialStudents } from '../../data/students';
import jsQR from 'jsqr';
import {
  ShieldCheck,
  Building2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ExternalLink,
  RefreshCw,
  Trash2,
  CheckCircle2,
  QrCode,
  Info,
  X,
  Plus
} from 'lucide-react';

export default function StudentCertificates() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const student = (state.students || []).find(s => s.id === user?.studentId) || (state.students || [])[0] || initialStudents[0];
  const myCerts = (state.certificates || []).filter(c => c.studentId === student?.id || c.student_id === student?.id);

  // Form states
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  // UI status
  const [clientQrDetected, setClientQrDetected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyingStep, setVerifyingStep] = useState('');
  const [inlineMsg, setInlineMsg] = useState(null);
  const [reverifyingId, setReverifyingId] = useState(null);
  const [selectedCertForDetails, setSelectedCertForDetails] = useState(null);
  const [deleteTargetCert, setDeleteTargetCert] = useState(null);

  const fileInputRef = useRef(null);

  // Expiring soon count
  const expiringSoon = myCerts.filter(c => c.status === 'Expiring soon');

  // Load latest certificates from server
  useEffect(() => {
    if (!student?.id) return;
    fetch('/api/certificates')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.certificates)) {
          dispatch({ type: 'SET_CERTIFICATES', payload: d.certificates });
        }
      })
      .catch(() => {});
  }, [student?.id, dispatch]);

  // Client-side QR scan for images
  async function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      setInlineMsg({ type: 'error', text: 'File size exceeds 5 MB limit.' });
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setClientQrDetected(false);
    setInlineMsg(null);

    // Auto-fill title from filename if empty
    if (!title) {
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }

    // Attempt client-side QR scan for images
    if (selectedFile.type.startsWith('image/')) {
      try {
        const reader = new FileReader();
        reader.onload = ev => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height);
            if (code && code.data && /^https?:\/\//i.test(code.data.trim())) {
              setVerificationUrl(code.data.trim());
              setClientQrDetected(true);
            }
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(selectedFile);
      } catch (_) {
        // Fallback silently: server will re-extract
      }
    }
  }

  function handleAddSkill() {
    const s = skillInput.trim();
    if (!s) return;
    if (!skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setSkillInput('');
  }

  function handleRemoveSkill(s) {
    setSkills(skills.filter(x => x !== s));
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!file) {
      setInlineMsg({ type: 'error', text: 'Please select a certificate file (PDF, PNG, JPG).' });
      return;
    }
    if (!title.trim() || !issuer.trim() || !issueDate) {
      setInlineMsg({ type: 'error', text: 'Please fill in Title, Issuer, and Issue Date.' });
      return;
    }

    setIsSubmitting(true);
    setInlineMsg(null);
    setVerifyingStep('Uploading document and computing cryptographic SHA-256 hash...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('studentId', student.id);
      formData.append('title', title.trim());
      formData.append('issuer', issuer.trim());
      formData.append('issue_date', issueDate);
      if (expiryDate) formData.append('expiry_date', expiryDate);
      if (credentialId.trim()) formData.append('credential_id', credentialId.trim());
      if (verificationUrl.trim()) formData.append('verification_url', verificationUrl.trim());
      if (skills.length > 0) formData.append('skills', JSON.stringify(skills));

      setTimeout(() => {
        setVerifyingStep('Scanning QR code and checking against verified issuer registry...');
      }, 700);

      const res = await fetch('/api/certificates', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload and verify certificate.');
      }

      // Add to React context
      dispatch({ type: 'ADD_CERTIFICATE', payload: data.certificate });

      // Refresh student data to reflect synced skills if auto-verified
      if (data.certificate?.trust_level === 'Issuer Verified') {
        fetch(`/api/students/${student.id}`)
          .then(r => r.json())
          .then(stData => {
            if (stData.student) {
              dispatch({ type: 'UPDATE_STUDENT', payload: stData.student });
            }
          })
          .catch(() => {});
      }

      // Form reset
      setFile(null);
      setFileName('');
      setTitle('');
      setIssuer('');
      setIssueDate('');
      setExpiryDate('');
      setCredentialId('');
      setVerificationUrl('');
      setSkills([]);
      setClientQrDetected(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (data.certificate?.trust_level === 'Issuer Verified') {
        setInlineMsg({
          type: 'success',
          text: `Certificate verified instantly! Issuer confirmation successful and skills synced to your profile matrix.`,
        });
      } else if (data.certificate?.trust_level === 'Flagged') {
        setInlineMsg({
          type: 'error',
          text: `Certificate flagged due to a data discrepancy (e.g. name or credential mismatch). Sent to placement cell for officer audit.`,
        });
      } else {
        setInlineMsg({
          type: 'info',
          text: `Certificate uploaded and routed to University Placement Cell review queue. It will count toward recruiter shortlists once approved.`,
        });
      }
    } catch (err) {
      setInlineMsg({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
      setVerifyingStep('');
    }
  }

  async function handleReverify(certId) {
    setReverifyingId(certId);
    try {
      const res = await fetch(`/api/certificates/${certId}/reverify`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to re-verify certificate.');
      }

      dispatch({
        type: 'UPDATE_CERTIFICATE',
        payload: {
          id: certId,
          ...data.certificate,
        },
      });

      setInlineMsg({
        type: 'success',
        text: `Re-verification finished: Trust Level is now "${data.certificate.trust_level}".`,
      });
    } catch (err) {
      setInlineMsg({ type: 'error', text: err.message });
    } finally {
      setReverifyingId(null);
    }
  }

  function handleDelete(cert) {
    setDeleteTargetCert(cert);
  }

  async function confirmDeleteCert() {
    if (!deleteTargetCert) return;
    try {
      const res = await fetch(`/api/certificates?id=${deleteTargetCert.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete certificate.');
      }
      dispatch({ type: 'DELETE_CERTIFICATE', payload: deleteTargetCert.id });
      setInlineMsg({ type: 'success', text: `Certificate "${deleteTargetCert.title}" removed.` });
    } catch (err) {
      setInlineMsg({ type: 'error', text: err.message });
    } finally {
      setDeleteTargetCert(null);
    }
  }

  function getTrustBadge(trustLevel) {
    switch (trustLevel) {
      case 'Issuer Verified':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 9999, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', fontSize: 11, fontWeight: 600 }}>
            <ShieldCheck size={13} color="#059669" /> Issuer Verified
          </span>
        );
      case 'Placement Cell Verified':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 9999, background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', fontSize: 11, fontWeight: 600 }}>
            <Building2 size={13} color="#2563EB" /> Placement Cell Verified
          </span>
        );
      case 'Flagged':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 9999, background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', fontSize: 11, fontWeight: 600 }}>
            <AlertTriangle size={13} color="#DC2626" /> Flagged for Review
          </span>
        );
      case 'Rejected':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 9999, background: '#FFF1F2', color: '#9F1239', border: '1px solid #FECDD3', fontSize: 11, fontWeight: 600 }}>
            <XCircle size={13} color="#E11D48" /> Rejected
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 9999, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', fontSize: 11, fontWeight: 600 }}>
            <Clock size={13} color="#D97706" /> Pending Review
          </span>
        );
    }
  }

  return (
    <Layout title="Certificates & Verified Credentials">
      {/* Alert banner for expiring certificates */}
      {expiringSoon.length > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} color="#D97706" />
          <span>You have {expiringSoon.length} certificate(s) expiring soon. Renew or re-verify them to maintain verified skill status.</span>
        </div>
      )}

      {/* Global verification notice */}
      <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#475569' }}>
        <Info size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ color: '#0F172A' }}>Cryptographic QR & Verification Link Policy:</strong> Career-OS independently verifies certificates directly against official issuer records (Credly, Coursera, NPTEL, Accredible, etc.). Only certificates with <strong>Issuer Verified</strong> or <strong>Placement Cell Verified</strong> status count toward your skill matrix, CDC shortlist scoring (20%), and recruiter visibility.
        </div>
      </div>

      {inlineMsg && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 13,
          background: inlineMsg.type === 'success' ? '#ECFDF5' : inlineMsg.type === 'error' ? '#FEF2F2' : '#EFF6FF',
          border: `1px solid ${inlineMsg.type === 'success' ? '#A7F3D0' : inlineMsg.type === 'error' ? '#FECACA' : '#BFDBFE'}`,
          color: inlineMsg.type === 'success' ? '#065F46' : inlineMsg.type === 'error' ? '#991B1B' : '#1E40AF',
        }}>
          {inlineMsg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 20, alignItems: 'start' }}>
        {/* Upload Form Card */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#2563EB" /> Upload & Verify Certificate
          </h2>
          <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
            Upload your official document (PDF, PNG, JPG). If a QR code is present, our system extracts and verifies it against the issuer URL automatically.
          </p>

          <form onSubmit={handleUploadSubmit}>
            {/* File drop area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: 8,
                padding: '20px 14px',
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? '#F0FDF4' : '#F8FAFC',
                marginBottom: 14,
                transition: 'all 0.2s',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <FileText size={28} color={file ? '#16A34A' : '#64748B'} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>
                {fileName ? fileName : 'Click to select certificate file'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                Supports PDF, PNG, JPG (max 5 MB)
              </div>
            </div>

            {clientQrDetected && (
              <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <QrCode size={14} color="#16A34A" />
                <span>QR Code detected on file! Verification URL pre-filled. Server will independently re-verify.</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FormField
                label="Certificate Title *"
                id="cert-title"
                value={title}
                placeholder="e.g. AWS Certified Solutions Architect"
                onChange={setTitle}
              />

              <FormField
                label="Issuer Organization *"
                id="cert-issuer"
                value={issuer}
                placeholder="e.g. Credly, Coursera, NPTEL, AWS"
                onChange={setIssuer}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FormField
                  label="Issue Date *"
                  id="cert-issue-date"
                  type="date"
                  value={issueDate}
                  onChange={setIssueDate}
                />
                <FormField
                  label="Expiry Date (optional)"
                  id="cert-expiry-date"
                  type="date"
                  value={expiryDate}
                  onChange={setExpiryDate}
                />
              </div>

              <FormField
                label="Credential ID / Roll No (optional)"
                id="cert-cred-id"
                value={credentialId}
                placeholder="e.g. NPTEL24CS01, CRED-99214"
                onChange={setCredentialId}
              />

              <FormField
                label="Verification URL (optional)"
                id="cert-verify-url"
                value={verificationUrl}
                placeholder="https://www.credly.com/badges/..."
                onChange={setVerificationUrl}
              />

              {/* Skills tagger */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                  Associated Skills (optional)
                </label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    type="text"
                    value={skillInput}
                    placeholder="e.g. Python, Docker, Cloud"
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: 6,
                      border: '1px solid #D1D5DB',
                      fontSize: 13,
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 6,
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Add
                  </button>
                </div>
                {skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {skills.map(sk => (
                      <span
                        key={sk}
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          background: '#EFF6FF',
                          color: '#1E40AF',
                          border: '1px solid #DBEAFE',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {sk}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkill(sk)} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {isSubmitting && verifyingStep && (
                <div style={{ padding: '10px 12px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 6, fontSize: 12, color: '#0369A1', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{verifyingStep}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: 6,
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: isSubmitting ? '#94A3B8' : '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: 13,
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} /> Submit for Cryptographic Verification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Certificates List */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>My Uploaded Certificates</h2>
              <div style={{ fontSize: 12, color: '#64748B' }}>Total: {myCerts.length} document(s)</div>
            </div>
          </div>

          {myCerts.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13, border: '1px dashed #E2E8F0', borderRadius: 8 }}>
              No certificates uploaded yet. Upload your certifications above to get them verified for CDC shortlists.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myCerts.map(cert => {
                const isIssuerVerified = cert.trust_level === 'Issuer Verified' || cert.trustLevel === 'Issuer Verified';
                const isOfficerVerified = cert.trust_level === 'Placement Cell Verified' || cert.trustLevel === 'Placement Cell Verified';
                const isVerified = isIssuerVerified || isOfficerVerified || cert.verified === true;
                const trustLevel = cert.trust_level || cert.trustLevel || (cert.verified ? 'Issuer Verified' : 'Unverified');
                const certSkills = Array.isArray(cert.skills) ? cert.skills : [];

                return (
                  <div
                    key={cert.id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: 14,
                      background: isVerified ? '#FAFCFF' : '#FFFFFF',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {cert.title}
                          {getTrustBadge(trustLevel)}
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                          Issued by <strong>{cert.issuer}</strong> on {cert.issue_date || cert.issueDate}
                          {(cert.expiry_date || cert.expiryDate) && ` · Expires ${cert.expiry_date || cert.expiryDate}`}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => setSelectedCertForDetails(cert)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            fontSize: 11,
                            fontWeight: 500,
                            color: '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          View Details
                        </button>

                        <button
                          onClick={() => handleReverify(cert.id)}
                          disabled={reverifyingId === cert.id}
                          title="Re-verify against issuer"
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            fontSize: 11,
                            color: '#2563EB',
                            cursor: reverifyingId === cert.id ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <RefreshCw size={12} className={reverifyingId === cert.id ? 'animate-spin' : ''} />
                          Re-verify
                        </button>

                        <button
                          onClick={() => handleDelete(cert)}
                          title="Delete certificate"
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            fontSize: 11,
                            color: '#DC2626',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Metadata & Skills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#64748B', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                      {cert.credential_id && (
                        <span>ID: <code style={{ background: '#F1F5F9', padding: '1px 4px', borderRadius: 4 }}>{cert.credential_id}</code></span>
                      )}

                      {/* File preview link */}
                      {cert.file_name && (
                        <a
                          href={`/api/certificates/${cert.id}/file`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2563EB', textDecoration: 'none' }}
                        >
                          <FileText size={12} /> View File
                        </a>
                      )}

                      {/* Issuer link */}
                      {cert.verification_url && (
                        <a
                          href={cert.verification_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', textDecoration: 'none' }}
                        >
                          <ExternalLink size={12} /> Issuer Link
                        </a>
                      )}

                      {/* Extracted skills */}
                      {certSkills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginLeft: 'auto' }}>
                          {certSkills.map(sk => (
                            <span
                              key={sk}
                              style={{
                                fontSize: 11,
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: isVerified ? '#ECFDF5' : '#F1F5F9',
                                color: isVerified ? '#065F46' : '#475569',
                                border: `1px solid ${isVerified ? '#A7F3D0' : '#E2E8F0'}`,
                              }}
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Verification Details Modal */}
      {selectedCertForDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 20, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="#2563EB" />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Cryptographic Audit Details</h3>
              </div>
              <button
                onClick={() => setSelectedCertForDetails(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div>
                <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Certificate</div>
                <div style={{ fontWeight: 600, color: '#0F172A' }}>{selectedCertForDetails.title}</div>
                <div style={{ color: '#475569' }}>Issuer: {selectedCertForDetails.issuer}</div>
              </div>

              <div>
                <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Trust Status</div>
                <div style={{ marginTop: 4 }}>{getTrustBadge(selectedCertForDetails.trust_level || (selectedCertForDetails.verified ? 'Issuer Verified' : 'Unverified'))}</div>
              </div>

              {selectedCertForDetails.check_results && (
                <div>
                  <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Automated Verification Checks</div>
                  <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Domain Allowlist:</span>
                      <strong style={{ color: selectedCertForDetails.check_results.allowlisted ? '#16A34A' : '#DC2626' }}>
                        {selectedCertForDetails.check_results.allowlisted ? 'Allowed Issuer' : 'Not Allowlisted / Unlisted'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Candidate Name Match:</span>
                      <strong style={{ color: selectedCertForDetails.check_results.nameMatch ? '#16A34A' : selectedCertForDetails.check_results.nameMatch === false ? '#DC2626' : '#64748B' }}>
                        {selectedCertForDetails.check_results.nameMatch ? 'Exact / High Similarity' : selectedCertForDetails.check_results.nameMatch === false ? 'Mismatch Flagged' : 'Pending Manual Review'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Issuer Response:</span>
                      <strong style={{ color: selectedCertForDetails.check_results.pageValid ? '#16A34A' : '#64748B' }}>
                        {selectedCertForDetails.check_results.pageValid ? 'Valid & Active Credential' : 'No Direct API/HTML confirmation'}
                      </strong>
                    </div>

                    {selectedCertForDetails.check_results.source && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Source:</span>
                        <span>{selectedCertForDetails.check_results.source === 'qr' ? 'Cryptographic QR Code' : 'Candidate Provided Link'}</span>
                      </div>
                    )}

                    {selectedCertForDetails.check_results.reasons && selectedCertForDetails.check_results.reasons.length > 0 && (
                      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #CBD5E1' }}>
                        <span style={{ color: '#64748B', display: 'block', marginBottom: 2 }}>Notes:</span>
                        <ul style={{ margin: 0, paddingLeft: 16, color: '#334155' }}>
                          {selectedCertForDetails.check_results.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedCertForDetails.review_status && selectedCertForDetails.review_status !== 'Not Required' && (
                <div>
                  <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Placement Cell Review</div>
                  <div style={{ background: '#FFFBEB', borderRadius: 8, padding: 10, border: '1px solid #FDE68A', fontSize: 12, color: '#92400E' }}>
                    <div><strong>Review Status:</strong> {selectedCertForDetails.review_status}</div>
                    {selectedCertForDetails.review_remark && (
                      <div style={{ marginTop: 4 }}><strong>Officer Remark:</strong> {selectedCertForDetails.review_remark}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button
                onClick={() => setSelectedCertForDetails(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation In-App Modal (replaces browser confirm) */}
      {deleteTargetCert && (
        <Modal
          isOpen={Boolean(deleteTargetCert)}
          onClose={() => setDeleteTargetCert(null)}
          title="Confirm Deletion"
          width={440}
        >
          <div style={{ padding: '6px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={22} color="#DC2626" />
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
                  Delete Certificate?
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                  Are you sure you want to delete this verified credential? It will be removed from your profile and recruiter scoring.
                </p>
              </div>
            </div>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 6,
                padding: '12px 14px',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                Certificate
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', wordBreak: 'break-word' }}>
                "{deleteTargetCert.title}"
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Issuer: {deleteTargetCert.issuer}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteTargetCert(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  background: '#fff',
                  color: '#374151',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCert}
                style={{
                  padding: '9px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#DC2626',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Trash2 size={15} />
                Delete Certificate
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
