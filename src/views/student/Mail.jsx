import { useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Search,
  Calendar,
  Filter,
  Video,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  Inbox,
  Paperclip,
  CheckCheck
} from 'lucide-react';

export default function StudentMail() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const student = state.students.find(s => s.id === user.studentId) || state.students[0];
  const allNotifs = state.notifications.filter(n => !n.studentId || n.studentId === student?.id);

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'unread' | 'video' | 'pdf'

  const [selectedMailId, setSelectedMailId] = useState(allNotifs[0]?.id || null);

  const filteredMails = useMemo(() => {
    return allNotifs.filter(m => {
      // Search matching
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (m.title || '').toLowerCase().includes(q) ||
        (m.message || '').toLowerCase().includes(q) ||
        (m.attachmentName || '').toLowerCase().includes(q);

      // Type matching
      const isVideo =
        m.attachmentType === 'video' ||
        (m.attachmentUrl && (m.attachmentUrl.includes('.mp4') || m.attachmentUrl.startsWith('data:video/mp4')));
      const isPdf =
        m.attachmentType === 'pdf' ||
        (m.attachmentUrl && (m.attachmentUrl.includes('.pdf') || m.attachmentUrl.startsWith('data:application/pdf')));

      let matchType = true;
      if (typeFilter === 'unread') matchType = !m.read;
      if (typeFilter === 'video') matchType = isVideo;
      if (typeFilter === 'pdf') matchType = isPdf;

      // Date matching
      let matchDate = true;
      if (m.date || m.createdAt) {
        const mailDate = new Date(m.date || m.createdAt);
        const now = new Date();
        if (dateFilter === 'today') {
          matchDate = mailDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchDate = mailDate >= sevenDaysAgo;
        } else if (dateFilter === 'month') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchDate = mailDate >= thirtyDaysAgo;
        } else if (dateFilter === 'custom') {
          if (customFrom) {
            matchDate = matchDate && mailDate >= new Date(customFrom);
          }
          if (customTo) {
            const toEnd = new Date(customTo);
            toEnd.setHours(23, 59, 59, 999);
            matchDate = matchDate && mailDate <= toEnd;
          }
        }
      }

      return matchSearch && matchType && matchDate;
    });
  }, [allNotifs, search, dateFilter, customFrom, customTo, typeFilter]);

  const selectedMail =
    filteredMails.find(m => m.id === selectedMailId) ||
    filteredMails[0] ||
    null;

  function handleSelectMail(mail) {
    setSelectedMailId(mail.id);
    if (!mail.read) {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: mail.id });
    }
  }

  function handleMarkAllRead() {
    dispatch({ type: 'MARK_ALL_READ' });
  }

  const unreadCount = allNotifs.filter(n => !n.read).length;

  return (
    <Layout title="Student Mail & Placement Announcements">
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
            Official University Notices & Recruiter Mails
          </h1>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
            Centralized mailbox for campus drives, eligibility notices, attached orientation videos (.mp4), and official guidelines (.pdf).
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              background: '#fff',
              color: '#374151',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCheck size={14} color="#2563EB" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search mails by keyword, subject, announcement text, or attachment name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                fontSize: 13,
              }}
            />
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="#6B7280" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              <option value="all">All Mails ({allNotifs.length})</option>
              <option value="unread">Unread Only ({unreadCount})</option>
              <option value="video">Has MP4 Video</option>
              <option value="pdf">Has Proper PDF</option>
            </select>
          </div>

          {/* Date / Time Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="#6B7280" />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {dateFilter === 'custom' && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
            <span style={{ color: '#4B5563', fontWeight: 500 }}>From Date:</span>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #D1D5DB' }}
            />
            <span style={{ color: '#4B5563', fontWeight: 500 }}>To Date:</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #D1D5DB' }}
            />
            {(customFrom || customTo) && (
              <button
                onClick={() => { setCustomFrom(''); setCustomTo(''); }}
                style={{ padding: '3px 8px', borderRadius: 4, border: 'none', background: '#F3F4F6', color: '#6B7280', fontSize: 11, cursor: 'pointer' }}
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Two-Column Mailbox View */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Mail List (Left) */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
              Inbox ({filteredMails.length})
            </span>
            <span style={{ fontSize: 11, color: '#6B7280' }}>
              {dateFilter === 'all' ? 'All historical mails' : `Filtered: ${dateFilter}`}
            </span>
          </div>

          <div style={{ maxHeight: 600, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {filteredMails.map(m => {
              const isSelected = selectedMail?.id === m.id;
              const isVideo =
                m.attachmentType === 'video' ||
                (m.attachmentUrl && (m.attachmentUrl.includes('.mp4') || m.attachmentUrl.startsWith('data:video/mp4')));
              const isPdf =
                m.attachmentType === 'pdf' ||
                (m.attachmentUrl && (m.attachmentUrl.includes('.pdf') || m.attachmentUrl.startsWith('data:application/pdf')));

              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMail(m)}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    background: isSelected ? '#EFF6FF' : m.read ? '#fff' : '#F8FAFC',
                    borderLeft: isSelected ? '4px solid #2563EB' : m.read ? '4px solid transparent' : '4px solid #3B82F6',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: m.read ? 500 : 700, color: '#111827' }}>
                        {m.title}
                      </span>
                    </div>
                    {!m.read && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 6 }}>
                    {m.message}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#9CA3AF' }}>
                    <span>{m.date || m.createdAt?.split('T')[0] || 'Recent'}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {isVideo && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#2563EB', fontWeight: 600 }}>
                          <Video size={11} /> MP4
                        </span>
                      )}
                      {isPdf && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#DC2626', fontWeight: 600 }}>
                          <FileText size={11} /> PDF
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredMails.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                <Inbox size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>No mails found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing search keywords or adjusting date range filters.</div>
              </div>
            )}
          </div>
        </div>

        {/* Mail Reading Pane (Right) */}
        {selectedMail ? (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 24 }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 16, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
                    {selectedMail.title}
                  </h2>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    From: <strong style={{ color: '#111827' }}>University Placement & Training Cell</strong> &bull; Student Mailbox
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} />
                    <span>{selectedMail.date || selectedMail.createdAt?.split('T')[0] || 'Recent'}</span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Badge variant={selectedMail.read ? 'neutral' : 'info'}>
                      {selectedMail.read ? 'Read' : 'New Announcement'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: '#374151',
                whiteSpace: 'pre-wrap',
                background: '#F9FAFB',
                border: '1px solid #F3F4F6',
                borderRadius: 6,
                padding: 16,
                marginBottom: 20,
              }}
            >
              {selectedMail.message}
            </div>

            {/* Attached MP4 Video Player */}
            {(selectedMail.attachmentType === 'video' || (selectedMail.attachmentUrl && (selectedMail.attachmentUrl.includes('.mp4') || selectedMail.attachmentUrl.startsWith('data:video/mp4')))) && (
              <div style={{ background: '#0F172A', borderRadius: 8, padding: 16, marginBottom: 20, color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Video size={18} color="#60A5FA" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {selectedMail.attachmentName || 'Placement Briefing Video (.mp4)'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>
                        Stored in Database &bull; High Definition MP4 Stream
                      </div>
                    </div>
                  </div>

                  <a
                    href={selectedMail.attachmentUrl}
                    download={selectedMail.attachmentName || 'orientation-briefing.mp4'}
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
                    <span>Download MP4</span>
                  </a>
                </div>

                <video
                  controls
                  playsInline
                  preload="metadata"
                  src={selectedMail.attachmentUrl}
                  style={{ width: '100%', maxHeight: 380, borderRadius: 6, background: '#000', objectFit: 'contain' }}
                >
                  Your browser does not support HTML5 MP4 playback.
                </video>
              </div>
            )}

            {/* Attached Proper PDF Document */}
            {(selectedMail.attachmentType === 'pdf' || (selectedMail.attachmentUrl && (selectedMail.attachmentUrl.includes('.pdf') || selectedMail.attachmentUrl.startsWith('data:application/pdf')))) && (
              <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={24} color="#DC2626" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#991B1B' }}>
                        {selectedMail.attachmentName || 'Official Placement Policy Document (.pdf)'}
                      </div>
                      <div style={{ fontSize: 12, color: '#B91C1C' }}>
                        Stored in Database &bull; Official Placement Cell Circular
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={selectedMail.attachmentUrl}
                      download={selectedMail.attachmentName || 'placement-document.pdf'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 6,
                        background: '#DC2626',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <Download size={13} />
                      <span>Download PDF</span>
                    </a>
                    <a
                      href={selectedMail.attachmentUrl}
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

                {/* PDF direct embedded preview */}
                {selectedMail.attachmentUrl && selectedMail.attachmentUrl.startsWith('data:application/pdf') && (
                  <iframe
                    src={selectedMail.attachmentUrl}
                    title="PDF Viewer"
                    style={{ width: '100%', height: 450, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}
                  />
                )}
              </div>
            )}

            {/* External Reference Link Fallback */}
            {selectedMail.attachmentType === 'link' && selectedMail.attachmentUrl && (
              <div style={{ padding: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, marginBottom: 16 }}>
                <a
                  href={selectedMail.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563EB', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  <span>Open Attached Resource Link ({selectedMail.attachmentName || selectedMail.attachmentUrl})</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 40, textAlign: 'center', color: '#6B7280' }}>
            <Mail size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Select a mail from the inbox list</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Review details, view attached MP4 video lectures, or download proper PDF documents.</div>
          </div>
        )}
      </div>
    </Layout>
  );
}
