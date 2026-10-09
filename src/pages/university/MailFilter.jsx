import { useState } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';

export default function UniversityMailFilter() {
  const { state, dispatch } = useData();
  const { mails, students } = state;

  const [selectedMail, setSelectedMail] = useState(mails[0] || null);
  const [extractedMailId, setExtractedMailId] = useState(null);
  const [inlineMsg, setInlineMsg] = useState(null);

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

  function handleNotify(mail) {
    if (!mail.criteria) return;

    const eligible = students.filter(s => {
      const matchBranch = !mail.criteria.branches || mail.criteria.branches.includes(s.branch);
      const matchCgpa = s.cgpa >= (mail.criteria.minCgpa || 0);
      const matchBacklog = s.backlogs <= (mail.criteria.maxBacklogs ?? 0);
      return matchBranch && matchCgpa && matchBacklog;
    });

    const todayStr = new Date().toISOString().split('T')[0];

    // Create notifications for each eligible student
    eligible.forEach(s => {
      const notif = {
        id: `notif_${Date.now()}_${s.id}`,
        studentId: s.id,
        title: `Campus Opportunity: ${mail.sender}`,
        message: `Mail from ${mail.sender} detected: you are eligible (CGPA ${s.cgpa} >= ${mail.criteria.minCgpa}, ${s.branch}). Drive floating soon on portal.`,
        date: todayStr,
        read: false,
        source: 'mail_filter',
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: notif });
    });

    // Mark mail as processed
    dispatch({
      type: 'UPDATE_MAIL',
      payload: { id: mail.id, processed: true },
    });

    const aaravEligible = eligible.some(s => s.id === 's1');
    setInlineMsg({
      type: 'success',
      text: `Successfully notified ${eligible.length} eligible student(s)${aaravEligible ? ' (including Aarav Sharma)' : ''}. Mail marked as processed.`,
    });
  }

  return (
    <Layout title="Eligibility Mail Filter & Candidate Parser">
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

      {/* Two-column layout: Inbox list on left, Reading & Parser pane on right */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Mail Inbox List */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', fontWeight: 600, fontSize: 14, color: '#111827' }}>
            Incoming Recruiter Inquiries ({mails.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {mails.map(m => {
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
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{m.sender}</span>
                    {m.processed ? (
                      <Badge variant="success">Processed</Badge>
                    ) : (
                      <Badge variant="warning">New</Badge>
                    )}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.subject}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {m.snippet}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Mail & Criteria Parser Pane */}
        {selectedMail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Mail Content Card */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20 }}>
              <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#111827' }}>
                      {selectedMail.subject}
                    </h2>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      From: <strong>{selectedMail.sender}</strong> ({selectedMail.from})
                    </div>
                  </div>
                  <div>
                    <Badge variant={selectedMail.processed ? 'success' : 'warning'}>
                      {selectedMail.processed ? 'Processed & Notified' : 'Unprocessed'}
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
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Extract criteria
                </button>
              </div>
            </div>

            {/* Extracted Criteria Box */}
            {extractedMailId === selectedMail.id && selectedMail.criteria && (
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                  Parsed Hiring Criteria
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: 12 }}>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>Eligible Branches</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginTop: 2 }}>
                      {selectedMail.criteria.branches.join(', ')}
                    </div>
                  </div>
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: 12 }}>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>Minimum CGPA</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginTop: 2 }}>
                      &ge; {selectedMail.criteria.minCgpa}
                    </div>
                  </div>
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: 12 }}>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>Maximum Backlogs</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginTop: 2 }}>
                      {selectedMail.criteria.maxBacklogs}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 6, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0369A1' }}>
                    Matching Candidate Pool: {getEligibleCount(selectedMail.criteria)} student(s) eligible
                  </div>
                  <div style={{ fontSize: 12, color: '#0284C7', marginTop: 2 }}>
                    Aarav Sharma (B.Tech CSE, CGPA 8.4, 0 backlogs):{' '}
                    <strong>
                      {selectedMail.criteria.minCgpa <= 8.4 && selectedMail.criteria.branches.includes('CSE')
                        ? 'Eligible'
                        : 'Not eligible'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    disabled={selectedMail.processed}
                    onClick={() => handleNotify(selectedMail)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 6,
                      border: 'none',
                      background: selectedMail.processed ? '#9CA3AF' : '#2563EB',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: selectedMail.processed ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {selectedMail.processed ? 'Students already notified' : 'Notify eligible students'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 24, textAlign: 'center', color: '#6B7280' }}>
            Select an email from the inbox list.
          </div>
        )}
      </div>
    </Layout>
  );
}
