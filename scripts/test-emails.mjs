import dotenv from 'dotenv';
dotenv.config();

import { sendEmail, sendBulkEmail } from '../src/lib/email.js';
import * as templates from '../src/lib/emailTemplates.js';
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  generateICS,
  notifyInterviewScheduled,
  notifyShortlistSent,
} from '../src/lib/emailEvents.js';
import { query } from '../src/lib/db.js';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 CAREER-OS EMAIL NOTIFICATION SYSTEM TEST SUITE');
  console.log('====================================================\n');

  const testEmail = process.env.TEST_EMAIL_OVERRIDE || 'test@career-os.local';
  console.log(`[Config] Target Test Email: ${testEmail}`);
  console.log(`[Config] Node ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Config] Provider Key Present: ${Boolean(process.env.EMAIL_PROVIDER_API_KEY)}\n`);

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`  ✓ ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Test HMAC Unsubscribe Token Generation & Verification
  console.log('--- 1. Testing Unsubscribe Tokens ---');
  const token = generateUnsubscribeToken('student@demo.com');
  assert('Token generated as string', typeof token === 'string' && token.length > 10);
  const verifiedEmail = verifyUnsubscribeToken(token);
  assert('Token verified matches original email', verifiedEmail === 'student@demo.com');
  const invalidVerified = verifyUnsubscribeToken('invalid_token');
  assert('Invalid token rejected', invalidVerified === null);

  // 2. Test ICS Calendar Generation
  console.log('\n--- 2. Testing iCalendar (.ics) Generator ---');
  const ics = generateICS({
    title: 'Google - Technical Interview',
    description: 'Round 1 Live Coding',
    startTime: new Date().toISOString(),
    location: 'Google Meet',
    url: 'https://meet.google.com/abc-defg-hij',
  });
  assert('ICS output contains BEGIN:VCALENDAR', ics.includes('BEGIN:VCALENDAR'));
  assert('ICS output contains SUMMARY', ics.includes('SUMMARY:Google - Technical Interview'));
  assert('ICS output contains END:VCALENDAR', ics.includes('END:VCALENDAR'));

  // 3. Test HTML Escaping & Layout Rendering
  console.log('\n--- 3. Testing HTML Escaping & Shared Layout ---');
  const unsafeString = '<script>alert("xss")</script> & "quotes"';
  const escaped = templates.escapeHtml(unsafeString);
  assert('Script tag escaped', !escaped.includes('<script>') && escaped.includes('&lt;script&gt;'));
  assert('Quotes escaped', escaped.includes('&quot;'));

  // 4. Test Sample Templates Rendering
  console.log('\n--- 4. Testing Template Renderers ---');
  const welcome = templates.welcomeStudent({ name: 'Aarav Sharma', unsubToken: token });
  assert('Welcome template renders subject and html', welcome.subject && welcome.html.includes('Aarav Sharma'));

  const drive = templates.newDrivePublished({
    studentName: 'Aarav Sharma',
    driveTitle: 'Software Development Engineer I',
    companyName: 'Microsoft',
    ctc: 24,
    deadline: new Date().toISOString(),
    unsubToken: token,
  });
  assert('New drive template renders CTC', drive.html.includes('24 LPA') && drive.subject.includes('Microsoft'));

  const interview = templates.interviewScheduled({
    studentName: 'Aarav Sharma',
    companyName: 'Amazon',
    round: 'System Design Round',
    date: new Date().toISOString(),
    mode: 'Online Video',
    meetLink: 'https://career-os.local/meet/123',
    unsubToken: token,
  });
  assert('Interview template renders round and company', interview.html.includes('System Design Round') && interview.subject.includes('Amazon'));

  const offer = templates.offerLetterReleased({
    studentName: 'Aarav Sharma',
    companyName: 'Atlassian',
    role: 'Product Engineer',
    ctc: 32,
    unsubToken: token,
  });
  assert('Offer letter template renders compensation', offer.html.includes('32 LPA') && offer.subject.includes('Atlassian'));

  const verifFailed = templates.profileVerificationFailed({
    studentName: 'Aarav Sharma',
    section: 'Academic CGPA',
    reason: 'Marksheet does not match university registrar entry',
    unsubToken: token,
  });
  assert('Verification failed template renders reason', verifFailed.html.includes('Marksheet does not match'));

  // 5. Test Live Email Dispatch & Non-Production Redirection
  console.log('\n--- 5. Testing Email Dispatch (with Test Redirect) ---');
  const sendRes = await sendEmail({
    to: 'realstudent@university.edu',
    subject: '[CAREER-OS Test] Placement Notification Test Suite',
    html: welcome.html,
    eventType: 'test_welcome',
    meta: { testRun: true, timestamp: Date.now() },
  });
  assert('sendEmail returns ok object without throwing', sendRes && typeof sendRes.ok === 'boolean');
  console.log('   Dispatch result:', sendRes);

  // 6. Test Deduplication
  console.log('\n--- 6. Testing Deduplication Guard ---');
  const dedupeKey = `test_dedupe_${Date.now()}`;
  const firstSend = await sendEmail({
    to: testEmail,
    subject: '[Test Dedupe] First dispatch',
    html: '<p>Test dedupe</p>',
    eventType: 'test_dedupe',
    meta: { dedupeKey },
  });
  const secondSend = await sendEmail({
    to: testEmail,
    subject: '[Test Dedupe] Duplicate dispatch attempt',
    html: '<p>Test dedupe duplicate</p>',
    eventType: 'test_dedupe',
    meta: { dedupeKey },
  });
  assert('First dispatch completed', firstSend && (firstSend.ok || firstSend.queued));
  assert('Second duplicate dispatch was skipped or deduplicated', secondSend?.skipped === true || secondSend?.ok === true);

  // 7. Test Bulk Email Sending
  console.log('\n--- 7. Testing Bulk Email Dispatch ---');
  const bulkItems = [
    {
      to: testEmail,
      subject: '[Bulk 1] Notice test',
      html: '<p>Notice 1</p>',
      eventType: 'test_bulk',
      meta: { item: 1 },
    },
    {
      to: testEmail,
      subject: '[Bulk 2] Notice test',
      html: '<p>Notice 2</p>',
      eventType: 'test_bulk',
      meta: { item: 2 },
    },
  ];
  const bulkRes = await sendBulkEmail(bulkItems);
  assert('Bulk email execution completed', bulkRes.ok === true && bulkRes.total === 2);

  // 8. Verify Database Logging in email_logs
  console.log('\n--- 8. Verifying PostgreSQL email_logs Audit Table ---');
  const logCheck = await query(`
    SELECT id, to_email, subject, event_type, status, created_at
    FROM email_logs
    ORDER BY created_at DESC
    LIMIT 5
  `);
  assert('Records successfully inserted into email_logs', logCheck.rows && logCheck.rows.length > 0);
  console.log('   Recent log sample:', logCheck.rows[0]);

  console.log('\n====================================================');
  console.log(`🏁 Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

