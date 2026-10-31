# CAREER-OS — Comprehensive Technical Project Documentation & System Reference

> **Autonomous Campus Placement & Verified Career Operating System**  
> *A unified, multi-tenant platform bridging University Placement Cells, Corporate Recruiters, and Graduating Students with 100% private, self-hosted AI, WebRTC video interview studios, and verifiable credential auditing.*

---

## Table of Contents
1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Technology Stack & Runtime Specifications](#2-technology-stack--runtime-specifications)
3. [Database Architecture & Complete PostgreSQL Schemas](#3-database-architecture--complete-postgresql-schemas)
4. [Exhaustive REST API Reference](#4-exhaustive-rest-api-reference)
5. [Complete Page-by-Page Functional Breakdown](#5-complete-page-by-page-functional-breakdown)
   - [5.1 Public & Core Pages](#51-public--core-pages)
   - [5.2 Student Portal Pages](#52-student-portal-pages)
   - [5.3 University Placement Cell Pages](#53-university-placement-cell-pages)
   - [5.4 Corporate Recruiter Portal Pages](#54-corporate-recruiter-portal-pages)
   - [5.5 Live WebRTC Collaborative Interview Studio](#55-live-webrtc-collaborative-interview-studio)
   - [5.6 Aspirant Portal Pages (12th Pass-Out College Selection)](#56-aspirant-portal-pages-12th-pass-out-college-selection)
6. [AI Subsystems, 3D WebGL Avatar & Vision Proctoring](#6-ai-subsystems-3d-webgl-avatar--vision-proctoring)
7. [Client State Architecture & Offline Mutation Pipeline](#7-client-state-architecture--offline-mutation-pipeline)
8. [Deployment & Environment Configuration](#8-deployment--environment-configuration)

---

## 1. Executive Summary & System Architecture

### 1.1 Project Mission
CAREER-OS is an enterprise-grade placement operating system that eliminates resume fraud, streamlines campus recruitment pipelines, and automates technical and behavioral interview preparation through zero-vendor-cost, private AI microservices.

### 1.2 Multi-Tenant Topology
```
                          ┌─────────────────────────────┐
                          │   Next.js 16 Web Client     │
                          │   (React 19 + Tailwind v4)  │
                          └──────────────┬──────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
                 ▼                       ▼                       ▼
     ┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐
     │    Student Portal    ││  University Admin    ││  Corporate Recruiter │
     │  - ATS Resume Studio ││  - Profile Audits    ││  - Verified Discovery│
     │  - 3D AI Interview   ││  - Drives & Approval ││  - Hiring Pipeline   │
     │  - Code Sandbox Arena││  - NLP Mail Parser   ││  - WebRTC Room Host  │
     │  - Portfolio Sync    ││  - Materials Manager ││  - Rubric Scoring    │
     └──────────┬───────────┘└──────────┬───────────┘└──────────┬───────────┘
                │                       │                       │
                └───────────────────────┼───────────────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │   Next.js Server / APIs     │
                         │   (Dynamic Node.js Lambdas) │
                         └──────┬──────────────┬───────┘
                                │              │
            ┌───────────────────┴──┐        ┌──┴───────────────────┐
            │  PostgreSQL Database │        │ Local AI Microservice │
            │  (Supabase / Pooler) │        │ (FastAPI Port 8000)   │
            │  - 20 Relational Tbls│        │ - Piper Neural TTS    │
            │  - WebRTC Signaling  │        │ - faster-whisper STT  │
            │  - Dynamic Questions │        │ - MiniLM Embeddings   │
            └──────────────────────┘        └──────────────────────┘
```

### 1.3 Core Architectural Principles
1. **Zero Third-Party AI API Dependency**: No reliance on external proprietary APIs (OpenAI, Google Speech, ElevenLabs, Azure). All speech synthesis, audio transcription, and semantic rubric scoring run locally or in a self-hosted container via Piper TTS, Faster-Whisper, and ONNX Runtime.
2. **Single Source of Verified Truth**: Strict section-by-section verification stamps by University Placement Officers ensure that corporate recruiters exclusively discover candidates with validated CGPA, coursework, projects, and certifications.
3. **Resilient Offline-First Mutations**: Client operations update optimistic local state and `localStorage` instantly. If network connectivity drops, non-GET mutations are queued into `career_os_pending_mutations` and automatically replayed sequentially when connectivity restores.
4. **Hybrid WebRTC Video Interviewing**: Real-time peer-to-peer video streaming backed by a high-availability PostgreSQL polling signaling channel (`meeting_signals`), ensuring WebRTC connection establishment without mandatory external WebSocket servers.

---

## 2. Technology Stack & Runtime Specifications

### 2.1 Frontend & Core Framework
- **Framework**: Next.js 16.4.3 (App Router with SSR & Dynamic Route Handlers)
- **Vite Compatibility**: Vite 8.3.0 + `@vitejs/plugin-react` (Dual development/bundling workflow)
- **UI Runtime**: React 19.2.8 & React-DOM 19.2.8
- **Styling**: Tailwind CSS v4.3.3 (`@tailwindcss/postcss`, `@tailwindcss/vite`)
- **Iconography**: Lucide React (`lucide-react` v1.53.0)
- **Data Visualization**: Recharts v3.10.1 (Bar charts, line graphs, radar distribution)
- **3D Graphics & Canvas**: Three.js v0.186.1 (`three`) with GLTFLoader, OrbitControls, and ACES Filmic Tone Mapping

### 2.2 Client-Side AI & Vision
- **MediaPipe Tasks Vision**: `@mediapipe/tasks-vision` v1.1.0 (Face Landmarker with 468 3D landmarks + Hand Landmarker with 21 skeletal joints executing inside WebAssembly)
- **Code Execution**: In-browser Node.js isolated VM sandbox (`vm.Script` in API) and browser JavaScript evaluations

### 2.3 Backend & Database
- **Database Driver**: `pg` v8.23.1 (PostgreSQL client with dynamic serverless pooling)
- **Target Database**: Supabase PostgreSQL / AWS RDS / Local Postgres (SSL enabled)
- **Connection Management**: Singleton pool (`globalThis._pgPool`) configuring max 2 connections in serverless lambda environments and 10 in standard server mode to prevent connection exhaustion

### 2.4 Self-Hosted Python AI Engine (`ai-service/`)
- **Framework**: FastAPI (Uvicorn ASGI runner on port 8000)
- **Speech-to-Text (STT)**: `faster-whisper` (`whisper-base.en`, int8 CPU quantization)
- **Text-to-Speech (TTS)**: Piper Neural ONNX (`en_US-kusal-medium.onnx`, `en_GB-southern_english_female-low.onnx`, `en_US-amy-medium.onnx`)
- **Semantic Answer Evaluation**: `all-MiniLM-L6-v2` dense 384-dimensional cosine similarity via PyTorch/ONNX and lexical rubric analysis

---

## 3. Database Architecture & Complete PostgreSQL Schemas

The database contains **20 relational tables** supporting multi-tenancy, verified records, dynamic question generation, live WebRTC signaling, and resume snapshots.

### 3.1 Table Index & Entity Relationship Map
```
users (Auth & RBAC)
  ├── students (Master Academic Profile)
  │     ├── applications (Drive Submissions) ── drives / jobs
  │     ├── certificates (Verified Credentials)
  │     ├── resume_versions (Saved ATS Snapshots)
  │     ├── test_attempts (Mock Test History)
  │     ├── roadmap_progress (Learning Milestones)
  │     └── ai_interviews (Completed AI Sessions)
  ├── candidate_pipelines (Recruiter Pipeline Stages)
  ├── interviews (Scheduled Live Video Rounds)
  │     ├── interview_questions (Dynamic MCQs & Coding Challenges)
  │     └── meeting_signals (WebRTC Signaling Exchange)
  ├── materials (University Placement Resources & Playlists)
  ├── mails (Inbound Recruiter Communications)
  ├── sent_mails (Placement Broadcast Dispatches)
  ├── notifications (Student In-App Notices)
  ├── question_bank (Standardized Practice Problems)
  └── skill_taxonomy (Role-Specific Benchmarks)
```

---

### 3.2 Complete Table Definitions

#### 1. `users`
Authentication, roles, and profile linkages.
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL, -- 'student' | 'university' | 'company'
  student_id TEXT,    -- References students(id) when role='student'
  company_id TEXT,    -- Company identifier when role='company'
  company TEXT,       -- Organization name
  display_role TEXT,  -- Human-friendly title (e.g. 'Senior Technical Recruiter')
  avatar TEXT,        -- Profile picture URL
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `students`
Master student academic, personal, and verified portfolio records.
```sql
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  reg_no TEXT NOT NULL,
  email TEXT NOT NULL,
  branch TEXT NOT NULL, -- 'CSE', 'IT', 'ECE', 'EEE', 'Mechanical'
  batch INT NOT NULL,
  cgpa NUMERIC(4,2) NOT NULL,
  backlogs INT DEFAULT 0,
  phone TEXT,
  dob TEXT,
  gender TEXT,
  address TEXT,
  profile_status TEXT DEFAULT 'Pending',   -- 'Verified' | 'Partial' | 'Pending'
  placement_status TEXT DEFAULT 'In process', -- 'Placed' | 'In process' | 'Opted Out'
  profile_completion INT DEFAULT 0,
  github TEXT,
  linkedin TEXT,
  verification_status JSONB DEFAULT '{}'::jsonb, 
  -- Example: {"personal": "Verified", "education": "Verified", "skills": "Pending", "projects": "Verified", "experience": "Verified"}
  verification_remarks JSONB DEFAULT '{}'::jsonb,
  -- Example: {"skills": "Please upload certification for AWS Cloud practitioner"}
  education JSONB DEFAULT '{}'::jsonb,
  -- Example: {"tenth": {"board": "CBSE", "percentage": 92.5}, "twelfth": {"board": "State", "percentage": 94.0}}
  skills JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"name": "React", "category": "Frontend", "level": 5}, {"name": "Node.js", "category": "Backend", "level": 4}]
  projects JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"id": "gh_123", "title": "Microservices Engine", "description": "...", "technologies": ["Go"], "link": "...", "stars": 12, "isGithub": true, "featured": true}]
  experience JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"company": "Google", "role": "SWE Intern", "duration": "Summer 2025", "description": "..."}]
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `jobs`
Job requisitions created by corporate recruiters.
```sql
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required_skills JSONB DEFAULT '[]'::jsonb,
  min_cgpa NUMERIC(4,2) DEFAULT 0,
  branches JSONB DEFAULT '[]'::jsonb,      -- ['CSE', 'IT', 'ECE']
  openings INT DEFAULT 1,
  ctc NUMERIC(6,2) DEFAULT 0,              -- CTC in LPA (e.g. 18.00)
  deadline TEXT,
  location TEXT,
  status TEXT DEFAULT 'Open',              -- 'Open' | 'Closed' | 'Pending approval'
  applicants_count INT DEFAULT 0,
  approved_by_university BOOLEAN DEFAULT TRUE,
  drive_id TEXT,                           -- Associated placement drive
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `drives`
Campus placement drives approved and published by the placement cell.
```sql
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
  status TEXT DEFAULT 'Upcoming',          -- 'Upcoming' | 'Ongoing' | 'Completed'
  applicants_count INT DEFAULT 0,
  job_id TEXT,
  approved_by_university BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. `applications`
Student drive applications and status tracking.
```sql
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  drive_id TEXT,
  job_id TEXT,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  ctc NUMERIC(6,2) DEFAULT 0,
  applied_date TEXT NOT NULL,
  status TEXT DEFAULT 'Applied',            -- 'Applied' | 'Online Test' | 'Interview' | 'Offer' | 'Rejected'
  notes TEXT,
  status_history JSONB DEFAULT '[]'::jsonb, -- [{"stage": "Applied", "date": "2026-10-01"}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `certificates`
Student uploaded credentials with simulated OCR metadata.
```sql
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  expiry_date TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Valid',              -- 'Valid' | 'Expiring Soon' | 'Expired'
  file_name TEXT,
  verified BOOLEAN DEFAULT TRUE,
  verification_score INT DEFAULT 95,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. `mails`
Inbound raw recruitment emails received from HR teams.
```sql
CREATE TABLE IF NOT EXISTS mails (
  id TEXT PRIMARY KEY,
  sender_from TEXT NOT NULL,
  sender TEXT NOT NULL,
  subject TEXT NOT NULL,
  snippet TEXT,
  body TEXT NOT NULL,
  received_at TEXT NOT NULL,
  criteria JSONB DEFAULT '{}'::jsonb,       -- Extracted: {"minCgpa": 8.0, "branches": ["CSE"], "ctc": 16.5}
  processed BOOLEAN DEFAULT FALSE,
  drive_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8. `sent_mails`
Broadcast emails dispatched by university placement officers to students.
```sql
CREATE TABLE IF NOT EXISTS sent_mails (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL DEFAULT 'University Placement & Training Cell',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  target_type TEXT DEFAULT 'all',           -- 'all' | 'eligible' | 'branch'
  target_summary TEXT DEFAULT 'All Students',
  recipient_count INT DEFAULT 0,
  attachment_url TEXT,
  attachment_type TEXT,                     -- 'video' | 'pdf' | 'document'
  attachment_name TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  linked_mail_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 9. `notifications`
Direct student notices and circular alerts.
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  student_id TEXT,                          -- Specific student ID or NULL for broadcast
  type TEXT NOT NULL,                       -- 'drive' | 'interview' | 'verification' | 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  attachment_type TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TEXT NOT NULL
);
```

#### 10. `interviews`
Scheduled WebRTC and panel video interviews.
```sql
CREATE TABLE IF NOT EXISTS interviews (
  id VARCHAR(100) PRIMARY KEY,
  meeting_id VARCHAR(100) UNIQUE NOT NULL,
  job_id VARCHAR(100),
  company VARCHAR(255),
  role VARCHAR(255),
  student_id VARCHAR(100),
  student_name VARCHAR(255),
  student_email VARCHAR(255),
  student_branch VARCHAR(100),
  student_cgpa NUMERIC(4,2),
  students JSONB DEFAULT '[]'::jsonb,       -- Array of student candidates for panel interviews
  join_requests JSONB DEFAULT '[]'::jsonb,  -- Candidate waiting room lobby requests
  chat_messages JSONB DEFAULT '[]'::jsonb,  -- In-call text messages
  date VARCHAR(50),
  time VARCHAR(50),
  duration INTEGER DEFAULT 45,
  type VARCHAR(150),                        -- 'Technical Round 1', 'Executive HR', etc.
  status VARCHAR(50) DEFAULT 'Scheduled',   -- 'Scheduled' | 'Live' | 'Completed' | 'Cancelled'
  notes TEXT,
  recruiter_name VARCHAR(255),
  evaluation JSONB,                         -- Recruiter evaluation scoring rubric & feedback
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 11. `interview_questions`
Live on-the-spot technical questions and coding challenges pushed into video rooms.
```sql
CREATE TABLE IF NOT EXISTS interview_questions (
  id VARCHAR(100) PRIMARY KEY,
  meeting_id VARCHAR(100),
  type VARCHAR(50) NOT NULL,                -- 'mcq' | 'coding' | 'open_ended'
  title VARCHAR(255),
  topic VARCHAR(100),
  difficulty VARCHAR(50) DEFAULT 'Medium',  -- 'Easy' | 'Medium' | 'Hard'
  question TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  correct INTEGER DEFAULT 0,
  explanation TEXT,
  points INTEGER DEFAULT 10,
  code_starter TEXT,
  test_cases TEXT,
  is_active BOOLEAN DEFAULT false,          -- Currently active on candidates' screens
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 12. `meeting_signals`
High-concurrency WebRTC SDP offers, answers, and ICE candidate exchange.
```sql
CREATE TABLE IF NOT EXISTS meeting_signals (
  id VARCHAR(100) PRIMARY KEY,
  meeting_id VARCHAR(100) NOT NULL,
  from_peer VARCHAR(100) NOT NULL,
  to_peer VARCHAR(100),
  signal_type VARCHAR(100) NOT NULL,        -- 'offer' | 'answer' | 'ice-candidate' | 'chat'
  payload JSONB NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_signals_meeting ON meeting_signals(meeting_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_signals_created ON meeting_signals(created_at);
```

#### 13. `ai_interviews`
Completed sessions with the 3D Voice AI Interview Agent.
```sql
CREATE TABLE IF NOT EXISTS ai_interviews (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  role_title TEXT NOT NULL,
  experience_level TEXT DEFAULT 'Fresher / Entry Level',
  interview_mode TEXT DEFAULT 'Technical & Behavioral Simulation',
  overall_score INTEGER DEFAULT 0,          -- 0 - 100
  technical_score INTEGER DEFAULT 0,
  communication_score INTEGER DEFAULT 0,
  problem_solving_score INTEGER DEFAULT 0,
  culture_fit_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  transcript JSONB DEFAULT '[]'::jsonb,     -- Full conversation transcript
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  recommended_topics JSONB DEFAULT '[]'::jsonb,
  feedback_summary TEXT,
  duration_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 14. `materials`
Placement study guides, lecture notes, and structured video playlists.
```sql
CREATE TABLE IF NOT EXISTS materials (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'General', 
  -- 'DSA & Algorithms' | 'System Design' | 'Interview Prep' | 'Core Engineering'
  material_type VARCHAR(50) NOT NULL DEFAULT 'note', -- 'pdf' | 'video' | 'note' | 'playlist'
  file_url TEXT,
  reference_link TEXT,
  notes_content TEXT,
  target_branch VARCHAR(100) DEFAULT 'All',
  uploaded_by VARCHAR(255) DEFAULT 'University Placement Cell',
  playlist JSONB DEFAULT '[]'::jsonb,       -- Ordered video chapters with timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 15. `candidate_pipelines`
Corporate recruiter Kanban tracking.
```sql
CREATE TABLE IF NOT EXISTS candidate_pipelines (
  job_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  stage TEXT NOT NULL, -- 'Shortlisted' | 'Interview Scheduled' | 'Selected' | 'Offer Sent' | 'Rejected'
  PRIMARY KEY (job_id, student_id)
);
```

#### 16. `test_attempts`
Student performance in adaptive technical & aptitude mock assessments.
```sql
CREATE TABLE IF NOT EXISTS test_attempts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  date TEXT NOT NULL,
  score INT NOT NULL,
  total INT NOT NULL,
  percentage INT NOT NULL,
  weak_areas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 17. `resume_versions`
Historical ATS resume snapshots created by students.
```sql
CREATE TABLE IF NOT EXISTS resume_versions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  score INT DEFAULT 0,                      -- ATS compatibility score (0-100)
  template TEXT DEFAULT 'Classic',          -- 'Classic' | 'Modern' | 'Minimal' | 'Technical'
  include_sections JSONB DEFAULT '{}'::jsonb,
  job_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 18. `roadmap_progress`
Individual student mastery checkboxes for the phased role learning curriculums.
```sql
CREATE TABLE IF NOT EXISTS roadmap_progress (
  student_id TEXT NOT NULL,
  role TEXT NOT NULL,
  step_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, role, step_id)
);
```

#### 19. `question_bank`
Standard practice questions for offline interview prep.
```sql
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
```

#### 20. `skill_taxonomy`
Role-based industry benchmark proficiencies used for gap analysis.
```sql
CREATE TABLE IF NOT EXISTS skill_taxonomy (
  id SERIAL PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  skills JSONB NOT NULL -- [{"name": "React", "requiredLevel": 4, "category": "Frontend"}]
);
```

#### 21. `job_shortlists`
Deterministic candidate rankings and CDC approval workflow per job requisition.
```sql
CREATE TABLE IF NOT EXISTS job_shortlists (
  id VARCHAR(100) PRIMARY KEY,
  job_id VARCHAR(100) NOT NULL,
  student_id VARCHAR(100) NOT NULL,
  rank INT,
  match_score NUMERIC(5,2),
  score_breakdown JSONB,                    -- {"skillOverlap": 40, "certRelevance": 20, "projects": 20, "cgpa": 20}
  status TEXT DEFAULT 'Suggested',          -- 'Suggested' | 'CDC Approved' | 'Sent to Company' | 'Removed'
  shortlisted_by TEXT,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, student_id)
);
```

#### 22. `university_records`
Official institutional registrar records imported via CSV for automated identity and transcript audits.
```sql
CREATE TABLE IF NOT EXISTS university_records (
  reg_no VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  cgpa NUMERIC(4,2) NOT NULL,
  backlogs INT DEFAULT 0,
  passing_year INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 23. `verification_audit` & `verification_settings`
Granular discrepancy logs and configurable tolerances for auto-approving student profiles.
```sql
CREATE TABLE IF NOT EXISTS verification_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  cgpa_tolerance NUMERIC(3,2) DEFAULT 0.05,
  auto_verify_on_exact_match BOOLEAN DEFAULT true,
  require_manual_review_on_discrepancy BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_audit (
  id VARCHAR(100) PRIMARY KEY,
  student_id VARCHAR(100) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  student_value TEXT,
  official_value TEXT,
  discrepancy_type VARCHAR(50),             -- 'exact_match' | 'minor_discrepancy' | 'major_discrepancy' | 'record_not_found'
  status VARCHAR(50) DEFAULT 'Flagged',     -- 'Verified' | 'Flagged' | 'Rejected'
  audited_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 24. `material_ratings` & `material_enrollments`
Course participation, progress tracking, and Bayesian star reviews for placement study materials.
```sql
CREATE TABLE IF NOT EXISTS material_enrollments (
  id VARCHAR(100) PRIMARY KEY,
  material_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Enrolled',    -- 'Enrolled' | 'In Progress' | 'Completed'
  progress_pct INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(material_id, student_id)
);

CREATE TABLE IF NOT EXISTS material_ratings (
  id VARCHAR(100) PRIMARY KEY,
  material_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(100) NOT NULL,
  stars INT CHECK (stars >= 1 AND stars <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(material_id, student_id)
);
```

#### 25. `reschedule_requests`
Candidate interview conflict reporting and recruiter reschedule workflows.
```sql
CREATE TABLE IF NOT EXISTS reschedule_requests (
  id VARCHAR(100) PRIMARY KEY,
  interview_id VARCHAR(100) NOT NULL,
  student_id VARCHAR(100) NOT NULL,
  reason TEXT NOT NULL,
  proposed_slot_1 TIMESTAMPTZ NOT NULL,
  proposed_slot_2 TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'Pending',     -- 'Pending' | 'Approved' | 'Rejected'
  decision_notes TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 26. `universities`
Multi-tenant institutional profiles powering cross-campus recruiter benchmarking.
```sql
CREATE TABLE IF NOT EXISTS universities (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  logo TEXT
);
```

#### 27. `higher_ed_programs`
Curated domestic and international graduate degrees with rule-based eligibility mapping.
```sql
CREATE TABLE IF NOT EXISTS higher_ed_programs (
  id VARCHAR(100) PRIMARY KEY,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(100) NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  eligible_branches JSONB DEFAULT '[]'::jsonb,
  min_cgpa NUMERIC(4,2) DEFAULT 6.0,
  required_exams JSONB DEFAULT '[]'::jsonb,
  application_deadline DATE,
  scholarship_available BOOLEAN DEFAULT false,
  estimated_cost_inr BIGINT,
  curriculum_highlights JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 28. `referrals`, `reward_ledger` & `recommendation_requests`
Peer network rewards with anti-abuse velocity protection and faculty endorsement badges.
```sql
CREATE TABLE IF NOT EXISTS referrals (
  id VARCHAR(100) PRIMARY KEY,
  referrer_id VARCHAR(100) NOT NULL,
  referee_email VARCHAR(255) NOT NULL,
  referee_id VARCHAR(100),
  code VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'Invited',     -- 'Invited' | 'Joined' | 'Verified' | 'Placed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reward_ledger (
  id VARCHAR(100) PRIMARY KEY,
  student_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  coins INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_requests (
  id VARCHAR(100) PRIMARY KEY,
  student_id VARCHAR(100) NOT NULL,
  faculty_name VARCHAR(255) NOT NULL,
  faculty_email VARCHAR(255) NOT NULL,
  relationship VARCHAR(100) DEFAULT 'Project Guide',
  endorsement_text TEXT,
  status VARCHAR(50) DEFAULT 'Pending',     -- 'Pending' | 'Endorsed' | 'Declined'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 29. `colleges`, `aspirant_profiles` & `college_applications`
12th pass-out college selection portal, cutoffs, and admissions application desk.
```sql
CREATE TABLE IF NOT EXISTS colleges (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  courses JSONB DEFAULT '[]'::jsonb,
  fees NUMERIC(10,2) DEFAULT 0,
  cutoff JSONB DEFAULT '{}'::jsonb,         -- {"stream": "PCM", "minTwelfth": 75, "minJee": 80}
  seats INT DEFAULT 120,
  accreditation VARCHAR(50) DEFAULT 'NAAC A+',
  rating NUMERIC(3,2) DEFAULT 4.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aspirant_profiles (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  twelfth_percent NUMERIC(5,2),
  stream VARCHAR(50),                       -- 'PCM' | 'PCB' | 'Commerce' | 'Arts'
  jee_percentile NUMERIC(5,2),
  preferred_location VARCHAR(100),
  budget_max NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS college_applications (
  id VARCHAR(100) PRIMARY KEY,
  aspirant_id VARCHAR(100) NOT NULL,
  college_id VARCHAR(100) NOT NULL,
  course VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Applied',     -- 'Applied' | 'Under Review' | 'Accepted' | 'Waitlisted' | 'Rejected'
  sop TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Exhaustive REST API Reference

All Next.js API endpoints reside in `src/app/api/` and output standard JSON responses. Serverless functions implement cache busters (`no-store`) for real-time reads and writes.

| Route Path | HTTP Methods | RBAC Role | Purpose & Parameters |
|:---|:---|:---|:---|
| `/api/initial-data` | `GET` | Public / All | Returns completely hydrated state of all collections for bootstrap. |
| `/api/auth/login` | `POST` | Public | Authenticates via email/password or 1-click demo role switcher. |
| `/api/auth/users` | `GET` | Public / All | Lists system users with role partitions. |
| `/api/students` | `GET`, `POST` | All / Admin | Lists students or registers new student profiles. |
| `/api/students/[id]` | `GET`, `PUT` | Student / Admin | Fetches profile or updates verification stamps and sections. |
| `/api/students/github-sync` | `POST` | Student | Synchronizes public repositories and metadata via GitHub REST API. |
| `/api/drives` | `GET`, `POST` | All / Admin | Lists campus drives or posts new placement drives. |
| `/api/drives/[id]` | `GET`, `PUT` | All / Admin | Fetches single drive or updates drive eligibility and status. |
| `/api/jobs` | `GET`, `POST` | Recruiter | Lists job requisitions or submits new requisition for university review. |
| `/api/jobs/[id]` | `GET`, `PUT` | Recruiter | Retrieves single job or updates requisition criteria. |
| `/api/jobs/[id]/shortlist/generate`| `POST` | University | Generates deterministic CDC candidate shortlist (40/20/20/20 scoring). |
| `/api/jobs/[id]/shortlist` | `GET`, `PATCH` | University / Recruiter| Reads ranked shortlist roster or updates candidate shortlist approval status. |
| `/api/jobs/[id]/shortlist/send` | `POST` | University | Dispatches approved candidates to corporate recruiter pipeline & notifies students. |
| `/api/university/records` | `GET`, `POST` | University | Ingests official registrar CSV batches or retrieves official academic directory. |
| `/api/university/verification` | `GET`, `POST` | University | Evaluates automated rule engine tolerances against student profile submissions. |
| `/api/applications` | `GET`, `POST`, `PATCH` | Student / Recruiter | Submits student application or advances candidate status. |
| `/api/certificates` | `GET`, `POST`, `DELETE`| Student | Ingests new certificates, performs OCR extraction, or deletes credentials. |
| `/api/pipeline` | `GET`, `POST` | Recruiter | Reads candidate Kanban pipeline or updates candidate stage. |
| `/api/interviews` | `GET`, `POST`, `PATCH` | Recruiter / Student| Fetches scheduled interviews, books new panel rounds, saves evaluations. |
| `/api/interviews/reschedule` | `GET`, `POST` | Student / Recruiter | Submits candidate reschedule request or fetches active requests. |
| `/api/interviews/reschedule/[id]` | `PATCH` | Recruiter | Approves or rejects student interview reschedule request. |
| `/api/interviews/join-request` | `GET`, `POST`, `PATCH`| All / Recruiter| Manages WebRTC waiting room lobby (submit request, admit, deny). |
| `/api/interviews/messages` | `GET`, `POST` | All | Reads or posts in-call live chat messages for a meeting. |
| `/api/interviews/questions` | `GET`, `POST` | Recruiter / Candidate| Fetches room questions, synthesizes dynamic on-the-spot questions. |
| `/api/meeting-signal` | `GET`, `POST`, `HEAD` | All (WebRTC) | High-speed WebRTC P2P signaling exchange and latency health checks. |
| `/api/ai-interview` | `GET`, `POST` | Student | Lists historical AI sessions or records completed 3D AI interview dossiers. |
| `/api/ai-interview/evaluate`| `POST` | Student (AI) | Evaluates answer against rubric via MiniLM ONNX or heuristic fallback. |
| `/api/materials` | `GET`, `POST` | All / Admin | Lists study materials or uploads new notes and playlists. |
| `/api/materials/[id]` | `GET`, `PUT`, `DELETE`| All / Admin | Fetches, updates, or deletes placement study materials. |
| `/api/materials/[id]/enroll` | `POST` | Student | Enrolls or marks completion status for placement courses and playlists. |
| `/api/materials/[id]/rate` | `POST` | Student | Submits 1-5 star review and student feedback comment. |
| `/api/materials/top` | `GET` | All | Returns Bayesian-weighted top courses (`0.5*stars + 0.3*enrol + 0.2*completion`). |
| `/api/materials/[id]/media` | `GET` | All | Streams binary media (PDF/video) with HTTP range seeking support. |
| `/api/mails` | `GET`, `PATCH` | Admin | Fetches inbound recruiter emails or marks them as converted/processed. |
| `/api/sent-mails` | `GET`, `POST` | Admin | Records dispatched broadcast communications sent to student batches. |
| `/api/company/university-ranking` | `GET` | Recruiter / University| Evaluates multi-university placement performance & skill readiness benchmarks. |
| `/api/higher-education` | `GET` | Student | Returns matched graduate programs, exam syllabi, and study abroad guides. |
| `/api/student/referrals` | `GET`, `POST` | Student | Generates unique referral links, tracks rewards coins, and requests faculty endorsements. |
| `/api/university/referrals` | `GET`, `POST` | University | Institutional referral tree monitoring and faculty recommendation endorsements. |
| `/api/aspirant/profile` | `GET`, `POST` | Aspirant | Reads or updates 12th pass-out academic scores and target college preferences. |
| `/api/aspirant/colleges` | `GET` | Aspirant / Public | Searches colleges with automated stream & percentile eligibility filtering. |
| `/api/aspirant/applications` | `GET`, `POST` | Aspirant | Submits or tracks higher secondary college admission applications. |
| `/api/university/admissions` | `GET`, `PATCH` | University | Reviews, accepts, waitlists, or rejects 12th pass-out admissions applicants. |
| `/api/notifications` | `GET`, `POST`, `PATCH`| All | Lists notifications, dispatches announcements, marks read. |
| `/api/prep` | `GET` | Student | Fetches practice questions from question bank categorized by topic. |
| `/api/prep/execute-code` | `POST` | Student | Executes user submitted code against test cases in isolated runtime. |
| `/api/prep/generate-question`| `POST` | Student | Dynamically generates next-tier coding challenge or targeted MCQs. |
| `/api/resume-versions` | `GET`, `POST`, `DELETE`| Student | Manages saved ATS resume version snapshots. |
| `/api/roadmap` | `GET`, `POST` | Student | Fetches or toggles completion of phased skill roadmap milestones. |
| `/api/test-attempts` | `GET`, `POST` | Student | Records mock test score and diagnostic weak areas. |
| `/api/tts` | `GET`, `POST` | Student (AI) | Returns pre-rendered audio prompt or proxies to Piper Neural TTS. |
| `/api/stt` | `POST` | Student (AI) | Proxies audio recordings to self-hosted Faster-Whisper transcriber. |

---

## 5. Complete Page-by-Page Functional Breakdown

### 5.1 Public & Core Pages

#### 1. Landing Page (`/`)
- **File**: `src/app/page.jsx` $\to$ `src/views/Landing.jsx`
- **Access**: Public
- **Layout & Visual Design**: Dark modern glassmorphic theme with animated purple/emerald mesh gradient background. Features interactive 3D avatar preview, feature marquee, verified placement counter, commercial pricing comparison matrix, and leadership quotes.
- **Key Features**:
  - Live role switcher previewing platform from Student, University, and Recruiter perspectives.
  - Interactive ROI calculator showing cost savings of zero-vendor local AI.
  - Quick action buttons routing directly to pre-authenticated portal views.

#### 2. Authentication Page (`/login`)
- **File**: `src/app/login/page.jsx` $\to$ `src/views/Login.jsx`
- **Access**: Public
- **Layout & Visual Design**: Split hero card with dark acrylic backdrop blur, branded logo, and floating particles.
- **Key Features**:
  - **1-Click Quick Demo Login**: Instantly switch roles between `Aarav Sharma (Student)`, `Dr. Rajesh Kumar (University Admin)`, and `Priya Mehta (Corporate Recruiter)`.
  - **Manual Credential Login**: Authenticates email and password against the PostgreSQL `users` table via `/api/auth/login`.
  - Error state handling with field validation and toast notifications.

#### 3. Institutional Overview (`/about`)
- **File**: `src/app/about/page.jsx` $\to$ `src/views/About.jsx`
- **Access**: Public
- **Layout & Visual Design**: Executive report format detailing institutional placement achievements, campus recruitment partners, security compliance, and privacy guarantees of self-hosted AI models.

---

### 5.2 Student Portal Pages

#### 1. Command Dashboard (`/student/dashboard`)
- **File**: `src/views/student/Dashboard.jsx`
- **Access**: Role `student`
- **Key Features**:
  - **4 Top-Level Metric Cards**: Profile Completion Percentage, Active Applications Count, ATS Resume Match Score, and Verified Certificates Count.
  - **30-Day Certificate Expiry Warning**: Prominent amber alert banner rendered if any verified certification has an expiry date within 30 days.
  - **Eligible Placement Drives Table**: Displays upcoming campus drives automatically filtered against candidate's CGPA, branch, and active backlogs. Features 1-click "Apply" button creating instant application records.
  - **Recent Notifications Feed**: Quick preview of official placement cell circulars with unread indicators.

#### 2. University-Verified Profile (`/student/profile`)
- **File**: `src/views/student/Profile.jsx`
- **Access**: Role `student`
- **Key Features**:
  - **5 Audited Sections**: Personal Information, Academic Standing, Technical Skills, Projects & Publications, and Work Experience.
  - **Immutable Verification Badges**: Every section renders an emerald `Verified by University`, amber `Pending Review`, or rose `Action Required` badge with placement officer notes.
  - **Auto-Downgrade Safeguard**: Modifying an already verified section automatically resets its status to `Pending` and alerts the placement cell audit desk.
  - **Interactive Skill Matrix**: Add skills with category tags (Frontend, Backend, Cloud, Core) and 1–5 visual proficiency rating bars.

#### 3. ATS Resume Builder & Job Match Analyzer (`/student/resume`)
- **File**: `src/views/student/Resume.jsx`
- **Access**: Role `student`
- **Key Features**:
  - **Real-Time ATS Job Scorer**: Paste any target Job Description to instantly calculate an ATS compatibility score (0–100%) based on keyword frequency, skill overlap, and section completeness.
  - **Keyword Gap Analysis**: Highlights matched keywords in emerald badges and missing critical keywords in rose badges.
  - **4 Layout Typography Presets**: `Classic` (executive serif), `Modern` (two-column layout with colored section dividers), `Minimal` (clean monospace), and `Technical` (dense engineering grid).
  - **Version Snapshots**: Save customized resume versions with custom titles and ATS scores into PostgreSQL (`resume_versions`).
  - **Print & PDF Export**: Native `@media print` styling generating pixel-perfect A4 resumes without UI chrome.

#### 4. Application Kanban Tracker (`/student/applications`)
- **File**: `src/views/student/Applications.jsx`
- **Access**: Role `student`
- **Key Features**:
  - **5-Column Pipeline**: `Applied` $\to$ `Online Test` $\to$ `Interview` $\to$ `Offer` $\to$ `Rejected`.
  - **Stage Elapsed Timers**: Badges showing days elapsed in each stage to identify stagnant hiring processes.
  - **Detailed Application Drawer**: Displays complete status transition audit history (`statusHistory`) with date stamps and private recruiter feedback notes.
  - **Off-Campus Application Modal**: Allows students to track independent job applications outside campus drives.

#### 5. Smart Certificates & OCR Ingestion (`/student/certificates`)
- **File**: `src/views/student/Certificates.jsx`
- **Access**: Role `student`
- **Key Features**:
  - **Simulated OCR File Ingestion**: Upload PDF or image credentials; triggers 600ms scanning animation extracting title, issuer, issue date, expiry date, and verified skill tags.
  - **Anti-Fraud Duplicate Detection**: Flags duplicate submissions matching title, issuer, and issue date against existing database entries.
  - **Skill Synchronization**: Saving a verified certificate automatically syncs verified skills directly into the student's technical skills matrix.

#### 6. Skill Gap Analysis & Phased Roadmap (`/student/skill-gap`)
- **File**: `src/views/student/SkillGap.jsx`
- **Access**: Role `student`
- **Key Features**:
  - **Role Benchmarking**: Select target industry roles (Frontend Developer, Backend Engineer, Data Analyst, Full Stack, Cloud Engineer) to load industry benchmark proficiencies.
  - **Recharts Comparative Bar Chart**: Graphs Required Level vs Candidate Current Level side-by-side.
  - **4-Phase Action Curriculum**: Sequential learning roadmap with estimated time commitments and checkable milestones stored in `roadmap_progress`.

#### 7. Interview Prep & Live Coding Arena (`/student/interview-prep`)
- **File**: `src/views/student/InterviewPrep.jsx`
- **Access**: Role `student`
- **Key Features**:
  - **Live Coding Arena (`CodingArena.jsx`)**: Monaco-like split-pane IDE with language selector (JavaScript, Python, Java, C++), code execution sandbox (`/api/prep/execute-code`), visible and hidden test cases, runtime complexity badges, and tab-switch anti-cheat monitoring.
  - **Automated Level-Up Engine**: Solved challenges automatically generate harder follow-up challenges via `/api/prep/generate-question`.
  - **Adaptive Mock Test Engine**: 10-question dynamic difficulty test adjusting Easy, Medium, and Hard based on student's previous answer correctness.
  - **Performance Tracker**: Historical line charts visualizing speed, accuracy, and score trends over time.

#### 8. 1-on-1 Voice AI Placement Interview Agent (`/student/ai-interview`)
- **File**: `src/views/student/AiInterview.jsx`
- **Access**: Role `student`
- **Key Features**:
  - **3D WebGL Avatar (`ThreeAvatarCanvas.jsx`)**: Photorealistic 3D avatar loaded in Three.js with studio lighting, executive office background, natural breathing animations, and audio RMS lip-sync.
  - **WASM 3D Face Mesh Proctoring (`CameraVisionProctor.jsx`)**: 468-point facial landmark tracker with 3-second personalized baseline calibration. Detects lap/mobile glances ($\Delta\text{Pitch} > 0.22$). 3-strike escalation with MediaPipe Hand Landmarker verification challenge.
  - **Neural Speech & Whisper STT**: Streams question voice through local Piper TTS and transcribes student audio via faster-whisper in $<1.5$ seconds.
  - **Semantic Rubric Evaluation**: MiniLM ONNX dense cosine similarity scoring against key conceptual rubric criteria with actionable improvement feedback.

#### 9. Placement Study Materials & Interactive Course Ratings (`/student/materials`)
- **File**: `src/views/student/Materials.jsx`
- **Access**: Role `student`
- **Key Features**:
  - Categorized materials (DSA, System Design, Placement Prep, Core Engineering).
  - **Course Enrollment & Completion Tracking**: 1-click "Enroll Course" with optimistic state updates, tracking progress percentage and completion badges.
  - **Interactive 5-Star Rating Widget**: Submit verified course reviews with star ratings (1–5) and written feedback comments.
  - **Bayesian-Ranked Top Courses Tab**: Dynamic leaderboard ranked using $0.5 \times \text{weightedStars} + 0.3 \times \text{enrolmentVolume} + 0.2 \times \text{completionRate}$.
  - Embedded video playlist player with chapter navigation, playback speed toggles, and branch-targeted priority tags.
  - Full-screen Markdown reader and PDF preview modal.

#### 10. Placement Communications Mailbox (`/student/mail`)
- **File**: `src/views/student/Mail.jsx`
- **Access**: Role `student`
- **Key Features**:
  - Aggregates official placement circulars and company interview notices.
  - Filter by unread status, date ranges, and attachment types (video briefings vs PDF circulars).
  - Inline HTML5 video player and PDF preview drawer with automatic read-state sync.

#### 11. Public Verifiable Digital Portfolio (`/student/portfolio`)
- **File**: `src/views/student/Portfolio.jsx`
- **Access**: Role `student`
- **Key Features**:
  - **GitHub Synchronizer**: Connects GitHub username to automatically fetch public repositories, star counts, fork counts, and primary languages via `/api/students/github-sync`.
  - Pin/unpin featured repositories and highlight proprietary projects.
  - Verified university credentials badge with copyable public portfolio URL (`/p/:regNo`).

#### 12. Student Video Interview Calls Hub & Reschedule Desk (`/student/interviews` & `/student/calls`)
- **File**: `src/views/student/Interviews.jsx`
- **Access**: Role `student`
- **Key Features**:
  - Lists scheduled recruiter interviews with company name, job role, date, time, and status.
  - **Universal Meeting Provider Join**: Seamlessly launches external meetings (Google Meet, Microsoft Teams, Zoom, Custom) or native in-browser WebRTC `/interview-room/:id`.
  - **Conflict Reschedule Request Modal**: Allows candidates to formally request a reschedule with reason and 2 proposed backup time slots.
  - View post-interview performance evaluations and recruiter feedback notes.

#### 13. Higher Education & Study Abroad Advisor (`/student/higher-education`)
- **File**: `src/views/student/HigherEducation.jsx` $\to$ `src/app/student/higher-education/page.jsx`
- **Access**: Role `student`
- **Key Features**:
  - **Rule-Based Program Matcher**: Evaluates student's verified CGPA and engineering branch against 16+ curated master's and doctoral degrees across India, USA, Germany, UK, and Singapore.
  - Eligibility status indicator (`Eligible` in emerald, `Reach` in amber) with specific CGPA shortfall metrics.
  - Comprehensive exam syllabi and timeline guides for GATE, GRE, TOEFL, and IELTS.
  - Domestic vs International estimated tuition and scholarship availability filters.

#### 14. Peer Referrals & Faculty Endorsements (`/student/referrals`)
- **File**: `src/views/student/Referrals.jsx` $\to$ `src/app/student/referrals/page.jsx`
- **Access**: Role `student`
- **Key Features**:
  - **Personal Referral Link**: Unique copyable referral codes with real-time invite tracker (`Invited` $\to$ `Joined` $\to$ `Verified` $\to$ `Placed`).
  - **Placement Coin Rewards Ledger**: Earn coins for onboarding peers and achieving milestones; redeemable for mock interview passes and premium prep guides.
  - **Anti-Abuse Velocity Limits**: Blocks self-referrals, email collision abuse, and throttles burst invite creation.
  - **Faculty Recommendation Request Desk**: Submit formal endorsement requests to department professors; approved recommendations render gold verified seals on digital portfolios.


---

### 5.3 University Placement Cell Pages

#### 1. Placement Executive Dashboard (`/university/dashboard`)
- **File**: `src/views/university/Dashboard.jsx`
- **Access**: Role `university`
- **Key Features**:
  - **5 Top KPIs**: Total Batch Students (Batch 2026), Verified Profiles Percentage, Active Campus Drives, Total Placed Students, and Overall Placement Rate.
  - **Branch-Wise Placement Bar Chart**: Visualizes Placed vs Total Students across CSE, IT, ECE, EEE, and Mechanical.
  - **Action Required Queue**: Highlights students with pending profile changes requiring immediate audit stamps.

#### 2. Student Verification Directory (`/university/students`)
- **File**: `src/views/university/Students.jsx`
- **Access**: Role `university`
- **Key Features**:
  - Multi-parameter filter bar: Name/Registration number search, Branch dropdown, CGPA range slider, Backlog filter (0 vs >0), and Verification status filter (`Verified`, `Partial`, `Pending`).
  - Paginated roster with quick "Inspect Profile" buttons routing to student audit desk.

#### 3. Granular Profile Verification Audit (`/university/students/[id]`)
- **File**: `src/views/university/StudentDetail.jsx`
- **Access**: Role `university`
- **Key Features**:
  - **Section-by-Section Audit**: Independent review cards for Personal Information, Academic Records, Technical Skills, Projects, and Experience.
  - **One-Click Approval / Rejection**: Approve sections with emerald verification stamps or reject with specific officer remarks sent to student dashboard.
  - Automatic recalculation of overall profile status (`Verified` if all pass, `Partial` if some pass, `Pending` otherwise).

#### 4. Campus Placement Drives & CDC Shortlisting Hub (`/university/drives`)
- **File**: `src/views/university/Drives.jsx`
- **Access**: Role `university`
- **Key Features**:
  - **"Float New Campus Drive" Modal**: Define company, role, package (CTC), minimum CGPA, eligible engineering branches, maximum backlogs, and deadlines.
  - **Corporate Requisitions Review Queue**: Review job postings submitted by registered recruiters (`Pending approval`), with 1-click Approve or Reject.
  - **CDC Smart Candidate Shortlisting Tab**:
    - Generates deterministic candidate rankings based on required-skill overlap (40%), certificate relevance (20%), verified projects (20%), and CGPA (20%).
    - Score breakdown tooltip showing exact sub-score components per candidate.
    - Toggle individual candidate approval status (`Suggested` $\to$ `CDC Approved` $\to$ `Removed`).
    - **"Send to Company & Notify Students" Button**: Pushes approved candidates into the corporate recruiter's hiring pipeline as `Shortlisted`, dispatches broadcast emails, and alerts students.
  - Active drive monitoring cards displaying applicant volume and application deadlines.

#### 5. Drive Detail, Applicant Roster & CSV Export (`/university/drives/[id]`)
- **File**: `src/views/university/DriveDetail.jsx`
- **Access**: Role `university`
- **Key Features**:
  - Comprehensive applicant roster showing candidate name, registration number, branch, CGPA, backlogs, profile verification badge, and application timestamp.
  - Actions to Shortlist or Reject applicants in real-time.
  - **One-Click CSV Export**: Compiles filtered applicant roster into standard spreadsheet format (`Student Name, Reg No, Branch, CGPA, Backlogs, Status, Application Date`).

#### 6. Placement Materials Publishing Suite (`/university/materials`)
- **File**: `src/views/university/Materials.jsx`
- **Access**: Role `university`
- **Key Features**:
  - Upload PDF guides, lecture notes, or write raw Markdown cheat sheets.
  - Curate multi-video YouTube playlists with ordered chapters and timestamps.
  - Tag resources by target engineering branches (CSE, IT, ECE, EEE, Mechanical, or All Branches).
  - Track student course enrollments, completion rates, and average star reviews per material.

#### 7. NLP Recruiter Email Filter & Targeted Broadcasts (`/university/mail-filter`)
- **File**: `src/views/university/MailFilter.jsx`
- **Access**: Role `university`
- **Key Features**:
  - **Inbound NLP Mail Extraction**: Select unstructured recruiter email; automated regex/heuristic parser extracts minimum CGPA, eligible branches, allowed backlogs, CTC, and role title.
  - **Live Student Counter**: Queries live student roster and calculates exact count of eligible students matching the parsed parameters.
  - **One-Click "Convert to Drive"**: Transforms parsed recruiter email into an active campus placement drive.
  - **Targeted Broadcast Dispatcher**: Dispatch circular announcements to All Students, Eligible Students Only, or Specific Branches with optional video briefings and PDF attachments.

#### 8. Registrar Records CSV Ingestion & Rule Engine (`/university/records-import`)
- **File**: `src/views/university/RecordsImport.jsx` $\to$ `src/app/university/records-import/page.jsx`
- **Access**: Role `university`
- **Key Features**:
  - **Registrar CSV Ingestion**: Drag-and-drop official student roster (`reg_no, name, email, branch, cgpa, backlogs, passing_year`) with real-time parsing and validation.
  - **Automated Verification Rule Engine**: Compares student self-reported profile data against official registrar records using configurable tolerances ($\pm 0.05$ CGPA tolerance).
  - **Discrepancy Audit Log**: Classifies variances into `exact_match`, `minor_discrepancy`, and `major_discrepancy` with audit trail stored in `verification_audit`.
  - Batch "Auto-Verify Exact Matches" button updating eligible student profiles instantly.

#### 9. Institutional Referral Tree & Recommendation Desk (`/university/referrals`)
- **File**: `src/views/university/Referrals.jsx` $\to$ `src/app/university/referrals/page.jsx`
- **Access**: Role `university`
- **Key Features**:
  - **Campus Referral Network Tree**: Visualizes student invitation graphs, active referral codes, and conversion milestones (`Invited` $\to$ `Placed`).
  - **Rewards Ledger Oversight**: Inspects campus coin allocations and prevents irregular spike activities.
  - **Faculty Recommendation Endorsement Desk**: Review pending student requests, draft verified endorsement statements, and issue cryptographically verifiable golden seals.

#### 10. 12th Pass-Out Admissions Review Desk (`/university/admissions`)
- **File**: `src/views/university/Admissions.jsx` $\to$ `src/app/university/admissions/page.jsx`
- **Access**: Role `university`
- **Key Features**:
  - Manages incoming college applications from 12th pass-out aspirants.
  - Real-time applicant roster displaying 12th PCM/PCB percentages, JEE percentiles, statements of purpose (SOP), and program preferences.
  - 1-click status actions: `Accept`, `Waitlist`, `Reject`, or `Mark Under Review`.

---

### 5.4 Corporate Recruiter Portal Pages

#### 1. Corporate Recruitment Dashboard (`/company/dashboard`)
- **File**: `src/views/company/Dashboard.jsx`
- **Access**: Role `company`
- **Key Features**:
  - **4 Top Metrics**: Active Campus Openings, Total Applicants, Candidates in Interview, and Offers Extended.
  - **Hiring Funnel Bar Chart**: Visualizes 4-stage recruitment velocity (`Applied` $\to$ `Screened` $\to$ `Interview` $\to$ `Offer`).
  - Feed of recent candidate applications with direct links to evaluation dossiers.

#### 2. Job Requisition Manager (`/company/jobs`)
- **File**: `src/views/company/Jobs.jsx`
- **Access**: Role `company`
- **Key Features**:
  - Create new campus job postings specifying role title, description, required skills, minimum CGPA, allowed branches, CTC package, vacancies, and deadlines.
  - Submitted requisitions enter `Pending approval` status awaiting placement cell clearance.

#### 3. Verified-Only Candidate Discovery (`/company/candidates`)
- **File**: `src/views/company/Candidates.jsx`
- **Access**: Role `company`
- **Key Features**:
  - **Zero Resume Fraud Guarantee**: Search pool exclusively surfaces students with `Verified` placement cell verification status.
  - **Dynamic Skill Match %**: Select an active job requisition to calculate real-time percentage match against candidate skills.
  - **Advanced Certification Filters**: Filter by certificate title (AWS, Google Cloud, Docker, Kubernetes) and minimum certification count.
  - Granular filters: branch multi-select, CGPA slider, verified certificates toggle, and skill tag pills.

#### 4. Candidate Evaluation Dossier (`/company/candidates/[id]`)
- **File**: `src/views/company/CandidateDetail.jsx`
- **Access**: Role `company`
- **Key Features**:
  - Complete candidate dossier: verified academic record, university verification stamps, skill ratings, GitHub repositories, and verified certificates.
  - Recruiter evaluation notes panel: record round-by-round comments, ratings, and advance candidates directly into interview scheduling.

#### 5. Requisition Recruitment Pipeline (`/company/pipeline`)
- **File**: `src/views/company/Pipeline.jsx`
- **Access**: Role `company`
- **Key Features**:
  - Switch between active company job postings.
  - 5-column Kanban board: `Shortlisted` $\to$ `Interview Scheduled` $\to$ `Selected` $\to$ `Offer Sent` $\to$ `Rejected`.
  - **CDC Shortlist Integration**: Surfaces pre-screened, university-approved candidates tagged with deterministic match scores and CDC approval badges.
  - Moving candidate to `Interview Scheduled` launches scheduler modal (date, time, mode, notes), updates pipeline, and sends automated candidate notifications.

#### 6. Recruiter Video Interview Schedule & Launchpad (`/company/interviews` & `/company/calls`)
- **File**: `src/views/company/Interviews.jsx`
- **Access**: Role `company`
- **Key Features**:
  - Manage scheduled live video interviews across technical and HR rounds.
  - **Universal Meeting Provider Configuration**: Select between native CareerOS WebRTC, Microsoft Teams, Google Meet, Zoom, or Custom URL with live URL format validation.
  - **Student Reschedule Request Review Desk**: Inspect candidate conflict reasons and proposed time slots with 1-click Accept or Decline.
  - 1-click launch into WebRTC `/interview-room/:id` with real-time status badges, join request alerts, and candidate evaluation summaries.

#### 7. Multi-University Placement Intelligence & Benchmarking (`/company/university-insights`)
- **File**: `src/views/company/UniversityInsights.jsx` $\to$ `src/app/company/university-insights/page.jsx`
- **Access**: Role `company`
- **Key Features**:
  - **Cross-Campus Institutional Rankings**: Evaluates participating universities using a deterministic multi-factor model: Placement Rate (40%), Technical Skill Score (20%), Profile Verification % (20%), Average CGPA (10%), and Recruiter Feedback Rating (10%).
  - **Statistical Sample Size Guard**: Transparently flags universities with $< 20$ graduating students to prevent small-sample skews.
  - **Interactive Radar & Metric Comparison**: Compare up to 3 universities side-by-side on technical depth, placement velocity, verified credentials, and academic standing.

---

### 5.5 Live WebRTC Collaborative Interview Studio

#### Live Interview Room (`/interview-room/[id]`)
- **File**: `src/app/interview-room/[id]/page.jsx` $\to$ `src/views/InterviewRoom.jsx`
- **Access**: Authenticated Student or Recruiter with matching meeting ID
- **Key Features**:
  1. **Full-Mesh WebRTC Video Calling**:
     - Peer-to-peer audio and video streaming via browser `RTCPeerConnection`.
     - High-speed fallback signaling channel via `/api/meeting-signal` stored in PostgreSQL.
     - Screen sharing with seamless screen-to-camera track replacement.
  2. **Waiting Room Lobby & Admit Queue**:
     - Candidate joins room in `pending` state; host receives real-time notification with student credentials (name, branch, CGPA).
     - Host can Admit or Deny candidate via `/api/interviews/join-request`.
  3. **Multi-Student Panel Support**:
     - Host can interview multiple students simultaneously with dynamic video grid layouts and candidate selector tabs.
  4. **In-Call Collaborative Code Editor & Sandbox Runner**:
     - Real-time synchronized code editor supporting JavaScript, Python, Java, and C++.
     - Code execution powered by `/api/prep/execute-code` evaluating visible and hidden test cases.
  5. **On-The-Spot Dynamic Question Generator**:
     - Host can prompt and push instant technical MCQs or coding problems directly to candidates' screens via `/api/interviews/questions`.
     - Candidate answers are instantly submitted, auto-graded, and displayed on host evaluation deck.
  6. **In-Call Real-Time Text Chat**:
     - Integrated live chat sidebar persisting messages to `/api/interviews/messages`.
  7. **Recruiter Live Evaluation Rubric**:
     - In-call grading panel scoring Technical Accuracy, Problem Solving, Communication, and Culture Fit.
     - Saves structured evaluation directly into the `interviews` table.

---

### 5.6 Aspirant Portal Pages (12th Pass-Out College Selection)

#### 1. Aspirant Command Center (`/aspirant/dashboard`)
- **File**: `src/views/aspirant/Dashboard.jsx` $\to$ `src/app/aspirant/dashboard/page.jsx`
- **Access**: Role `aspirant`
- **Key Features**:
  - **Academic Standing Overview**: Displays 12th board percentage, stream (PCM/PCB/Commerce/Arts), and JEE percentile.
  - **Personalized College Matches**: Curates eligible colleges and engineering universities based on candidate stream and cutoffs.
  - **Active Admissions Tracker**: Live status cards tracking submitted applications from `Applied` to `Under Review` and `Accepted`.
  - Quick action shortcuts to College Explorer and Profile settings.

#### 2. Academic & Entrance Profile (`/aspirant/profile`)
- **File**: `src/views/aspirant/Profile.jsx` $\to$ `src/app/aspirant/profile/page.jsx`
- **Access**: Role `aspirant`
- **Key Features**:
  - Edit 12th grade marks, board type, entrance exam scores (JEE Main, State CET), target location, and annual tuition budget range.
  - Instant validation preventing impossible percentage ranges.
  - Profile completion health bar guiding aspirants toward complete submissions.

#### 3. Interactive College Explorer & Comparison (`/aspirant/explore`)
- **File**: `src/views/aspirant/Explore.jsx` $\to$ `src/app/aspirant/explore/page.jsx`
- **Access**: Role `aspirant`
- **Key Features**:
  - **Eligibility Engine**: Flags every college as `Eligible` (emerald) or `Not Eligible` (rose) with specific reasons (e.g., "Requires PCM stream", "Requires $\ge 75\%$ 12th grade").
  - **Multi-Parametric Filter Suite**: Stream selector, tuition budget slider, NAAC accreditation filter, and location search.
  - **Side-by-Side Comparison Modal**: Select any 2 or 3 colleges to compare tuition fees, NAAC grades, available engineering streams, cutoffs, and NIRF ratings.
  - **1-Click Application Drawer**: Submit statement of purpose (SOP) and target course directly to college admissions.

#### 4. College Application Tracker (`/aspirant/applications`)
- **File**: `src/views/aspirant/Applications.jsx` $\to$ `src/app/aspirant/applications/page.jsx`
- **Access**: Role `aspirant`
- **Key Features**:
  - 4-stage admissions tracking pipeline (`Applied` $\to$ `Under Review` $\to$ `Accepted` $\to$ `Rejected` / `Waitlisted`).
  - View application timestamps, chosen courses, and fee schedules.
  - Download acceptance letters and institutional onboarding guidelines upon approval.


---

## 6. AI Subsystems, 3D WebGL Avatar & Vision Proctoring

### 6.1 Self-Hosted AI Engine Architecture (`ai-service/`)
The FastAPI AI service runs locally on port 8000 with **zero cloud dependencies**.

```
[Candidate Audio] ──> [/stt: faster-whisper (int8)] ──> [Normalized Transcript]
                                                               │
                                                               ▼
[Normalized Text] <── [/tts: Piper Neural ONNX] <── [Semantic Rubric Evaluation]
(22,050Hz 16-bit)    (Indian Male / British Female)  (all-MiniLM-L6-v2 ONNX)
```

1. **Local Speech-to-Text (`POST /stt`)**:
   - Powered by `faster-whisper` (`whisper-base.en` with int8 quantization).
   - Ingests `audio/webm` or `audio/wav` multipart uploads and transcribes on CPU in $\sim 1.4$ seconds.
   - Includes custom technical vocabulary conditioning prompt (`React, Virtual DOM, B-tree, SQL, PostgreSQL, useCallback, useMemo, LCP, CLS, JWT, Docker, Kubernetes`).
2. **Local Neural Text-to-Speech (`POST /tts`)**:
   - Powered by Piper Neural ONNX models.
   - Default Voice: Indian English Male (`en_US-kusal-medium.onnx` - Vikram Malhotra, Senior Tech Recruiter).
   - Alternate Voices: British Female (`en_GB-southern_english_female-low.onnx`) and US Female (`en_US-amy-medium.onnx`).
   - Normalizes domain jargon via `text_normalizer.py` (e.g. "SQL" $\to$ "sequel", "useCallback" $\to$ "use callback", "PostgreSQL" $\to$ "postgres Q L").
3. **Semantic Rubric Evaluator (`POST /evaluate`)**:
   - Computes 384-dimensional dense sentence embeddings using `all-MiniLM-L6-v2` ONNX.
   - Measures cosine similarity between candidate response and key rubric criteria without requiring strict keyword lock.
   - Evaluates speech cadence, filler words (`um`, `uh`, `like`, `basically`), technical clarity, and provides actionable constructive advice.

### 6.2 MediaPipe Client Vision Proctoring (`CameraVisionProctor.jsx`)
- **Models**: In-browser WebAssembly MediaPipe Face Landmarker (468 3D landmarks) and Hand Landmarker (21 skeletal joints).
- **3-Second Personalized Baseline Calibration**:
  - Calculates resting pitch ($\mu_{\text{pitch}}$) and yaw ($\mu_{\text{yaw}}$) to prevent false positives caused by natural head posture or monitor placement.
- **Round-Specific Sensitivity**:
  - `Verbal Round`: $\Delta\text{Pitch} > 0.32$ or $\Delta\text{Yaw} > 0.42$ for $> 6.0$s triggers warning.
  - `Coding Round`: Thresholds relaxed ($\Delta\text{Pitch} > 0.55$) allowing candidates to inspect physical keyboards or lower screen code editors.
- **3-Strike Progressive Escalation Ladder**:
  - **Strike 1**: Silent diagnostic log event recorded in session metadata.
  - **Strike 2**: Amber warning overlay banner displayed on candidate's camera feed.
  - **Strike 3**: Video freezes; triggers mandatory 10-second verification challenge requiring candidate to hold both hands up to the camera (verified via MediaPipe Hand Landmarker detecting 2 active hands).
- **Strike Decay Mechanism**: 60 seconds of clean, centered head posture automatically decays active strikes by 1.

### 6.3 3D WebGL Avatar Engine (`ThreeAvatarCanvas.jsx`)
- **Renderer**: Three.js WebGL renderer with ACES Filmic tone mapping and sRGB color output.
- **Model**: Articulated GLTF character `hr-female.glb` in an executive office setting with 3-point studio lighting (Key, Fill, Rim).
- **Procedural Skeletal Animations**:
  - Sinusoidal idle chest breathing via `Spine1` and `Spine2` bone rotations.
  - Natural head nods during candidate speech recognition.
  - Speech lip-sync synchronized with audio playback amplitude RMS.

---

## 7. Client State Architecture & Offline Mutation Pipeline

### 7.1 Unified Client State (`DataContext.jsx`)
Global state is managed via React `useReducer` and synchronized with `localStorage` under key `career_os_data`. The context provides seamless instant role switching between Student, University Admin, and Corporate Recruiter while preserving all local edits.

### 7.2 Resilient Offline Mutation Queue (`resilientFetch`)
```
[Client Action] ──> [Optimistic UI Update] ──> [Network Request]
                                                     │
                                       ┌─────────────┴─────────────┐
                                       ▼                           ▼
                                   [Success]                    [Offline]
                                       │                           │
                                   [Done]              [Serialize Mutation into]
                                                       [career_os_pending_mutations]
                                                                   │
                                                                   ▼
                                                       [Network Restores (online)]
                                                                   │
                                                                   ▼
                                                       [Sequential Background Replay]
```
If network connectivity drops (`navigator.onLine === false`) or the backend returns an error:
1. UI updates optimistically without interrupting user workflow.
2. The mutation is serialized with timestamp and HTTP metadata into `career_os_pending_mutations` in `localStorage`.
3. `NetworkContext.jsx` monitors browser connectivity events and drains the queue sequentially upon reconnection.

### 7.3 ATS Resume Scoring Formula (`atsScore.js`)
```
Total Score (0–100) = (Skill Overlap × 0.40) + (Keyword Density × 0.30) + (Section Health × 0.20) + (Education Completeness × 0.10)
```
- **Skill Overlap**: Ratio of job description required skills found in student's verified skill inventory.
- **Keyword Density**: Natural frequency of technical terminology (excluding stop words).
- **Section Health**: Non-emptiness of Summary, Experience, Projects, and Certifications.
- **Education Completeness**: Presence of verified 10th, 12th, and Degree CGPA.

---

## 8. Deployment & Environment Configuration

### 8.1 Environment Variables (`.env`)
```bash
# Database Configuration (Supabase PostgreSQL / Cloud Postgres)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
PGHOST=your-db-host.supabase.co
PGPORT=6543
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=your-secure-password

# Self-Hosted AI Service URL (FastAPI)
AI_SERVICE_URL=http://127.0.0.1:8000

# GitHub Integration (Optional - for high-rate-limit portfolio repo sync)
GITHUB_TOKEN=ghp_your_personal_access_token

# Node Environment
NODE_ENV=development
```

### 8.2 Startup Commands
```bash
# 1. Install Node.js dependencies
npm install

# 2. Setup MediaPipe WASM assets
npm run copy:mediapipe

# 3. Migrate and seed PostgreSQL database
npm run db:seed

# 4. Start Next.js Development Server (Port 3000)
npm run dev

# 5. Start Local Python AI Engine (Optional / In separate terminal)
cd ai-service
pip install -r requirements.txt
python main.py
```

### 8.3 Production Deployment Artifacts
- **Vercel**: Pre-configured in `vercel.json` with dynamic serverless route rules.
- **Render**: Pre-configured in `render.yaml` defining web service and disk storage for AI models.
- **Docker**: `ai-service/Dockerfile` and `docker-compose.yml` for containerized zero-setup deployment of Piper TTS and Faster-Whisper.
