// Mock certificates for Aarav (s1)
const today = new Date('2026-10-09');

export const initialCertificates = [
  {
    id: 'cert1',
    studentId: 's1',
    title: 'AWS Cloud Practitioner',
    issuer: 'Amazon Web Services',
    issueDate: '2025-06-15',
    expiryDate: '2028-06-15',
    skills: ['Cloud Computing', 'AWS', 'EC2', 'S3', 'IAM'],
    status: 'Valid',
    fileName: 'aws-cloud-practitioner.pdf',
  },
  {
    id: 'cert2',
    studentId: 's1',
    title: 'Python for Data Science',
    issuer: 'Coursera (IBM)',
    issueDate: '2025-03-20',
    expiryDate: null, // no expiry
    skills: ['Python', 'Pandas', 'NumPy', 'Data Analysis'],
    status: 'Valid',
    fileName: 'python-data-science.pdf',
  },
  {
    id: 'cert3',
    studentId: 's1',
    title: 'React Developer Certification',
    issuer: 'Meta (Coursera)',
    issueDate: '2024-11-10',
    expiryDate: null,
    skills: ['React', 'JavaScript', 'JSX', 'Hooks', 'Redux'],
    status: 'Valid',
    fileName: 'react-developer.pdf',
  },
  {
    id: 'cert4',
    studentId: 's1',
    title: 'Google Project Management Certificate',
    issuer: 'Google (Coursera)',
    issueDate: '2025-08-05',
    expiryDate: '2026-11-01', // expiring soon (within 60 days from Oct 9 2026)
    skills: ['Project Management', 'Agile', 'Scrum', 'Risk Management'],
    status: 'Expiring soon',
    fileName: 'google-pm.pdf',
  },
  {
    id: 'cert5',
    studentId: 's1',
    title: 'Oracle SQL Expert',
    issuer: 'Oracle',
    issueDate: '2023-09-12',
    expiryDate: '2025-09-12', // already expired
    skills: ['SQL', 'PL/SQL', 'Database Design'],
    status: 'Expired',
    fileName: 'oracle-sql.pdf',
  },
];
