import { query } from '../src/lib/db.js';

async function resetAndSeed3DemoUsers() {
  console.log('--- Cleaning up existing demo data ---');

  // Alter users table to support company field
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT;');

  // Clean all user and transactional data tables
  await query('DELETE FROM candidate_pipelines;');
  await query('DELETE FROM resume_versions;');
  await query('DELETE FROM test_attempts;');
  await query('DELETE FROM roadmap_progress;');
  await query('DELETE FROM applications;');
  await query('DELETE FROM certificates;');
  await query('DELETE FROM notifications;');
  await query('DELETE FROM mails;');
  await query('DELETE FROM drives;');
  await query('DELETE FROM jobs;');
  await query('DELETE FROM students;');
  await query('DELETE FROM users;');

  console.log('All previous demo data purged.');

  console.log('--- Inserting 3 Primary Demo Users ---');
  // 1. Student Demo User
  // 2. University Demo User
  // 3. Company Demo User
  await query(`
    INSERT INTO users (id, name, email, password, role, student_id, company_id, company, display_role, avatar)
    VALUES 
      ('user_student', 'Demo Student', 'student@demo.com', 'demo', 'student', 's1', NULL, NULL, 'B.Tech CSE - Batch 2026', 'DS'),
      ('user_university', 'University Demo', 'university@demo.com', 'demo', 'university', NULL, NULL, NULL, 'Placement Officer, University Relations', 'UD'),
      ('user_company', 'Company Demo', 'company@demo.com', 'demo', 'company', NULL, 'c1', 'Demo Company', 'Campus Talent Acquisition Lead', 'CD');
  `);

  console.log('--- Inserting Student Profile (Demo Student - s1) ---');
  await query(`
    INSERT INTO students (
      id, name, reg_no, email, branch, batch, cgpa, backlogs, phone, dob, gender, address,
      profile_status, placement_status, profile_completion, github, linkedin,
      verification_status, education, skills, projects, experience, resume_url
    ) VALUES (
      's1',
      'Demo Student',
      '22BCE1001',
      'student@demo.com',
      'CSE',
      2026,
      8.85,
      0,
      '+91 98765 43210',
      '2004-06-15',
      'Male',
      'VIT Campus, Vellore, Tamil Nadu - 632014',
      'Verified',
      'In process',
      100,
      'https://github.com/demostudent',
      'https://linkedin.com/in/demostudent',
      $1,
      $2,
      $3,
      $4,
      $5,
      '/resumes/demo_student_resume.pdf'
    );
  `, [
    JSON.stringify({
      personal: 'Verified',
      education: 'Verified',
      skills: 'Verified',
      projects: 'Verified',
      experience: 'Verified'
    }),
    JSON.stringify({
      tenth: { board: 'CBSE', percentage: 94.2, year: 2020 },
      twelfth: { board: 'CBSE', percentage: 92.8, year: 2022 },
      btech: {
        degree: 'B.Tech in Computer Science and Engineering',
        college: 'Vellore Institute of Technology, Vellore',
        currentSemester: 7,
        cgpa: 8.85,
        backlogs: 0
      }
    }),
    JSON.stringify([
      { name: 'React', level: 'Advanced' },
      { name: 'Node.js', level: 'Advanced' },
      { name: 'Python', level: 'Intermediate' },
      { name: 'PostgreSQL', level: 'Advanced' },
      { name: 'Data Structures & Algorithms', level: 'Advanced' },
      { name: 'TypeScript', level: 'Intermediate' }
    ]),
    JSON.stringify([
      {
        id: 'p1',
        title: 'Career & Placement Operating System',
        description: 'Full-stack campus placement orchestration portal with ATS resume evaluator and Kanban pipelines.',
        technologies: ['Next.js', 'Node.js', 'PostgreSQL', 'Tailwind'],
        link: 'https://github.com/demostudent/career-os',
        year: 2025
      },
      {
        id: 'p2',
        title: 'Distributed Task Scheduler',
        description: 'High-throughput asynchronous task queue with Redis persistence and worker prioritization.',
        technologies: ['Node.js', 'Redis', 'Docker'],
        link: 'https://github.com/demostudent/task-scheduler',
        year: 2025
      }
    ]),
    JSON.stringify([
      {
        id: 'e1',
        company: 'Tech Innovations Corp',
        role: 'Software Engineering Intern',
        duration: 'May 2025 - Jul 2025',
        type: 'Internship',
        description: 'Developed scalable microservice REST APIs and enhanced real-time customer data dashboards.'
      }
    ])
  ]);

  console.log('--- Inserting Certificates for Demo Student ---');
  await query(`
    INSERT INTO certificates (id, student_id, title, issuer, issue_date, expiry_date, skills, status, file_name, verified, verification_score)
    VALUES 
      ('cert_demo_1', 's1', 'AWS Certified Cloud Practitioner', 'Amazon Web Services', '2025-01-15', '2028-01-15', '["AWS", "Cloud Computing"]'::jsonb, 'Valid', 'aws_cert.pdf', TRUE, 98),
      ('cert_demo_2', 's1', 'Meta Frontend Developer Professional Certificate', 'Coursera / Meta', '2024-11-20', '2027-11-20', '["React", "JavaScript", "CSS"]'::jsonb, 'Valid', 'meta_frontend_cert.pdf', TRUE, 95);
  `);

  console.log('--- Inserting Jobs for Company Demo ---');
  await query(`
    INSERT INTO jobs (
      id, company_id, company, title, description, required_skills, min_cgpa, branches, openings, ctc, deadline, location, status, applicants_count, approved_by_university, drive_id
    ) VALUES 
      (
        'job_demo_1',
        'c1',
        'Demo Company',
        'Software Development Engineer',
        'Build high-scale distributed systems and user-facing web applications using modern web stacks.',
        '["React", "Node.js", "PostgreSQL", "Data Structures & Algorithms"]'::jsonb,
        7.5,
        '["CSE", "IT", "ECE"]'::jsonb,
        5,
        14.5,
        '2026-11-15',
        'Bengaluru / Hyderabad',
        'Active',
        1,
        TRUE,
        'drive_demo_1'
      ),
      (
        'job_demo_2',
        'c1',
        'Demo Company',
        'Cloud Solutions Associate',
        'Work on infrastructure automation, cloud services deployment, and CI/CD pipelines.',
        '["Cloud", "Linux", "Docker", "Python"]'::jsonb,
        7.0,
        '["CSE", "IT"]'::jsonb,
        3,
        11.0,
        '2026-11-30',
        'Pune / Remote',
        'Active',
        0,
        TRUE,
        'drive_demo_2'
      );
  `);

  console.log('--- Inserting Placement Drives for University Demo ---');
  await query(`
    INSERT INTO drives (
      id, company, company_id, role, ctc, date, deadline, eligible_branches, min_cgpa, max_backlogs, description, status, applicants_count, job_id, approved_by_university
    ) VALUES 
      (
        'drive_demo_1',
        'Demo Company',
        'c1',
        'Software Development Engineer',
        14.5,
        '2026-10-20',
        '2026-11-15',
        '["CSE", "IT", "ECE"]'::jsonb,
        7.5,
        0,
        'Campus hiring drive for SDE-1 position at Demo Company. Eligible candidates will undergo online test and technical interview.',
        'Open',
        1,
        'job_demo_1',
        TRUE
      ),
      (
        'drive_demo_2',
        'Demo Company',
        'c1',
        'Cloud Solutions Associate',
        11.0,
        '2026-11-05',
        '2026-11-30',
        '["CSE", "IT"]'::jsonb,
        7.0,
        1,
        'Campus recruitment for Cloud Solutions Associate role. Focuses on automation and cloud infrastructure engineering.',
        'Upcoming',
        0,
        'job_demo_2',
        TRUE
      );
  `);

  console.log('--- Inserting Application & Pipeline ---');
  await query(`
    INSERT INTO applications (
      id, student_id, drive_id, job_id, company, role, ctc, applied_date, status, notes, status_history
    ) VALUES (
      'app_demo_1',
      's1',
      'drive_demo_1',
      'job_demo_1',
      'Demo Company',
      'Software Development Engineer',
      14.5,
      '2026-10-14',
      'Interview',
      'Candidate cleared the Technical Assessment. Round 1 Technical Interview scheduled.',
      $1
    );
  `, [
    JSON.stringify([
      { stage: 'Applied', date: '2026-10-10' },
      { stage: 'Online Test', date: '2026-10-12' },
      { stage: 'Interview', date: '2026-10-14' }
    ])
  ]);

  await query(`
    INSERT INTO candidate_pipelines (job_id, student_id, stage)
    VALUES ('job_demo_1', 's1', 'Interview');
  `);

  console.log('--- Inserting Notifications ---');
  await query(`
    INSERT INTO notifications (id, student_id, type, title, message, read, created_at)
    VALUES 
      ('notif_demo_1', 's1', 'drive', 'Technical Interview Scheduled', 'Demo Company has scheduled your Technical Interview for Software Development Engineer role.', FALSE, '2026-10-14T10:00:00Z'),
      ('notif_demo_2', 's1', 'verification', 'Profile Verification Verified', 'All sections of your student profile have been verified by University Placement Coordinator.', TRUE, '2026-10-12T14:30:00Z');
  `);

  console.log('--- Inserting Mails ---');
  await query(`
    INSERT INTO mails (id, sender_from, sender, subject, snippet, body, received_at, criteria, processed, drive_id)
    VALUES (
      'mail_demo_1',
      'campus-recruitment@democompany.com',
      'Demo Company Talent Acquisition',
      'Campus Drive 2026 — Shortlisted Candidates for Technical Interviews',
      'We are pleased to share the shortlisted candidates for Software Development Engineer role...',
      'Dear Placement Team,\n\nFollowing the online assessment conducted on 12th October, we have shortlisted candidates for technical rounds. Interviews will begin shortly.\n\nBest regards,\nDemo Company Talent Acquisition',
      '2026-10-14T09:30:00Z',
      '{"minCgpa": 7.5, "branches": ["CSE", "IT"]}'::jsonb,
      TRUE,
      'drive_demo_1'
    );
  `);

  console.log('--- Inserting Test Attempts & Resume Version ---');
  await query(`
    INSERT INTO test_attempts (id, student_id, topic, date, score, total, percentage, weak_areas)
    VALUES 
      ('ta_demo_1', 's1', 'DSA', '2026-10-01', 8, 10, 80, '[]'::jsonb),
      ('ta_demo_2', 's1', 'React', '2026-10-08', 9, 10, 90, '[]'::jsonb);
  `);

  await query(`
    INSERT INTO resume_versions (id, student_id, name, date, score, template, include_sections, job_description)
    VALUES (
      'rv_demo_1',
      's1',
      'Demo Student - SDE Resume (ATS 88)',
      '2026-10-14',
      88,
      'Classic',
      '{"projects": true, "experience": true, "certificates": true}'::jsonb,
      'Full Stack Software Development Engineer skilled in React, Node.js, and SQL.'
    );
  `);

  console.log('--- Migration & Seeding of 3 Demo Users Completed Successfully! ---');
  process.exit(0);
}

resetAndSeed3DemoUsers().catch(err => {
  console.error('Reset error:', err);
  process.exit(1);
});
