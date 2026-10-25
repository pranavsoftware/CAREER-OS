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
