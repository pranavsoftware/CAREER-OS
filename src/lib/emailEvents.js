import crypto from 'crypto';
import { query } from './db.js';
import { sendEmail, sendBulkEmail } from './email.js';
import * as templates from './emailTemplates.js';

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || 'careeros_unsub_secret_key_2026';

/**
 * Generate HMAC token for unsubscribe link
 */
export function generateUnsubscribeToken(email) {
  if (!email) return '';
  const hmac = crypto.createHmac('sha256', UNSUBSCRIBE_SECRET).update(email.toLowerCase().trim()).digest('hex');
  return Buffer.from(`${email.toLowerCase().trim()}:${hmac}`).toString('base64url');
}

/**
 * Verify HMAC token from unsubscribe link
 */
export function verifyUnsubscribeToken(token) {
  if (!token) return null;
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const [email, sig] = raw.split(':');
    if (!email || !sig) return null;

    const expected = crypto.createHmac('sha256', UNSUBSCRIBE_SECRET).update(email).digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return email;
    }
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * Check if recipient user opted in to category
 */
async function canReceiveCategory(email, category) {
  if (!email) return false;
  if (!category || category === 'critical' || category === 'auth') return true;

  try {
    const res = await query(
      `SELECT email_preferences FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );
    if (!res.rows || res.rows.length === 0) return true; // Default true if user not found or not opted out

    const prefs = res.rows[0].email_preferences;
    if (!prefs) return true;

    // Check specific toggle
    if (category === 'drives' && prefs.drives === false) return false;
    if (category === 'reminders' && prefs.reminders === false) return false;
    if (category === 'circulars' && prefs.circulars === false) return false;
    if (category === 'marketing' && prefs.marketing === false) return false;

    return true;
  } catch (err) {
    console.error('Error checking email preferences:', err);
    return true;
  }
}

/**
 * Helper to build an iCalendar (.ics) attachment for interviews
 */
export function generateICS({ title, description, startTime, endTime, location, url }) {
  const formatICSDate = (dt) => {
    const d = new Date(dt);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const start = formatICSDate(startTime || new Date());
  const end = formatICSDate(endTime || new Date(Date.now() + 60 * 60 * 1000));
  const now = formatICSDate(new Date());
  const uid = `interview_${Date.now()}_${Math.random().toString(36).slice(2, 9)}@career-os.local`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CAREER-OS//Campus Placement Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title || 'Campus Placement Interview'}`,
    `DESCRIPTION:${description ? description.replace(/\n/g, '\\n') : ''}`,
    `LOCATION:${location || 'CAREER-OS Video Room'}`,
    url ? `URL:${url}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

/* ==========================================================================
   STUDENT EVENT DISPATCHERS
   ========================================================================== */

export async function notifyWelcomeStudent(student, tempPassword) {
  if (!student?.email) return;
  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.welcomeStudent({
    name: student.name,
    email: student.email,
    tempPassword,
    unsubToken,
  });
  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'welcome_student',
    meta: { studentId: student.id, dedupeKey: `welcome_${student.id}_${Date.now()}`, forceDirect: true },
  });
}

export async function notifyNewDrivePublished(drive, eligibleStudents = []) {
  if (!drive || !eligibleStudents.length) return;
  const items = [];

  for (const st of eligibleStudents) {
    if (!st.email) continue;
    const canSend = await canReceiveCategory(st.email, 'drives');
    if (!canSend) continue;

    const unsubToken = generateUnsubscribeToken(st.email);
    const { subject, html } = templates.newDrivePublished({
      studentName: st.name,
      driveTitle: drive.title || drive.role,
      companyName: drive.company,
      ctc: drive.ctc,
      deadline: drive.deadline,
      unsubToken,
    });

    items.push({
      to: st.email,
      subject,
      html,
      eventType: 'new_drive',
      meta: { driveId: drive.id, studentId: st.id, dedupeKey: `drive_${drive.id}_${st.id}` },
    });
  }

  return sendBulkEmail(items);
}

export async function notifyApplicationSubmitted({ student, job, application }) {
  if (!student?.email) return;
  const canSend = await canReceiveCategory(student.email, 'drives');
  if (!canSend) return;

  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.applicationSubmitted({
    studentName: student.name,
    jobTitle: job?.title || job?.role || 'Job',
    companyName: job?.company || 'Company',
    appliedAt: application?.applied_at || application?.created_at,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'application_submitted',
    meta: { applicationId: application?.id, dedupeKey: `app_sub_${application?.id}` },
  });
}

export async function notifyApplicationStatusChanged({ student, job, newStatus, remarks }) {
  if (!student?.email) return;
  const canSend = await canReceiveCategory(student.email, 'drives');
  if (!canSend) return;

  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.applicationStatusChanged({
    studentName: student.name,
    jobTitle: job?.title || job?.role || 'Job',
    companyName: job?.company || 'Company',
    newStatus,
    remarks,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'application_status_changed',
    meta: { studentId: student.id, newStatus, dedupeKey: `app_stat_${student.id}_${job?.id}_${newStatus}` },
  });
}

export async function notifyShortlistSent({ student, job }) {
  if (!student?.email) return;
  const canSend = await canReceiveCategory(student.email, 'drives');
  if (!canSend) return;

  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.shortlistSentToCompany({
    studentName: student.name,
    jobTitle: job?.title || job?.role || 'Job',
    companyName: job?.company || 'Company',
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'shortlist_sent',
    meta: { studentId: student.id, jobId: job?.id, dedupeKey: `shortlist_${job?.id}_${student.id}` },
  });
}

export async function notifyInterviewScheduled({ student, companyName, round, date, time, mode, meetLink }) {
  if (!student?.email) return;
  const canSend = await canReceiveCategory(student.email, 'reminders');
  if (!canSend) return;

  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.interviewScheduled({
    studentName: student.name,
    companyName,
    round,
    date,
    time,
    mode,
    meetLink,
    unsubToken,
  });

  // Generate ICS calendar attachment
  const ics = generateICS({
    title: `${companyName} - ${round} Interview`,
    description: `Campus Interview for ${companyName}. Mode: ${mode || 'Online Video'}. Link: ${meetLink || ''}`,
    startTime: date,
    location: meetLink || 'Online',
    url: meetLink,
  });

  const attachments = [
    {
      filename: 'interview-invite.ics',
      content: Buffer.from(ics).toString('base64'),
    },
  ];

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'interview_scheduled',
    attachments,
    meta: { studentId: student.id, companyName, round, dedupeKey: `interview_${student.id}_${round}_${date}` },
  });
}

export async function notifyInterviewRescheduled({ student, companyName, round, newDate, newTime, reason, meetLink }) {
  if (!student?.email) return;
  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.interviewRescheduled({
    studentName: student.name,
    companyName,
    round,
    newDate,
    newTime,
    reason,
    meetLink,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'interview_rescheduled',
    meta: { studentId: student.id, round, newDate },
  });
}

export async function notifyInterviewCancelled({ student, companyName, round, reason }) {
  if (!student?.email) return;
  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.interviewCancelled({
    studentName: student.name,
    companyName,
    round,
    reason,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'interview_cancelled',
    meta: { studentId: student.id, round, reason, critical: true },
  });
}

export async function notifyInterviewFeedback({ student, companyName, round, overallScore }) {
  if (!student?.email) return;
  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.interviewFeedbackAvailable({
    studentName: student.name,
    companyName,
    round,
    overallScore,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'interview_feedback',
    meta: { studentId: student.id, round, overallScore },
  });
}

export async function notifyOfferLetter({ student, companyName, role, ctc, deadline }) {
  if (!student?.email) return;
  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.offerLetterReleased({
    studentName: student.name,
    companyName,
    role,
    ctc,
    deadline,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'offer_released',
    meta: { studentId: student.id, companyName, role, critical: true, dedupeKey: `offer_${student.id}_${companyName}` },
  });
}

export async function notifyProfileVerified(student) {
  if (!student?.email) return;
  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.profileVerified({
    studentName: student.name,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'profile_verified',
    meta: { studentId: student.id, dedupeKey: `prof_ver_${student.id}` },
  });
}

export async function notifyProfileVerificationFailed(student, section, reason) {
  if (!student?.email) return;
  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.profileVerificationFailed({
    studentName: student.name,
    section,
    reason,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'profile_verification_failed',
    meta: { studentId: student.id, section, critical: true },
  });
}

export async function notifyProfileDiscrepancy(student, section, registryValue, submittedValue) {
  if (!student?.email) return;
  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.profileDiscrepancyFlagged({
    studentName: student.name,
    section,
    registryValue,
    submittedValue,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'profile_discrepancy',
    meta: { studentId: student.id, section, critical: true },
  });
}

export async function notifyNewCircular(circular, recipients = []) {
  if (!circular || !recipients.length) return;
  const items = [];

  for (const st of recipients) {
    if (!st.email) continue;
    const canSend = await canReceiveCategory(st.email, 'circulars');
    if (!canSend) continue;

    const unsubToken = generateUnsubscribeToken(st.email);
    const { subject, html } = templates.newCircular({
      studentName: st.name,
      title: circular.title,
      priority: circular.priority,
      summary: circular.content || circular.summary,
      unsubToken,
    });

    items.push({
      to: st.email,
      subject,
      html,
      eventType: 'new_circular',
      meta: { circularId: circular.id, studentId: st.id, dedupeKey: `circ_${circular.id}_${st.id}` },
    });
  }

  return sendBulkEmail(items);
}

export async function notifyPlacementPassApproved(student, validUntil) {
  if (!student?.email) return;
  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.placementPassApproved({
    studentName: student.name,
    validUntil,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'placement_pass_approved',
    meta: { studentId: student.id },
  });
}

export async function notifyPlacementPassRevoked(student, reason) {
  if (!student?.email) return;
  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.placementPassRevoked({
    studentName: student.name,
    reason,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'placement_pass_revoked',
    meta: { studentId: student.id, critical: true },
  });
}

export async function notifyNewStudyMaterial(material, recipients = []) {
  if (!material || !recipients.length) return;
  const items = [];

  for (const st of recipients) {
    if (!st.email) continue;
    const canSend = await canReceiveCategory(st.email, 'circulars');
    if (!canSend) continue;

    const unsubToken = generateUnsubscribeToken(st.email);
    const { subject, html } = templates.newStudyMaterial({
      studentName: st.name,
      title: material.title,
      subject: material.subject || material.category,
      unsubToken,
    });

    items.push({
      to: st.email,
      subject,
      html,
      eventType: 'study_material',
      meta: { materialId: material.id, studentId: st.id, dedupeKey: `mat_${material.id}_${st.id}` },
    });
  }

  return sendBulkEmail(items);
}

export async function notifyReferralCreated(student, referralCode) {
  if (!student?.email) return;
  const canSend = await canReceiveCategory(student.email, 'marketing');
  if (!canSend) return;

  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.referralCreated({
    studentName: student.name,
    referralCode,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'referral_created',
    meta: { studentId: student.id, referralCode },
  });
}

export async function notifyReferralEarned(student, referredName, rewardAmount) {
  if (!student?.email) return;
  const unsubToken = generateUnsubscribeToken(student.email);
  const { subject, html } = templates.referralEarned({
    studentName: student.name,
    referredName,
    rewardAmount,
    unsubToken,
  });

  return sendEmail({
    to: student.email,
    subject,
    html,
    eventType: 'referral_earned',
    meta: { studentId: student.id, referredName, rewardAmount },
  });
}

/* ==========================================================================
   RECRUITER / COMPANY EVENT DISPATCHERS
   ========================================================================== */

export async function notifyWelcomeRecruiter(recruiter, companyName) {
  if (!recruiter?.email) return;
  const { subject, html } = templates.welcomeRecruiter({
    name: recruiter.name,
    companyName: companyName || 'Partner Employer',
  });

  return sendEmail({
    to: recruiter.email,
    subject,
    html,
    eventType: 'welcome_recruiter',
    meta: { recruiterId: recruiter.id, companyName, dedupeKey: `rec_wel_${recruiter.email}` },
  });
}

export async function notifyJobApproved(job, recruiterEmail, recruiterName) {
  if (!recruiterEmail) return;
  const { subject, html } = templates.jobApprovedByCDC({
    recruiterName: recruiterName || 'Recruiter',
    jobTitle: job.title || job.role,
    companyName: job.company,
  });

  return sendEmail({
    to: recruiterEmail,
    subject,
    html,
    eventType: 'job_approved_cdc',
    meta: { jobId: job.id, dedupeKey: `job_appr_${job.id}` },
  });
}

export async function notifyCDCShortlistReady(job, recruiterEmail, candidateCount) {
  if (!recruiterEmail) return;
  const { subject, html } = templates.cdcShortlistReady({
    recruiterName: 'Recruiter',
    jobTitle: job.title || job.role,
    candidateCount,
  });

  return sendEmail({
    to: recruiterEmail,
    subject,
    html,
    eventType: 'cdc_shortlist_ready',
    meta: { jobId: job.id, candidateCount, dedupeKey: `shortlist_ready_${job.id}` },
  });
}

export async function notifyNewApplicationReceived(recruiterEmail, candidate, job) {
  if (!recruiterEmail) return;
  const { subject, html } = templates.newApplicationReceived({
    recruiterName: 'Recruiter',
    candidateName: candidate.name,
    jobTitle: job.title || job.role,
    cGpa: candidate.cgpa || candidate.gpa,
  });

  return sendEmail({
    to: recruiterEmail,
    subject,
    html,
    eventType: 'new_applicant_recruiter',
    meta: { candidateId: candidate.id, jobId: job.id },
  });
}

export async function notifyStudentAcceptedInterview(recruiterEmail, student, job, round, scheduledAt) {
  if (!recruiterEmail) return;
  const { subject, html } = templates.studentAcceptedInterview({
    recruiterName: 'Recruiter',
    candidateName: student.name,
    jobTitle: job?.title || job?.role || 'Job',
    round,
    scheduledAt,
  });

  return sendEmail({
    to: recruiterEmail,
    subject,
    html,
    eventType: 'interview_accepted',
    meta: { studentId: student.id, round, scheduledAt },
  });
}

export async function notifyStudentRescheduleRequested(recruiterEmail, student, job, round, requestedSlot, reason) {
  if (!recruiterEmail) return;
  const { subject, html } = templates.studentRescheduleRequested({
    recruiterName: 'Recruiter',
    candidateName: student.name,
    jobTitle: job?.title || job?.role || 'Job',
    round,
    requestedSlot,
    reason,
  });

  return sendEmail({
    to: recruiterEmail,
    subject,
    html,
    eventType: 'reschedule_requested',
    meta: { studentId: student.id, round, requestedSlot },
  });
}

export async function notifyInterviewScoreSubmitted(recruiterEmail, student, job, interviewerName, score) {
  if (!recruiterEmail) return;
  const { subject, html } = templates.interviewScoreSubmitted({
    recruiterName: 'Recruiter',
    candidateName: student.name,
    jobTitle: job?.title || job?.role || 'Job',
    interviewerName,
    score,
  });

  return sendEmail({
    to: recruiterEmail,
    subject,
    html,
    eventType: 'interview_score_submitted',
    meta: { studentId: student.id, score },
  });
}

/* ==========================================================================
   UNIVERSITY / PLACEMENT CELL EVENT DISPATCHERS
   ========================================================================== */

export async function notifyNewCompanyRegistration(company, adminEmail) {
  const targetEmail = adminEmail || 'placement@university.edu';
  const { subject, html } = templates.newCompanyRegistration({
    companyName: company.name,
    hrEmail: company.email || company.hr_email || 'hr@partner.com',
  });

  return sendEmail({
    to: targetEmail,
    subject,
    html,
    eventType: 'new_company_registration',
    meta: { companyId: company.id, dedupeKey: `comp_reg_${company.id}` },
  });
}

export async function notifyVerificationQueueThreshold(pendingCount, adminEmail) {
  const targetEmail = adminEmail || 'placement@university.edu';
  const { subject, html } = templates.verificationQueueThreshold({
    pendingCount,
  });

  return sendEmail({
    to: targetEmail,
    subject,
    html,
    eventType: 'verification_threshold',
    meta: { pendingCount, dedupeKey: `thresh_${new Date().toISOString().split('T')[0]}` },
  });
}

export async function notifyDriveDeadlineApproaching(drive, applicantCount, adminEmail) {
  const targetEmail = adminEmail || 'placement@university.edu';
  const { subject, html } = templates.driveDeadlineApproaching({
    driveTitle: drive.title || drive.role,
    deadline: drive.deadline,
    applicantCount,
  });

  return sendEmail({
    to: targetEmail,
    subject,
    html,
    eventType: 'drive_deadline_approaching',
    meta: { driveId: drive.id, dedupeKey: `deadline_${drive.id}` },
  });
}

export async function notifyDailyDigest(digestData, adminEmail) {
  const targetEmail = adminEmail || 'placement@university.edu';
  const { subject, html } = templates.dailyDigest({
    placedToday: digestData.placedToday,
    totalPlaced: digestData.totalPlaced,
    activeDrives: digestData.activeDrives,
    pendingVerifications: digestData.pendingVerifications,
  });

  return sendEmail({
    to: targetEmail,
    subject,
    html,
    eventType: 'daily_digest',
    meta: { date: new Date().toISOString().split('T')[0], dedupeKey: `digest_${new Date().toISOString().split('T')[0]}` },
  });
}

/* ==========================================================================
   ASPIRANT EVENT DISPATCHERS
   ========================================================================== */

export async function notifyWelcomeAspirant(aspirant) {
  if (!aspirant?.email) return;
  const unsubToken = generateUnsubscribeToken(aspirant.email);
  const { subject, html } = templates.welcomeAspirant({
    name: aspirant.name,
    unsubToken,
  });

  return sendEmail({
    to: aspirant.email,
    subject,
    html,
    eventType: 'welcome_aspirant',
    meta: { aspirantId: aspirant.id, dedupeKey: `asp_wel_${aspirant.id}` },
  });
}

export async function notifyCollegePredictionReady(aspirant, score, predictedCount) {
  if (!aspirant?.email) return;
  const unsubToken = generateUnsubscribeToken(aspirant.email);
  const { subject, html } = templates.collegePredictionReady({
    aspirantName: aspirant.name,
    score,
    predictedCount,
    unsubToken,
  });

  return sendEmail({
    to: aspirant.email,
    subject,
    html,
    eventType: 'prediction_ready',
    meta: { aspirantId: aspirant.id, score },
  });
}

export async function notifyCollegeApplicationStatusChanged(application, aspirant, college) {
  if (!aspirant?.email) return;
  const unsubToken = generateUnsubscribeToken(aspirant.email);
  const { subject, html } = templates.collegeApplicationStatusChanged({
    aspirantName: aspirant.name,
    collegeName: college?.name || 'Institution',
    course: application?.course || 'Degree Program',
    status: application?.status || 'Reviewed',
    unsubToken,
  });

  return sendEmail({
    to: aspirant.email,
    subject,
    html,
    eventType: 'college_app_status',
    meta: { applicationId: application?.id, status: application?.status },
  });
}

/* ==========================================================================
   AUTH & SECURITY EVENT DISPATCHERS
   ========================================================================== */

export async function notifyMagicLogin(user, loginLink) {
  if (!user?.email) return;
  const { subject, html } = templates.magicLoginLink({
    name: user.name,
    loginLink,
  });

  return sendEmail({
    to: user.email,
    subject,
    html,
    eventType: 'magic_login',
    meta: { userId: user.id, critical: true },
  });
}

export async function notifyPasswordReset(user, resetLink) {
  if (!user?.email) return;
  const { subject, html } = templates.passwordResetLink({
    name: user.name,
    resetLink,
  });

  return sendEmail({
    to: user.email,
    subject,
    html,
    eventType: 'password_reset',
    meta: { userId: user.id, critical: true },
  });
}

