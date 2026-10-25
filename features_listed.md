# CAREER-OS — Comprehensive Feature Blueprint & Recreation Specification

> **A Complete Prompt-Based System Blueprint for Autonomous Campus Placement & Career Operating System**
>
> This document provides an exhaustive, technically precise specification of CAREER-OS. It serves as an implementation-ready blueprint containing prompt-driven specifications, state machines, algorithmic criteria, UI behaviors, database schemas, and API contracts necessary to reproduce the entire application in any programming language and framework.

---

## 1. System Architecture & Core Principles

### 1.1 Architecture Topology
- **Client Tier**: Web application supporting responsive desktop, tablet, and mobile layouts with Progressive Web App (PWA) offline caching capabilities (`manifest.json` and service worker caching).
- **Application Server Tier**: RESTful API / SSR Server handling authentication, multi-tenant RBAC (Student, University Admin, Corporate Recruiter), data aggregation, and resilient persistence.
- **Data Tier**: Relational persistence (PostgreSQL / Supabase) supplemented by client-side optimistic UI state and an offline mutation queue stored in `localStorage`.
- **Local Private AI Microservice**: Self-hosted FastAPI service running completely isolated on `localhost:8000` with **zero external cloud API dependencies**. Handles Neural Text-To-Speech (TTS), Local Speech-To-Text (STT), Semantic Cosine Similarity Rubric Evaluation, and technical text normalization.
- **Client-Side WASM Vision Engine**: In-browser MediaPipe Face and Hand Landmarker executing in WebAssembly for real-time gaze calibration and proctor challenge verification.

### 1.2 Core Architectural Principles
- **100% Zero Third-Party AI Dependency**: No calls to Google Cloud Speech, ElevenLabs, OpenAI, Anthropic, or Azure. All models are open-source with permissive commercial licenses (MIT, Apache-2.0).
- **Single Source of Verified Truth**: Strict section-by-section verification stamps by University Placement Officers ensure that corporate recruiters exclusively discover candidates with validated CGPA, coursework, projects, and certifications.
- **Optimistic UI with Offline Mutability**: Client operations update local state and localStorage instantly, queuing network operations in a resilient background mutation pipeline (`career_os_pending_mutations`) if offline.

---

## 2. Domain Modeling & Entity Relationships

### 2.1 Entity Relationship Model
```
[User] ─── (1:1) ───> [Student Profile] ─── (1:N) ───> [Certificates]
                          │             ─── (1:N) ───> [Resume Versions]
                          │             ─── (1:N) ───> [Roadmap Progress]
                          │             ─── (1:N) ───> [Test Attempts]
                          │             ─── (1:N) ───> [Coding Solved Records]
                          │             ─── (1:N) ───> [AI Interview Sessions]
                          │
                          └─── (1:N) ───> [Applications] <─── (N:1) ─── [Drives / Jobs]
                                                                                ▲
                                                                                │
[Corporate Recruiter] ──────────────────────── (1:N) ──────────────────────────┘
[University Placement Cell] ──────── (1:N) ────────> [Materials & Playlists]
                            ──────── (1:N) ────────> [Broadcast Notifications]
                            ──────── (1:N) ────────> [Inbound Recruiter Mails]
```

### 2.2 Core Data Schemas

#### 1. User & Authentication
- `id` (String / UUID): Primary key.
- `email` (String): Unique email address.
- `name` (String): Display name.
- `role` (Enum: `student` | `university` | `company`): Role-based access partition.
- `studentId` (String, Optional): Foreign key linking to `students` table if role is `student`.
- `company` (String, Optional): Organization name if role is `company`.

#### 2. Student Profile
- `id` (String): e.g., `s1`.
- `name` (String): Candidate full name.
- `regNo` (String): Unique university registration number (e.g., `21BCE1042`).
- `email` (String): Institutional email.
- `phone` (String): Contact phone number.
- `branch` (Enum: `CSE` | `IT` | `ECE` | `EEE` | `Mechanical`).
- `batch` (String): e.g., `2026`.
- `cgpa` (Float): Current cumulative grade point average (0.00 – 10.00).
- `tenthMarks` (Float): Secondary school percentage (0 – 100).
- `twelfthMarks` (Float): Higher secondary school percentage (0 – 100).
- `backlogs` (Integer): Count of active academic backlogs.
- `avatar` (String): Profile image URL.
- `profileStatus` (Enum: `Verified` | `Partial` | `Pending`): Rollup state of all section verification statuses.
- `verificationStatus` (Object): Section-level statuses (`Personal`, `Education`, `Skills`, `Projects`, `Experience`), each taking values `Verified`, `Pending`, or `Rejected`.
- `verificationRemarks` (Object): Map of section names to placement officer explanatory feedback.
- `skills` (Array of Objects): `{ name: String, category: String, level: Integer (1-5) }`.
- `projects` (Array of Objects): `{ title: String, tech: Array<String>, description: String, link: String, github: String, year: Integer }`.
- `experience` (Array of Objects): `{ company: String, role: String, duration: String, description: String }`.
- `githubUsername` (String, Optional): GitHub handle for automated repository synchronization.

#### 3. Placement Drives & Job Requisitions
- `id` (String): Unique identifier.
- `company` (String): Company name.
- `role` (String): Job title / designation.
- `ctc` (String): Compensation package in LPA (e.g., `18 LPA` or `₹12 - ₹16 LPA`).
- `minCgpa` (Float): Minimum academic CGPA threshold.
- `eligibleBranches` (Array<String>): Allowed branches or `['All']`.
- `maxBacklogs` (Integer): Allowed active backlogs (usually 0).
- `deadline` (Date string): Application cut-off timestamp.
- `status` (Enum: `Open` | `Upcoming` | `Closed` | `Pending approval`).
- `type` (Enum: `On-Campus` | `Dream` | `Super Dream` | `Off-Campus`).
- `location` (String): Job location.
- `description` (String): Job description & candidate expectations.
- `skills` (Array<String>): Required candidate skill tags.
- `rounds` (Array<String>): e.g., `['Online Test', 'Technical Round 1', 'HR Round']`.

#### 4. Applications & Pipeline
- `id` (String): Unique application ID.
- `studentId` (String): Foreign key to student.
- `company` (String): Hiring firm.
- `role` (String): Designation.
- `driveId` (String, Optional): Linked drive ID.
- `appliedDate` (Date string): Submission date.
- `status` (Enum: `Applied` | `Online Test` | `Interview` | `Offer` | `Rejected`).
- `statusHistory` (Array of Objects): Audit trail recording `{ stage: String, date: String }`.
- `notes` (String): Candidate notes or recruiter feedback.
- `ctc` (String): Offer CTC package.

#### 5. Certifications
- `id` (String): Certificate UUID.
- `studentId` (String): Foreign key to student.
- `title` (String): Course or credential title.
- `issuer` (String): Issuing body (e.g., AWS, Coursera, HackerRank, Google).
- `issueDate` (Date string): Date awarded.
- `expiryDate` (Date string, Optional): Expiration date.
- `status` (Enum: `Valid` | `Expiring soon` | `Expired`).
- `credentialId` (String): Verification URL or alphanumeric license ID.
- `skills` (Array<String>): Skills verified by this certification.

#### 6. Placement Study Materials
- `id` (String): Unique material ID.
- `title` (String): Title of resource.
- `category` (Enum: `Placement Prep` | `DSA & Algorithms` | `System Design` | `Interview Notes` | `Core Engineering` | `Web Development` | `Aptitude & Reasoning`).
- `format` (Enum: `video` | `pdf` | `ppt` | `note` | `link`).
- `targetBranches` (Array<String>): e.g., `['All']` or `['CSE', 'IT']`.
- `content` (String): Rich text, markdown content, or embedded summary.
- `fileUrl` (String, Optional): Cloud storage URL or base64 data URI.
- `playlist` (Array of Objects, Optional): Ordered chapters/videos `{ id, title, duration, youtubeId, fileUrl, type }`.

#### 7. Inbound Recruiter Mails & Broadcast Notifications
- `mails`: Inbound emails received from visiting HR teams `{ id, from, sender, subject, date, body, snippet, processed, extractedCriteria: { minCgpa, branches, backlogs, ctc, role } }`.
- `sentMails`: Record of broadcast dispatches dispatched by placement cell `{ id, subject, body, targetSummary, sentAt, recipientsCount, attachmentName, attachmentType, attachmentUrl }`.
- `notifications`: Student inbox notices `{ id, studentId, title, message, date, read, attachmentType, attachmentUrl, attachmentName }`.

---

## 3. Student Portal Features & Implementation Prompts

### 3.1 Command Dashboard (`/student/dashboard`)
*   **Prompt**: "Implement a Student Placement Dashboard displaying real-time academic standing, placement drives, and alerts. The system must render 4 KPI metric cards: Profile Completion % (computed from non-empty profile sections), Active Applications count, ATS Resume Match Score, and Verified Certificates count. Display an emergency warning banner if any certificate is within 30 days of expiry. Render an Active Placement Drives table filtered by the student's eligibility (comparing student CGPA $\ge$ drive minCGPA, branch included in drive eligibleBranches, and student backlogs $\le$ drive maxBacklogs). Include a single-click 'Apply' button that creates an application entry, advances drive applicant count, and records a timestamped history entry. Display a notifications feed with read/unread markers and quick links to the skill gap analyzer."

### 3.2 University-Verified Profile (`/student/profile`)
*   **Prompt**: "Implement a University-Verified Profile management view with 5 distinct sections: Personal Information, Academic Records, Technical Skills, Projects & Publications, and Work Experience. Each section must display an immutable placement cell verification badge (`Verified by university` in emerald, `Pending review` in amber, or `Action required / Rejected` in rose with placement officer remarks). Enable the student to edit unverified fields, add technical skills with 1-5 rating bars categorized by Language/Framework/Tool, and add projects with GitHub and live URLs. When edits are submitted, the section's status must revert to `Pending` and trigger a database update to `/api/students/:id`."

### 3.3 Intelligent ATS Resume Builder (`/student/resume`)
*   **Prompt**: "Implement an ATS Resume Builder with real-time scoring against arbitrary job descriptions. The system must:
    1. Provide a Job Description text input and compute an instant 0-100 ATS compatibility score based on keyword extraction, technical skill overlap, education completeness, and section health.
    2. Render keyword gap analysis showing matching keywords (green) and critical missing keywords (red).
    3. Provide 4 styling layout presets: Classic (serif corporate), Modern (two-column colored headers), Minimal (clean monospace sans), and Technical (compact grid).
    4. Provide checkboxes to toggle inclusion of projects, experience, and certificates.
    5. Support version snapshots: save current state with a custom name, timestamp, and ATS score into `/api/resume-versions`, with one-click restore and deletion.
    6. Include a high-fidelity print button with dedicated CSS `@media print` rules stripping UI navigation and formatting the resume to standard A4/Letter margins."

### 3.4 Application Kanban Tracker (`/student/applications`)
*   **Prompt**: "Implement a 5-column Drag-and-Drop Kanban Board tracking student applications across: `Applied` ➔ `Online Test` ➔ `Interview` ➔ `Offer` ➔ `Rejected`. Application cards must show company name, role, CTC badge, application date, and days elapsed in current stage. Clicking a card opens a modal displaying status transition audit logs (`statusHistory`) and private notes. Provide an 'Add Off-Campus Application' modal capturing company, role, package, applied date, and initial stage, persisting changes to `/api/applications`."

### 3.5 Smart Certificates & Simulated OCR Engine (`/student/certificates`)
*   **Prompt**: "Implement a Smart Certificates management page with simulated OCR file ingestion. Upon file upload (PDF/PNG/JPG), display a 600ms scanning animation and extract: certificate title, issuing organization, issue date, expiry date, and verified skill tags. Execute a duplicate fraud detection check matching title, issuer, and issue date against existing student certificates. Provide an interactive tag editor allowing the candidate to confirm or add skills. Upon saving, append the certificate to `/api/certificates` and automatically synchronize new skills into the student's technical skills matrix."

### 3.6 Skill Gap Analysis & Phased Roadmap (`/student/skill-gap`)
*   **Prompt**: "Implement a Role Benchmarking & Skill Gap view allowing candidates to select from target industry roles (Frontend Developer, Backend Developer, Data Analyst, Full Stack Developer, Cloud Engineer). Load required proficiencies (1-5) from the skill taxonomy. Compare against candidate's verified skills to categorize each requirement as `Met` (green), `Partial` (amber), or `Missing` (red). Render a Recharts dual-bar chart visualizing Required Level vs Candidate Current Level. Below the chart, render a 4-phase sequential learning curriculum with estimated time commitments and interactive completion checkboxes persisted to `/api/roadmap`."

### 3.7 Adaptive Interview Prep & Live Coding Arena (`/student/interview-prep`)
*   **Prompt**: "Implement an Interview Preparation Hub with 4 interconnected tabs:
    1. **Live Coding Arena (`CodingArena.jsx`)**: Split-pane IDE with language selector (Python, JavaScript, Java, C++), Monaco/Textarea code editor with line numbers, Tab key indentation, and execution sandbox. Include problem statement, example inputs/outputs, constraints, time/space complexity targets, collapsible hints, and company tags. Execute tests against visible and hidden test cases, reporting execution time and memory. Track anti-cheat tab switches. Include an 'Automated Level-Up Engine' that generates harder questions when solved.
    2. **Adaptive Mock Test Engine**: 10-question test dynamically adjusting subsequent question difficulty (Easy, Medium, Hard) based on whether the candidate answered the previous question correctly.
    3. **Question Bank**: Searchable, filterable library of technical and HR questions categorized by topic (DSA, DBMS, OS, Networks, React, Aptitude, HR).
    4. **Performance Tracker**: Recharts Line Chart graphing historical test scores, speed, and accuracy over successive attempts."

### 3.8 1-on-1 Voice AI Placement Interview Agent (`/student/ai-interview`)
*   **Prompt**: "Implement a photorealistic 3D Voice-to-Voice AI Interview Studio. The interface must integrate:
    1. **3D WebGL Avatar (`ThreeAvatarCanvas.jsx`)**: Load articulated GLTF model `hr-female.glb` in Three.js with ACES Filmic tone mapping, 3-point studio lighting, executive office virtual background, procedural skeletal breathing (`Spine1`, `Spine2`), listening nods, and audio RMS-driven mouth movement.
    2. **MediaPipe 3D Face Mesh Proctoring (`CameraVisionProctor.jsx`)**: WASM-based 468-point face mesh tracking 3D pitch/yaw gaze vectors with a 3-second personalized baseline calibration. Differentiate monitor gaze from mobile phone glances ($\Delta\text{Pitch} > 0.22$) and head turn-aways. Execute a 3-strike escalation: Strike 1 silent log, Strike 2 amber video warning, Strike 3 mandatory 10-second hands-up verification using MediaPipe Hand Landmarker.
    3. **Neural Voice Playback**: Stream question audio through local Piper TTS `/api/tts` with 0ms pre-rendered WAV cache for standard questions.
    4. **Private Audio Transcription**: Capture candidate voice via HTML5 `MediaRecorder` (`audio/webm;codecs=opus`), auto-handing off mic 300ms after avatar finishes speaking. Transcribe via self-hosted `faster-whisper` (`whisper-base.en`, int8) at `/api/stt` within 1.5 seconds.
    5. **Semantic Rubric Evaluator**: Grade answers conceptually using `all-MiniLM-L6-v2` dense cosine similarity at `/api/ai-interview/evaluate`. Grade without requiring exact keyword matches, analyze filler words, and output conceptual strengths and actionable improvement tips."

### 3.9 Placement Study Materials & Playlist Hub (`/student/materials`)
*   **Prompt**: "Implement a Study Materials & Playlist Library. Candidates can filter by category (DSA, System Design, Placement Prep, Core Engineering) and format (Video Playlists, PDFs, PPTs, Lecture Notes). Implement an embedded video playlist player with sequential chapter navigation, playback speed controls, and completion indicators. Implement a full-screen markdown and document reader modal with zoom and download capabilities. Highlight resources prioritized for the student's branch."

### 3.10 Placement Mailbox (`/student/mail`)
*   **Prompt**: "Implement a Placement Communications Mailbox aggregating official placement circulars and company interview invites. Support search, unread filter, attachment type filter (video briefings vs PDF circulars), and date range filters (Today, This Week, This Month, Custom). Clicking an email displays full rich text, inline HTML5 video player for company video attachments, PDF preview drawer, and one-click 'Mark as Read' sync to `/api/notifications`."

### 3.11 Public Digital Portfolio (`/student/portfolio`)
*   **Prompt**: "Implement a Public Digital Portfolio generator with automated GitHub synchronization. Provide an input to sync a GitHub username, fetching public repositories, star counts, fork counts, and primary language badges via GitHub REST API. Enable the candidate to pin featured repositories and manually add proprietary projects. Render an interactive preview showing verified university credentials, CGPA, verified skills, and project cards. Provide a 'Copy Public Link' button copying `https://career-os.vit.ac.in/p/:regNo` to clipboard."

---

## 4. University Admin Portal Features & Implementation Prompts

### 4.1 Placement Cell Executive Overview (`/university/dashboard`)
*   **Prompt**: "Implement a Placement Cell Executive Overview dashboard featuring 5 top-level KPI cards: Total Batch Students (2026), Verified Profiles %, Active Campus Drives, Total Placed Students, and Overall Placement Rate %. Render a Recharts Bar Chart showing branch-wise placement statistics (Placed vs Total students across CSE, IT, ECE, EEE, Mechanical). Display an 'Action Required' queue showing student profiles pending verification, and an active drives monitoring table with applicant counts and approaching deadlines."

### 4.2 Student Directory & Multi-Filter Roster (`/university/students`)
*   **Prompt**: "Implement a Student Verification Directory with multi-parameter filtering: text search (name/regNo), branch dropdown, minimum CGPA slider, backlog filter (All, 0 Backlogs, >0 Backlogs), and verification status (All, Verified, Partial, Pending). Display results in a paginated data table showing registration number, student name, branch, CGPA, backlogs, verification badge, and an 'Inspect Profile' action button routing to `/university/students/:id`."

### 4.3 Granular Profile & Certificate Audit (`/university/students/:id`)
*   **Prompt**: "Implement a Section-by-Section Profile Verification Audit view. Render independent audit cards for: Personal Info, Academic Records, Technical Skills, Projects, and Experience. Each card must include an approval button (stamping `Verified`) and a rejection button opening a modal for placement officer remarks. Display all uploaded student certificates with credential IDs, dates, and preview links. Updating verification status dispatches `VERIFY_STUDENT_SECTION` and recalculates overall profile status (`Verified` if all sections pass, `Partial` if some pass, `Pending` otherwise)."

### 4.4 Campus Placement Drives & Approval Queue (`/university/drives`)
*   **Prompt**: "Implement a Placement Drives Management and Requisition Approval interface. The view must include:
    1. A 'Float New Campus Drive' modal defining company, role, package (CTC), minimum CGPA, eligible branches, maximum backlogs, application deadline, and drive category.
    2. A 'Company Requisitions Queue' listing job postings submitted by registered corporate recruiters with status `Pending approval`. Placement officers can inspect job requirements, approve to publish as a campus drive, or reject with comments.
    3. Active drive cards showing application progress, status tags (`Open`, `Upcoming`, `Closed`), and direct links to applicant rosters."

### 4.5 Drive Detail, Roster & CSV Export (`/university/drives/:id`)
*   **Prompt**: "Implement a Drive Detail & Applicant Management screen. Display drive summary cards (CTC, CGPA cutoff, eligible branches, deadline). Render a table of all student applicants displaying candidate name, registration number, branch, CGPA, backlogs, profile verification badge, and application date. Include actions to shortlist or reject candidates. Provide an 'Export CSV' button that compiles the filtered applicant roster into a standard CSV file formatted as `Student Name, Registration No, Branch, CGPA, Backlogs, Status, Application Date`."

### 4.6 Placement Study Materials Manager (`/university/materials`)
*   **Prompt**: "Implement a Placement Study Materials Publishing Suite for placement cell coordinators. The system must support:
    1. Uploading PDF notes, presentation slides, or writing direct Markdown lecture notes.
    2. Curating multi-video YouTube playlists by inputting video IDs, chapter titles, order, and descriptions.
    3. Tagging resources with target branches (CSE, IT, ECE, EEE, Mechanical, or All Branches).
    4. Full CRUD operations: search existing materials, edit metadata, delete outdated resources, and launch a student-view preview modal."

### 4.7 Recruiter NLP Mail Filter & Broadcast Dispatcher (`/university/mail-filter`)
*   **Prompt**: "Implement an NLP Inbound Recruiter Email Filter and Targeted Broadcast Dispatcher:
    1. **Inbound Mail Parsing**: Provide an inbox of unstructured corporate recruiter emails. Clicking an email triggers an NLP regex/heuristic extraction engine parsing: minimum CGPA, eligible branches, allowed backlogs, CTC, and role title.
    2. **Real-Time Eligibility Counter**: Instantly query the live student roster to calculate the exact count of university students matching the parsed criteria.
    3. **Auto-Generate Drive**: One-click action converting the recruiter email directly into an active campus drive pre-filled with the extracted parameters.
    4. **Targeted Broadcast Dispatcher**: Modal allowing placement officers to compose and dispatch broadcast circulars to: All Students, Eligible Students Only, Specific Branch, or Minimum CGPA threshold. Support video briefing attachments and PDF attachments, creating records in `sentMails` and generating student inbox `notifications`."

---

## 5. Corporate Recruiter Portal Features & Implementation Prompts

### 5.1 Corporate Recruitment Dashboard (`/company/dashboard`)
*   **Prompt**: "Implement a Corporate Recruitment Dashboard for HR partners. Render 4 top-level KPI metrics: Active Campus Openings, Total Applicants, Candidates in Interview, and Offers Extended. Render a Recharts Bar Chart illustrating the 4-stage Hiring Funnel (`Applied` ➔ `Screened` ➔ `Interview` ➔ `Offer`). Display a feed of the most recent candidate applications with direct links to candidate evaluation dossiers."

### 5.2 Job Requisition Management (`/company/jobs`)
*   **Prompt**: "Implement a Campus Job Requisition Manager. Corporate recruiters can create new job openings specifying: job title, role description, required skill tags, minimum CGPA, eligible engineering branches, CTC package, vacancies, job location, and application deadline. Newly posted requisitions enter `Pending approval` status and appear in the university placement cell queue before converting to active campus drives."

### 5.3 Verified-Only Candidate Discovery Engine (`/company/candidates`)
*   **Prompt**: "Implement a Candidate Discovery Engine enforcing zero resume fraud:
    1. The talent search pool must strictly filter and display only students whose profile verification status is `Verified` by the university placement cell.
    2. When a company job requisition is selected, execute a real-time Skill Match calculation comparing candidate skills against requisition skill tags to display a `Match %` badge (e.g., `92% Match`).
    3. Provide granular filters: search by name/regNo, branch multi-select, minimum CGPA slider, skill tag pills, and certificate verification toggle.
    4. Include an 'Inspect Dossier' button navigating to the full candidate evaluation dossier."

### 5.4 Candidate Evaluation Dossier (`/company/candidates/:id`)
*   **Prompt**: "Implement a Candidate Evaluation Dossier view displaying a verified student's complete academic record, university verification stamps, verified skills with proficiency ratings, GitHub repositories, live project links, and credential-backed certifications. Include a Recruiter Evaluation Notes panel where interviewers can record round-by-round comments, ratings, and feedback. Provide quick action buttons to promote candidate to `Interview Scheduled` or mark as `Rejected`."

### 5.5 Requisition Recruitment Pipeline & Scheduler (`/company/pipeline`)
*   **Prompt**: "Implement a Requisition Recruitment Pipeline with interactive interview scheduling:
    1. Dropdown selector to switch between active company job postings.
    2. 5-column Kanban board: `Shortlisted` ➔ `Interview Scheduled` ➔ `Selected` ➔ `Offer Sent` ➔ `Rejected`.
    3. Moving a candidate into `Interview Scheduled` opens a modal capturing: interview date, time, mode (Google Meet, Microsoft Teams, In-Person), and round description notes.
    4. Scheduling or advancing candidates updates `/api/pipeline`, syncs the student's application status to `Interview` or `Offer`, and dispatches an automated interview invite notification to the candidate's inbox."

---

## 6. Local AI Microservice & Proctoring Architecture

### 6.1 FastApi Microservice (`ai-service/main.py`)
- **Port**: `8000` (CORS enabled for `localhost:3000`).
- **Endpoints**:
  - `GET /health`: Returns service health, loaded models, and device info.
  - `POST /tts`: Piper TTS synthesis converting text to 22,050Hz 16-bit PCM WAV. Pre-processes input with `text_normalizer.py` (e.g., expanding "SQL" $\to$ "sequel", "useCallback" $\to$ "use callback", "PostgreSQL" $\to$ "postgres Q L").
  - `POST /stt`: Audio transcription using `faster-whisper` (`whisper-base.en`, int8 quantization). Accepts `audio/webm` or `audio/wav` multipart uploads and transcribes on CPU in $\sim 1.4$ seconds with technical prompt conditioning.
  - `POST /evaluate`: Semantic rubric grading using `evaluation_engine.py`. Computes dense 384-d cosine similarity embeddings using `all-MiniLM-L6-v2` ONNX. Grades candidate answer against rubric key points without requiring keyword matching, analyzes speech clarity & filler words, and outputs conceptual feedback.

### 6.2 MediaPipe Client Proctoring Pipeline (`CameraVisionProctor.jsx`)
- **Model**: MediaPipe Face Landmarker (468 3D facial landmarks) + Hand Landmarker running via local browser WebAssembly (`face_landmarker.task`, `hand_landmarker.task`).
- **3-Second Baseline Calibration**: Computes personalized resting pitch ($\mu_{\text{pitch}}$) and yaw ($\mu_{\text{yaw}}$). Normal screen gazing is never flagged.
- **Round-Type Sensitivity**:
  - `Verbal Round`: $\Delta\text{Pitch} > 0.32$ or $\Delta\text{Yaw} > 0.42$ for $> 6.0$s continuously triggers look-down/away warning.
  - `Coding Round`: Relaxed thresholds ($\Delta\text{Pitch} > 0.55$) allowing candidates to look down at keyboard or screen code editor without false penalties.
- **3-Strike Progressive Challenge**:
  - Strike 1: Silent audit log event.
  - Strike 2: Soft visual amber warning overlay on video stream.
  - Strike 3: Triggers mandatory 10-second verification challenge requiring candidate to hold both hands up to camera, verified using MediaPipe Hand Landmarker (detecting 2 hands).
- **Strike Decay**: 60 seconds of clean centered behavior automatically decays active strikes by 1.

---

## 7. State Management, Offline Resilience & API Specifications

### 7.1 Unified Client State (`DataContext.jsx`)
- Global state managed via React `useReducer` and synchronized with `localStorage` key `career_os_data`.
- Supports instant zero-latency role switching between Student, University Admin, and Corporate Recruiter while preserving modifications.

### 7.2 Resilient Mutation Queue (`resilientFetch`)
- If network connection drops (`navigator.onLine === false`) or API fails, non-GET mutations are automatically serialized into `career_os_pending_mutations` in `localStorage`.
- When connectivity resumes (monitored via `NetworkContext.jsx`), queued mutations are automatically drained and replayed sequentially against the backend API.

### 7.3 REST API Endpoints Specification

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/initial-data` | `GET` | All | Returns hydrated database state across all entities |
| `/api/students` | `POST` | University | Add single or mass students |
| `/api/students/:id` | `PUT` | Student / University | Update student profile or verify section |
| `/api/drives` | `GET`, `POST` | University | List or create campus placement drives |
| `/api/drives/:id` | `PUT` | University | Update drive status or criteria |
| `/api/jobs` | `GET`, `POST` | Company | List or submit company job requisitions |
| `/api/jobs/:id` | `PUT` | Company | Update job details |
| `/api/applications` | `POST`, `PATCH` | Student / Company | Submit application or advance stage |
| `/api/certificates` | `POST`, `DELETE` | Student | Add or remove student certificates |
| `/api/materials` | `POST`, `PUT`, `DELETE`| University | CRUD placement study notes & playlists |
| `/api/notifications` | `POST`, `PATCH` | University / Student | Dispatch broadcast or mark notification read |
| `/api/mails` | `PATCH` | University | Update recruiter email processed state |
| `/api/sent-mails` | `POST` | University | Record sent broadcast email |
| `/api/pipeline` | `POST` | Company | Update company Kanban candidate stage |
| `/api/resume-versions` | `POST`, `DELETE` | Student | Save or remove resume snapshots |
| `/api/roadmap` | `POST` | Student | Toggle phased learning roadmap steps |
| `/api/test-attempts` | `POST` | Student | Record completed mock test attempt |
| `/api/tts` | `POST` | AI Subsystem | Piper Neural TTS proxy with audio cache fallback |
| `/api/stt` | `POST` | AI Subsystem | faster-whisper local speech-to-text proxy |
| `/api/ai-interview/evaluate`| `POST` | AI Subsystem | Semantic cosine similarity answer evaluation |

---

## 8. Verification & "Rebuild" Test Checklist

If rebuilding CAREER-OS from scratch, verify each cross-role loop against this checklist:

1. **The Verification Loop**:
   - [ ] Student edits CGPA or adds project $\to$ section marks as `Pending`.
   - [ ] University Admin inspects student in `/university/students/:id` and stamps `Verified`.
   - [ ] Overall profile updates to `Verified`.
   - [ ] Candidate appears in Company Candidate Discovery (`/company/candidates`); unverified candidates are excluded.

2. **The Requisition & Drive Loop**:
   - [ ] Corporate Recruiter creates job posting in `/company/jobs` $\to$ status is `Pending approval`.
   - [ ] University Admin reviews requisition in `/university/drives` and clicks `Approve`.
   - [ ] Job converts to active campus drive and appears on eligible student dashboards.
   - [ ] Student with matching CGPA and branch applies with 1-click.
   - [ ] Candidate appears in University Drive Roster (`/university/drives/:id`) and Company Pipeline (`/company/pipeline`).

3. **The Recruiter Mail Parser Loop**:
   - [ ] Open `/university/mail-filter` and select inbound recruiter email.
   - [ ] System parses CGPA, branch, and backlog criteria.
   - [ ] Live counter computes matching student count.
   - [ ] Click 'Broadcast to Eligible' $\to$ dispatches notifications with attached video briefing to eligible students' mailboxes (`/student/mail`).

4. **The AI Interview Studio Loop**:
   - [ ] Student launches `/student/ai-interview`.
   - [ ] 3D Three.js avatar loads with lighting, virtual background, and natural breathing.
   - [ ] MediaPipe calibrates baseline in 3 seconds. Looking at screen causes 0 false strikes; glancing at lap for $>6$s escalates strikes.
   - [ ] Piper TTS speaks question in low-latency natural voice with lip sync.
   - [ ] Candidate speaks; faster-whisper transcribes response in $<1.5$s.
   - [ ] MiniLM ONNX grades answer conceptually against rubric key points without keyword lock.
