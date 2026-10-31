/**
 * Phase 4 Migration: Aspirant College Selection
 * - aspirant_profiles
 * - colleges
 * - college_applications
 * - aspirant user in users table
 * Idempotent — safe to run multiple times.
 */
import 'dotenv/config';
import { getPool } from '../../src/lib/db.js';

const pool = getPool();

console.log('Running Phase 4 migrations…');

// 1. Aspirant Profiles
await pool.query(`
  CREATE TABLE IF NOT EXISTS aspirant_profiles (
    user_id             TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    board               TEXT, -- 'CBSE' | 'ICSE' | 'State Board' | 'IB'
    stream              TEXT, -- 'PCM' | 'PCB' | 'PCMB' | 'Commerce with Maths' | 'Arts'
    twelfth_percentage  NUMERIC(5,2) NOT NULL,
    entrance_exams      JSONB DEFAULT '[]'::jsonb, -- [{ exam: 'JEE Main', percentile: 94.5, rank: 45000 }]
    interests           JSONB DEFAULT '[]'::jsonb, -- ['AI & ML', 'Computer Science', 'Robotics']
    state               TEXT,
    phone               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
  );
`);
console.log('✓ aspirant_profiles');

// 2. Colleges & Course Offerings
await pool.query(`
  CREATE TABLE IF NOT EXISTS colleges (
    id             TEXT PRIMARY KEY,
    university_id  TEXT,
    name           TEXT NOT NULL,
    location       TEXT NOT NULL,
    courses        JSONB DEFAULT '[]'::jsonb, -- [{ code: 'CSE', name: 'B.Tech in Computer Science', duration: '4 Years', seats: 120 }]
    fees           NUMERIC(10,2) NOT NULL DEFAULT 150000.00,
    cutoff         JSONB DEFAULT '{}'::jsonb,  -- { minTwelfthPercent: 75.0, minJeePercentile: 85.0 }
    seats          INT NOT NULL DEFAULT 400,
    accreditation  TEXT DEFAULT 'NAAC A++',
    rating         NUMERIC(3,1) DEFAULT 4.5,
    campus_facilities JSONB DEFAULT '[]'::jsonb,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  );
`);
console.log('✓ colleges');

// 3. College Applications
await pool.query(`
  CREATE TABLE IF NOT EXISTS college_applications (
    id            TEXT PRIMARY KEY,
    aspirant_id   TEXT NOT NULL,
    college_id    TEXT NOT NULL,
    course        TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'Applied', -- 'Applied' | 'Under Review' | 'Accepted' | 'Waitlisted' | 'Rejected'
    remarks       TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  );
`);
console.log('✓ college_applications');

// 4. Ensure demo aspirant user exists in users table
await pool.query(`
  INSERT INTO users (id, name, email, password, role, display_role, avatar)
  VALUES ('user_aspirant', 'Demo Aspirant (Rahul Verma)', 'aspirant@demo.com', 'demo', 'aspirant', 'Class 12th Pass-Out • CBSE PCM', 'RV')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    display_role = EXCLUDED.display_role;
`);
console.log('✓ aspirant user in users table');

// 5. Seed initial profile for demo aspirant
await pool.query(`
  INSERT INTO aspirant_profiles (user_id, name, board, stream, twelfth_percentage, entrance_exams, interests, state)
  VALUES (
    'user_aspirant',
    'Rahul Verma',
    'CBSE',
    'PCM',
    89.40,
    '[{"exam": "JEE Main", "percentile": 92.5, "score": 185}, {"exam": "BITSAT", "score": 290}]'::jsonb,
    '["Artificial Intelligence", "Computer Science", "Cloud Architecture"]'::jsonb,
    'Delhi NCR'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    twelfth_percentage = EXCLUDED.twelfth_percentage,
    entrance_exams = EXCLUDED.entrance_exams;
`);
console.log('✓ seeded demo aspirant profile');

// 6. Seed Colleges
const collegesData = [
  {
    id: 'col_apex',
    university_id: 'univ_apex',
    name: 'Apex Institute of Technology, School of Computing',
    location: 'Electronic City, Bengaluru',
    courses: [
      { code: 'BTECH_CSE', name: 'B.Tech in Computer Science & Engineering', duration: '4 Years', seats: 180, annualFee: 195000 },
      { code: 'BTECH_AIML', name: 'B.Tech in AI & Machine Learning', duration: '4 Years', seats: 120, annualFee: 210000 },
      { code: 'BTECH_ECE', name: 'B.Tech in Electronics & Communication', duration: '4 Years', seats: 120, annualFee: 175000 },
    ],
    fees: 195000,
    cutoff: { minTwelfthPercent: 75.0, minJeePercentile: 88.0, streams: ['PCM', 'PCMB'] },
    seats: 420,
    accreditation: 'NAAC A++ (CGPA 3.82)',
    rating: 4.8,
    campus_facilities: ['100Gbps Campus WiFi', 'NVIDIA GPU Cluster', 'Tier-1 Placement Cell', 'Robotics Innovation Center'],
  },
  {
    id: 'col_vtu',
    university_id: 'univ_vit',
    name: 'Vellore Institute of Technology & Engineering',
    location: 'Katpadi, Vellore',
    courses: [
      { code: 'BTECH_CSE', name: 'B.Tech in Computer Science', duration: '4 Years', seats: 240, annualFee: 220000 },
      { code: 'BTECH_IT', name: 'B.Tech in Information Technology', duration: '4 Years', seats: 120, annualFee: 198000 },
      { code: 'BTECH_MECH', name: 'B.Tech in Mechatronics & Automation', duration: '4 Years', seats: 90, annualFee: 165000 },
    ],
    fees: 220000,
    cutoff: { minTwelfthPercent: 70.0, minJeePercentile: 82.0, streams: ['PCM', 'PCMB'] },
    seats: 450,
    accreditation: 'NAAC A+ (MHRD Tier-1)',
    rating: 4.7,
    campus_facilities: ['Smart Classrooms', 'Incubation Foundry', 'Olympic Sports Complex', 'High-speed Fiber Lab'],
  },
  {
    id: 'col_mac',
    university_id: 'univ_manipal',
    name: 'Manipal Academy School of Engineering & Technology',
    location: 'Tiger Circle, Manipal',
    courses: [
      { code: 'BTECH_CSE', name: 'B.Tech in Computer & Communication', duration: '4 Years', seats: 150, annualFee: 260000 },
      { code: 'BTECH_DS', name: 'B.Tech in Data Science & Engineering', duration: '4 Years', seats: 90, annualFee: 250000 },
      { code: 'BTECH_EEE', name: 'B.Tech in Electrical & Electronics', duration: '4 Years', seats: 90, annualFee: 190000 },
    ],
    fees: 260000,
    cutoff: { minTwelfthPercent: 65.0, minJeePercentile: 78.0, streams: ['PCM', 'PCMB'] },
    seats: 330,
    accreditation: 'Institute of Eminence (IoE)',
    rating: 4.6,
    campus_facilities: ['Innovation Centre', 'Global Student Exchange', 'Central Computing Facility', 'Hostel Tech Hubs'],
  },
  {
    id: 'col_nit_trichy',
    university_id: 'univ_nit',
    name: 'National College of Engineering & Sciences',
    location: 'Thuvakudi, Trichy',
    courses: [
      { code: 'BTECH_CSE', name: 'B.Tech in Computer Science', duration: '4 Years', seats: 120, annualFee: 125000 },
      { code: 'BTECH_ECE', name: 'B.Tech in Electronics & Communication', duration: '4 Years', seats: 90, annualFee: 125000 },
      { code: 'BTECH_MECH', name: 'B.Tech in Mechanical Engineering', duration: '4 Years', seats: 120, annualFee: 125000 },
    ],
    fees: 125000,
    cutoff: { minTwelfthPercent: 80.0, minJeePercentile: 95.0, streams: ['PCM'] },
    seats: 330,
    accreditation: 'National Autonomous Tier-1',
    rating: 4.9,
    campus_facilities: ['Government R&D Labs', 'Supercomputing Grid', 'Zero-ragging Green Campus', '100% Core Placements'],
  },
  {
    id: 'col_delhi_tech',
    university_id: 'univ_apex',
    name: 'Metropolitan Institute of Technology & Innovation',
    location: 'Dwarka, New Delhi',
    courses: [
      { code: 'BTECH_CSE', name: 'B.Tech in Software Systems', duration: '4 Years', seats: 120, annualFee: 160000 },
      { code: 'BTECH_AI', name: 'B.Tech in Artificial Intelligence & IoT', duration: '4 Years', seats: 60, annualFee: 175000 },
    ],
    fees: 160000,
    cutoff: { minTwelfthPercent: 72.0, minJeePercentile: 80.0, streams: ['PCM', 'PCMB'] },
    seats: 180,
    accreditation: 'NBA Accredited',
    rating: 4.4,
    campus_facilities: ['Metro Connectivity', 'Industry Partner Labs', 'Start-up Cell', 'Digital Library'],
  }
];

for (const col of collegesData) {
  await pool.query(`
    INSERT INTO colleges (id, university_id, name, location, courses, fees, cutoff, seats, accreditation, rating, campus_facilities)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      location = EXCLUDED.location,
      courses = EXCLUDED.courses,
      fees = EXCLUDED.fees,
      cutoff = EXCLUDED.cutoff,
      seats = EXCLUDED.seats,
      rating = EXCLUDED.rating
  `, [
    col.id,
    col.university_id,
    col.name,
    col.location,
    JSON.stringify(col.courses),
    col.fees,
    JSON.stringify(col.cutoff),
    col.seats,
    col.accreditation,
    col.rating,
    JSON.stringify(col.campus_facilities)
  ]);
}
console.log(`✓ Seeded ${collegesData.length} colleges with course portfolios`);

// 7. Seed Sample College Applications for demo aspirant
await pool.query(`
  INSERT INTO college_applications (id, aspirant_id, college_id, course, status, remarks)
  VALUES
    ('ca_1', 'user_aspirant', 'col_apex', 'B.Tech in Computer Science & Engineering', 'Under Review', 'Verified 89.4% 12th CBSE marksheet. JEE Main 92.5 percentile verified.'),
    ('ca_2', 'user_aspirant', 'col_vtu', 'B.Tech in Computer Science', 'Accepted', 'Provisional admission offer issued! Fee deadline 15 July 2027.')
  ON CONFLICT (id) DO NOTHING;
`);
console.log('✓ Seeded college applications');

await pool.end();
console.log('Phase 4 migrations complete.');
process.exit(0);

