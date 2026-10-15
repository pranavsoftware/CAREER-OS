import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Badge, { getBadgeVariant } from '../../components/Badge';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { checkEligibility } from '../../utils/eligibility';
import { Video, FileText, Download, ExternalLink, Paperclip, CheckCircle2, Play } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { state, dispatch } = useData();
  const [selectedNotif, setSelectedNotif] = useState(null);

  const student = state.students.find(s => s.id === user.studentId);
  if (!student) return <Layout title="Dashboard"><p>Student not found.</p></Layout>;

  const myApplications = state.applications.filter(a => a.studentId === student.id);
  const myCerts = state.certificates.filter(c => c.studentId === student.id);
  const myNotifs = state.notifications.filter(n => n.studentId === student.id);

  // ATS score from latest resume version
  const myVersions = state.resumeVersions[student.id] || [];
  const latestAts = myVersions.length > 0 ? myVersions[0].score : null;

  // Upcoming drives eligibility
  const upcomingDrives = state.drives.filter(d => d.status === 'Open' || d.status === 'Upcoming');

  // Expiring soon certs banner
  const expiringSoon = myCerts.filter(c => c.status === 'Expiring soon');

  function handleApply(drive) {
    const alreadyApplied = myApplications.some(a => a.driveId === drive.id);
    if (alreadyApplied) return;

    const newApp = {
      id: `a${Date.now()}`,
      studentId: student.id,
      driveId: drive.id,
      jobId: drive.jobId,
      company: drive.company,
      role: drive.role,
      ctc: drive.ctc,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
      notes: '',
      statusHistory: [{ stage: 'Applied', date: new Date().toISOString().split('T')[0] }],
    };
    dispatch({ type: 'ADD_APPLICATION', payload: newApp });

    // Also add to drive applications
    const newDriveApp = {
      id: `da${Date.now()}`,
      studentId: student.id,
      driveId: drive.id,
      studentName: student.name,
      regNo: student.regNo,
      branch: student.branch,
      cgpa: student.cgpa,
      status: 'Applied',
      shortlisted: false,
      rejected: false,
    };
    dispatch({ type: 'ADD_DRIVE_APPLICATION', payload: newDriveApp });

    // Update drive applicant count
    dispatch({ type: 'UPDATE_DRIVE', payload: { id: drive.id, applicantsCount: (drive.applicantsCount || 0) + 1 } });
  }

  const driveColumns = [
    { key: 'company', header: 'Company' },
    { key: 'role', header: 'Role' },
    { key: 'ctc', header: 'CTC', render: v => `${v} LPA` },
    { key: 'deadline', header: 'Deadline' },
    {
      key: 'id', header: 'Eligibility', render: (_, row) => {
        const { eligible, reason } = checkEligibility(student, row);
        return <Badge variant={eligible ? 'success' : 'danger'}>{eligible ? 'Eligible' : reason}</Badge>;
      }
    },
    {
      key: 'actions', header: '', render: (_, row) => {
        const { eligible } = checkEligibility(student, row);
        const alreadyApplied = myApplications.some(a => a.driveId === row.id);
        return (
          <button
            disabled={!eligible || alreadyApplied}
            onClick={e => { e.stopPropagation(); handleApply(row); }}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: '1px solid #E5E7EB',
              background: alreadyApplied ? '#F9FAFB' : eligible ? '#2563EB' : '#F9FAFB',
              color: alreadyApplied ? '#9CA3AF' : eligible ? '#fff' : '#9CA3AF',
              cursor: eligible && !alreadyApplied ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {alreadyApplied ? 'Applied' : 'Apply'}
          </button>
        );
      }
    },
  ];

  // Skill gap top 3 missing skills for Frontend Developer
  const skillGapPreview = [
    { skill: 'TypeScript', requiredLevel: 3, currentLevel: 0 },
    { skill: 'Redux', requiredLevel: 3, currentLevel: 0 },
    { skill: 'Testing (Jest)', requiredLevel: 2, currentLevel: 0 },
  ];

  return (
    <Layout title="Dashboard">
      {/* Expiring cert banner */}
      {expiringSoon.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          Certificate expiring soon: {expiringSoon.map(c => c.title).join(', ')}. Renew before the deadline.
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Profile Completion" value={`${student.profileCompletion}%`} sub={student.profileStatus} />
        <StatCard label="Applications" value={myApplications.length} sub={`${myApplications.filter(a => a.status === 'Offer').length} offer(s)`} />
        <StatCard label="Resume ATS Score" value={latestAts !== null ? `${latestAts}/100` : 'N/A'} sub="Latest version" />
        <StatCard label="Certificates" value={myCerts.length} sub={`${myCerts.filter(c => c.status === 'Valid').length} valid`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 24 }}>
        {/* Upcoming drives */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Upcoming Drives</h2>
          <DataTable
            columns={driveColumns}
            rows={upcomingDrives}
            emptyMessage="No upcoming drives."
          />
        </div>

        {/* Notifications & Student Mail */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Recent Notices & Mails</h2>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Latest 3 announcements</div>
            </div>
            <Link
              to="/student/mail"
              style={{
                fontSize: 12,
                color: '#2563EB',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>View All Mails ({myNotifs.length})</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myNotifs.slice(0, 3).map(n => {
              const isVideo = n.attachmentType === 'video' || (n.attachmentUrl && (n.attachmentUrl.includes('.mp4') || n.attachmentUrl.startsWith('data:video/mp4')));
              const isPdf = n.attachmentType === 'pdf' || (n.attachmentUrl && (n.attachmentUrl.includes('.pdf') || n.attachmentUrl.startsWith('data:application/pdf')));

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
                    setSelectedNotif(n);
                  }}
                  style={{
                    padding: 12,
                    border: '1px solid #E5E7EB',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: n.read ? '#fff' : '#F0F9FF',
                    borderLeft: n.read ? '1px solid #E5E7EB' : '3px solid #2563EB',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{n.title}</div>
                    {isVideo && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <Video size={11} /> MP4 Video
                      </span>
                    )}
                    {isPdf && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <FileText size={11} /> PDF Document
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {n.message}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: '#9CA3AF' }}>
                    <span>{n.date || 'Recent'}</span>
                    <span style={{ color: '#2563EB', fontWeight: 500 }}>Open &rarr;</span>
                  </div>
                </div>
              );
            })}
            {myNotifs.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                No notifications or broadcast mails received yet.
              </div>
            )}
          </div>

          {myNotifs.length > 3 && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Link
                to="/student/mail"
                style={{
                  display: 'inline-block',
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  background: '#F9FAFB',
                  color: '#374151',
                  fontSize: 12,
                  fontWeight: 500,
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                Go to Student Mailbox with Search & Date Filters ({myNotifs.length - 3} older mails)
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Skill gap summary */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Skill Gap Summary</h2>
          <Link to="/student/skill-gap" style={{ fontSize: 13, color: '#2563EB' }}>View full analysis</Link>
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Top missing skills for Frontend Developer role:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {skillGapPreview.map(item => (
            <div key={item.skill} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 140, fontSize: 13, color: '#374151' }}>{item.skill}</span>
              <Badge variant="danger">Missing</Badge>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Required level: {item.requiredLevel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Notification & Mail Detail Modal */}
      {selectedNotif && (
        <Modal
          isOpen={Boolean(selectedNotif)}
          title={selectedNotif.title}
          onClose={() => setSelectedNotif(null)}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                Received on: <strong>{selectedNotif.date || 'Recent'}</strong> &bull; From: <strong>University Placement Cell</strong>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(selectedNotif.attachmentType === 'video' || (selectedNotif.attachmentUrl && (selectedNotif.attachmentUrl.includes('.mp4') || selectedNotif.attachmentUrl.startsWith('data:video/mp4')))) && (
                  <Badge variant="info">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Video size={12} /> MP4 Video Attached
                    </span>
                  </Badge>
                )}
                {(selectedNotif.attachmentType === 'pdf' || (selectedNotif.attachmentUrl && (selectedNotif.attachmentUrl.includes('.pdf') || selectedNotif.attachmentUrl.startsWith('data:application/pdf')))) && (
                  <Badge variant="danger">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <FileText size={12} /> PDF Document Attached
                    </span>
                  </Badge>
                )}
              </div>
            </div>

            {/* Notification message body */}
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#374151', lineHeight: 1.6, background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 6, padding: 14, marginBottom: 16 }}>
              {selectedNotif.message}
            </div>

            {/* MP4 Video Player */}
            {(selectedNotif.attachmentType === 'video' || (selectedNotif.attachmentUrl && (selectedNotif.attachmentUrl.includes('.mp4') || selectedNotif.attachmentUrl.startsWith('data:video/mp4')))) && (
              <div style={{ background: '#0F172A', borderRadius: 8, padding: 12, marginBottom: 16, color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Video size={16} color="#60A5FA" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {selectedNotif.attachmentName || 'Official Placement Briefing & Orientation Video (.mp4)'}
                  </span>
                </div>
                <video
                  controls
                  playsInline
                  preload="metadata"
                  autoPlay={false}
                  src={selectedNotif.attachmentUrl}
                  style={{ width: '100%', maxHeight: 320, borderRadius: 6, background: '#000', objectFit: 'contain' }}
                >
                  Your browser does not support HTML5 MP4 video playback.
                </video>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <a
                    href={selectedNotif.attachmentUrl}
                    download={selectedNotif.attachmentName || 'placement-video.mp4'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 4,
                      background: '#1E293B',
                      color: '#93C5FD',
                      fontSize: 12,
                      textDecoration: 'none',
                      border: '1px solid #334155',
                    }}
                  >
                    <Download size={13} />
                    <span>Download MP4 Video</span>
                  </a>
                </div>
              </div>
            )}

            {/* Proper PDF Document Card & Viewer */}
            {(selectedNotif.attachmentType === 'pdf' || (selectedNotif.attachmentUrl && (selectedNotif.attachmentUrl.includes('.pdf') || selectedNotif.attachmentUrl.startsWith('data:application/pdf')))) && (
              <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={22} color="#DC2626" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
                        {selectedNotif.attachmentName || 'Placement Guidelines & Company Profile (.pdf)'}
                      </div>
                      <div style={{ fontSize: 11, color: '#B91C1C' }}>
                        Official University Document &bull; Verified PDF
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={selectedNotif.attachmentUrl}
                      download={selectedNotif.attachmentName || 'document.pdf'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: '#DC2626',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 500,
                        textDecoration: 'none',
                      }}
                    >
                      <Download size={13} />
                      <span>Download PDF</span>
                    </a>
                    <a
                      href={selectedNotif.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: '#fff',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        fontSize: 12,
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Open in Tab</span>
                    </a>
                  </div>
                </div>

                {/* Embedded PDF iframe viewer if data URI */}
                {selectedNotif.attachmentUrl && selectedNotif.attachmentUrl.startsWith('data:application/pdf') && (
                  <iframe
                    src={selectedNotif.attachmentUrl}
                    title="PDF Viewer"
                    style={{ width: '100%', height: 350, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}
                  />
                )}
              </div>
            )}

            {/* Fallback for external link attachment */}
            {selectedNotif.attachmentType === 'link' && selectedNotif.attachmentUrl && (
              <div style={{ padding: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, marginBottom: 16 }}>
                <a
                  href={selectedNotif.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563EB', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  <span>Open Attached Resource Link ({selectedNotif.attachmentName || selectedNotif.attachmentUrl})</span>
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                style={{ padding: '7px 18px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
