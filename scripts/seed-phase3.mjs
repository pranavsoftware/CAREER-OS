/**
 * Phase 3 Seed Data:
 * - 4 Universities
 * - >= 15 Higher Ed Programs
 * - Sample referrals and reward ledger entries
 */
import 'dotenv/config';
import { getPool } from '../src/lib/db.js';

const pool = getPool();

console.log('Seeding Phase 3 datasets…');

await pool.query(`
  ALTER TABLE universities ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE universities ADD COLUMN IF NOT EXISTS logo TEXT;
`);

// 1. Seed Universities
const universities = [
  { id: 'univ_apex', name: 'Apex Institute of Technology', city: 'Bengaluru', logo: '🏛️' },
  { id: 'univ_vit', name: 'Vellore Technical University', city: 'Vellore', logo: '🎓' },
  { id: 'univ_manipal', name: 'Manipal Academy of Computing', city: 'Manipal', logo: '🏫' },
  { id: 'univ_nit', name: 'National Institute of Engineering', city: 'Trichy', logo: '🌟' },
];

for (const u of universities) {
  await pool.query(`
    INSERT INTO universities (id, name, city, logo)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      city = EXCLUDED.city,
      logo = EXCLUDED.logo
  `, [u.id, u.name, u.city, u.logo]);
}
console.log('✓ Seeded universities');

// 2. Seed >= 15 Higher Education Programs
const programs = [
  {
    id: 'hep_1',
    name: 'M.S. in Computer Science (AI & Systems)',
    institution: 'Carnegie Mellon University',
    country: 'USA',
    level: 'MS',
    branch_tags: ['CSE', 'IT'],
    min_cgpa: 8.5,
    exam_required: 'GRE + TOEFL',
    deadline_hint: 'December 15, 2026',
    link: 'https://www.cs.cmu.edu/academics/masters',
    description: 'World-renowned master’s program focusing on deep distributed systems, modern AI architectures, and compiler design.'
  },
  {
    id: 'hep_2',
    name: 'M.Sc. in Machine Learning and Data Science',
    institution: 'Technical University of Munich (TUM)',
    country: 'Germany',
    level: 'MS',
    branch_tags: ['CSE', 'IT', 'ECE'],
    min_cgpa: 8.0,
    exam_required: 'IELTS',
    deadline_hint: 'May 31, 2027',
    link: 'https://www.tum.de/en/studies/degree-programs/detail/data-engineering-and-analytics-master-of-science-msc',
    description: 'No tuition fee program in Munich focusing on scalable data pipelines, robotics perception, and applied machine learning.'
  },
  {
    id: 'hep_3',
    name: 'M.S. in Electrical & Computer Engineering',
    institution: 'Georgia Institute of Technology',
    country: 'USA',
    level: 'MS',
    branch_tags: ['ECE', 'EEE', 'CSE'],
    min_cgpa: 7.8,
    exam_required: 'GRE + IELTS',
    deadline_hint: 'January 10, 2027',
    link: 'https://ece.gatech.edu/graduate-programs',
    description: 'Top-ranked ECE program with strong research labs in VLSI design, edge AI hardware, and signal processing.'
  },
  {
    id: 'hep_4',
    name: 'M.Eng. in Software Engineering',
    institution: 'National University of Singapore (NUS)',
    country: 'Singapore',
    level: 'MS',
    branch_tags: ['CSE', 'IT'],
    min_cgpa: 8.2,
    exam_required: 'TOEFL',
    deadline_hint: 'February 28, 2027',
    link: 'https://www.comp.nus.edu.sg/programmes/pg/mr/',
    description: 'Intensive 1-year graduate program in Asia’s premier tech hub with direct access to multinational R&D headquarters.'
  },
  {
    id: 'hep_5',
    name: 'M.Tech in Artificial Intelligence',
    institution: 'Indian Institute of Science (IISc)',
    country: 'India',
    level: 'MTech',
    branch_tags: ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'],
    min_cgpa: 8.0,
    exam_required: 'GATE',
    deadline_hint: 'April 20, 2027',
    link: 'https://eecs.iisc.ac.in/mtech-ai/',
    description: 'Interdisciplinary premier Indian postgraduate degree with cutting-edge reinforcement learning and NLP research.'
  },
  {
    id: 'hep_6',
    name: 'M.Sc. in Advanced Computing',
    institution: 'Imperial College London',
    country: 'UK',
    level: 'MS',
    branch_tags: ['CSE', 'IT'],
    min_cgpa: 8.3,
    exam_required: 'IELTS',
    deadline_hint: 'March 1, 2027',
    link: 'https://www.imperial.ac.uk/study/courses/postgraduate-taught/advanced-computing/',
    description: 'Prestigious European master’s degree providing rigorous theoretical and practical training in high-performance computing.'
  },
  {
    id: 'hep_7',
    name: 'M.S. in Robotics & Autonomous Systems',
    institution: 'ETH Zurich',
    country: 'Switzerland',
    level: 'MS',
    branch_tags: ['Mechanical', 'ECE', 'CSE', 'EEE'],
    min_cgpa: 8.5,
    exam_required: 'GRE + IELTS',
    deadline_hint: 'December 15, 2026',
    link: 'https://ethz.ch/en/studies/master/degree-programmes/engineering-sciences/robotics-systems-and-control.html',
    description: 'World-leading robotics engineering master’s program with deep integration in quadrupeds, drones, and autonomous driving.'
  },
  {
    id: 'hep_8',
    name: 'Master of Business Administration (Tech MBA)',
    institution: 'INSEAD',
    country: 'France',
    level: 'MBA',
    branch_tags: ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'],
    min_cgpa: 7.5,
    exam_required: 'GMAT',
    deadline_hint: 'April 15, 2027',
    link: 'https://www.insead.edu/master-programmes/mba',
    description: 'Accelerated 10-month global business leadership degree for engineers transitioning to executive product and management roles.'
  },
  {
    id: 'hep_9',
    name: 'M.S. in Information Systems & Cloud Architectures',
    institution: 'University of Washington',
    country: 'USA',
    level: 'MS',
    branch_tags: ['CSE', 'IT'],
    min_cgpa: 7.7,
    exam_required: 'TOEFL',
    deadline_hint: 'January 15, 2027',
    link: 'https://ischool.uw.edu/programs/msim',
    description: 'Located in Seattle near AWS and Microsoft campuses, specializing in cloud computing, cybersecurity, and enterprise systems.'
  },
  {
    id: 'hep_10',
    name: 'M.S. in Microelectronics and VLSI',
    institution: 'Delft University of Technology (TU Delft)',
    country: 'Netherlands',
    level: 'MS',
    branch_tags: ['ECE', 'EEE'],
    min_cgpa: 7.8,
    exam_required: 'IELTS',
    deadline_hint: 'April 1, 2027',
    link: 'https://www.tudelft.nl/en/education/programmes/masters/electrical-engineering/',
    description: 'Direct pipeline into European semiconductor leaders like ASML and NXP, covering analog, digital chip design and lithography.'
  },
  {
    id: 'hep_11',
    name: 'M.S. in Mechanical Engineering & Thermal Design',
    institution: 'University of Michigan, Ann Arbor',
    country: 'USA',
    level: 'MS',
    branch_tags: ['Mechanical'],
    min_cgpa: 7.6,
    exam_required: 'GRE + TOEFL',
    deadline_hint: 'January 15, 2027',
    link: 'https://me.engin.umich.edu/academics/graduate/',
    description: 'Top automotive and aerospace powertrain engineering institute with world-class wind tunnels and combustion facilities.'
  },
  {
    id: 'hep_12',
    name: 'M.Tech in Computer Science and Engineering',
    institution: 'IIT Bombay',
    country: 'India',
    level: 'MTech',
    branch_tags: ['CSE', 'IT'],
    min_cgpa: 8.2,
    exam_required: 'GATE',
    deadline_hint: 'April 18, 2027',
    link: 'https://www.cse.iitb.ac.in/academics/pg.php',
    description: 'India’s premier institute offering exceptional research in formal methods, cybersecurity, computer vision, and NLP.'
  },
  {
    id: 'hep_13',
    name: 'Master of Information Technology',
    institution: 'University of Melbourne',
    country: 'Australia',
    level: 'MS',
    branch_tags: ['CSE', 'IT', 'ECE'],
    min_cgpa: 7.2,
    exam_required: 'IELTS',
    deadline_hint: 'May 31, 2027',
    link: 'https://study.unimelb.edu.au/find/courses/graduate/master-of-information-technology/',
    description: 'Flexible 2-year masters program with work-integrated learning and pathways for permanent residency in Australia.'
  },
  {
    id: 'hep_14',
    name: 'M.Sc. in Sustainable Energy Engineering',
    institution: 'KTH Royal Institute of Technology',
    country: 'Sweden',
    level: 'MS',
    branch_tags: ['EEE', 'Mechanical', 'ECE'],
    min_cgpa: 7.5,
    exam_required: 'IELTS',
    deadline_hint: 'January 15, 2027',
    link: 'https://www.kth.se/en/studies/master/sustainable-energy-engineering',
    description: 'Scandinavian leader in smart grids, renewable energy integration, battery storage systems, and electromobility.'
  },
  {
    id: 'hep_15',
    name: 'Ph.D. in Computer Science (Direct Fellowships)',
    institution: 'University of Oxford',
    country: 'UK',
    level: 'PhD',
    branch_tags: ['CSE', 'IT', 'ECE'],
    min_cgpa: 8.8,
    exam_required: 'IELTS',
    deadline_hint: 'January 8, 2027',
    link: 'https://www.cs.ox.ac.uk/admissions/graduate/dphil-cs/',
    description: 'Fully funded 4-year doctoral research fellowship covering automated verification, quantum computing, and ethical AI.'
  },
  {
    id: 'hep_16',
    name: 'M.S. in Financial Engineering & Quantitative Finance',
    institution: 'Columbia University',
    country: 'USA',
    level: 'MS',
    branch_tags: ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'],
    min_cgpa: 8.4,
    exam_required: 'GRE + TOEFL',
    deadline_hint: 'January 5, 2027',
    link: 'https://ieor.columbia.edu/masters/financial-engineering',
    description: 'Wall Street powerhouse curriculum covering algorithmic trading, stochastic calculus, risk modeling, and high-frequency systems.'
  }
];

for (const p of programs) {
  await pool.query(`
    INSERT INTO higher_ed_programs (id, name, institution, country, level, branch_tags, min_cgpa, exam_required, deadline_hint, link, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      institution = EXCLUDED.institution,
      country = EXCLUDED.country,
      level = EXCLUDED.level,
      branch_tags = EXCLUDED.branch_tags,
      min_cgpa = EXCLUDED.min_cgpa,
      exam_required = EXCLUDED.exam_required,
      deadline_hint = EXCLUDED.deadline_hint,
      link = EXCLUDED.link,
      description = EXCLUDED.description
  `, [
    p.id,
    p.name,
    p.institution,
    p.country,
    p.level,
    JSON.stringify(p.branch_tags),
    p.min_cgpa,
    p.exam_required,
    p.deadline_hint,
    p.link,
    p.description
  ]);
}
console.log(`✓ Seeded ${programs.length} Higher Education Programs`);

// 3. Seed Sample Referrals and Reward Ledger
const sampleReferrals = [
  { id: 'ref_1', referrerId: 's1', refereeEmail: 'neha.sharma@vitstudent.ac.in', refereeId: 's2', code: 'REF-S1-9842', status: 'Rewarded' },
  { id: 'ref_2', referrerId: 's1', refereeEmail: 'vikram.rathore@vitstudent.ac.in', refereeId: 's4', code: 'REF-S1-4321', status: 'Verified' },
  { id: 'ref_3', referrerId: 's2', refereeEmail: 'arjun.patel@vitstudent.ac.in', refereeId: null, code: 'REF-S2-7711', status: 'Invited' },
];

for (const r of sampleReferrals) {
  await pool.query(`
    INSERT INTO referrals (id, referrer_id, referee_email, referee_id, code, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      referee_id = EXCLUDED.referee_id
  `, [r.id, r.referrerId, r.refereeEmail, r.refereeId, r.code, r.status]);
}

const sampleLedger = [
  { id: 'rw_1', userId: 's1', points: 100, reason: 'Successful Referral: Neha Sharma profile verified', refId: 'ref_1' },
  { id: 'rw_2', userId: 's1', points: 50, reason: 'Mock Interview Feedback Bonus', refId: null },
  { id: 'rw_3', userId: 's2', points: 100, reason: 'Early Profile Completion & Academic Verification', refId: null },
];

for (const l of sampleLedger) {
  await pool.query(`
    INSERT INTO reward_ledger (id, user_id, points, reason, ref_id)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      points = EXCLUDED.points,
      reason = EXCLUDED.reason
  `, [l.id, l.userId, l.points, l.reason, l.refId]);
}
console.log('✓ Seeded referrals and reward ledger entries');

// 4. Seed sample faculty recommendations
const sampleRecs = [
  {
    id: 'rec_1',
    studentId: 's1',
    facultyName: 'Dr. K. Ramanathan',
    role: 'Professor & Head of Department, Computer Science',
    message: 'Candidate demonstrates exceptional algorithmic problem solving and built a full-stack campus placement platform.',
    endorsement: 'Strongly Recommended for Tier-1 Core Engineering Roles',
    status: 'Endorsed',
  },
  {
    id: 'rec_2',
    studentId: 's2',
    facultyName: 'Dr. Sunita Deshmukh',
    role: 'Associate Professor, Distributed Systems Lab',
    message: 'Top 1% performer in Operating Systems and Distributed Systems courses. Excellent collaboration and project delivery.',
    endorsement: 'Highest Recommendation for Backend & Systems Roles',
    status: 'Endorsed',
  }
];

for (const r of sampleRecs) {
  await pool.query(`
    INSERT INTO recommendation_requests (id, student_id, faculty_name, role, message, endorsement, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      endorsement = EXCLUDED.endorsement
  `, [r.id, r.studentId, r.facultyName, r.role, r.message, r.endorsement, r.status]);
}
console.log('✓ Seeded faculty recommendations');

await pool.end();
console.log('Phase 3 seed completed successfully!');
process.exit(0);
