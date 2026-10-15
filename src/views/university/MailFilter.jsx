import { useState, useRef } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import {
  Mail,
  Send,
  Paperclip,
  FileText,
  Video,
  Link2,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Info,
  Search,
  Calendar,
  Clock,
  Users,
  Inbox,
  SendHorizontal,
  ExternalLink,
  Download,
  Filter,
  Check
} from 'lucide-react';

const ALL_BRANCHES = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'Mechanical'];

export default function UniversityMailFilter() {
  const { state, dispatch } = useData();
  const { mails = [], students = [], sentMails = [] } = state;

  // Main Tabs: 'received' (Inbound recruiter inquiries) | 'sent' (Outbound sent emails to students)
  const [activeTab, setActiveTab] = useState('received');

  // Received Inquiries State
  const [selectedMail, setSelectedMail] = useState(mails[0] || null);
  const [extractedMailId, setExtractedMailId] = useState(null);
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxStatusFilter, setInboxStatusFilter] = useState('all'); // 'all' | 'new' | 'processed'

  // Sent Broadcasts State
  const [selectedSentMail, setSelectedSentMail] = useState(sentMails[0] || null);
  const [sentSearch, setSentSearch] = useState('');
  const [sentDateFilter, setSentDateFilter] = useState('all'); // 'all' | 'today' | '7days' | '30days'

  const [inlineMsg, setInlineMsg] = useState(null);

  // Compose / Send Mail Modal State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const fileInputRef = useRef(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentProgress, setAttachmentProgress] = useState(null);
  const [attachmentError, setAttachmentError] = useState(null);
  const [attachmentTab, setAttachmentTab] = useState('upload'); // 'upload' | 'link'

  const [composeForm, setComposeForm] = useState({
    targetType: 'all', // 'all' | 'eligible' | 'branch' | 'minCgpa' | 'student'
    branch: 'CSE',
    minCgpa: '7.5',
    selectedStudentId: '',
    subject: '',
    body: '',
    linkedMailId: null,
    attachmentType: '', // 'video' | 'pdf' | 'link' | ''
    attachmentUrl: '',
    attachmentName: '',
  });

  // Filter Received Inquiries
  const filteredMails = mails.filter(m => {
    const q = inboxSearch.toLowerCase();
    const matchSearch =
      m.sender.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      (m.snippet || '').toLowerCase().includes(q) ||
      (m.body || '').toLowerCase().includes(q) ||
      (m.from || '').toLowerCase().includes(q);

    const matchStatus =
      inboxStatusFilter === 'all'
        ? true
        : inboxStatusFilter === 'new'
        ? !m.processed
        : Boolean(m.processed);

    return matchSearch && matchStatus;
  });

  // Filter Sent Broadcasts
  const filteredSentMails = sentMails.filter(s => {
    const q = sentSearch.toLowerCase();
    const matchSearch =
      s.subject.toLowerCase().includes(q) ||
      s.body.toLowerCase().includes(q) ||
      (s.targetSummary || '').toLowerCase().includes(q) ||
      (s.sender || '').toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (sentDateFilter === 'all') return true;

    const sentTime = new Date(s.sentAt || s.sent_at || Date.now()).getTime();
    const now = Date.now();
    const diffHours = (now - sentTime) / (1000 * 60 * 60);

    if (sentDateFilter === 'today') return diffHours <= 24;
    if (sentDateFilter === '7days') return diffHours <= 24 * 7;
    if (sentDateFilter === '30days') return diffHours <= 24 * 30;

    return true;
  });

  // Compute eligible students for a mail's criteria
  function getEligibleCount(criteria) {
    if (!criteria) return 0;
    return students.filter(s => {
      const matchBranch = !criteria.branches || criteria.branches.includes(s.branch);
      const matchCgpa = s.cgpa >= (criteria.minCgpa || 0);
      const matchBacklog = s.backlogs <= (criteria.maxBacklogs ?? 0);
      return matchBranch && matchCgpa && matchBacklog;
    }).length;
  }

  function handleExtract(mailId) {
    setExtractedMailId(mailId);
    setInlineMsg(null);
  }

  function handleOpenCompose(mail = null) {
    setAttachmentError(null);
    setAttachmentProgress(null);
    if (mail) {
      setComposeForm({
        targetType: mail.criteria ? 'eligible' : 'all',
        branch: 'CSE',
        minCgpa: mail.criteria?.minCgpa ? String(mail.criteria.minCgpa) : '7.0',
        selectedStudentId: students[0]?.id || '',
        subject: `Campus Opportunity Announcement: ${mail.sender}`,
        body: `Dear Students,\n\nWe have received an official placement inquiry from ${mail.sender} (${mail.from}).\n\nSubject: ${mail.subject}\n\nDetails:\n${mail.snippet || mail.body.substring(0, 200)}...\n\nEligible students are advised to review their resumes on the portal. Drive registration will open shortly.\n\nBest regards,\nUniversity Placement & Training Cell`,
        linkedMailId: mail.id,
        attachmentType: '',
        attachmentUrl: '',
        attachmentName: '',
      });
    } else {
      setComposeForm({
        targetType: 'all',
        branch: 'CSE',
        minCgpa: '7.5',
        selectedStudentId: students[0]?.id || '',
        subject: 'Important Placement Cell Announcement',
        body: 'Dear Students,\n\nPlease ensure your academic details, project portfolio, and resumes are updated on the CAREER-OS portal for upcoming placement drives.\n\nBest regards,\nUniversity Placement Cell',
        linkedMailId: null,
        attachmentType: '',
        attachmentUrl: '',
        attachmentName: '',
      });
    }
    setShowComposeModal(true);
  }

  function handleFileAttachment(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentError(null);
    const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isMp4 && !isPdf) {
      setAttachmentError('Please upload a valid .mp4 video or .pdf document.');
      return;
    }

    setAttachmentLoading(true);
    setAttachmentProgress(10);

    const interval = setInterval(() => {
      setAttachmentProgress(prev => {
        if (!prev || prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 20) + 15;
      });
    }, 100);

    const reader = new FileReader();
    reader.onload = () => {
      clearInterval(interval);
      setAttachmentProgress(100);
      setTimeout(() => {
        setComposeForm(prev => ({
          ...prev,
          attachmentType: isMp4 ? 'video' : 'pdf',
          attachmentUrl: reader.result,
          attachmentName: file.name,
        }));
        setAttachmentLoading(false);
      }, 300);
    };
    reader.onerror = () => {
      clearInterval(interval);
      setAttachmentError('Failed to read file from disk. Please try again.');
      setAttachmentLoading(false);
      setAttachmentProgress(null);
    };
    reader.readAsDataURL(file);
  }

  function handleClearAttachment() {
    setComposeForm(prev => ({
      ...prev,
      attachmentType: '',
      attachmentUrl: '',
      attachmentName: '',
    }));
    setAttachmentError(null);
    setAttachmentProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function getTargetRecipients() {
    if (composeForm.targetType === 'all') {
      return students;
    }
    if (composeForm.targetType === 'eligible' && selectedMail?.criteria) {
      const crit = selectedMail.criteria;
      return students.filter(s => {
        const matchBranch = !crit.branches || crit.branches.includes(s.branch);
        const matchCgpa = s.cgpa >= (crit.minCgpa || 0);
        const matchBacklog = s.backlogs <= (crit.maxBacklogs ?? 0);
        return matchBranch && matchCgpa && matchBacklog;
      });
    }
    if (composeForm.targetType === 'branch') {
      return students.filter(s => composeForm.branch === 'All' || s.branch === composeForm.branch);
    }
    if (composeForm.targetType === 'minCgpa') {
      const min = Number(composeForm.minCgpa) || 0;
      return students.filter(s => s.cgpa >= min);
    }
    if (composeForm.targetType === 'student') {
      return students.filter(s => s.id === composeForm.selectedStudentId);
    }
    return students;
  }

  function handleSendMail(e) {
    e.preventDefault();
    if (!composeForm.subject || !composeForm.body) return;

    const recipients = getTargetRecipients();
    if (recipients.length === 0) {
      alert('No students match the selected target criteria.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    // 1. Dispatch notification for each recipient to receive in their portal
    recipients.forEach(s => {
      const notif = {
        id: `notif_${Date.now()}_${s.id}_${Math.random().toString(36).substr(2, 4)}`,
        studentId: s.id,
        type: composeForm.attachmentType === 'video' ? 'video' : composeForm.attachmentType === 'pdf' ? 'document' : 'info',
        title: composeForm.subject,
        message: composeForm.body,
        date: todayStr,
        read: false,
        source: 'university_mail',
        attachmentUrl: composeForm.attachmentUrl || null,
        attachmentType: composeForm.attachmentType || null,
        attachmentName: composeForm.attachmentName || null,
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: notif });
    });

    // 2. Persist to sent_mails table in DB and update context state
    const sentMailRecord = {
      id: `sent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sender: 'University Placement & Training Cell',
      subject: composeForm.subject,
      body: composeForm.body,
      targetType: composeForm.targetType,
      targetSummary: composeForm.targetType === 'all'
        ? 'All Students'
        : composeForm.targetType === 'eligible'
        ? `Eligible Students (${recipients.length})`
        : composeForm.targetType === 'branch'
        ? `Branch: ${composeForm.branch}`
        : composeForm.targetType === 'minCgpa'
        ? `CGPA >= ${composeForm.minCgpa}`
        : `Student ID: ${composeForm.selectedStudentId}`,
      recipientCount: recipients.length,
      attachmentUrl: composeForm.attachmentUrl || null,
      attachmentType: composeForm.attachmentType || null,
      attachmentName: composeForm.attachmentName || null,
      sentAt: nowIso,
      linkedMailId: composeForm.linkedMailId || null,
    };
    dispatch({ type: 'ADD_SENT_MAIL', payload: sentMailRecord });

    // 3. Mark linked recruiter email as processed
    if (composeForm.linkedMailId) {
      dispatch({
        type: 'UPDATE_MAIL',
        payload: { id: composeForm.linkedMailId, processed: true },
      });
    }

    setShowComposeModal(false);
    setSelectedSentMail(sentMailRecord);
    setActiveTab('sent');
    setInlineMsg({
      type: 'success',
      text: `Mail with ${composeForm.attachmentType ? `${composeForm.attachmentType.toUpperCase()} attachment` : 'announcement'} successfully sent to ${recipients.length} student(s) and recorded in sent history.`,
    });
  }

  function formatDateTime(isoString) {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  }

  return (
    <Layout title="Eligibility Mail Filter & Communication Hub">
      {inlineMsg && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 16,
            borderRadius: 6,
            background: inlineMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${inlineMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            color: inlineMsg.type === 'success' ? '#15803D' : '#B91C1C',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{inlineMsg.text}</span>
        </div>
      )}

      {/* Top Header & View Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, background: '#F3F4F6', padding: 4, borderRadius: 8 }}>
          <button
            onClick={() => setActiveTab('received')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === 'received' ? '#fff' : 'transparent',
              color: activeTab === 'received' ? '#111827' : '#6B7280',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: activeTab === 'received' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Inbox size={15} color={activeTab === 'received' ? '#2563EB' : '#6B7280'} />
            <span>Received Inquiries (Inbox)</span>
            <span
              style={{
                background: activeTab === 'received' ? '#EFF6FF' : '#E5E7EB',
                color: activeTab === 'received' ? '#2563EB' : '#4B5563',
                borderRadius: 12,
                padding: '1px 8px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {mails.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === 'sent' ? '#fff' : 'transparent',
              color: activeTab === 'sent' ? '#111827' : '#6B7280',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: activeTab === 'sent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <SendHorizontal size={15} color={activeTab === 'sent' ? '#2563EB' : '#6B7280'} />
            <span>Sent Student Broadcasts (Outbox)</span>
            <span
              style={{
                background: activeTab === 'sent' ? '#EFF6FF' : '#E5E7EB',
                color: activeTab === 'sent' ? '#2563EB' : '#4B5563',
                borderRadius: 12,
                padding: '1px 8px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {sentMails.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => handleOpenCompose()}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: '#2563EB',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 1px 3px rgba(37,99,235,0.2)',
          }}
        >
          <Mail size={15} />
          <span>Compose / Broadcast to Students</span>
        </button>
      </div>

      {/* ======================= TAB 1: RECEIVED INQUIRIES ======================= */}
      {activeTab === 'received' && (
        <div>
          {/* Sub Search & Filter bar for Received */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search recruiter inquiries by sender, subject, or message content..."
                value={inboxSearch}
                onChange={e => setInboxSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Status:</span>
              <button
                onClick={() => setInboxStatusFilter('all')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: `1px solid ${inboxStatusFilter === 'all' ? '#2563EB' : '#D1D5DB'}`,
                  background: inboxStatusFilter === 'all' ? '#EFF6FF' : '#fff',
                  color: inboxStatusFilter === 'all' ? '#2563EB' : '#374151',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                All ({mails.length})
              </button>
              <button
                onClick={() => setInboxStatusFilter('new')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: `1px solid ${inboxStatusFilter === 'new' ? '#F59E0B' : '#D1D5DB'}`,
                  background: inboxStatusFilter === 'new' ? '#FEF3C7' : '#fff',
                  color: inboxStatusFilter === 'new' ? '#B45309' : '#374151',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                New ({mails.filter(m => !m.processed).length})
              </button>
              <button
                onClick={() => setInboxStatusFilter('processed')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: `1px solid ${inboxStatusFilter === 'processed' ? '#10B981' : '#D1D5DB'}`,
                  background: inboxStatusFilter === 'processed' ? '#D1FAE5' : '#fff',
                  color: inboxStatusFilter === 'processed' ? '#047857' : '#374151',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Processed ({mails.filter(m => m.processed).length})
              </button>
            </div>
          </div>

          {/* Two-column layout: Inbox list on left, Reading & Parser pane on right */}
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, alignItems: 'start' }}>
            {/* Mail Inbox List */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', fontWeight: 600, fontSize: 13, color: '#111827', background: '#F9FAFB' }}>
                Inbound Inquiries ({filteredMails.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 600, overflowY: 'auto' }}>
                {filteredMails.map(m => {
                  const isSelected = selectedMail?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => { setSelectedMail(m); setExtractedMailId(null); }}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid #F3F4F6',
                        cursor: 'pointer',
                        background: isSelected ? '#EFF6FF' : '#fff',
                        borderLeft: isSelected ? '4px solid #2563EB' : '4px solid transparent',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{m.sender}</span>
                        {m.processed ? (
                          <Badge variant="success">Processed</Badge>
                        ) : (
                          <Badge variant="warning">New</Badge>
                        )}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.subject}
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {m.snippet}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 11, color: '#9CA3AF' }}>
                        <span>{m.from}</span>
                        <span>{m.criteria ? `${getEligibleCount(m.criteria)} eligible` : ''}</span>
                      </div>
                    </div>
                  );
                })}

                {filteredMails.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    No received inquiries match your filter.
                  </div>
                )}
              </div>
            </div>

            {/* Selected Mail & Criteria Parser Pane */}
            {selectedMail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Mail Content Card */}
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20 }}>
                  <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: '#111827' }}>
                          {selectedMail.subject}
                        </h2>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>
                          From: <strong style={{ color: '#111827' }}>{selectedMail.sender}</strong> &lt;{selectedMail.from}&gt;
                        </div>
                      </div>
                      <div>
                        <Badge variant={selectedMail.processed ? 'success' : 'warning'}>
                          {selectedMail.processed ? 'Processed & Forwarded' : 'Unprocessed'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Raw email body */}
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#374151', lineHeight: 1.6, background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 6, padding: 14, fontFamily: 'monospace' }}>
                    {selectedMail.body}
                  </div>

                  {/* Action buttons */}
                  <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => handleExtract(selectedMail.id)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 6,
                        border: '1px solid #2563EB',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Filter size={14} />
                      <span>Extract Recruitment Criteria</span>
                    </button>
                    <button
                      onClick={() => handleOpenCompose(selectedMail)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#2563EB',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Send size={14} />
                      <span>Forward / Broadcast to Eligible Students</span>
                    </button>
                  </div>
                </div>

                {/* Candidate Parser Results */}
                {extractedMailId === selectedMail.id && selectedMail.criteria && (
                  <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
                        Automated Criteria Extraction
                      </h3>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: 4 }}>
                        {getEligibleCount(selectedMail.criteria)} Eligible Candidates Found
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
                      <div style={{ background: '#F9FAFB', padding: 10, borderRadius: 6, border: '1px solid #F3F4F6' }}>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>Min CGPA Required</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{selectedMail.criteria.minCgpa}</div>
                      </div>
                      <div style={{ background: '#F9FAFB', padding: 10, borderRadius: 6, border: '1px solid #F3F4F6' }}>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>Allowed Branches</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginTop: 2 }}>
                          {selectedMail.criteria.branches?.join(', ') || 'All'}
                        </div>
                      </div>
                      <div style={{ background: '#F9FAFB', padding: 10, borderRadius: 6, border: '1px solid #F3F4F6' }}>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>Max Active Backlogs</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{selectedMail.criteria.maxBacklogs}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                Select an inquiry from the inbox on the left to read its content.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB 2: SENT STUDENT BROADCASTS (OUTBOX) ======================= */}
      {activeTab === 'sent' && (
        <div>
          {/* Sub Search & Date filter for Sent */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search sent student broadcasts by subject, body, or recipient audience..."
                value={sentSearch}
                onChange={e => setSentSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Calendar size={14} color="#6B7280" />
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Sent Period:</span>
              <button
                onClick={() => setSentDateFilter('all')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: `1px solid ${sentDateFilter === 'all' ? '#2563EB' : '#D1D5DB'}`,
                  background: sentDateFilter === 'all' ? '#EFF6FF' : '#fff',
                  color: sentDateFilter === 'all' ? '#2563EB' : '#374151',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                All Time ({sentMails.length})
              </button>
              <button
                onClick={() => setSentDateFilter('today')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: `1px solid ${sentDateFilter === 'today' ? '#2563EB' : '#D1D5DB'}`,
                  background: sentDateFilter === 'today' ? '#EFF6FF' : '#fff',
                  color: sentDateFilter === 'today' ? '#2563EB' : '#374151',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Today
              </button>
              <button
                onClick={() => setSentDateFilter('7days')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: `1px solid ${sentDateFilter === '7days' ? '#2563EB' : '#D1D5DB'}`,
                  background: sentDateFilter === '7days' ? '#EFF6FF' : '#fff',
                  color: sentDateFilter === '7days' ? '#2563EB' : '#374151',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Past 7 Days
              </button>
              <button
                onClick={() => setSentDateFilter('30days')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: `1px solid ${sentDateFilter === '30days' ? '#2563EB' : '#D1D5DB'}`,
                  background: sentDateFilter === '30days' ? '#EFF6FF' : '#fff',
                  color: sentDateFilter === '30days' ? '#2563EB' : '#374151',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Past 30 Days
              </button>
            </div>
          </div>

          {/* Two-column layout: Sent list on left, Sent detail viewer on right */}
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 16, alignItems: 'start' }}>
            {/* Sent Outbox List */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', fontWeight: 600, fontSize: 13, color: '#111827', background: '#F9FAFB' }}>
                Sent Student Broadcasts ({filteredSentMails.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 600, overflowY: 'auto' }}>
                {filteredSentMails.map(s => {
                  const isSelected = selectedSentMail?.id === s.id;
                  const hasAttachment = Boolean(s.attachmentUrl || s.attachment_url);
                  const attType = s.attachmentType || s.attachment_type;
                  const count = s.recipientCount ?? s.recipient_count ?? 0;
                  const dateFormatted = formatDateTime(s.sentAt || s.sent_at);

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSentMail(s)}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid #F3F4F6',
                        cursor: 'pointer',
                        background: isSelected ? '#EFF6FF' : '#fff',
                        borderLeft: isSelected ? '4px solid #2563EB' : '4px solid transparent',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                          {s.targetSummary || s.target_summary || 'All Students'}
                        </span>
                        <span style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} />
                          <span>{dateFormatted}</span>
                        </span>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.subject}
                      </div>

                      <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 6 }}>
                        {s.body}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                        <span style={{ color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={12} />
                          <span>{count} Students</span>
                        </span>

                        {hasAttachment && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: attType === 'video' ? '#FEE2E2' : '#FEF3C7', color: attType === 'video' ? '#DC2626' : '#D97706', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                            {attType === 'video' ? <Video size={11} /> : <FileText size={11} />}
                            <span style={{ textTransform: 'uppercase' }}>{attType}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredSentMails.length === 0 && (
                  <div style={{ padding: 36, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    No sent broadcasts found for this period. Click "Compose" to send mail.
                  </div>
                )}
              </div>
            </div>

            {/* Selected Sent Broadcast Details Pane */}
            {selectedSentMail ? (
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20 }}>
                <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
                        {selectedSentMail.subject}
                      </h2>
                      <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span>Sent by: <strong style={{ color: '#111827' }}>{selectedSentMail.sender}</strong></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          <span>{formatDateTime(selectedSentMail.sentAt || selectedSentMail.sent_at)}</span>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Users size={13} />
                        <span>{selectedSentMail.recipientCount ?? selectedSentMail.recipient_count ?? 0} Students</span>
                      </span>
                      <span style={{ background: '#F3F4F6', color: '#374151', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                        {selectedSentMail.targetSummary || selectedSentMail.target_summary || 'All Students'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sent Mail Body */}
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#1F2937', lineHeight: 1.7, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: 16, marginBottom: 16 }}>
                  {selectedSentMail.body}
                </div>

                {/* Attachment Preview Section */}
                {(selectedSentMail.attachmentUrl || selectedSentMail.attachment_url) && (
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Paperclip size={14} color="#6366F1" />
                      <span>Attached Material: {selectedSentMail.attachmentName || selectedSentMail.attachment_name || (selectedSentMail.attachmentType === 'video' ? 'Video Attachment (.mp4)' : 'Document (.pdf)')}</span>
                    </div>

                    {/* MP4 Video Player */}
                    {(selectedSentMail.attachmentType === 'video' || selectedSentMail.attachment_type === 'video' || (selectedSentMail.attachmentUrl || selectedSentMail.attachment_url)?.startsWith('data:video')) && (
                      <div style={{ background: '#0F172A', borderRadius: 8, padding: 8 }}>
                        <video
                          controls
                          src={selectedSentMail.attachmentUrl || selectedSentMail.attachment_url}
                          style={{ width: '100%', maxHeight: 280, borderRadius: 6, background: '#000' }}
                        >
                          Your browser does not support HTML5 video.
                        </video>
                      </div>
                    )}

                    {/* PDF Document Embedded Viewer */}
                    {(selectedSentMail.attachmentType === 'pdf' || selectedSentMail.attachment_type === 'pdf' || (selectedSentMail.attachmentUrl || selectedSentMail.attachment_url)?.startsWith('data:application/pdf')) && (
                      <div>
                        <iframe
                          src={selectedSentMail.attachmentUrl || selectedSentMail.attachment_url}
                          style={{ width: '100%', height: 320, border: '1px solid #CBD5E1', borderRadius: 6 }}
                          title="PDF Attachment"
                        />
                      </div>
                    )}

                    <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <a
                        href={selectedSentMail.attachmentUrl || selectedSentMail.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 12,
                          color: '#2563EB',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>Open Attachment in New Tab</span>
                      </a>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    onClick={() => {
                      setComposeForm(prev => ({
                        ...prev,
                        subject: `Follow-up: ${selectedSentMail.subject}`,
                        body: `Dear Students,\n\nFollowing up on our earlier announcement regarding "${selectedSentMail.subject}":\n\n\n\nBest regards,\nUniversity Placement Cell`,
                      }));
                      setShowComposeModal(true);
                    }}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 6,
                      border: '1px solid #2563EB',
                      background: '#EFF6FF',
                      color: '#2563EB',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Send size={13} />
                    <span>Send Follow-up to Same Group</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                Select a sent broadcast from the outbox list on the left to view its delivery details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= COMPOSE / BROADCAST MODAL ======================= */}
      {showComposeModal && (
        <Modal
          isOpen={showComposeModal}
          title="Compose / Send Mail to Students"
          width={740}
          onClose={() => setShowComposeModal(false)}
        >
          <form onSubmit={handleSendMail}>
            {/* Target Criteria Selector */}
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: 12, marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>
                Target Recipients *
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="targetType"
                    value="all"
                    checked={composeForm.targetType === 'all'}
                    onChange={() => setComposeForm(p => ({ ...p, targetType: 'all' }))}
                  />
                  <span>All Registered Students ({students.length})</span>
                </label>

                {selectedMail?.criteria && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="targetType"
                      value="eligible"
                      checked={composeForm.targetType === 'eligible'}
                      onChange={() => setComposeForm(p => ({ ...p, targetType: 'eligible' }))}
                    />
                    <span>Eligible for this Drive ({getEligibleCount(selectedMail.criteria)})</span>
                  </label>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="targetType"
                    value="branch"
                    checked={composeForm.targetType === 'branch'}
                    onChange={() => setComposeForm(p => ({ ...p, targetType: 'branch' }))}
                  />
                  <span>Specific Branch</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="targetType"
                    value="minCgpa"
                    checked={composeForm.targetType === 'minCgpa'}
                    onChange={() => setComposeForm(p => ({ ...p, targetType: 'minCgpa' }))}
                  />
                  <span>Minimum CGPA Filter</span>
                </label>
              </div>

              {composeForm.targetType === 'branch' && (
                <div style={{ marginTop: 8 }}>
                  <select
                    value={composeForm.branch}
                    onChange={e => setComposeForm(p => ({ ...p, branch: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
                  >
                    {ALL_BRANCHES.map(b => (
                      <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>
                    ))}
                  </select>
                </div>
              )}

              {composeForm.targetType === 'minCgpa' && (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="Enter Min CGPA (e.g. 7.5)"
                    value={composeForm.minCgpa}
                    onChange={e => setComposeForm(p => ({ ...p, minCgpa: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #D1D5DB', fontSize: 13 }}
                  />
                </div>
              )}

              <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={13} />
                <span>Total recipients matching criteria: {getTargetRecipients().length} students</span>
              </div>
            </div>

            <FormField label="Email Subject *" required>
              <input
                type="text"
                placeholder="e.g. Campus Placement Drive Announcement..."
                value={composeForm.subject}
                onChange={e => setComposeForm(p => ({ ...p, subject: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                required
              />
            </FormField>

            <FormField label="Email Body & Announcements *" required>
              <textarea
                rows={6}
                placeholder="Write announcement details, eligibility instructions, interview schedules..."
                value={composeForm.body}
                onChange={e => setComposeForm(p => ({ ...p, body: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, lineHeight: 1.5 }}
                required
              />
            </FormField>

            {/* Attachment Section with Upload Percentage Bar */}
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Paperclip size={14} />
                  <span>Attach Video (.mp4) or Document (.pdf)</span>
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setAttachmentTab('upload')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: 'none',
                      background: attachmentTab === 'upload' ? '#2563EB' : 'transparent',
                      color: attachmentTab === 'upload' ? '#fff' : '#6B7280',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachmentTab('link')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: 'none',
                      background: attachmentTab === 'link' ? '#2563EB' : 'transparent',
                      color: attachmentTab === 'link' ? '#fff' : '#6B7280',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Paste Link
                  </button>
                </div>
              </div>

              {attachmentTab === 'upload' ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="video/mp4,application/pdf"
                    onChange={handleFileAttachment}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={attachmentLoading}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 4,
                        border: '1px solid #D1D5DB',
                        background: '#fff',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Upload size={13} />
                      <span>{attachmentLoading ? 'Reading File...' : 'Choose MP4 Video or PDF Document'}</span>
                    </button>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>
                      Supports .mp4 video lectures & .pdf documents
                    </span>
                  </div>

                  {/* Upload Percentage Bar */}
                  {attachmentProgress !== null && (
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 4, padding: 8, marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>Uploading & buffering to database...</span>
                        <span style={{ fontWeight: 700, color: attachmentProgress === 100 ? '#15803D' : '#2563EB' }}>
                          {attachmentProgress}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${attachmentProgress}%`,
                            height: '100%',
                            background: attachmentProgress === 100 ? '#16A34A' : '#2563EB',
                            transition: 'width 0.2s',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Enter external link or cloud storage URL..."
                    value={composeForm.attachmentUrl}
                    onChange={e => setComposeForm(p => ({
                      ...p,
                      attachmentUrl: e.target.value,
                      attachmentType: 'link',
                      attachmentName: 'External Resource Link',
                    }))}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 4, border: '1px solid #D1D5DB', fontSize: 12 }}
                  />
                </div>
              )}

              {attachmentError && (
                <div style={{ color: '#DC2626', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={13} />
                  <span>{attachmentError}</span>
                </div>
              )}

              {/* Ready Attachment Badge */}
              {composeForm.attachmentUrl && (
                <div style={{ marginTop: 10, padding: 10, background: '#fff', border: '1px solid #BBF7D0', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {composeForm.attachmentType === 'video' ? (
                        <Video size={18} color="#DC2626" />
                      ) : (
                        <FileText size={18} color="#D97706" />
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                          {composeForm.attachmentName || (composeForm.attachmentType === 'video' ? 'video-attachment.mp4' : 'document.pdf')}
                        </div>
                        <div style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} />
                          <span>Ready for database persistence & student distribution</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearAttachment}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: '1px solid #FECACA',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowComposeModal(false)}
                style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Send Broadcast to {getTargetRecipients().length} Students
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
