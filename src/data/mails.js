// Mock company emails for the mail filter feature
export const initialMails = [
  {
    id: 'm1',
    from: 'campus@zoho.com',
    sender: 'Zoho Campus Relations',
    subject: 'Zoho Campus Drive 2026 - Eligibility Criteria',
    snippet: 'We are pleased to announce our campus recruitment drive for VIT Vellore...',
    body: `Dear Placement Cell,

We are pleased to announce our campus recruitment drive at VIT Vellore for the batch of 2026.

Role: Product Engineer
CTC: 6.5 LPA
Eligible Branches: CSE, IT, ECE
Minimum CGPA: 7.5
Maximum Backlogs: 0

Please share the list of eligible students by February 28, 2026.

Regards,
Zoho Campus Relations Team`,
    receivedAt: '2026-01-10T09:00:00',
    criteria: { branches: ['CSE', 'IT', 'ECE'], minCgpa: 7.5, maxBacklogs: 0 },
    processed: false,
    driveId: 'd3',
  },
  {
    id: 'm2',
    from: 'placement@amazon.in',
    sender: 'Amazon University Relations',
    subject: 'Amazon SDE-1 Campus Hiring - VIT Vellore',
    snippet: 'Amazon is excited to visit VIT for our annual campus hiring program...',
    body: `Dear Dr. Iyer,

Amazon is excited to visit VIT Vellore for our annual campus hiring program for SDE-1 positions.

Role: Software Development Engineer - 1
CTC: 25 LPA
Eligible Branches: CSE, IT
Minimum CGPA: 8.0
Maximum Backlogs: 0
Additional: Strong DSA skills required

Shortlisting to commence by March 15, 2026.

Best regards,
Amazon University Relations`,
    receivedAt: '2026-01-15T11:30:00',
    criteria: { branches: ['CSE', 'IT'], minCgpa: 8.0, maxBacklogs: 0 },
    processed: false,
    driveId: 'd4',
  },
  {
    id: 'm3',
    from: 'talent@freshworks.com',
    sender: 'Freshworks Talent Acquisition',
    subject: 'Freshworks SDE Campus Drive - Interested?',
    snippet: 'Freshworks is growing rapidly and we\'d love to hire from VIT this year...',
    body: `Hi Dr. Iyer,

Freshworks is expanding rapidly and we are keen to hire from VIT Vellore for our SDE roles.

Role: Software Development Engineer
CTC: 12 LPA
Eligible Branches: CSE, IT
Minimum CGPA: 7.5
Maximum Backlogs: 0

Please confirm availability for April 2026.

Thanks,
Freshworks Talent Team`,
    receivedAt: '2026-01-20T14:00:00',
    criteria: { branches: ['CSE', 'IT'], minCgpa: 7.5, maxBacklogs: 0 },
    processed: false,
    driveId: 'd6',
  },
  {
    id: 'm4',
    from: 'hr@accenture-campus.com',
    sender: 'Accenture Campus Team',
    subject: 'Accenture GenC Next - VIT Recruitment Drive',
    snippet: 'Accenture is conducting its GenC Next drive at select institutions...',
    body: `Dear Placement Coordinator,

Accenture is conducting the GenC Next program recruitment at VIT Vellore.

Role: Associate Software Engineer
CTC: 6.5 LPA
Eligible Branches: CSE, IT, ECE, EEE, MECH, CIVIL
Minimum CGPA: 6.0
Maximum Backlogs: 2

We have broad eligibility to reach maximum students.

Warm regards,
Accenture Campus Team`,
    receivedAt: '2026-02-01T10:00:00',
    criteria: { branches: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'], minCgpa: 6.0, maxBacklogs: 2 },
    processed: true,
    driveId: 'd8',
  },
  {
    id: 'm5',
    from: 'campus@cognizant.com',
    sender: 'Cognizant Campus Hiring',
    subject: 'Cognizant GenC Plus - Batch 2026 Drive',
    snippet: 'Cognizant GenC Plus program offers exciting opportunities for engineering graduates...',
    body: `Dear Dr. Meenakshi Iyer,

Cognizant announces its GenC Plus recruitment at VIT Vellore.

Role: Programmer Analyst
CTC: 5.0 LPA
Eligible Branches: CSE, IT, ECE, EEE, MECH
Minimum CGPA: 6.0
Maximum Backlogs: 2

Please share eligible student data at the earliest.

Regards,
Cognizant Campus Hiring`,
    receivedAt: '2026-02-05T09:30:00',
    criteria: { branches: ['CSE', 'IT', 'ECE', 'EEE', 'MECH'], minCgpa: 6.0, maxBacklogs: 2 },
    processed: true,
    driveId: 'd5',
  },
  {
    id: 'm6',
    from: 'university@tcs.com',
    sender: 'TCS Campus Relations',
    subject: 'TCS NQT Special Drive - CGPA 8+ Students',
    snippet: 'TCS is conducting a special National Qualifier Test for high performers...',
    body: `Dear Placement Head,

TCS is running a special NQT drive targeting high performers at VIT Vellore.

Role: Systems Engineer (Special Track)
CTC: 9.0 LPA
Eligible Branches: CSE, IT
Minimum CGPA: 8.0
Maximum Backlogs: 0

Only students with CGPA 8 and above are eligible for this track.

Best,
TCS Campus Relations`,
    receivedAt: '2026-02-10T16:00:00',
    criteria: { branches: ['CSE', 'IT'], minCgpa: 8.0, maxBacklogs: 0 },
    processed: false,
    driveId: null,
  },
];
