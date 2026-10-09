/**
 * Mock OCR: derives certificate details from filename keywords.
 * No real OCR library used.
 */

const ocrDatabase = {
  aws: {
    title: 'AWS Cloud Practitioner',
    issuer: 'Amazon Web Services',
    skills: ['Cloud Computing', 'AWS', 'EC2', 'S3', 'IAM'],
    issueDate: '2026-03-15',
    expiryDate: '2029-03-15',
  },
  azure: {
    title: 'Microsoft Azure Fundamentals (AZ-900)',
    issuer: 'Microsoft',
    skills: ['Azure', 'Cloud Computing', 'Virtual Machines', 'Azure Storage'],
    issueDate: '2026-02-10',
    expiryDate: '2028-02-10',
  },
  python: {
    title: 'Python for Data Science and AI',
    issuer: 'IBM (Coursera)',
    skills: ['Python', 'Pandas', 'NumPy', 'Jupyter', 'Data Analysis'],
    issueDate: '2026-01-20',
    expiryDate: null,
  },
  react: {
    title: 'React Developer Certification',
    issuer: 'Meta (Coursera)',
    skills: ['React', 'JavaScript', 'JSX', 'Hooks', 'Context API'],
    issueDate: '2026-01-10',
    expiryDate: null,
  },
  javascript: {
    title: 'JavaScript Algorithms and Data Structures',
    issuer: 'freeCodeCamp',
    skills: ['JavaScript', 'Algorithms', 'Data Structures', 'ES6'],
    issueDate: '2025-12-01',
    expiryDate: null,
  },
  java: {
    title: 'Java SE 11 Developer Certification',
    issuer: 'Oracle',
    skills: ['Java', 'OOP', 'Collections', 'Streams', 'JVM'],
    issueDate: '2026-02-28',
    expiryDate: '2028-02-28',
  },
  sql: {
    title: 'SQL and Relational Databases',
    issuer: 'IBM (Coursera)',
    skills: ['SQL', 'Database Design', 'Joins', 'Aggregations'],
    issueDate: '2025-11-15',
    expiryDate: null,
  },
  google: {
    title: 'Google Data Analytics Certificate',
    issuer: 'Google (Coursera)',
    skills: ['Data Analysis', 'SQL', 'Tableau', 'R', 'Spreadsheets'],
    issueDate: '2026-03-01',
    expiryDate: '2027-03-01',
  },
  docker: {
    title: 'Docker Certified Associate',
    issuer: 'Docker Inc.',
    skills: ['Docker', 'Containers', 'Docker Compose', 'Kubernetes basics'],
    issueDate: '2026-01-05',
    expiryDate: '2028-01-05',
  },
  machine_learning: {
    title: 'Machine Learning Specialization',
    issuer: 'DeepLearning.AI (Coursera)',
    skills: ['Machine Learning', 'Python', 'TensorFlow', 'Neural Networks'],
    issueDate: '2026-02-14',
    expiryDate: null,
  },
};

/**
 * Extract details from a filename using keyword matching.
 * Returns a mock "OCR" result.
 */
export function mockOcr(filename) {
  const lower = filename.toLowerCase().replace(/[^a-z0-9]/g, '_');

  for (const [keyword, data] of Object.entries(ocrDatabase)) {
    if (lower.includes(keyword)) {
      return { ...data };
    }
  }

  // Fallback generic certificate
  const name = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  return {
    title: name.charAt(0).toUpperCase() + name.slice(1),
    issuer: 'Unknown Issuer',
    skills: ['Professional Development'],
    issueDate: '2026-01-01',
    expiryDate: null,
  };
}
