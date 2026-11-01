const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * Escape HTML to prevent injection in generated email templates
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format timestamp in Asia/Kolkata (IST)
 */
export function formatIST(dateInput) {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d) + ' IST';
  } catch (_) {
    return String(dateInput);
  }
}

/**
 * Core responsive layout wrapper
 */
export function renderEmailLayout({
  title,
  preheader = '',
  heading,
  bodyHtml,
  ctaText,
  ctaUrl,
  secondaryText = '',
  unsubToken = '',
  emailCategory = 'general',
}) {
  const finalCta = ctaUrl && ctaText ? `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px;">
      <tr>
        <td align="center" style="border-radius: 6px; background-color: #2563EB;">
          <a href="${escapeHtml(ctaUrl)}" target="_blank" style="font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; padding: 12px 28px; border-radius: 6px; border: 1px solid #1D4ED8; letter-spacing: 0.2px;">
            ${escapeHtml(ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  const isAuthOrCritical = emailCategory === 'auth' || emailCategory === 'welcome' || emailCategory === 'critical';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: separate; }
    a { color: #2563EB; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .email-card { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A;">
  <span style="display:none;font-size:1px;color: #0F172A;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${escapeHtml(preheader || title)}
  </span>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F172A; padding: 28px 0 36px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px;" class="email-container">
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <div style="text-align: center;">
                <span style="font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #1E40AF;">CAREER-OS</span>
                <span style="display: block; font-size: 12px; color: #64748B; margin-top: 2px; font-weight: 500;">Campus Placement Operating System</span>
              </div>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td class="email-card" style="background-color: #FFFFFF; border-radius: 8px; border: 1px solid #E2E8F0; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              ${heading ? `
                <h1 style="margin: 0 0 18px; font-size: 20px; font-weight: 700; color: #0F172A; line-height: 1.35;">
                  ${escapeHtml(heading)}
                </h1>
              ` : ''}

              <div style="font-size: 14px; line-height: 1.6; color: #334155;">
                ${bodyHtml}
              </div>

              ${finalCta}

              ${secondaryText ? `
                <p style="margin: 16px 0 0; font-size: 12px; color: #64748B; line-height: 1.5;">
                  ${secondaryText}
                </p>
              ` : ''}
            </td>
          </tr>

          <!-- Minimal Footer -->
          <tr>
            <td align="center" style="padding-top: 20px; color: #94A3B8; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0;">Automated campus placement notification from <strong>CAREER-OS</strong>.</p>
              <p style="margin: 4px 0 0;">
                <a href="https://www.career-os.in" style="color: #64748B; text-decoration: underline;">www.career-os.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ==========================================================================
   STUDENT EMAIL TEMPLATES (1 - 19)
   ========================================================================== */

// 1. Welcome / account created
export function welcomeStudent({ name, email, tempPassword, loginUrl = 'https://www.career-os.in/login' }) {
  const title = 'Welcome to CAREER-OS Campus Placement Portal';
  return {
    subject: `Welcome to CAREER-OS, ${name}! Your Campus Placement Credentials Inside`,
    html: renderEmailLayout({
      title,
      heading: `Welcome to the Placement Portal, ${name}!`,
      emailCategory: 'welcome',
      bodyHtml: `
        <p style="margin: 0 0 16px; color: #334155; font-size: 14px; line-height: 1.6;">
          Your student profile has been registered in the University Placement Directory by the Career Development Cell (CDC).
        </p>
        
        <div style="background-color: #0F172A; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <div style="margin-bottom: 14px;">
            <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Registered Email Address</div>
            <div style="font-size: 15px; font-weight: 600; color: #0F172A;">${escapeHtml(email || '')}</div>
          </div>
          
          <div style="margin-bottom: 14px;">
            <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Temporary Password</div>
            <div style="display: inline-block; background-color: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; border-radius: 6px; padding: 6px 14px; font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 700; letter-spacing: 1px;">${escapeHtml(tempPassword || 'demo')}</div>
          </div>

          <div>
            <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Portal Sign-In Address</div>
            <a href="https://www.career-os.in/login" style="font-size: 13px; color: #2563EB; text-decoration: underline;">https://www.career-os.in/login</a>
          </div>
        </div>

        <div style="background-color: #FEF9C3; border: 1px solid #FEF08A; border-left: 4px solid #CA8A04; border-radius: 6px; padding: 14px 16px; margin: 20px 0;">
          <div style="font-size: 13px; font-weight: 700; color: #854D0E; margin-bottom: 6px;">Required Next Steps</div>
          <div style="font-size: 13px; color: #713F12; line-height: 1.5;">
            1. Sign in using your temporary password above and set your permanent password.<br/>
            2. Complete and submit your profile section (Academics, Skills, and Projects) to unlock campus placement drives and AI interview prep.
          </div>
        </div>
      `,
      ctaText: 'Sign In to Student Portal',
      ctaUrl: 'https://www.career-os.in/login',
    }),
  };
}

// 2. New drive published
export function newDrivePublished({ studentName, driveTitle, companyName, ctc, deadline, driveUrl, unsubToken }) {
  const title = `New Drive: ${companyName} - ${driveTitle}`;
  return {
    subject: `[New Campus Drive] ${companyName} is hiring: ${driveTitle} (${ctc} LPA)`,
    html: renderEmailLayout({
      title,
      heading: `New Recruitment Drive Announced: ${companyName}`,
      bodyHtml: `
        <p>Hello ${escapeHtml(studentName)},</p>
        <p>A new campus placement drive matching your department has just been published by the CDC.</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #94A3B8;">Role: <strong style="color: #0F172A;">${escapeHtml(driveTitle)}</strong></p>
          <p style="margin: 0 0 6px; font-size: 13px; color: #94A3B8;">Package: <strong style="color: #2563EB;">${escapeHtml(ctc)} LPA</strong></p>
          <p style="margin: 0; font-size: 13px; color: #94A3B8;">Application Deadline: <strong style="color: #F43F5E;">${formatIST(deadline)}</strong></p>
        </div>
        <p>Review the job requirements and ensure your profile meets the eligibility criteria before applying.</p>
      `,
      ctaText: 'View Drive & Apply',
      ctaUrl: driveUrl || `${APP_URL}/student/drives`,
      unsubToken,
    }),
  };
}

// 3. Application submitted
export function applicationSubmitted({ studentName, jobTitle, companyName, appliedAt, applicationUrl, unsubToken }) {
  return {
    subject: `Application Confirmed: ${jobTitle} at ${companyName}`,
    html: renderEmailLayout({
      title: 'Application Received',
      heading: 'Application Successfully Submitted',
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been recorded by the CDC placement system.</p>
        <p style="font-size: 13px; color: #94A3B8;">Submitted on: ${formatIST(appliedAt || new Date())}</p>
        <p>You will receive email notifications as your application progresses through CDC shortlisting and company evaluation rounds.</p>
      `,
      ctaText: 'Track Application Status',
      ctaUrl: applicationUrl || `${APP_URL}/student/applications`,
      unsubToken,
    }),
  };
}

// 4. Application status changed
export function applicationStatusChanged({ studentName, jobTitle, companyName, newStatus, remarks, statusUrl, unsubToken }) {
  const isPositive = ['Shortlisted', 'Interview Scheduled', 'Offer Released', 'Placed', 'CDC Approved'].includes(newStatus);
  const badgeColor = isPositive ? '#10B981' : '#F43F5E';

  return {
    subject: `Application Update: ${newStatus} - ${jobTitle} (${companyName})`,
    html: renderEmailLayout({
      title: `Application Status: ${newStatus}`,
      heading: `Update on your application with ${companyName}`,
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>The status of your application for <strong>${escapeHtml(jobTitle)}</strong> has been updated to:</p>
        <div style="margin: 16px 0;">
          <span style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 14px;">
            ${escapeHtml(newStatus)}
          </span>
        </div>
        ${remarks ? `
          <div style="background: #F8FAFC; border-left: 4px solid #38BDF8; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Officer / Recruiter Notes:</strong> ${escapeHtml(remarks)}</p>
          </div>
        ` : ''}
      `,
      ctaText: 'View Candidate Dashboard',
      ctaUrl: statusUrl || `${APP_URL}/student/applications`,
      unsubToken,
    }),
  };
}

// 5. Shortlist sent to company
export function shortlistSentToCompany({ studentName, jobTitle, companyName, shortlistUrl, unsubToken }) {
  return {
    subject: `Congratulations! You have been CDC-Shortlisted for ${companyName}`,
    html: renderEmailLayout({
      title: 'CDC Shortlist Endorsement',
      heading: 'You have been shortlisted by the CDC!',
      bodyHtml: `
        <p>Dear ${escapeHtml(studentName)},</p>
        <p>Based on your academic merit, skill taxonomy match, and verified portfolio, the University Placement Cell (CDC) has formally endorsed your profile and forwarded your candidature to <strong>${escapeHtml(companyName)}</strong> for the role of <strong>${escapeHtml(jobTitle)}</strong>.</p>
        <p>Keep your phone reachable and check your portal frequently for interview call schedules.</p>
      `,
      ctaText: 'View Shortlist Details',
      ctaUrl: shortlistUrl || `${APP_URL}/student/applications`,
      unsubToken,
    }),
  };
}

// 6. Interview scheduled
export function interviewScheduled({ studentName, companyName, round, date, time, mode, meetLink, prepUrl, unsubToken }) {
  return {
    subject: `Interview Call: ${companyName} - ${round} Scheduled`,
    html: renderEmailLayout({
      title: 'Interview Scheduled',
      heading: `Interview Invitation from ${companyName}`,
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>Your upcoming recruitment round has been officially scheduled:</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #94A3B8;">Company: <strong style="color: #0F172A;">${escapeHtml(companyName)}</strong></p>
          <p style="margin: 0 0 8px; font-size: 13px; color: #94A3B8;">Round: <strong style="color: #2563EB;">${escapeHtml(round)}</strong></p>
          <p style="margin: 0 0 8px; font-size: 13px; color: #94A3B8;">Date &amp; Time: <strong style="color: #0F172A;">${formatIST(date)} ${escapeHtml(time || '')}</strong></p>
          <p style="margin: 0; font-size: 13px; color: #94A3B8;">Mode: <strong style="color: #0F172A;">${escapeHtml(mode || 'Online Video')}</strong></p>
          ${meetLink ? `
            <p style="margin: 10px 0 0; font-size: 13px;"><a href="${escapeHtml(meetLink)}" target="_blank" style="color: #2563EB; font-weight: 600;">Direct Meeting Link &rarr;</a></p>
          ` : ''}
        </div>
        <p>A calendar invitation (.ics) is linked to this event. Please join 5 minutes before your scheduled slot.</p>
      `,
      ctaText: 'Open Interview Room',
      ctaUrl: prepUrl || meetLink || `${APP_URL}/student/interviews`,
      unsubToken,
    }),
  };
}

// 7. Interview rescheduled
export function interviewRescheduled({ studentName, companyName, round, newDate, newTime, reason, meetLink, prepUrl, unsubToken }) {
  return {
    subject: `Updated Schedule: Interview with ${companyName} Rescheduled`,
    html: renderEmailLayout({
      title: 'Interview Rescheduled',
      heading: `Interview Rescheduled: ${companyName}`,
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>Your interview round for <strong>${escapeHtml(round)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been rescheduled.</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #94A3B8;">New Timing: <strong style="color: #2563EB;">${formatIST(newDate)} ${escapeHtml(newTime || '')}</strong></p>
          ${reason ? `<p style="margin: 0; font-size: 13px; color: #94A3B8;">Reason: <span style="color: #475569;">${escapeHtml(reason)}</span></p>` : ''}
        </div>
      `,
      ctaText: 'View Updated Slot',
      ctaUrl: prepUrl || meetLink || `${APP_URL}/student/interviews`,
      unsubToken,
    }),
  };
}

// 8. Interview cancelled
export function interviewCancelled({ studentName, companyName, round, reason, portalUrl, unsubToken }) {
  return {
    subject: `Notice: Interview Cancelled - ${companyName} (${round})`,
    html: renderEmailLayout({
      title: 'Interview Cancelled',
      heading: 'Interview Cancellation Notice',
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>Your interview round for <strong>${escapeHtml(round)}</strong> with <strong>${escapeHtml(companyName)}</strong> has been cancelled.</p>
        ${reason ? `
          <div style="background: #F8FAFC; border-left: 4px solid #F43F5E; padding: 12px 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
          </div>
        ` : ''}
        <p>If this was due to recruiter availability, a revised schedule will be arranged by the placement team.</p>
      `,
      ctaText: 'Go to Interview Dashboard',
      ctaUrl: portalUrl || `${APP_URL}/student/interviews`,
      unsubToken,
    }),
  };
}

// 9. Interview feedback available
export function interviewFeedbackAvailable({ studentName, companyName, round, overallScore, feedbackUrl, unsubToken }) {
  return {
    subject: `Feedback Available: Your ${round} with ${companyName}`,
    html: renderEmailLayout({
      title: 'Interview Feedback Published',
      heading: 'Evaluator Scorecard & Feedback Published',
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>The recruiter feedback and rubric evaluations for your <strong>${escapeHtml(round)}</strong> with <strong>${escapeHtml(companyName)}</strong> have been submitted.</p>
        ${overallScore ? `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin: 14px 0;">
            <p style="margin: 0; font-size: 13px; color: #94A3B8;">Overall Performance Score: <strong style="color: #2563EB; font-size: 16px;">${escapeHtml(overallScore)}/100</strong></p>
          </div>
        ` : ''}
        <p>Check the breakdown to review strengths and areas for technical improvement.</p>
      `,
      ctaText: 'View Detailed Scorecard',
      ctaUrl: feedbackUrl || `${APP_URL}/student/interviews`,
      unsubToken,
    }),
  };
}

// 10. Offer letter released
export function offerLetterReleased({ studentName, companyName, role, ctc, deadline, offerUrl, unsubToken }) {
  return {
    subject: `Congratulations! Job Offer from ${companyName} (${ctc} LPA)`,
    html: renderEmailLayout({
      title: 'Formal Placement Offer',
      heading: `Congratulations, ${studentName}!`,
      bodyHtml: `
        <p>We are delighted to share that <strong>${escapeHtml(companyName)}</strong> has extended a formal campus placement offer to you for the position of <strong>${escapeHtml(role)}</strong>.</p>
        <div style="background: #F8FAFC; border: 1px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #94A3B8;">Role: <strong style="color: #0F172A;">${escapeHtml(role)}</strong></p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #94A3B8;">Annual Compensation (CTC): <strong style="color: #10B981; font-size: 16px;">${escapeHtml(ctc)} LPA</strong></p>
          ${deadline ? `<p style="margin: 0; font-size: 13px; color: #94A3B8;">Decision Deadline: <strong style="color: #F43F5E;">${formatIST(deadline)}</strong></p>` : ''}
        </div>
        <p>Please review the offer details, terms of employment, and confirm acceptance via the student portal before the deadline.</p>
      `,
      ctaText: 'Review & Accept Offer',
      ctaUrl: offerUrl || `${APP_URL}/student/applications`,
      unsubToken,
    }),
  };
}

// 11. Profile verified
export function profileVerified({ studentName, verifiedAt, profileUrl, unsubToken }) {
  return {
    subject: 'Your University Placement Profile is Fully Verified',
    html: renderEmailLayout({
      title: 'Profile Verification Complete',
      heading: 'Profile Verification Successful',
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>Great news! The university placement cell and registrar have verified your academic records, CGPA, and project portfolio as of ${formatIST(verifiedAt || new Date())}.</p>
        <p>Your profile is now in <strong>Verified</strong> status, granting you full eligibility for all tier-1 campus drives, JD shortlists, and recruiter pipelines.</p>
      `,
      ctaText: 'View Verified Profile',
      ctaUrl: profileUrl || `${APP_URL}/student/profile`,
      unsubToken,
    }),
  };
}

// 12. Profile verification failed
export function profileVerificationFailed({ studentName, section, reason, editUrl, unsubToken }) {
  return {
    subject: 'Action Required: Placement Profile Verification Update Needed',
    html: renderEmailLayout({
      title: 'Profile Verification Review',
      heading: 'Verification Update Needed',
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>During automated registrar synchronization, your profile section <strong>${escapeHtml(section || 'Academic Records')}</strong> could not be verified.</p>
        <div style="background: #F8FAFC; border-left: 4px solid #F43F5E; padding: 12px 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Reason:</strong> ${escapeHtml(reason || 'Data mismatch with registrar database.')}</p>
        </div>
        <p>Please review and submit corrected information so our placement officers can re-verify your standing.</p>
      `,
      ctaText: 'Correct Profile Details',
      ctaUrl: editUrl || `${APP_URL}/student/profile`,
      unsubToken,
    }),
  };
}

// 13. Profile discrepancy flagged
export function profileDiscrepancyFlagged({ studentName, section, registryValue, submittedValue, resolutionUrl, unsubToken }) {
  return {
    subject: 'Discrepancy Alert: University Registry vs Profile Data',
    html: renderEmailLayout({
      title: 'Registry Discrepancy Flagged',
      heading: 'Academic Record Discrepancy Flagged',
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>A discrepancy was identified between your entered details and the University Registry database for <strong>${escapeHtml(section)}</strong>:</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #94A3B8;">Entered in Portal: <strong style="color: #F43F5E;">${escapeHtml(submittedValue)}</strong></p>
          <p style="margin: 0; font-size: 13px; color: #94A3B8;">Official University Registry: <strong style="color: #10B981;">${escapeHtml(registryValue)}</strong></p>
        </div>
        <p>In accordance with university placement guidelines, your profile status has been set to Pending until corrected or reviewed.</p>
      `,
      ctaText: 'Resolve Discrepancy',
      ctaUrl: resolutionUrl || `${APP_URL}/student/profile`,
      unsubToken,
    }),
  };
}

// 14. New circular
export function newCircular({ studentName, title, priority, summary, circularUrl, unsubToken }) {
  const isHigh = priority === 'High' || priority === 'Urgent';
  return {
    subject: `[Placement Notice] ${isHigh ? 'URGENT: ' : ''}${title}`,
    html: renderEmailLayout({
      title: 'Placement Cell Circular',
      heading: escapeHtml(title),
      bodyHtml: `
        <p>Dear ${escapeHtml(studentName)},</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #334155;">${escapeHtml(summary)}</p>
        </div>
        <p>Read the official circular issued by the Placement Directorate for complete details and guidelines.</p>
      `,
      ctaText: 'Read Full Circular',
      ctaUrl: circularUrl || `${APP_URL}/student/circulars`,
      unsubToken,
    }),
  };
}

// 15. Placement pass approved
export function placementPassApproved({ studentName, validUntil, passUrl, unsubToken }) {
  return {
    subject: 'Your Digital Placement Drive Hall Pass is Approved',
    html: renderEmailLayout({
      title: 'Digital Drive Pass Approved',
      heading: 'Campus Drive Hall Pass Ready',
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>Your digital campus placement hall pass has been verified and stamped by the placement officer.</p>
        <p style="font-size: 13px; color: #94A3B8;">Valid through: <strong>${formatIST(validUntil)}</strong></p>
        <p>Present the QR code on your pass at physical drive interview desks or university test centers.</p>
      `,
      ctaText: 'Download Digital Pass',
      ctaUrl: passUrl || `${APP_URL}/student/placement-pass`,
      unsubToken,
    }),
  };
}

// 16. Placement pass revoked
export function placementPassRevoked({ studentName, reason, appealUrl, unsubToken }) {
  return {
    subject: 'Important: Campus Placement Drive Pass Revoked',
    html: renderEmailLayout({
      title: 'Drive Pass Revoked',
      heading: 'Placement Pass Revocation Notice',
      bodyHtml: `
        <p>Dear ${escapeHtml(studentName)},</p>
        <p>Your campus placement pass has been revoked by the placement office.</p>
        ${reason ? `
          <div style="background: #F8FAFC; border-left: 4px solid #F43F5E; padding: 12px 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
          </div>
        ` : ''}
        <p>If you believe this was in error, you may file an appeal through the placement grievance desk.</p>
      `,
      ctaText: 'Submit Grievance Appeal',
      ctaUrl: appealUrl || `${APP_URL}/student/placement-pass`,
      unsubToken,
    }),
  };
}

// 17. New study material
export function newStudyMaterial({ studentName, title, subject, materialUrl, unsubToken }) {
  return {
    subject: `New Resource: ${title} (${subject})`,
    html: renderEmailLayout({
      title: 'New Study Material Published',
      heading: 'New Preparation Resource Added',
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>A new placement preparation guide has been uploaded to the material hub:</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #0F172A;">${escapeHtml(title)}</p>
          <p style="margin: 0; font-size: 13px; color: #2563EB;">Category: ${escapeHtml(subject)}</p>
        </div>
      `,
      ctaText: 'View Preparation Material',
      ctaUrl: materialUrl || `${APP_URL}/student/materials`,
      unsubToken,
    }),
  };
}

// 18. Referral created
export function referralCreated({ studentName, referralCode, referralBonus = '500 Points', inviteUrl, unsubToken }) {
  return {
    subject: `Your CAREER-OS Referral Link is Active (${referralBonus})`,
    html: renderEmailLayout({
      title: 'Referral Link Ready',
      heading: 'Share & Earn Placement Rewards',
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>Your personal peer referral code is ready to share. Invite your classmates and batchmates to onboard on CAREER-OS:</p>
        <div style="background: #F8FAFC; border: 1px dashed #38BDF8; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #94A3B8;">YOUR UNIQUE CODE</p>
          <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #2563EB;">${escapeHtml(referralCode)}</span>
        </div>
        <p>Earn reward credits towards premium interview mock simulations when your peers activate their profiles.</p>
      `,
      ctaText: 'Open Referral Hub',
      ctaUrl: inviteUrl || `${APP_URL}/student/referrals`,
      unsubToken,
    }),
  };
}

// 19. Referral earned
export function referralEarned({ studentName, referredName, rewardAmount, walletUrl, unsubToken }) {
  return {
    subject: `Referral Reward Earned: ${rewardAmount} Credited`,
    html: renderEmailLayout({
      title: 'Referral Reward Credited',
      heading: 'Referral Bonus Unlocked!',
      bodyHtml: `
        <p>Hi ${escapeHtml(studentName)},</p>
        <p>Your peer <strong>${escapeHtml(referredName)}</strong> has verified their profile using your referral code.</p>
        <div style="background: #F8FAFC; border: 1px solid #10B981; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px; color: #94A3B8;">Reward Credited: <strong style="color: #10B981; font-size: 16px;">${escapeHtml(rewardAmount)}</strong></p>
        </div>
      `,
      ctaText: 'View Reward Balance',
      ctaUrl: walletUrl || `${APP_URL}/student/referrals`,
      unsubToken,
    }),
  };
}

/* ==========================================================================
   RECRUITER / COMPANY EMAIL TEMPLATES (20 - 26)
   ========================================================================== */

// 20. Welcome recruiter
export function welcomeRecruiter({ name, companyName, loginUrl = `${APP_URL}/login`, unsubToken }) {
  return {
    subject: `Welcome to CAREER-OS Recruiter Portal - ${companyName}`,
    html: renderEmailLayout({
      title: 'Recruiter Account Activated',
      heading: `Welcome to CAREER-OS, ${name}!`,
      bodyHtml: `
        <p>Your corporate recruiter account for <strong>${escapeHtml(companyName)}</strong> has been activated.</p>
        <p>Through our portal, you can post campus job requisitions, receive CDC-vetted student shortlists, schedule AI and live interviews, and release offers seamlessly.</p>
      `,
      ctaText: 'Access Recruiter Dashboard',
      ctaUrl: loginUrl,
      unsubToken,
    }),
  };
}

// 21. Job approved by CDC
export function jobApprovedByCDC({ recruiterName, jobTitle, companyName, jobUrl, unsubToken }) {
  return {
    subject: `Approved: ${jobTitle} Requisition is Now Active on Campus`,
    html: renderEmailLayout({
      title: 'Campus Job Approved',
      heading: `Job Requisition Approved: ${jobTitle}`,
      bodyHtml: `
        <p>Hello ${escapeHtml(recruiterName)},</p>
        <p>The placement cell (CDC) has reviewed and approved your requisition for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong>.</p>
        <p>Eligible students can now apply, and our automated matching system is ranking top candidates.</p>
      `,
      ctaText: 'View Live Drive',
      ctaUrl: jobUrl || `${APP_URL}/company/pipeline`,
      unsubToken,
    }),
  };
}

// 22. CDC Shortlist ready
export function cdcShortlistReady({ recruiterName, jobTitle, candidateCount, pipelineUrl, unsubToken }) {
  return {
    subject: `CDC Shortlist Ready: ${candidateCount} Verified Candidates for ${jobTitle}`,
    html: renderEmailLayout({
      title: 'CDC Shortlist Endorsed',
      heading: 'Curated Candidate Shortlist Ready',
      bodyHtml: `
        <p>Hello ${escapeHtml(recruiterName)},</p>
        <p>The University Placement Cell has completed its candidate review and forwarded <strong>${candidateCount} endorsed candidates</strong> for your requisition: <strong>${escapeHtml(jobTitle)}</strong>.</p>
        <p>Each profile includes verified CGPA, skill overlap scores, and repository links ready for evaluation.</p>
      `,
      ctaText: 'Review Candidate Pipeline',
      ctaUrl: pipelineUrl || `${APP_URL}/company/pipeline`,
      unsubToken,
    }),
  };
}

// 23. New application received
export function newApplicationReceived({ recruiterName, candidateName, jobTitle, cGpa, candidateUrl, unsubToken }) {
  return {
    subject: `New Application: ${candidateName} for ${jobTitle}`,
    html: renderEmailLayout({
      title: 'New Applicant Received',
      heading: 'New Candidate Applied',
      bodyHtml: `
        <p>Hello ${escapeHtml(recruiterName)},</p>
        <p>A new eligible candidate has applied for <strong>${escapeHtml(jobTitle)}</strong>:</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #94A3B8;">Candidate: <strong style="color: #0F172A;">${escapeHtml(candidateName)}</strong></p>
          <p style="margin: 0; font-size: 13px; color: #94A3B8;">Verified CGPA: <strong style="color: #2563EB;">${escapeHtml(cGpa)}</strong></p>
        </div>
      `,
      ctaText: 'View Applicant Profile',
      ctaUrl: candidateUrl || `${APP_URL}/company/pipeline`,
      unsubToken,
    }),
  };
}

// 24. Student accepted interview
export function studentAcceptedInterview({ recruiterName, candidateName, jobTitle, round, scheduledAt, pipelineUrl, unsubToken }) {
  return {
    subject: `Slot Confirmed: ${candidateName} accepted interview for ${jobTitle}`,
    html: renderEmailLayout({
      title: 'Interview Slot Confirmed',
      heading: 'Candidate Confirmed Interview Slot',
      bodyHtml: `
        <p>Hello ${escapeHtml(recruiterName)},</p>
        <p><strong>${escapeHtml(candidateName)}</strong> has confirmed attendance for the <strong>${escapeHtml(round)}</strong> interview round for <strong>${escapeHtml(jobTitle)}</strong>.</p>
        <p style="font-size: 13px; color: #94A3B8;">Slot: <strong style="color: #0F172A;">${formatIST(scheduledAt)}</strong></p>
      `,
      ctaText: 'View Interview Schedule',
      ctaUrl: pipelineUrl || `${APP_URL}/company/interviews`,
      unsubToken,
    }),
  };
}

// 25. Student reschedule requested
export function studentRescheduleRequested({ recruiterName, candidateName, jobTitle, round, requestedSlot, reason, rescheduleUrl, unsubToken }) {
  return {
    subject: `Reschedule Request: ${candidateName} (${jobTitle})`,
    html: renderEmailLayout({
      title: 'Interview Reschedule Request',
      heading: 'Candidate Reschedule Request',
      bodyHtml: `
        <p>Hello ${escapeHtml(recruiterName)},</p>
        <p>Candidate <strong>${escapeHtml(candidateName)}</strong> has requested to reschedule their <strong>${escapeHtml(round)}</strong> interview for <strong>${escapeHtml(jobTitle)}</strong>.</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #94A3B8;">Proposed Slot: <strong style="color: #2563EB;">${escapeHtml(requestedSlot)}</strong></p>
          ${reason ? `<p style="margin: 0; font-size: 13px; color: #94A3B8;">Reason: <span style="color: #475569;">${escapeHtml(reason)}</span></p>` : ''}
        </div>
      `,
      ctaText: 'Review & Respond to Request',
      ctaUrl: rescheduleUrl || `${APP_URL}/company/interviews`,
      unsubToken,
    }),
  };
}

// 26. Interview score submitted
export function interviewScoreSubmitted({ recruiterName, candidateName, jobTitle, interviewerName, score, scorecardUrl, unsubToken }) {
  return {
    subject: `Scorecard Filed: ${candidateName} - ${jobTitle} (${score}/100)`,
    html: renderEmailLayout({
      title: 'Interview Evaluation Submitted',
      heading: 'Interviewer Scorecard Logged',
      bodyHtml: `
        <p>Hello ${escapeHtml(recruiterName)},</p>
        <p>Interviewer <strong>${escapeHtml(interviewerName || 'Panelist')}</strong> has completed evaluation for <strong>${escapeHtml(candidateName)}</strong> on <strong>${escapeHtml(jobTitle)}</strong>.</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin: 14px 0;">
          <p style="margin: 0; font-size: 13px; color: #94A3B8;">Rubric Score: <strong style="color: #2563EB; font-size: 16px;">${escapeHtml(score)}/100</strong></p>
        </div>
      `,
      ctaText: 'Inspect Full Scorecard',
      ctaUrl: scorecardUrl || `${APP_URL}/company/pipeline`,
      unsubToken,
    }),
  };
}

/* ==========================================================================
   UNIVERSITY / PLACEMENT CELL EMAIL TEMPLATES (27 - 30)
   ========================================================================== */

// 27. New company registration
export function newCompanyRegistration({ universityAdminName = 'Placement Officer', companyName, hrEmail, reviewUrl, unsubToken }) {
  return {
    subject: `[Partner Intake] New Corporate Registration: ${companyName}`,
    html: renderEmailLayout({
      title: 'New Recruiter Registration',
      heading: `Company Registration: ${companyName}`,
      bodyHtml: `
        <p>Hello ${escapeHtml(universityAdminName)},</p>
        <p>A new recruiting company <strong>${escapeHtml(companyName)}</strong> has submitted registration credentials on the placement portal.</p>
        <p style="font-size: 13px; color: #94A3B8;">HR Contact: <strong>${escapeHtml(hrEmail)}</strong></p>
        <p>Please verify corporate credentials and approve their placement partnership agreement.</p>
      `,
      ctaText: 'Review Company Registration',
      ctaUrl: reviewUrl || `${APP_URL}/university/companies`,
      unsubToken,
    }),
  };
}

// 28. Verification queue threshold
export function verificationQueueThreshold({ universityAdminName = 'Placement Team', pendingCount, queueUrl, unsubToken }) {
  return {
    subject: `Action Required: ${pendingCount} Student Profiles Pending Verification`,
    html: renderEmailLayout({
      title: 'Verification Queue Alert',
      heading: 'Pending Verification Queue Threshold Exceeded',
      bodyHtml: `
        <p>Hello ${escapeHtml(universityAdminName)},</p>
        <p>The student profile verification queue currently has <strong>${pendingCount} profiles</strong> awaiting registrar review.</p>
        <p>Run automated registry sync to clear pending student discrepancies.</p>
      `,
      ctaText: 'Open Verification Desk',
      ctaUrl: queueUrl || `${APP_URL}/university/records-import`,
      unsubToken,
    }),
  };
}

// 29. Drive deadline approaching
export function driveDeadlineApproaching({ universityAdminName = 'Placement Team', driveTitle, deadline, applicantCount, driveUrl, unsubToken }) {
  return {
    subject: `Reminder: Campus Drive Closing Soon - ${driveTitle}`,
    html: renderEmailLayout({
      title: 'Drive Deadline Approaching',
      heading: `Drive Deadline Approaching: ${driveTitle}`,
      bodyHtml: `
        <p>Hello ${escapeHtml(universityAdminName)},</p>
        <p>The application window for <strong>${escapeHtml(driveTitle)}</strong> will close within 24 hours on <strong>${formatIST(deadline)}</strong>.</p>
        <p style="font-size: 13px; color: #94A3B8;">Current Applicant Count: <strong style="color: #2563EB;">${applicantCount} students</strong></p>
      `,
      ctaText: 'Inspect Drive Details',
      ctaUrl: driveUrl || `${APP_URL}/university/drives`,
      unsubToken,
    }),
  };
}

// 30. Daily digest
export function dailyDigest({ universityAdminName = 'Placement Cell', date, placedToday, totalPlaced, activeDrives, pendingVerifications, digestUrl, unsubToken }) {
  return {
    subject: `Daily Placement Digest - ${formatIST(date || new Date()).split(',')[0]}`,
    html: renderEmailLayout({
      title: 'Daily Campus Placement Digest',
      heading: 'Placement Operations Summary',
      bodyHtml: `
        <p>Good morning ${escapeHtml(universityAdminName)},</p>
        <p>Here is your daily operational summary across the placement directorate:</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #94A3B8;">Offers Logged Today: <strong style="color: #10B981; font-size: 15px;">${placedToday || 0}</strong></p>
          <p style="margin: 0 0 8px; font-size: 13px; color: #94A3B8;">Cumulative Placed Students: <strong style="color: #2563EB;">${totalPlaced || 0}</strong></p>
          <p style="margin: 0 0 8px; font-size: 13px; color: #94A3B8;">Active Recruitment Drives: <strong style="color: #0F172A;">${activeDrives || 0}</strong></p>
          <p style="margin: 0; font-size: 13px; color: #94A3B8;">Pending Registrar Verifications: <strong style="color: #F43F5E;">${pendingVerifications || 0}</strong></p>
        </div>
      `,
      ctaText: 'Open University Dashboard',
      ctaUrl: digestUrl || `${APP_URL}/university/dashboard`,
      unsubToken,
    }),
  };
}

/* ==========================================================================
   ASPIRANT EMAIL TEMPLATES (31 - 33)
   ========================================================================== */

// 31. Welcome aspirant
export function welcomeAspirant({ name, loginUrl = `${APP_URL}/aspirant/explore`, unsubToken }) {
  return {
    subject: `Welcome to CAREER-OS College Predictor, ${name}!`,
    html: renderEmailLayout({
      title: 'Welcome Aspirant',
      heading: `Welcome, ${name}!`,
      bodyHtml: `
        <p>Thank you for signing up for the CAREER-OS College Selection &amp; Admission Predictor.</p>
        <p>Enter your 12th board marks, state of domicile, and preferred engineering / management branches to generate real-time admission feasibility reports across accredited colleges.</p>
      `,
      ctaText: 'Explore College Predictor',
      ctaUrl: loginUrl,
      unsubToken,
    }),
  };
}

// 32. College prediction ready
export function collegePredictionReady({ aspirantName, score, predictedCount, exploreUrl, unsubToken }) {
  return {
    subject: `Your College Admission Prediction is Ready (${predictedCount} Matches)`,
    html: renderEmailLayout({
      title: 'Prediction Complete',
      heading: 'College Admission Report Generated',
      bodyHtml: `
        <p>Hi ${escapeHtml(aspirantName)},</p>
        <p>Based on your 12th percentage score of <strong>${escapeHtml(score)}%</strong>, our engine has calculated your admission odds across universities:</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px; color: #2563EB; font-weight: 700;">${predictedCount} Recommended Institutes Identified</p>
        </div>
      `,
      ctaText: 'View Predicted Colleges',
      ctaUrl: exploreUrl || `${APP_URL}/aspirant/explore`,
      unsubToken,
    }),
  };
}

// 33. College application status changed
export function collegeApplicationStatusChanged({ aspirantName, collegeName, course, status, statusUrl, unsubToken }) {
  return {
    subject: `Application Update: ${status} - ${collegeName} (${course})`,
    html: renderEmailLayout({
      title: 'College Application Update',
      heading: `Application Status: ${collegeName}`,
      bodyHtml: `
        <p>Hi ${escapeHtml(aspirantName)},</p>
        <p>Your admission enquiry application for <strong>${escapeHtml(course)}</strong> at <strong>${escapeHtml(collegeName)}</strong> has been updated to:</p>
        <div style="margin: 16px 0;">
          <span style="display: inline-block; background-color: #2563EB; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 14px;">
            ${escapeHtml(status)}
          </span>
        </div>
      `,
      ctaText: 'Check Application Tracker',
      ctaUrl: statusUrl || `${APP_URL}/aspirant/my-applications`,
      unsubToken,
    }),
  };
}

/* ==========================================================================
   AUTH / SECURITY EMAIL TEMPLATES (34 - 35)
   ========================================================================== */

// 34. Magic login link
export function magicLoginLink({ name = 'User', loginLink, expiresInMinutes = 15 }) {
  return {
    subject: 'Your CAREER-OS Instant Login Link',
    html: renderEmailLayout({
      title: 'Instant Login Link',
      heading: 'Instant One-Click Login',
      bodyHtml: `
        <p>Hello ${escapeHtml(name)},</p>
        <p>Click the button below to securely sign in to your CAREER-OS account without typing a password.</p>
        <p style="font-size: 13px; color: #94A3B8;">This link will expire in ${expiresInMinutes} minutes and can only be used once.</p>
      `,
      ctaText: 'Sign In to CAREER-OS',
      ctaUrl: loginLink,
      secondaryText: 'If you did not request this login link, you can safely ignore this email.',
    }),
  };
}

// 35. Password reset link
export function passwordResetLink({ name = 'User', resetLink, expiresInMinutes = 30 }) {
  return {
    subject: 'Reset Your CAREER-OS Account Password',
    html: renderEmailLayout({
      title: 'Password Reset Request',
      heading: 'Password Reset Request',
      bodyHtml: `
        <p>Hello ${escapeHtml(name)},</p>
        <p>We received a request to reset the password for your CAREER-OS portal account.</p>
        <p style="font-size: 13px; color: #94A3B8;">This link is valid for ${expiresInMinutes} minutes.</p>
      `,
      ctaText: 'Reset Password',
      ctaUrl: resetLink,
      secondaryText: 'If you did not make this request, please contact your university placement administrator immediately.',
    }),
  };
}

/* ==========================================================================
   CERTIFICATE VERIFICATION SYSTEM TEMPLATES (36 - 41)
   ========================================================================== */

export function certAutoVerified({ studentName, certTitle, issuer, skills = [] }) {
  const body = `
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #374151;">
      Hello <strong>${escapeHtml(studentName)}</strong>,
    </p>
    <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 18px; margin: 16px 0 24px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; color: #166534; font-weight: 700;">
        Certificate Verified by Issuer
      </h3>
      <p style="margin: 0; font-size: 13px; color: #15803D; line-height: 20px;">
        Your credential <strong>"${escapeHtml(certTitle)}"</strong> from <strong>${escapeHtml(issuer)}</strong> has been verified directly against issuer registries.
      </p>
    </div>
    <p style="margin: 0 0 14px; font-size: 14px; line-height: 22px; color: #374151;">
      <strong>What this means for your placements:</strong>
    </p>
    <ul style="margin: 0 0 20px 20px; padding: 0; font-size: 13px; color: #4B5563; line-height: 22px;">
      <li>This certificate now carries the green <strong>Issuer Verified</strong> trust badge.</li>
      <li>It is now active and directly visible to enterprise recruiters and hiring managers.</li>
      <li>Skills verified by this credential have been credited to your campus ATS matching score.</li>
    </ul>
  `;

  return {
    subject: `Certificate Verified: ${certTitle} (${issuer})`,
    html: renderEmailLayout({
      title: 'Certificate Verified',
      preheader: `Your ${certTitle} certificate is verified and visible to recruiters`,
      heading: 'Credential Verified Successfully',
      bodyHtml: body,
      ctaText: 'View My Certificates',
      ctaUrl: `${APP_URL}/student/certificates`,
      emailCategory: 'critical',
    }),
  };
}

export function certSentToReview({ studentName, certTitle, issuer, reasons }) {
  const body = `
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #374151;">
      Hello <strong>${escapeHtml(studentName)}</strong>,
    </p>
    <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; padding: 18px; margin: 16px 0 24px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; color: #92400E; font-weight: 700;">
        Certificate Queued for Placement Cell Review
      </h3>
      <p style="margin: 0; font-size: 13px; color: #B45309; line-height: 20px;">
        Your certificate <strong>"${escapeHtml(certTitle)}"</strong> from <strong>${escapeHtml(issuer)}</strong> has been uploaded and queued for manual verification by your university placement officer.
      </p>
      ${reasons ? `<p style="margin: 10px 0 0; font-size: 12px; color: #78350F;"><em>Note: ${escapeHtml(reasons)}</em></p>` : ''}
    </div>
    <p style="margin: 0 0 14px; font-size: 14px; line-height: 22px; color: #374151;">
      Certificates are usually reviewed within <strong>2 working days</strong>. Once approved by the placement cell, it will immediately unlock recruiter visibility and ATS skill credit.
    </p>
  `;

  return {
    subject: `Certificate Queued for Review: ${certTitle}`,
    html: renderEmailLayout({
      title: 'Certificate Under Review',
      preheader: `Your ${certTitle} certificate is under placement cell review`,
      heading: 'Verification in Progress',
      bodyHtml: body,
      ctaText: 'Check Review Status',
      ctaUrl: `${APP_URL}/student/certificates`,
      emailCategory: 'critical',
    }),
  };
}

export function certApprovedByOfficer({ studentName, certTitle, issuer, remark }) {
  const body = `
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #374151;">
      Hello <strong>${escapeHtml(studentName)}</strong>,
    </p>
    <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 18px; margin: 16px 0 24px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; color: #166534; font-weight: 700;">
        Certificate Approved by Placement Directorate
      </h3>
      <p style="margin: 0; font-size: 13px; color: #15803D; line-height: 20px;">
        Your university placement cell has approved <strong>"${escapeHtml(certTitle)}"</strong> (${escapeHtml(issuer)}).
      </p>
      ${remark ? `<p style="margin: 10px 0 0; font-size: 12px; color: #166534;"><strong>Officer Remarks:</strong> ${escapeHtml(remark)}</p>` : ''}
    </div>
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #374151;">
      This credential now carries the <strong>Placement Cell Verified</strong> trust seal and is visible on your profile to campus recruiters.
    </p>
  `;

  return {
    subject: `Certificate Approved: ${certTitle}`,
    html: renderEmailLayout({
      title: 'Certificate Approved',
      preheader: `Your placement cell approved ${certTitle}`,
      heading: 'Certificate Approved by University',
      bodyHtml: body,
      ctaText: 'View Approved Certificate',
      ctaUrl: `${APP_URL}/student/certificates`,
      emailCategory: 'critical',
    }),
  };
}

export function certRejectedByOfficer({ studentName, certTitle, issuer, remark }) {
  const body = `
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #374151;">
      Hello <strong>${escapeHtml(studentName)}</strong>,
    </p>
    <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 18px; margin: 16px 0 24px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; color: #991B1B; font-weight: 700;">
        Certificate Not Approved
      </h3>
      <p style="margin: 0 0 8px; font-size: 13px; color: #B91C1C; line-height: 20px;">
        Your certificate <strong>"${escapeHtml(certTitle)}"</strong> was reviewed by the placement cell and could not be verified.
      </p>
      <p style="margin: 0; font-size: 13px; color: #991B1B;">
        <strong>Officer Remark:</strong> ${escapeHtml(remark || 'Provided document could not be authenticated against issuer registry.')}
      </p>
    </div>
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #374151;">
      <strong>Action Required:</strong> Please check that your certificate has a valid verification URL or QR code, verify your registered student name matches the document, and re-upload with official credentials.
    </p>
  `;

  return {
    subject: `Certificate Verification Update: ${certTitle}`,
    html: renderEmailLayout({
      title: 'Certificate Verification Update',
      preheader: `Update on verification for ${certTitle}`,
      heading: 'Certificate Verification Notice',
      bodyHtml: body,
      ctaText: 'Review My Certificates',
      ctaUrl: `${APP_URL}/student/certificates`,
      emailCategory: 'critical',
    }),
  };
}

export function certFlaggedAlert({ officerName = 'Placement Officer', studentName, regNo, certTitle, issuer, reason }) {
  const body = `
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #374151;">
      Dear <strong>${escapeHtml(officerName)}</strong>,
    </p>
    <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 18px; margin: 16px 0 24px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; color: #991B1B; font-weight: 700;">
        Security Alert: Certificate Flagged for Discrepancy
      </h3>
      <p style="margin: 0 0 8px; font-size: 13px; color: #B91C1C; line-height: 20px;">
        A certificate uploaded by student <strong>${escapeHtml(studentName)}</strong> (${escapeHtml(regNo)}) was flagged during automated registry verification.
      </p>
      <p style="margin: 0; font-size: 13px; color: #991B1B;">
        <strong>Flag Reason:</strong> ${escapeHtml(reason)}
      </p>
    </div>
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #374151;">
      Certificate: <strong>${escapeHtml(certTitle)}</strong> (${escapeHtml(issuer)})<br />
      This certificate is currently blocked from recruiter visibility and CDC shortlist scoring. Please review the document in the Certificate Review queue.
    </p>
  `;

  return {
    subject: `[ALERT] Certificate Flagged: ${studentName} (${regNo})`,
    html: renderEmailLayout({
      title: 'Certificate Security Alert',
      preheader: `Flagged certificate uploaded by ${studentName}`,
      heading: 'Certificate Security Review Required',
      bodyHtml: body,
      ctaText: 'Open Review Queue',
      ctaUrl: `${APP_URL}/university/certificate-review`,
      emailCategory: 'critical',
    }),
  };
}

export function certRevokedAlert({ studentName, certTitle, issuer }) {
  const body = `
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #374151;">
      Hello <strong>${escapeHtml(studentName)}</strong>,
    </p>
    <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 18px; margin: 16px 0 24px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; color: #991B1B; font-weight: 700;">
        Credential Revoked or Invalidated by Issuer
      </h3>
      <p style="margin: 0; font-size: 13px; color: #B91C1C; line-height: 20px;">
        During automated audit re-verification, your credential <strong>"${escapeHtml(certTitle)}"</strong> was flagged as revoked or no longer active on <strong>${escapeHtml(issuer)}</strong> records.
      </p>
    </div>
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #374151;">
      This certificate has been suspended from active campus recruitment filters and queued for placement officer review.
    </p>
  `;

  return {
    subject: `Notice: Credential Revoked on Issuer Registry (${certTitle})`,
    html: renderEmailLayout({
      title: 'Credential Revocation Notice',
      preheader: `Credential ${certTitle} was marked revoked by ${issuer}`,
      heading: 'Credential Status Notice',
      bodyHtml: body,
      ctaText: 'View Certificate Details',
      ctaUrl: `${APP_URL}/student/certificates`,
      emailCategory: 'critical',
    }),
  };
}


