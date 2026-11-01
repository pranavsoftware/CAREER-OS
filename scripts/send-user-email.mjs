import dotenv from 'dotenv';
dotenv.config();

import { Resend } from 'resend';
import { welcomeStudent } from '../src/lib/emailTemplates.js';

async function sendTest() {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  console.log('Using Resend API key:', apiKey.slice(0, 10) + '...');
  
  const resend = new Resend(apiKey);
  const targetEmail = 'raybanpranav27@gmail.com';

  const template = welcomeStudent({
    name: 'Pranav',
    email: targetEmail,
    tempPassword: 'Temp@Pranav2026',
    loginUrl: 'https://career-os.in/login',
  });

  console.log(`Sending email from "CAREER-OS <notifications@career-os.in>" to "${targetEmail}"...`);

  const result = await resend.emails.send({
    from: 'CAREER-OS <notifications@career-os.in>',
    to: targetEmail,
    subject: template.subject,
    html: template.html,
  });

  console.log('\n--- RESEND DISPATCH RESPONSE ---');
  console.log(JSON.stringify(result, null, 2));

  if (result.error) {
    console.error('\n❌ Delivery Failed:', result.error);
    process.exit(1);
  } else {
    console.log('\n🎉 SUCCESS! Email dispatched with ID:', result.data.id);
    process.exit(0);
  }
}

sendTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
