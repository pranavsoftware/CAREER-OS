import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

import { users } from '../src/data/users.js';
import { initialStudents } from '../src/data/students.js';
import { initialJobs } from '../src/data/jobs.js';
import { initialDrives } from '../src/data/drives.js';
import { initialApplications } from '../src/data/applications.js';
import { initialCertificates } from '../src/data/certificates.js';
import { initialMails } from '../src/data/mails.js';
import { initialNotifications } from '../src/data/notifications.js';
import { questionBank } from '../src/data/questionBank.js';
import { skillTaxonomy } from '../src/data/skillTaxonomy.js';

const client = new pg.Client(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT || '6543', 10),
        database: process.env.PGDATABASE || 'postgres',
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false }
      }
);

async function runMigrationAndSeed() {
  console.log('Connecting to Supabase PostgreSQL database...');
  await client.connect();
  console.log('Connected! Creating database schema...');

  await client.query(`
    -- Enable uuid extension if needed
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      student_id TEXT,
      company_id TEXT,
      display_role TEXT,
      avatar TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Students Table
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      reg_no TEXT NOT NULL,
      email TEXT NOT NULL,
      branch TEXT NOT NULL,
      batch INT NOT NULL,
      cgpa NUMERIC(4,2) NOT NULL,
      backlogs INT DEFAULT 0,
      phone TEXT,
      dob TEXT,
      gender TEXT,
      address TEXT,
      profile_status TEXT DEFAULT 'Pending',
      placement_status TEXT DEFAULT 'In process',
      profile_completion INT DEFAULT 0,
      github TEXT,
      linkedin TEXT,
      verification_status JSONB DEFAULT '{}'::jsonb,
      education JSONB DEFAULT '{}'::jsonb,
      skills JSONB DEFAULT '[]'::jsonb,
      projects JSONB DEFAULT '[]'::jsonb,
      experience JSONB DEFAULT '[]'::jsonb,
      resume_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Jobs Table
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      required_skills JSONB DEFAULT '[]'::jsonb,
      min_cgpa NUMERIC(4,2) DEFAULT 0,
      branches JSONB DEFAULT '[]'::jsonb,
      openings INT DEFAULT 1,
      ctc NUMERIC(6,2) DEFAULT 0,
      deadline TEXT,
      location TEXT,
      status TEXT DEFAULT 'Open',
      applicants_count INT DEFAULT 0,
      approved_by_university BOOLEAN DEFAULT TRUE,
      drive_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Drives Table
    CREATE TABLE IF NOT EXISTS drives (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      company_id TEXT NOT NULL,
      role TEXT NOT NULL,
      ctc NUMERIC(6,2) DEFAULT 0,
      date TEXT NOT NULL,
      deadline TEXT,
      eligible_branches JSONB DEFAULT '[]'::jsonb,
      min_cgpa NUMERIC(4,2) DEFAULT 0,
      max_backlogs INT DEFAULT 0,
      description TEXT,
      status TEXT DEFAULT 'Upcoming',
      applicants_count INT DEFAULT 0,
      job_id TEXT,
      approved_by_university BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Applications Table
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      drive_id TEXT,
      job_id TEXT,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      ctc NUMERIC(6,2) DEFAULT 0,
      applied_date TEXT NOT NULL,
      status TEXT DEFAULT 'Applied',
      notes TEXT,
      status_history JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Certificates Table
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      title TEXT NOT NULL,
      issuer TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiry_date TEXT,
      skills JSONB DEFAULT '[]'::jsonb,
      status TEXT DEFAULT 'Valid',
      file_name TEXT,
      verified BOOLEAN DEFAULT TRUE,
      verification_score INT DEFAULT 95,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Mails Table
    CREATE TABLE IF NOT EXISTS mails (
      id TEXT PRIMARY KEY,
      sender_from TEXT NOT NULL,
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      snippet TEXT,
      body TEXT NOT NULL,
      received_at TEXT NOT NULL,
      criteria JSONB DEFAULT '{}'::jsonb,
      processed BOOLEAN DEFAULT FALSE,
      drive_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Notifications Table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TEXT NOT NULL
    );

    -- Question Bank Table
    CREATE TABLE IF NOT EXISTS question_bank (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      question TEXT NOT NULL,
      options JSONB NOT NULL,
      correct INT NOT NULL,
      explanation TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Skill Taxonomy Table
    CREATE TABLE IF NOT EXISTS skill_taxonomy (
      id SERIAL PRIMARY KEY,
      role_name TEXT NOT NULL UNIQUE,
      skills JSONB NOT NULL
    );

    -- Candidate Pipeline Stages
    CREATE TABLE IF NOT EXISTS candidate_pipelines (
      job_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      PRIMARY KEY (job_id, student_id)
    );

    -- Phase 1 Tables
    CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT,
      logo TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS job_shortlists (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      rank INT,
      match_score NUMERIC(5,2),
      score_breakdown JSONB DEFAULT '{}'::jsonb,
      status TEXT DEFAULT 'Suggested', -- 'Suggested' | 'CDC Approved' | 'Sent to Company' | 'Removed'
      shortlisted_by TEXT,
      emailed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(job_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS university_records (
      id TEXT PRIMARY KEY,
      university_id TEXT DEFAULT 'univ_apex',
      reg_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      branch TEXT NOT NULL,
      batch INT NOT NULL,
      cgpa NUMERIC(4,2) NOT NULL,
      backlogs INT DEFAULT 0,
      dob TEXT,
      imported_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS verification_audit (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      section TEXT NOT NULL,
      decision TEXT NOT NULL,
      mode TEXT NOT NULL, -- 'auto' | 'manual'
      rule TEXT,
      reasons JSONB DEFAULT '[]'::jsonb,
      actor TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS verification_settings (
      section TEXT PRIMARY KEY,
      auto_enabled BOOLEAN DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('Tables created successfully. Seeding initial data...');

  // 1. Seed Users
  for (const u of users) {
    await client.query(`
      INSERT INTO users (id, name, email, password, role, student_id, company_id, display_role, avatar)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        student_id = EXCLUDED.student_id,
        company_id = EXCLUDED.company_id,
        display_role = EXCLUDED.display_role,
        avatar = EXCLUDED.avatar;
    `, [u.id, u.name, u.email, u.password, u.role, u.studentId || null, u.companyId || null, u.displayRole || null, u.avatar]);
  }
  console.log(`Seeded ${users.length} users.`);

  // 2. Seed Students
  for (const s of initialStudents) {
    await client.query(`
      INSERT INTO students (
        id, name, reg_no, email, branch, batch, cgpa, backlogs, phone, dob, gender,
        address, profile_status, placement_status, profile_completion, github, linkedin,
        verification_status, education, skills, projects, experience, resume_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        reg_no = EXCLUDED.reg_no,
        email = EXCLUDED.email,
        branch = EXCLUDED.branch,
        batch = EXCLUDED.batch,
        cgpa = EXCLUDED.cgpa,
        backlogs = EXCLUDED.backlogs,
        phone = EXCLUDED.phone,
        dob = EXCLUDED.dob,
        gender = EXCLUDED.gender,
        address = EXCLUDED.address,
        profile_status = EXCLUDED.profile_status,
        placement_status = EXCLUDED.placement_status,
        profile_completion = EXCLUDED.profile_completion,
        github = EXCLUDED.github,
        linkedin = EXCLUDED.linkedin,
        verification_status = EXCLUDED.verification_status,
        education = EXCLUDED.education,
        skills = EXCLUDED.skills,
        projects = EXCLUDED.projects,
        experience = EXCLUDED.experience,
        resume_url = EXCLUDED.resume_url;
    `, [
      s.id, s.name, s.regNo, s.email, s.branch, s.batch, s.cgpa, s.backlogs || 0, s.phone || null, s.dob || null, s.gender || null,
      s.address || null, s.profileStatus || 'Pending', s.placementStatus || 'In process', s.profileCompletion || 0,
      s.github || null, s.linkedin || null, JSON.stringify(s.verificationStatus || {}), JSON.stringify(s.education || {}),
      JSON.stringify(s.skills || []), JSON.stringify(s.projects || []), JSON.stringify(s.experience || []), s.resumeUrl || null
    ]);
  }
  console.log(`Seeded ${initialStudents.length} students.`);

  // 3. Seed Jobs
  for (const j of initialJobs) {
    await client.query(`
      INSERT INTO jobs (
        id, company_id, company, title, description, required_skills, min_cgpa, branches,
        openings, ctc, deadline, location, status, applicants_count, approved_by_university, drive_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET
        company_id = EXCLUDED.company_id,
        company = EXCLUDED.company,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        required_skills = EXCLUDED.required_skills,
        min_cgpa = EXCLUDED.min_cgpa,
        branches = EXCLUDED.branches,
        openings = EXCLUDED.openings,
        ctc = EXCLUDED.ctc,
        deadline = EXCLUDED.deadline,
        location = EXCLUDED.location,
        status = EXCLUDED.status,
        applicants_count = EXCLUDED.applicants_count,
        approved_by_university = EXCLUDED.approved_by_university,
        drive_id = EXCLUDED.drive_id;
    `, [
      j.id, j.companyId, j.company, j.title, j.description || '', JSON.stringify(j.requiredSkills || []),
      j.minCgpa || 0, JSON.stringify(j.branches || []), j.openings || 1, j.ctc || 0, j.deadline || null,
      j.location || '', j.status || 'Open', j.applicantsCount || 0, j.approvedByUniversity ?? true, j.driveId || null
    ]);
  }
  console.log(`Seeded ${initialJobs.length} jobs.`);

  // 4. Seed Drives
  for (const d of initialDrives) {
    await client.query(`
      INSERT INTO drives (
        id, company, company_id, role, ctc, date, deadline, eligible_branches,
        min_cgpa, max_backlogs, description, status, applicants_count, job_id, approved_by_university
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        company = EXCLUDED.company,
        company_id = EXCLUDED.company_id,
        role = EXCLUDED.role,
        ctc = EXCLUDED.ctc,
        date = EXCLUDED.date,
        deadline = EXCLUDED.deadline,
        eligible_branches = EXCLUDED.eligible_branches,
        min_cgpa = EXCLUDED.min_cgpa,
        max_backlogs = EXCLUDED.max_backlogs,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        applicants_count = EXCLUDED.applicants_count,
        job_id = EXCLUDED.job_id,
        approved_by_university = EXCLUDED.approved_by_university;
    `, [
      d.id, d.company, d.companyId, d.role, d.ctc || 0, d.date, d.deadline || null,
      JSON.stringify(d.eligibleBranches || []), d.minCgpa || 0, d.maxBacklogs || 0, d.description || '',
      d.status || 'Upcoming', d.applicantsCount || 0, d.jobId || null, d.approvedByUniversity ?? true
    ]);
  }
  console.log(`Seeded ${initialDrives.length} drives.`);

  // 5. Seed Applications
  for (const a of initialApplications) {
    await client.query(`
      INSERT INTO applications (
        id, student_id, drive_id, job_id, company, role, ctc, applied_date, status, notes, status_history
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        student_id = EXCLUDED.student_id,
        drive_id = EXCLUDED.drive_id,
        job_id = EXCLUDED.job_id,
        company = EXCLUDED.company,
        role = EXCLUDED.role,
        ctc = EXCLUDED.ctc,
        applied_date = EXCLUDED.applied_date,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        status_history = EXCLUDED.status_history;
    `, [
      a.id, a.studentId, a.driveId || null, a.jobId || null, a.company, a.role,
      a.ctc || 0, a.appliedDate, a.status || 'Applied', a.notes || '', JSON.stringify(a.statusHistory || [])
    ]);
  }
  console.log(`Seeded ${initialApplications.length} applications.`);

  // 6. Seed Certificates
  for (const c of initialCertificates) {
    await client.query(`
      INSERT INTO certificates (
        id, student_id, title, issuer, issue_date, expiry_date, skills, status, file_name, verified, verification_score
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        student_id = EXCLUDED.student_id,
        title = EXCLUDED.title,
        issuer = EXCLUDED.issuer,
        issue_date = EXCLUDED.issue_date,
        expiry_date = EXCLUDED.expiry_date,
        skills = EXCLUDED.skills,
        status = EXCLUDED.status,
        file_name = EXCLUDED.file_name,
        verified = EXCLUDED.verified,
        verification_score = EXCLUDED.verification_score;
    `, [
      c.id, c.studentId, c.title, c.issuer, c.issueDate, c.expiryDate || null,
      JSON.stringify(c.skills || []), c.status || 'Valid', c.fileName || null, true, 95
    ]);
  }
  console.log(`Seeded ${initialCertificates.length} certificates.`);

  // 7. Seed Mails
  for (const m of initialMails) {
    await client.query(`
      INSERT INTO mails (
        id, sender_from, sender, subject, snippet, body, received_at, criteria, processed, drive_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        sender_from = EXCLUDED.sender_from,
        sender = EXCLUDED.sender,
        subject = EXCLUDED.subject,
        snippet = EXCLUDED.snippet,
        body = EXCLUDED.body,
        received_at = EXCLUDED.received_at,
        criteria = EXCLUDED.criteria,
        processed = EXCLUDED.processed,
        drive_id = EXCLUDED.drive_id;
    `, [
      m.id, m.from, m.sender, m.subject, m.snippet || '', m.body, m.receivedAt,
      JSON.stringify(m.criteria || {}), m.processed ?? false, m.driveId || null
    ]);
  }
  console.log(`Seeded ${initialMails.length} mails.`);

  // 8. Seed Notifications
  for (const n of initialNotifications) {
    await client.query(`
      INSERT INTO notifications (id, student_id, type, title, message, read, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        student_id = EXCLUDED.student_id,
        type = EXCLUDED.type,
        title = EXCLUDED.title,
        message = EXCLUDED.message,
        read = EXCLUDED.read,
        created_at = EXCLUDED.created_at;
    `, [n.id, n.studentId || null, n.type, n.title, n.message, n.read ?? false, n.createdAt]);
  }
  console.log(`Seeded ${initialNotifications.length} notifications.`);

  // 9. Seed Question Bank
  for (const q of questionBank) {
    await client.query(`
      INSERT INTO question_bank (id, topic, difficulty, question, options, correct, explanation)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        topic = EXCLUDED.topic,
        difficulty = EXCLUDED.difficulty,
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        correct = EXCLUDED.correct,
        explanation = EXCLUDED.explanation;
    `, [q.id, q.topic, q.difficulty, q.question, JSON.stringify(q.options), q.correct, q.explanation || '']);
  }
  console.log(`Seeded ${questionBank.length} questions in question bank.`);

  // 10. Seed Skill Taxonomy
  for (const [roleName, skills] of Object.entries(skillTaxonomy)) {
    await client.query(`
      INSERT INTO skill_taxonomy (role_name, skills)
      VALUES ($1, $2)
      ON CONFLICT (role_name) DO UPDATE SET
        skills = EXCLUDED.skills;
    `, [roleName, JSON.stringify(skills)]);
  }
  console.log('Seeded skill taxonomy.');

  // 11. Initial Candidate Pipeline for Infosys (j1)
  const pipelineCandidates = [
    { studentId: 's1', stage: 'Online Test' },
    { studentId: 's2', stage: 'Shortlisted' },
    { studentId: 's3', stage: 'Interview' },
    { studentId: 's4', stage: 'Offer' },
    { studentId: 's5', stage: 'Shortlisted' },
    { studentId: 's6', stage: 'Online Test' },
  ];
  for (const pc of pipelineCandidates) {
    await client.query(`
      INSERT INTO candidate_pipelines (job_id, student_id, stage)
      VALUES ($1, $2, $3)
      ON CONFLICT (job_id, student_id) DO UPDATE SET
        stage = EXCLUDED.stage;
    `, ['j1', pc.studentId, pc.stage]);
  }
  console.log('Seeded candidate pipeline stages.');

  // 12. Seed Universities
  await client.query(`
    INSERT INTO universities (id, name, city, logo)
    VALUES ('univ_apex', 'Apex Institute of Technology', 'Bangalore', '/logos/apex.png')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city;
  `);
  console.log('Seeded universities.');

  // 13. Seed Verification Settings
  const sections = ['personalInfo', 'education', 'skills', 'projects', 'experience'];
  for (const sec of sections) {
    await client.query(`
      INSERT INTO verification_settings (section, auto_enabled)
      VALUES ($1, true)
      ON CONFLICT (section) DO NOTHING;
    `, [sec]);
  }
  console.log('Seeded verification settings.');

  // 14. Seed University Master Records (for automated verification)
  for (const s of initialStudents) {
    // Introduce an intentional discrepancy for s7 to test the exceptions queue
    const cgpaVal = s.id === 's7' ? 7.95 : s.cgpa;
    const backlogsVal = s.id === 's7' ? 1 : (s.backlogs || 0);

    await client.query(`
      INSERT INTO university_records (id, university_id, reg_no, name, branch, batch, cgpa, backlogs, dob)
      VALUES ($1, 'univ_apex', $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (reg_no) DO UPDATE SET
        name = EXCLUDED.name,
        branch = EXCLUDED.branch,
        batch = EXCLUDED.batch,
        cgpa = EXCLUDED.cgpa,
        backlogs = EXCLUDED.backlogs,
        dob = EXCLUDED.dob;
    `, [
      `ur_${s.id}`,
      s.regNo,
      s.name,
      s.branch,
      s.batch,
      cgpaVal,
      backlogsVal,
      s.dob || '2003-01-01'
    ]);
  }
  console.log(`Seeded ${initialStudents.length} university records.`);

  // 15. Seed Sample Verification Audit Logs
  await client.query(`
    INSERT INTO verification_audit (id, student_id, section, decision, mode, rule, reasons, actor)
    VALUES
      ('va_1', 's2', 'personalInfo', 'Verified', 'auto', 'REGISTRY_EXACT_MATCH', '["Name, RegNo, Branch, Batch match official registrar database"]'::jsonb, 'SYSTEM_AUTO_ENGINE'),
      ('va_2', 's2', 'education', 'Verified', 'auto', 'CGPA_BACKLOG_TOLERANCE', '["CGPA 8.90 matches university transcript with tolerance <= 0.01", "0 backlogs verified"]'::jsonb, 'SYSTEM_AUTO_ENGINE'),
      ('va_3', 's7', 'education', 'Flagged Exception', 'auto', 'CGPA_MISMATCH', '["Student entered 8.20 CGPA; official university record has 7.95", "Student claims 0 backlogs; university record has 1 backlog"]'::jsonb, 'SYSTEM_AUTO_ENGINE')
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('Seeded verification audit entries.');

  // 16. Seed Sample Job Shortlist for j1
  const sampleShortlist = [
    { studentId: 's2', rank: 1, matchScore: 92.50, status: 'CDC Approved', breakdown: { skillOverlap: 38.0, certRelevance: 20.0, verifiedProjects: 18.0, cgpaScore: 16.5 } },
    { studentId: 's4', rank: 2, matchScore: 89.00, status: 'Suggested', breakdown: { skillOverlap: 36.0, certRelevance: 18.0, verifiedProjects: 17.5, cgpaScore: 17.5 } },
    { studentId: 's1', rank: 3, matchScore: 84.20, status: 'Suggested', breakdown: { skillOverlap: 34.0, certRelevance: 15.0, verifiedProjects: 18.4, cgpaScore: 16.8 } },
  ];
  for (const item of sampleShortlist) {
    await client.query(`
      INSERT INTO job_shortlists (id, job_id, student_id, rank, match_score, score_breakdown, status, shortlisted_by)
      VALUES ($1, 'j1', $2, $3, $4, $5, $6, 'CDC Placement Team')
      ON CONFLICT (job_id, student_id) DO UPDATE SET
        rank = EXCLUDED.rank,
        match_score = EXCLUDED.match_score,
        score_breakdown = EXCLUDED.score_breakdown,
        status = EXCLUDED.status;
    `, [`sl_j1_${item.studentId}`, item.studentId, item.rank, item.matchScore, JSON.stringify(item.breakdown), item.status]);
  }
  console.log('Seeded sample job shortlists for j1.');

  // ─── PHASE 2 SCHEMAS (idempotent) ──────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS material_ratings (
      material_id  VARCHAR(100) NOT NULL,
      student_id   VARCHAR(100) NOT NULL,
      stars        INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
      review       TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (material_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS material_enrollments (
      material_id  VARCHAR(100) NOT NULL,
      student_id   VARCHAR(100) NOT NULL,
      enrolled_at  TIMESTAMPTZ DEFAULT NOW(),
      completed    BOOLEAN DEFAULT false,
      PRIMARY KEY (material_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS reschedule_requests (
      id              VARCHAR(100) PRIMARY KEY,
      interview_id    VARCHAR(100) NOT NULL,
      student_id      VARCHAR(100) NOT NULL,
      reason_code     TEXT NOT NULL,
      reason_details  TEXT,
      proposed_date   TEXT,
      proposed_time   TEXT,
      status          TEXT NOT NULL DEFAULT 'Pending',
      recruiter_note  TEXT,
      decided_at      TIMESTAMPTZ,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE interviews ADD COLUMN IF NOT EXISTS meeting_provider VARCHAR(30) DEFAULT 'careeros';
    ALTER TABLE interviews ADD COLUMN IF NOT EXISTS meeting_url TEXT;
  `);
  console.log('Phase 2 schemas ensured.');

  // 17. Seed sample material enrollments and ratings
  // Get a sample of material IDs from DB
  const matRes = await client.query(`SELECT id FROM materials LIMIT 6`);
  const matIds = matRes.rows.map(r => r.id);
  const sampleStudents = ['s1', 's2', 's3', 's4', 's5', 's6'];

  if (matIds.length > 0) {
    // Seed enrollments
    const enrollPairs = [
      [matIds[0], 's1', true], [matIds[0], 's2', true], [matIds[0], 's3', false],
      [matIds[0], 's4', true], [matIds[0], 's5', false],
    ];
    if (matIds[1]) {
      enrollPairs.push([matIds[1], 's1', false], [matIds[1], 's2', true], [matIds[1], 's6', true]);
    }
    if (matIds[2]) {
      enrollPairs.push([matIds[2], 's3', true], [matIds[2], 's4', true], [matIds[2], 's5', true]);
    }

    for (const [mid, sid, completed] of enrollPairs) {
      await client.query(`
        INSERT INTO material_enrollments (material_id, student_id, enrolled_at, completed)
        VALUES ($1, $2, NOW(), $3)
        ON CONFLICT (material_id, student_id) DO UPDATE SET completed = EXCLUDED.completed
      `, [mid, sid, completed]);
    }
    console.log('Seeded material enrollments.');

    // Seed ratings (only enrolled students)
    const ratingData = [
      [matIds[0], 's1', 5, 'Excellent content! Very well structured and easy to follow.'],
      [matIds[0], 's2', 4, 'Good material, covers most concepts needed for placement prep.'],
      [matIds[0], 's4', 5, 'Highly recommended for DSA preparation. Clear explanations.'],
      [matIds[0], 's5', 3, 'Average material, some concepts could be explained better.'],
    ];
    if (matIds[1]) {
      ratingData.push(
        [matIds[1], 's2', 4, 'Great resource for system design concepts.'],
        [matIds[1], 's6', 5, 'Outstanding! Helped me crack my interview.']
      );
    }
    if (matIds[2]) {
      ratingData.push(
        [matIds[2], 's3', 3, 'Decent but could use more examples.'],
        [matIds[2], 's4', 4, 'Very useful for competitive programming.'],
        [matIds[2], 's5', 5, 'Best resource for this topic on the platform!']
      );
    }

    for (const [mid, sid, stars, review] of ratingData) {
      await client.query(`
        INSERT INTO material_ratings (material_id, student_id, stars, review, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (material_id, student_id) DO UPDATE SET stars = EXCLUDED.stars, review = EXCLUDED.review
      `, [mid, sid, stars, review]);
    }
    console.log('Seeded material ratings.');
  }

  // ─── PHASE 3 SCHEMAS & SEEDS ──────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT,
      logo TEXT,
      code TEXT,
      state TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE universities ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE universities ADD COLUMN IF NOT EXISTS logo TEXT;

    ALTER TABLE students ADD COLUMN IF NOT EXISTS university_id TEXT DEFAULT 'univ_apex';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS university_id TEXT DEFAULT 'univ_apex';

    UPDATE students SET university_id = 'univ_apex' WHERE university_id IS NULL;
    UPDATE users SET university_id = 'univ_apex' WHERE university_id IS NULL;

    CREATE TABLE IF NOT EXISTS higher_ed_programs (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      institution     TEXT NOT NULL,
      country         TEXT NOT NULL,
      level           TEXT NOT NULL,
      branch_tags     JSONB DEFAULT '[]'::jsonb,
      min_cgpa        NUMERIC(4,2) DEFAULT 7.00,
      exam_required   TEXT,
      deadline_hint   TEXT,
      link            TEXT,
      description     TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id             TEXT PRIMARY KEY,
      referrer_id    TEXT NOT NULL,
      referee_email  TEXT NOT NULL,
      referee_id     TEXT,
      code           TEXT UNIQUE NOT NULL,
      status         TEXT NOT NULL DEFAULT 'Invited',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reward_ledger (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      points      INT NOT NULL,
      reason      TEXT NOT NULL,
      ref_id      TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS recommendation_requests (
      id            TEXT PRIMARY KEY,
      student_id    TEXT NOT NULL,
      faculty_name  TEXT NOT NULL,
      role          TEXT NOT NULL,
      message       TEXT,
      endorsement   TEXT,
      status        TEXT NOT NULL DEFAULT 'Pending',
      decided_at    TIMESTAMPTZ,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Seed Universities
  const phase3Universities = [
    { id: 'univ_apex', name: 'Apex Institute of Technology', city: 'Bengaluru', logo: '🏛️' },
    { id: 'univ_vit', name: 'Vellore Technical University', city: 'Vellore', logo: '🎓' },
    { id: 'univ_manipal', name: 'Manipal Academy of Computing', city: 'Manipal', logo: '🏫' },
    { id: 'univ_nit', name: 'National Institute of Engineering', city: 'Trichy', logo: '🌟' },
  ];
  for (const u of phase3Universities) {
    await client.query(`
      INSERT INTO universities (id, name, city, logo)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, logo = EXCLUDED.logo
    `, [u.id, u.name, u.city, u.logo]);
  }

  // Seed Higher Ed
  const phase3Programs = [
    { id: 'hep_1', name: 'M.S. in Computer Science (AI & Systems)', institution: 'Carnegie Mellon University', country: 'USA', level: 'MS', branch_tags: ['CSE', 'IT'], min_cgpa: 8.5, exam_required: 'GRE + TOEFL', deadline_hint: 'December 15, 2026', link: 'https://www.cs.cmu.edu/academics/masters', description: 'Premier distributed systems and AI program.' },
    { id: 'hep_2', name: 'M.Sc. in Machine Learning and Data Science', institution: 'Technical University of Munich (TUM)', country: 'Germany', level: 'MS', branch_tags: ['CSE', 'IT', 'ECE'], min_cgpa: 8.0, exam_required: 'IELTS', deadline_hint: 'May 31, 2027', link: 'https://www.tum.de/en/studies/degree-programs', description: 'Top German public data science program.' },
    { id: 'hep_3', name: 'M.S. in Electrical & Computer Engineering', institution: 'Georgia Institute of Technology', country: 'USA', level: 'MS', branch_tags: ['ECE', 'EEE', 'CSE'], min_cgpa: 7.8, exam_required: 'GRE + IELTS', deadline_hint: 'January 10, 2027', link: 'https://ece.gatech.edu', description: 'Renowned VLSI and embedded systems research.' },
    { id: 'hep_4', name: 'M.Eng. in Software Engineering', institution: 'National University of Singapore (NUS)', country: 'Singapore', level: 'MS', branch_tags: ['CSE', 'IT'], min_cgpa: 8.2, exam_required: 'TOEFL', deadline_hint: 'February 28, 2027', link: 'https://www.comp.nus.edu.sg', description: 'Asia’s premier software engineering degree.' },
    { id: 'hep_5', name: 'M.Tech in Artificial Intelligence', institution: 'Indian Institute of Science (IISc)', country: 'India', level: 'MTech', branch_tags: ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'], min_cgpa: 8.0, exam_required: 'GATE', deadline_hint: 'April 20, 2027', link: 'https://eecs.iisc.ac.in', description: 'India’s top AI postgraduate curriculum.' },
    { id: 'hep_6', name: 'M.Sc. in Advanced Computing', institution: 'Imperial College London', country: 'UK', level: 'MS', branch_tags: ['CSE', 'IT'], min_cgpa: 8.3, exam_required: 'IELTS', deadline_hint: 'March 1, 2027', link: 'https://www.imperial.ac.uk', description: 'High-performance computing and formal algorithms.' },
    { id: 'hep_7', name: 'M.S. in Robotics & Autonomous Systems', institution: 'ETH Zurich', country: 'Switzerland', level: 'MS', branch_tags: ['Mechanical', 'ECE', 'CSE', 'EEE'], min_cgpa: 8.5, exam_required: 'GRE + IELTS', deadline_hint: 'December 15, 2026', link: 'https://ethz.ch', description: 'World leader in quadrupedal and flying robotics.' },
    { id: 'hep_8', name: 'Master of Business Administration (Tech MBA)', institution: 'INSEAD', country: 'France', level: 'MBA', branch_tags: ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'], min_cgpa: 7.5, exam_required: 'GMAT', deadline_hint: 'April 15, 2027', link: 'https://www.insead.edu', description: 'Global leadership for engineering managers.' },
    { id: 'hep_9', name: 'M.S. in Information Systems & Cloud Architectures', institution: 'University of Washington', country: 'USA', level: 'MS', branch_tags: ['CSE', 'IT'], min_cgpa: 7.7, exam_required: 'TOEFL', deadline_hint: 'January 15, 2027', link: 'https://ischool.uw.edu', description: 'Direct access to cloud giants in Seattle.' },
    { id: 'hep_10', name: 'M.S. in Microelectronics and VLSI', institution: 'Delft University of Technology (TU Delft)', country: 'Netherlands', level: 'MS', branch_tags: ['ECE', 'EEE'], min_cgpa: 7.8, exam_required: 'IELTS', deadline_hint: 'April 1, 2027', link: 'https://www.tudelft.nl', description: 'European semiconductor and nanotechnology pipeline.' },
    { id: 'hep_11', name: 'M.S. in Mechanical Engineering & Thermal Design', institution: 'University of Michigan, Ann Arbor', country: 'USA', level: 'MS', branch_tags: ['Mechanical'], min_cgpa: 7.6, exam_required: 'GRE + TOEFL', deadline_hint: 'January 15, 2027', link: 'https://me.engin.umich.edu', description: 'Automotive and sustainable power leader.' },
    { id: 'hep_12', name: 'M.Tech in Computer Science and Engineering', institution: 'IIT Bombay', country: 'India', level: 'MTech', branch_tags: ['CSE', 'IT'], min_cgpa: 8.2, exam_required: 'GATE', deadline_hint: 'April 18, 2027', link: 'https://www.cse.iitb.ac.in', description: 'Top ranking Indian computer science master’s.' },
    { id: 'hep_13', name: 'Master of Information Technology', institution: 'University of Melbourne', country: 'Australia', level: 'MS', branch_tags: ['CSE', 'IT', 'ECE'], min_cgpa: 7.2, exam_required: 'IELTS', deadline_hint: 'May 31, 2027', link: 'https://study.unimelb.edu.au', description: 'Comprehensive computing with internship options.' },
    { id: 'hep_14', name: 'M.Sc. in Sustainable Energy Engineering', institution: 'KTH Royal Institute of Technology', country: 'Sweden', level: 'MS', branch_tags: ['EEE', 'Mechanical', 'ECE'], min_cgpa: 7.5, exam_required: 'IELTS', deadline_hint: 'January 15, 2027', link: 'https://www.kth.se', description: 'Clean tech, energy storage and smart grids.' },
    { id: 'hep_15', name: 'Ph.D. in Computer Science (Direct Fellowships)', institution: 'University of Oxford', country: 'UK', level: 'PhD', branch_tags: ['CSE', 'IT', 'ECE'], min_cgpa: 8.8, exam_required: 'IELTS', deadline_hint: 'January 8, 2027', link: 'https://www.cs.ox.ac.uk', description: 'Fully funded doctoral research.' },
    { id: 'hep_16', name: 'M.S. in Financial Engineering & Quantitative Finance', institution: 'Columbia University', country: 'USA', level: 'MS', branch_tags: ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'], min_cgpa: 8.4, exam_required: 'GRE + TOEFL', deadline_hint: 'January 5, 2027', link: 'https://ieor.columbia.edu', description: 'Wall Street quantitative trading and finance.' }
  ];
  for (const p of phase3Programs) {
    await client.query(`
      INSERT INTO higher_ed_programs (id, name, institution, country, level, branch_tags, min_cgpa, exam_required, deadline_hint, link, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, institution = EXCLUDED.institution
    `, [p.id, p.name, p.institution, p.country, p.level, JSON.stringify(p.branch_tags), p.min_cgpa, p.exam_required, p.deadline_hint, p.link, p.description]);
  }
  console.log(`Seeded ${phase3Programs.length} higher ed programs.`);

  // ─── PHASE 4 SCHEMAS & SEEDS ──────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS aspirant_profiles (
      user_id             TEXT PRIMARY KEY,
      name                TEXT NOT NULL,
      board               TEXT,
      stream              TEXT,
      twelfth_percentage  NUMERIC(5,2) NOT NULL,
      entrance_exams      JSONB DEFAULT '[]'::jsonb,
      interests           JSONB DEFAULT '[]'::jsonb,
      state               TEXT,
      phone               TEXT,
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      updated_at          TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS colleges (
      id             TEXT PRIMARY KEY,
      university_id  TEXT,
      name           TEXT NOT NULL,
      location       TEXT NOT NULL,
      courses        JSONB DEFAULT '[]'::jsonb,
      fees           NUMERIC(10,2) NOT NULL DEFAULT 150000.00,
      cutoff         JSONB DEFAULT '{}'::jsonb,
      seats          INT NOT NULL DEFAULT 400,
      accreditation  TEXT DEFAULT 'NAAC A++',
      rating         NUMERIC(3,1) DEFAULT 4.5,
      campus_facilities JSONB DEFAULT '[]'::jsonb,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS college_applications (
      id            TEXT PRIMARY KEY,
      aspirant_id   TEXT NOT NULL,
      college_id    TEXT NOT NULL,
      course        TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'Applied',
      remarks       TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO users (id, name, email, password, role, display_role, avatar)
    VALUES ('user_aspirant', 'Demo Aspirant (Rahul Verma)', 'aspirant@demo.com', 'demo', 'aspirant', 'Class 12th Pass-Out • CBSE PCM', 'RV')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
  `);

  console.log('Seeded Phase 4 aspirant schemas & user.');

  console.log('Database migration and seeding completed successfully!');
}

runMigrationAndSeed()
  .catch((err) => {
    console.error('Migration/seed error:', err);
    process.exit(1);
  })
  .finally(() => {
    client.end();
  });
