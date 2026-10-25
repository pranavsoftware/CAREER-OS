# CAREER-OS 🚀
> **Next-Generation Autonomous Campus Placement & Career Operating System**

A modern, full-stack campus placement platform built with **Next.js 16 (App Router)**, **PostgreSQL (Supabase)**, **Tailwind CSS v4**, **Three.js WebGL**, and a self-hosted **Local Python AI Microservice**. CAREER-OS seamlessly connects **Students**, **University Placement Cells**, and **Corporate Recruiters** in a unified, verified, automated, and tamper-proof workflow.

---

## 📑 Table of Contents
- [Executive Overview](#-executive-overview)
- [System Architecture & Cross-Role Workflows](#-system-architecture--cross-role-workflows)
- [Hard Architectural Principle: 100% Private, Zero Third-Party AI](#-hard-architectural-principle-100-private-zero-third-party-ai)
- [Open-Source AI Model & Engine Registry](#-open-source-ai-model--engine-registry)
- [Comprehensive Features by Role](#-comprehensive-features-by-role)
  - [1. Student Portal](#1-student-portal)
    - [1.1 Command Dashboard (`/student/dashboard`)](#11-command-dashboard-studentdashboard)
    - [1.2 University-Verified Profile (`/student/profile`)](#12-university-verified-profile-studentprofile)
    - [1.3 Intelligent ATS Resume Builder (`/student/resume`)](#13-intelligent-ats-resume-builder-studentresume)
    - [1.4 Application Kanban Tracker (`/student/applications`)](#14-application-kanban-tracker-studentapplications)
    - [1.5 Smart Certificates & OCR Engine (`/student/certificates`)](#15-smart-certificates--ocr-engine-studentcertificates)
    - [1.6 Skill Gap Analysis & Phased Roadmap (`/student/skill-gap`)](#16-skill-gap-analysis--phased-roadmap-studentskill-gap)
    - [1.7 Adaptive Interview Prep & Live Coding Arena (`/student/interview-prep`)](#17-adaptive-interview-prep--live-coding-arena-studentinterview-prep)
    - [1.8 1-on-1 Voice AI Placement Interview Agent (`/student/ai-interview`)](#18-1-on-1-voice-ai-placement-interview-agent-studentai-interview)
    - [1.9 Placement Study Materials & Playlist Hub (`/student/materials`)](#19-placement-study-materials--playlist-hub-studentmaterials)
    - [1.10 Placement Communications Mailbox (`/student/mail`)](#110-placement-communications-mailbox-studentmail)
    - [1.11 Public Digital Portfolio (`/student/portfolio`)](#111-public-digital-portfolio-studentportfolio)
  - [2. University Admin Portal (Placement Cell)](#2-university-admin-portal-placement-cell)
    - [2.1 Placement Cell Executive Overview (`/university/dashboard`)](#21-placement-cell-executive-overview-universitydashboard)
    - [2.2 Student Directory & Multi-Filter Roster (`/university/students`)](#22-student-directory--multi-filter-roster-universitystudents)
    - [2.3 Granular Profile & Certificate Audit (`/university/students/:id`)](#23-granular-profile--certificate-audit-universitystudentsid)
    - [2.4 Campus Placement Drives & Approval Queue (`/university/drives`)](#24-campus-placement-drives--approval-queue-universitydrives)
    - [2.5 Drive Detail, Roster & CSV Export (`/university/drives/:id`)](#25-drive-detail-roster--csv-export-universitydrivesid)
    - [2.6 Placement Study Materials Manager (`/university/materials`)](#26-placement-study-materials-manager-universitymaterials)
    - [2.7 Recruiter NLP Mail Filter & Broadcast Dispatcher (`/university/mail-filter`)](#27-recruiter-nlp-mail-filter--broadcast-dispatcher-universitymail-filter)
  - [3. Corporate Recruiter Portal](#3-corporate-recruiter-portal)
    - [3.1 Corporate Recruitment Dashboard (`/company/dashboard`)](#31-corporate-recruitment-dashboard-companydashboard)
    - [3.2 Job Requisition Management (`/company/jobs`)](#32-job-requisition-management-companyjobs)
    - [3.3 Verified-Only Candidate Discovery Engine (`/company/candidates`)](#33-verified-only-candidate-discovery-engine-companycandidates)
    - [3.4 Candidate Evaluation Dossier (`/company/candidates/:id`)](#34-candidate-evaluation-dossier-companycandidatesid)
    - [3.5 Requisition Recruitment Pipeline & Scheduler (`/company/pipeline`)](#35-requisition-recruitment-pipeline--scheduler-companypipeline)
- [Cross-Role Data Synchronization & Persistence](#-cross-role-data-synchronization--persistence)
- [Progressive Web App (PWA) & Offline Reliability](#-progressive-web-app-pwa--offline-reliability)
- [Tech Stack & Architecture](#-tech-stack--architecture)
- [Quick Start & Local Setup](#-quick-start--local-setup)
- [Demo Credentials](#-demo-credentials)
- [Production Build & Deployment](#-production-build--deployment)

---

## 🌟 Executive Overview

Traditional campus placements suffer from fragmented spreadsheets, unverified student resume claims, chaotic recruiter email threads, and disconnected interview prep. **CAREER-OS** solves this by establishing a **single source of verified truth**:

1. **Zero Resume Fraud**: Corporate recruiters exclusively discover student profiles whose CGPA, coursework, projects, and certificates have been verified and stamped section-by-section by university placement officers.
2. **Automated Eligibility & Matching**: Placement drives and inbound recruiter inquiries are parsed automatically and matched in real time against academic criteria (CGPA cutoff, eligible branches, backlog thresholds).
3. **End-to-End Synchronized Pipelines**: Transparent progression from student drive application to adaptive mock testing, online coding rounds, AI video interviews, and corporate offer rollouts.
4. **On-Premise Private AI**: All conversational speech, proctoring computer vision, and semantic rubric evaluations run strictly in the browser or on a self-hosted local microservice with **zero external cloud API dependencies**.

---

## 🔄 System Architecture & Cross-Role Workflows

```
                           ┌───────────────────────────────┐
                           │       UNIVERSITY ADMIN        │
                           │   (Placement Cell Director)   │
                           └───────────────┬───────────────┘
                                           │
                    Profile Verification   │  Drive Approvals, Materials,
                    & Audit Stamps         │  & Recruiter Mail Parsing
                                           v
┌─────────────────────────┐     ┌─────────────────────┐     ┌─────────────────────────┐
│     STUDENT PORTAL      │ <── │   CAREER-OS CORE    │ ──> │   CORPORATE RECRUITER   │
│  Applications, Resumes, │     │ (Next.js 16 + PWA + │     │   (Job Postings, Talent │
│  Coding Arena & AI Prep │     │ Supabase PostgreSQL)│     │   Search, Kanban Board) │
└────────────┬────────────┘     └──────────┬──────────┘     └────────────┬────────────┘
             │                             │                             │
             │ WebGL / WebAudio / WASM     │ REST / Proxy                │ Candidate Dossiers
             v                             v                             v
┌─────────────────────────┐     ┌─────────────────────┐     ┌─────────────────────────┐
│  IN-BROWSER CLIENT AI   │     │  LOCAL AI SERVICE   │     │   HIRED CANDIDATES      │
│  - MediaPipe Face Mesh  │     │  (FastAPI :8000)    │     │   Offer Rollouts &      │
│  - Three.js 3D Avatar   │     │  - Piper Neural TTS │     │   Interview Schedules   │
│  - Web Audio Analyser   │     │  - faster-whisper   │     └─────────────────────────┘
└─────────────────────────┘     │  - MiniLM-L6-v2 ONNX│
                                └─────────────────────┘
```

### Core Cross-Role Loops:
1. **The Verification Loop**: Student submits academic records & certificates ➔ Placement Cell audits each section and stamps verification ➔ Recruiter discovery engine exposes only verified records.
2. **The Requisition Loop**: Company HR posts campus job openings ➔ Placement Cell reviews and approves opening as an official Campus Drive ➔ Drive automatically appears on eligible student dashboards.
3. **The Recruiter Mail Parser Loop**: Inbound recruiter inquiries parsed for eligibility criteria (CGPA, branches, backlogs) ➔ System evaluates live student database ➔ Instant broadcast notifications dispatched to eligible students.
4. **The Pipeline Sync Loop**: Student applies ➔ Candidate appears in University Drive reviews and Company Pipeline ➔ Interview schedules and offer updates sync across both Kanban boards.
5. **The AI Readiness Loop**: Student practices with the 3D AI Interview Agent ➔ MediaPipe proctors integrity ➔ Whisper transcribes responses ➔ Semantic ONNX engine grades rubrics ➔ Performance trends update candidate readiness scorecards.

---

## 🛡 Hard Architectural Principle: 100% Private, Zero Third-Party AI

All artificial intelligence in CAREER-OS runs either **locally in the candidate's browser** (via WebAssembly / WebGL) or on our **self-hosted on-premise AI microservice** (`ai-service` on port 8000).

- ❌ No Google Cloud Speech-to-Text or Chrome `webkitSpeechRecognition` cloud endpoints.
- ❌ No OpenAI, Anthropic, Gemini, ElevenLabs, Azure, HeyGen, or D-ID APIs.
- ❌ Zero external vendor API keys, zero user data tracking, and zero per-minute billing.
- 100% open-source models with commercial-friendly licenses (MIT / Apache-2.0).

---

## 🤖 Open-Source AI Model & Engine Registry

| Subsystem | Model / Library | Runtime Location | License | Purpose & Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **3D Proctoring Vision** | MediaPipe Face Landmarker (468 3D points) | Browser WASM (`face_landmarker.task`) | Apache-2.0 | Real-time 3D pitch/yaw gaze tracking, 3s personalized baseline calibration, phone detection, zero false-positives |
| **Neural Speech (TTS)** | Piper Neural TTS (`en_GB-southern_english_female` & `en_US-kusal`) | Local ONNX (`ai-service`) | MIT | Expressive low-latency voice, technical acronym expansion (`text_normalizer.py`), 0ms pre-rendered audio cache |
| **Speech-to-Text (STT)** | `faster-whisper` (`whisper-base.en`, int8) | Local CTranslate2 (`ai-service`) | MIT / Apache-2.0 | Private HTML5 MediaRecorder audio transcription on CPU (1.4s transcribe time) with tech vocabulary conditioning |
| **3D Avatar Engine** | Three.js WebGL (`hr-female.glb`) | Browser WebGL (`ThreeAvatarCanvas.jsx`) | MIT / CC-BY | Photorealistic corporate HR interviewer avatar with procedural skeletal breathing, listening nods, and audio RMS lip-sync |
| **Semantic Evaluator** | `all-MiniLM-L6-v2` ONNX + local Ollama | Local ONNX (`ai-service`) | Apache-2.0 | Dense 384-d cosine similarity rubric grading, paraphrasing recognition, speech clarity & filler word penalty |

---

## 🎯 Comprehensive Features by Role

### 1. Student Portal

The Student experience equips candidates with end-to-end tools to prepare, build verifiable credentials, track placement drives, and practice mock rounds.

#### 1.1 Command Dashboard (`/student/dashboard`)
- **Key Performance Metrics**: Live KPI cards tracking **Profile Completion %**, **Active Applications**, **Resume ATS Score**, and **Verified Certificates**.
- **Expiring Certificate Warning Banner**: Real-time alerts warning students of expiring industry certifications before placement drive deadlines.
- **Dynamic Drive Eligibility Engine**: Automated check (`Eligible` vs specific rejection reasons like low CGPA or ineligible branch) for all active and upcoming campus drives.
- **One-Click Drive Application**: Directly apply to eligible drives with automatic sync to company applicant rosters and university audit logs.
- **Notification Inbox**: Real-time broadcast alerts from university placement officers and corporate recruiters with mark-as-read interaction.
- **Quick Skill Gap Snapshot**: High-level indicator of missing skills for target industry profiles with direct routing to deep learning roadmaps.

#### 1.2 University-Verified Profile (`/student/profile`)
- **Section-Wise Verification Status**: Visual badges indicating whether each section is `Verified by university`, `Pending verification`, or `Rejected`.
- **Academic Records**: Manage Degree, Branch, Batch, CGPA, 10th %, 12th %, and active backlogs.
- **Technical Skills Matrix**: Add, rate (1-5 proficiency), and categorize technical proficiencies across Languages, Frameworks, Databases, and Tools.
- **Projects & Publications**: Showcase projects with tech stacks, year, descriptions, live deployment URLs, and GitHub links.
- **Work Experience & Internships**: Document company history, roles, tenures, and responsibilities.

#### 1.3 Intelligent ATS Resume Builder (`/student/resume`)
- **Real-Time ATS Scoring Engine**: Evaluates resume match against arbitrary Job Descriptions (JDs) with instant 0-100 score calculation.
- **Keyword Match & Gap Analysis**: Highlights present keywords, missing industry keywords, and keyword density.
- **Section Completeness Breakdown**: Quantitative health scoring across Contact Info, Education, Skills, Projects, and Work Experience.
- **Template Switcher**: Toggle instantly between **Classic**, **Modern**, **Minimal**, and **Technical** styling presets.
- **Selective Section Toggling**: Customize resume versions by selectively including or excluding specific projects, experience, or certificates.
- **Version History & Snapshot Management**: Save named resume versions, view historical ATS scores, restore previous configurations, or delete drafts.
- **Print & PDF Export**: Clean, high-fidelity browser print styling formatted for standard A4/Letter ATS parsers.

#### 1.4 Application Kanban Tracker (`/student/applications`)
- **Interactive 5-Stage Kanban Board**: Drag-and-drop or advance applications across:
  `Applied` ➔ `Online Test` ➔ `Interview` ➔ `Offer` ➔ `Rejected`.
- **Status Audit History**: Automatic timestamp tracking recording the exact date every stage transition occurred.
- **Off-Campus Application Tracker**: Modal to manually add off-campus job applications to maintain a unified job hunt dashboard.
- **Application Detail Drawer**: View CTC, applied role, dates, stages, and personal interview preparation notes.

#### 1.5 Smart Certificates & OCR Engine (`/student/certificates`)
- **Document Management**: Centralized repository of earned certificates with status badges (`Valid`, `Expiring soon`, `Expired`).
- **Simulated OCR Parser**: Upload certificate documents/images to automatically extract certificate title, issuing organization, issue date, expiry date, and skill tags.
- **Duplicate & Fraud Prevention**: Detects duplicate certificates by matching title, issuer, and issue date against existing entries.
- **Direct Skill Synchronization**: Automatically append extracted and verified certificate skills into the student's profile.

#### 1.6 Skill Gap Analysis & Phased Roadmap (`/student/skill-gap`)
- **Industry Role Benchmarking**: Select from target tech roles including *Frontend Developer*, *Backend Developer*, *Data Analyst*, *Full Stack Developer*, and *Cloud Engineer*.
- **Skill Proficiency Matrix**: Tabular comparison of **Required Level (1-5)** vs **Current Level**, calculating exact skill gaps (`Met`, `Partial`, `Missing`).
- **Recharts Proficiency Comparison Bar Chart**: Dual-colored visual bar chart comparing required standards vs candidate competency.
- **Actionable Phased Learning Roadmap**: Multi-phase curriculum (e.g., Core Fundamentals ➔ State Management ➔ Bundling ➔ Automated Testing) with interactive checkboxes and completion % tracker.

#### 1.7 Adaptive Interview Prep & Live Coding Arena (`/student/interview-prep`)
- **4 Integrated Preparation Modules**:
  1. **Live Coding Arena (`CodingArena.jsx`)**: In-browser JavaScript code editor with execution sandbox, multiple hidden/visible test cases, anti-cheat tab switch detection, runtime console logs, time complexity hints, and solved problem tracking.
  2. **Adaptive Mock Test Engine**: Dynamically recalibrates subsequent question difficulty (**Easy**, **Medium**, **Hard**) based on continuous correct/incorrect answers.
  3. **Comprehensive Question Bank**: Filterable repository of technical and non-technical questions across **DSA**, **DBMS**, **OS**, **Networks**, **React**, **Aptitude**, and **HR**.
  4. **Performance Trend Tracker**: Recharts Line Chart tracking score trajectories across successive mock tests over time.

#### 1.8 1-on-1 Voice AI Placement Interview Agent (`/student/ai-interview`)
- **Photorealistic 3D Female HR Interviewer (`Ananya Sharma`)**: Rendered using Three.js WebGL with studio lighting, realistic breathing cycles, audio RMS lip-sync, and attention nods.
- **MediaPipe 468-Point 3D Face Mesh Proctoring**: Runs via local WASM with 3-second personalized baseline calibration; detects mobile phone glances in the lap, multi-monitor cheating, and escalates through a 3-strike verification challenge.
- **Self-Hosted Neural Piper TTS**: Studio-quality voice synthesis with zero cloud latency; normalizes technical acronyms (e.g., "SQL" ➔ "sequel", "useCallback" ➔ "use callback").
- **Private Audio STT via `faster-whisper`**: HTML5 MediaRecorder captures voice; self-hosted Whisper base transcribes speech on CPU in 1.4 seconds.
- **Dense Semantic Rubric Evaluation**: `all-MiniLM-L6-v2` ONNX cosine similarity grades candidate answers conceptually (paraphrasing accepted, no exact keyword requirements), provides verbal communication clarity metrics, and outputs actionable strengths & improvement tips.
- **Anti-Cheat Live Code Editor**: Integrated coding challenge panel for technical interview rounds.

#### 1.9 Placement Study Materials & Playlist Hub (`/student/materials`)
- **Curated Multi-Format Library**: Access verified university study materials across **Placement Prep**, **DSA & Algorithms**, **System Design**, **Interview Notes**, **Core Engineering**, and **Web Development**.
- **Interactive Multi-Video Playlist Player**: Embedded YouTube player with custom playlist navigation, video chapter selection, and completion checkoffs.
- **In-App Document Reader**: Fullscreen reader modal for classroom notes and PDF cheatsheets with Markdown rendering and direct downloads.
- **Target Branch Filtering**: Automatically prioritizes and highlights resources designated specifically for the student's engineering branch.

#### 1.10 Placement Communications Mailbox (`/student/mail`)
- **Dedicated Candidate Inbox**: Aggregates all direct university placement circulars, broadcast notifications, and corporate interview invitations.
- **Media & Document Attachments**: In-app video briefing player for company intro clips and PDF attachment previews.
- **Date & Category Filtering**: Filter messages by unread status, attachments (video/PDF), and date ranges (*Today*, *This Week*, *This Month*, *Custom*).

#### 1.11 Public Digital Portfolio (`/student/portfolio`)
- **Dynamic Web Portfolio**: Auto-generated personal portfolio website reflecting verified profile records, CGPA, projects, and skills.
- **One-Click Shareable Link**: Direct link generator (`https://career-os.vit.ac.in/p/:regNo`) ready to share with recruiters or on LinkedIn.

---

### 2. University Admin Portal (Placement Cell)

The University Admin portal equips placement directors with comprehensive verification workflows, campus drive management, study material curation, and NLP email parsing tools.

#### 2.1 Placement Cell Executive Overview (`/university/dashboard`)
- **Executive Metrics**: Live KPI counters for **Total Students (Batch 2026)**, **Verified Profiles (%)**, **Active Drives**, **Students Placed**, and **Placement Rate %**.
- **Branch-Wise Placement Analytics**: Recharts Bar Chart showing Placed vs Total student distributions across CSE, IT, ECE, EEE, and Mechanical engineering.
- **Actionable Pending Verification Queue**: Instant alerts indicating student profiles awaiting placement cell review.
- **Active Drive Monitor**: Summary table of live corporate drives, CTC offerings, deadlines, and applicant counts.

#### 2.2 Student Directory & Multi-Filter Roster (`/university/students`)
- **Comprehensive Student Roster**: Browse all registered students with contact details, registration numbers, branch, and CGPA.
- **Multi-Parameter Filtering**: Filter students by search query, branch, minimum CGPA threshold, backlog status (`All`, `0 Backlogs`, `>0 Backlogs`), and verification status (`All`, `Verified`, `Pending`).
- **Deep-Dive Navigation**: Direct click-through to individual student verification inspection pages.

#### 2.3 Granular Profile & Certificate Audit (`/university/students/:id`)
- **Section-Level Audit**: Audit individual sections (**Personal Information**, **Education Records**, **Skills**, **Projects**, **Experience**).
- **One-Click Approval**: Verify individual sections with a placement cell verified stamp.
- **Rejection Modal with Custom Remarks**: Flag fraudulent or incomplete sections with custom explanatory remarks sent back to the student.
- **Certificate Verification**: Review attached certificates, credential IDs, and OCR-parsed issue details.

#### 2.4 Campus Placement Drives & Approval Queue (`/university/drives`)
- **Float Campus Placement Drives**: Modal to float new campus recruitment drives defining eligible branches, CGPA criteria, maximum allowed backlogs, CTC, and deadlines.
- **Company Job Approval Queue**: Review requisitions submitted by registered company recruiters; approve to publish as campus drives or reject with comments.
- **Drive Lifecycle Tracking**: Manage drive statuses between `Open`, `Upcoming`, and `Closed`.

#### 2.5 Drive Detail, Roster & CSV Export (`/university/drives/:id`)
- **Roster of Drive Applicants**: Review all students who applied to a specific placement drive with their CGPA and branch details.
- **Shortlist / Reject Controls**: Approve candidates to advance to company rounds or reject ineligible candidates.
- **CSV Data Export**: Export candidate lists into formatted CSV files (`Student Name, Registration No, Branch, CGPA, Status`) for external company communication.

#### 2.6 Placement Study Materials Manager (`/university/materials`)
- **Resource Publishing Suite**: Upload, publish, and manage placement materials across Video Lectures, PDF Documents, PPT Slides, and Direct Lecture Notes.
- **Curated YouTube Playlist Builder**: Add and sequence YouTube video playlists with custom titles, chapter descriptions, and order.
- **Branch-Targeted Distribution**: Restrict material visibility to specific branches (CSE, IT, ECE, EEE, Mechanical) or broadcast to all branches.
- **Full CRUD Management**: Search, edit existing entries, delete outdated materials, and preview student reading experiences.

#### 2.7 Recruiter NLP Mail Filter & Broadcast Dispatcher (`/university/mail-filter`)
- **Inbound Recruiter Inbox**: Centralized dashboard for unstructured emails sent by visiting recruiters and corporate HRs.
- **Criteria Extraction Engine**: Parses recruiter email text to automatically extract minimum CGPA, eligible branches, and backlog constraints.
- **Live Database Eligibility Counter**: Instant calculation of exactly how many students in the university database match the recruiter's criteria.
- **Broadcast Notification Dispatcher**: Single-click button to broadcast targeted notification alerts to all eligible students informing them of the upcoming opportunity.
- **Auto-Generate Drive**: Convert validated recruiter inquiries directly into active campus drives with prefilled criteria.

---

### 3. Corporate Recruiter Portal

The Corporate Recruiter portal allows HR teams to post positions, discover verified candidates without screening noise, and run interview pipelines.

#### 3.1 Corporate Recruitment Dashboard (`/company/dashboard`)
- **Hiring Funnel Analytics**: Visual Recharts Bar Chart illustrating the funnel stages: `Applied` ➔ `Screened` ➔ `Interview` ➔ `Offer`.
- **Corporate Key Metrics**: Active Job Postings, Total Applicants, Candidates in Interview, and Offers Extended.
- **Recent Applicant Stream**: Feed of candidate submissions with immediate candidate scorecard access.

#### 3.2 Job Requisition Management (`/company/jobs`)
- **Post Campus Requisitions**: Create detailed openings with role titles, job descriptions, required skill tags, minimum CGPA, eligible branches, vacancies, CTC (LPA), location, and application deadlines.
- **University Approval Workflow**: New jobs enter `Pending approval` status and convert to active placement drives upon university placement cell sign-off.
- **Requisition Tracking**: View openings, applicant numbers, and listing statuses.

#### 3.3 Verified-Only Candidate Discovery Engine (`/company/candidates`)
- **Verified-Only Talent Pool**: Enforces university verification—only students with verified credentials appear in search results, eliminating fake claims.
- **Skill Match Score Calculation**: Real-time algorithm calculates **% Match** between candidate skillsets and the selected job requisition.
- **Granular Multi-Filters**: Filter by name/reg number, branch, minimum CGPA slider, specific skill tags (React, Python, AWS, Docker, etc.), and certificate verification status.
- **Direct Candidate Evaluation**: One-click transition into individual candidate audit dossiers.

#### 3.4 Candidate Evaluation Dossier (`/company/candidates/:id`)
- **Holistic Candidate Profile**: Access verified GPA, academic credentials, verified skills, and project links.
- **Recruiter Evaluation Notes**: Private notes log for interviewers to record candidate feedback and round-by-round evaluations.
- **Pipeline Quick Actions**: Promote candidate to `Interview Scheduled` or mark as `Rejected`.

#### 3.5 Requisition Recruitment Pipeline & Scheduler (`/company/pipeline`)
- **Requisition-Specific Kanban Board**: Filter pipeline view across specific company job postings.
- **5-Stage Pipeline Tracking**: Drag-and-drop or advance candidates through:
  `Shortlisted` ➔ `Interview Scheduled` ➔ `Selected` ➔ `Offer Sent` ➔ `Rejected`.
- **Interactive Interview Scheduler**: Modal to schedule interviews with specific dates, times, video conferencing platforms (Google Meet, Teams, In-Person), and round descriptions.
- **Direct Status Sync**: Updating stages automatically notifies students and updates application statuses.

---

## 💾 Cross-Role Data Synchronization & Persistence

CAREER-OS implements a **Hybrid Persistence Architecture**:

1. **PostgreSQL (Supabase)**: Persistent storage for production tables:
   - `materials`: Placement study notes, playlists, attachments, and branch targeting.
   - `notifications`: Student inbox alerts, broadcast notices, and attachment metadata.
   - `mails`: Inbound corporate recruiter emails and extracted eligibility criteria.
   - `ai_interviews`: Session records, evaluation scores, rubric diagnostics, and proctor strikes.
2. **Local State Synchronization (`DataContext` + `useReducer`)**:
   - Zero-latency client updates across all 3 roles without page reloads.
   - Persisted snapshots in `localStorage` ensuring continuity across role switching.
3. **Instant Role Switching**: Switch between Student, University Admin, and Corporate Recruiter at any time while retaining live changes.

---

## 📱 Progressive Web App (PWA) & Offline Reliability

- **Service Worker (`public/sw.js`)**: Caches static assets, avatar GLB models, and core app shells.
- **Web App Manifest (`public/manifest.json`)**: Configured for standalone desktop & mobile installation (`theme_color: #4F46E5`).
- **Live Network Status Indicator (`NetworkStatusIndicator.jsx`)**: Real-time online/offline detector with reconnection notifications and offline fallback banners.

---

## 🛠 Tech Stack & Architecture

| Layer | Technology | Purpose / Details |
| :--- | :--- | :--- |
| **Fullstack Framework** | **Next.js 16 (App Router)** | Server Components, Route Handlers, Turbopack |
| **Frontend Library** | **React 19** | Component architecture, Hooks, Context |
| **3D Avatar & Graphics** | **Three.js WebGL** | Articulated corporate interviewer model, studio lighting rig |
| **Computer Vision** | **Google MediaPipe WASM** | 468-point 3D facial landmarker, eye gaze vector proctoring |
| **Backend AI Microservice** | **FastAPI + Uvicorn (Python 3.11)** | Self-hosted speech synthesis, transcription, and evaluation |
| **Neural TTS** | **Piper Neural TTS ONNX** | Low-latency British/Indian English voice, acronym normalizer |
| **Speech-to-Text** | **faster-whisper (CTranslate2)** | Private on-premise audio transcription on CPU |
| **Semantic Rubrics** | **all-MiniLM-L6-v2 ONNX** | 384-dimensional dense sentence embeddings & cosine similarity |
| **Database** | **PostgreSQL (Supabase)** | Relational storage with connection pooling & JSONB |
| **Database Client** | **pg (node-postgres)** | High-performance pooled Node client with SSL |
| **Styling** | **Tailwind CSS v4 + PostCSS** | Modern utility styling, CSS variables, dark theme |
| **Charts & Analytics** | **Recharts** | Bar charts, line charts, funnels, radar charts |
| **Icons** | **lucide-react** | Clean iconography across all dashboards |
| **PWA** | **Service Worker & Manifest** | Standalone installation, offline detection indicator |

---

## 🔐 Demo Credentials

Use any of the demo accounts below on the `/login` page or click any of the **"Quick Demo Login"** buttons to instantly sign in:

| Role | Email / User ID | Password | Persona & Focus |
| :--- | :--- | :--- | :--- |
| **Student** | `aarav.sharma@vitstudent.ac.in` or `u1` | `student123` | Final-year CSE student (Resumes, AI interviews, coding arena, drives) |
| **University Admin** | `placement@vit.ac.in` or `u2` | `admin123` | Placement Cell Director (Verifications, drive approvals, study materials) |
| **Company Recruiter** | `hr@infosys-demo.com` or `u3` | `company123` | Corporate Talent Acquisition (Job postings, candidate discovery, pipeline) |

---

## 🏃 Quick Start & Local Setup

### Prerequisites
- **Node.js**: v20.9.0 or later
- **Python**: 3.10 or 3.11 (for the self-hosted AI microservice)
- **Git**

### 1. Clone & Install Frontend
```bash
git clone https://github.com/pranavsoftware/CAREER-OS.git
cd career-os
npm install
```

### 2. Configure Environment Variables
Verify or create `.env` in the root directory:
```env
DATABASE_URL="postgresql://user:password@host:5432/postgres"
PGHOST="host"
PGPORT="5432"
PGDATABASE="postgres"
PGUSER="user"
PGPASSWORD="password"
PGSSLMODE="require"
AI_SERVICE_URL="http://127.0.0.1:8000"
```

### 3. Initialize Database
```bash
# Seed initial PostgreSQL tables and mock data
npm run db:seed
```

### 4. Start the AI Microservice (Backend)
In a separate terminal:
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
*AI Service will be listening at [http://127.0.0.1:8000](http://127.0.0.1:8000) (Interactive Swagger Docs at `/docs`).*

### 5. Start the Fullstack Web App (Frontend)
In your primary terminal:
```bash
npm run dev
```
*Next.js web application will be live at **[http://localhost:3000](http://localhost:3000)**.*

---

## 📦 Production Build & Deployment

```bash
# Generate optimized production bundle
npm run build

# Start production server
npm run start
```

### Deploying to Vercel & Railway
1. **Frontend (Next.js)**: Connect repository to [Vercel](https://vercel.com). Add environment variables (`DATABASE_URL`, `PG*`, `AI_SERVICE_URL`).
2. **AI Microservice**: Deploy the `ai-service/` folder as a container using the included `Dockerfile` and `docker-compose.yml` on Railway or AWS ECS.

---

*CAREER-OS — Revolutionizing campus placements through verified transparency, intelligent automation, and privacy-first AI.*
