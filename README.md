# CAREER-OS 🚀
> **Next-Generation Autonomous Campus Placement & Career Operating System**

A modern, full-stack simulated campus placement platform built with React, Vite, Tailwind CSS, and Recharts. CAREER-OS seamlessly connects **Students**, **University Placement Cells**, and **Corporate Recruiters** in a unified, verified, and automated workflow.

---

## 📑 Table of Contents
- [Executive Overview](#-executive-overview)
- [System Architecture & Cross-Role Workflows](#-system-architecture--cross-role-workflows)
- [Comprehensive Features by Role](#-comprehensive-features-by-role)
  - [1. Student Portal](#1-student-portal)
  - [2. University Admin Portal (Placement Cell)](#2-university-admin-portal-placement-cell)
  - [3. Corporate Recruiter Portal](#3-corporate-recruiter-portal)
- [Cross-Role Data Synchronization](#-cross-role-data-synchronization)
- [Technical Stack & Libraries](#-technical-stack--libraries)
- [Quick Start & Local Setup](#-quick-start--local-setup)
- [Demo Credentials](#-demo-credentials)
- [Deployment](#-deployment)

---

## 🌟 Executive Overview

Traditional campus placements suffer from fragmented spreadsheets, unverifiable student resumes, manual recruiter email processing, and disconnected interview pipelines. **CAREER-OS** solves this by establishing a **single source of verified truth**:

1. **Zero Resume Fraud**: Company recruiters only access profiles with credentials verified and stamped section-by-section by university administrators.
2. **Automated Eligibility & Matching**: Placement drives and inbound recruiter criteria are automatically evaluated against real-time academic records (CGPA, branch, backlogs).
3. **End-to-End Recruitment Pipelines**: Full transparency from initial student application to test rounds, interviews, and offer rollouts via synchronized Kanban boards.

---

## 🔄 System Architecture & Cross-Role Workflows

```
┌─────────────────┐       Verification Audit      ┌───────────────────────┐
│     STUDENT     │ ────────────────────────────> │   UNIVERSITY ADMIN    │
│  Profile/Resume │ <──────────────────────────── │   (Placement Cell)    │
└────────┬────────┘       Verified Credentials    └───────────┬───────────┘
         │                                                    │
         │ Applications & Drives          Drive Approvals &   │
         │                                Recruiter Mail Parse│
         v                                                    v
┌─────────────────────────────────────────────────────────────────────────┐
│                           CAREER-OS ENGINE                              │
│         (State Management, ATS Scoring, OCR, Adaptive Tests)            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
            Candidate Discovery,     │ Job Postings &
            Pipeline & Interviews    │ Recruitment Pipeline
                                     v
                          ┌───────────────────────┐
                          │  CORPORATE RECRUITER  │
                          │   (Infosys / Demo)    │
                          └───────────────────────┘
```

### Core Cross-Role Loops:
1. **The Verification Loop**: Student updates profile / certificates ➔ University Placement Cell reviews and stamps each section ➔ Recruiter search only exposes 100% verified candidate profiles.
2. **The Requisition Loop**: Company posts job openings ➔ University reviews and approves job as an official Campus Drive ➔ Drive automatically appears on eligible student dashboards.
3. **The Recruiter Mail Parser Loop**: Inbound recruiter inquiries parsed for eligibility criteria (CGPA, branches, backlogs) ➔ System evaluates live student database ➔ Instant broadcast notifications dispatched to eligible students.
4. **The Pipeline Sync Loop**: Student applies ➔ Candidate appears in University Drive reviews and Company Pipeline ➔ Interview schedules and offer updates sync across both Kanban boards.

---

## 🎯 Comprehensive Features by Role

### 1. Student Portal

The Student experience is tailored to maximize placement readiness, automate application tracking, and provide verifiable credentials.

#### 📊 Dashboard (`/student/dashboard`)
- **Key Performance Metrics**: Live cards tracking **Profile Completion %**, **Active Applications**, **Resume ATS Score**, and **Verified Certificates**.
- **Expiring Certificate Warning Banner**: Real-time alerts warning students of expiring industry certificates before placement deadlines.
- **Dynamic Drive Eligibility Engine**: Automated check (`Eligible` vs specific rejection reasons like low CGPA or ineligible branch) for all active and upcoming campus drives.
- **One-Click Drive Application**: Directly apply to eligible drives with automatic sync to company applicant rosters.
- **Notification Inbox**: Real-time broadcast alerts from university placement officers and companies with mark-as-read interaction.
- **Quick Skill Gap Snapshot**: High-level indicator of missing skills for target industry profiles with direct routing to deep learning roadmaps.

#### 👤 University-Verified Profile (`/student/profile`)
- **Section-Wise Verification Status**: Visual badges indicating whether each section is `Verified by university`, `Pending verification`, or `Rejected`.
- **Academic Records**: Manage Degree, Branch, Batch, CGPA, 10th %, 12th %, and active backlogs.
- **Technical Skills Matrix**: Add, rate (1-5 proficiency), and categorize technical proficiencies.
- **Projects & Publications**: Showcase projects with tech stacks, year, descriptions, and live GitHub/deployment links.
- **Work Experience & Internships**: Document company history, roles, tenures, and responsibilities.

#### 📄 Intelligent ATS Resume Builder (`/student/resume`)
- **Real-Time ATS Scoring Engine**: Evaluates resume match against arbitrary Job Descriptions (JDs) with instant 0-100 score calculation.
- **Keyword Match & Gap Analysis**: Highlights present keywords, missing industry keywords, and keyword density.
- **Section Completeness Breakdown**: Quantitative health scoring across Contact Info, Education, Skills, Projects, and Work Experience.
- **Template Switcher**: Toggle instantly between **Classic**, **Modern**, **Minimal**, and **Technical** styling presets.
- **Selective Section Toggling**: Customize resume versions by selectively including or excluding projects, experience, or certificates.
- **Version History & Snapshot Management**: Save named resume versions, view historical ATS scores, restore previous configurations, or delete drafts.
- **Print & PDF Export**: Clean, high-fidelity browser print styling formatted for standard A4/Letter ATS parsers.

#### 📌 Application Kanban Tracker (`/student/applications`)
- **Interactive 5-Stage Kanban Board**: Drag-and-drop or advance applications across:
  `Applied` ➔ `Online Test` ➔ `Interview` ➔ `Offer` ➔ `Rejected`.
- **Status Audit History**: Automatic timestamp tracking recording the exact date every stage transition occurred.
- **Off-Campus Application Tracker**: Modal to manually add off-campus job applications to maintain a unified job hunt dashboard.
- **Application Detail Drawer**: View CTC, applied role, dates, stages, and personal interview preparation notes.

#### 📜 Smart Certificates & OCR Engine (`/student/certificates`)
- **Document Management**: Centralized repository of earned certificates with status badges (`Valid`, `Expiring soon`, `Expired`).
- **Simulated OCR Parser**: Upload certificate documents/images to automatically extract certificate title, issuing organization, issue date, expiry date, and skill tags.
- **Duplicate & Fraud Prevention**: Detects duplicate certificates by matching title, issuer, and issue date against existing entries.
- **Direct Skill Synchronization**: Automatically append extracted and verified certificate skills into the student's profile.

#### 🎯 Skill Gap Analysis & Learning Roadmap (`/student/skill-gap`)
- **Industry Role Benchmarking**: Select from target tech roles including *Frontend Developer*, *Backend Developer*, *Data Analyst*, *Full Stack Developer*, and *Cloud Engineer*.
- **Skill Proficiency Matrix**: Tabular comparison of **Required Level (1-5)** vs **Current Level**, calculating exact skill gaps (`Met`, `Partial`, `Missing`).
- **Recharts Proficiency Comparison Bar Chart**: Dual-colored visual bar chart comparing required standards vs candidate competency.
- **Actionable Phased Learning Roadmap**: Multi-phase curriculum (e.g., Core Fundamentals ➔ State Management ➔ Bundling ➔ Automated Testing) with interactive checkboxes and completion % tracker.

#### 🧠 Adaptive Interview Prep & Question Bank (`/student/interview-prep`)
- **Comprehensive Question Bank**: Filterable repository of technical and non-technical questions across **DSA**, **DBMS**, **OS**, **Networks**, **React**, **Aptitude**, and **HR**.
- **Adaptive Mock Test Engine**: Dynamically recalibrates subsequent question difficulty (**Easy**, **Medium**, **Hard**) based on continuous correct/incorrect answers.
- **Comprehensive Test Results & Diagnostics**: Detailed score breakdowns, accuracy rates, and identified weak area diagnostics.
- **Performance Trend Analytics**: Recharts Line Chart tracking score trajectories across successive mock tests over time.

#### 🌐 Public Digital Portfolio Preview (`/student/portfolio`)
- **Dynamic Web Portfolio**: Auto-generated personal portfolio website reflecting verified profile records, CGPA, projects, and skills.
- **One-Click Shareable Link**: Direct link generator (`https://career-os.vit.ac.in/p/:regNo`) ready to share with recruiters or on LinkedIn.

---

### 2. University Admin Portal (Placement Cell)

The University Admin dashboard equips placement directors with bird's-eye metrics, candidate verification workflows, drive management, and recruiter parsing tools.

#### 📈 Placement Cell Overview (`/university/dashboard`)
- **Executive Metrics**: Live KPI counters for **Total Students (Batch 2026)**, **Verified Profiles (%)**, **Active Drives**, **Students Placed**, and **Placement Rate %**.
- **Branch-Wise Placement Analytics**: Recharts Bar Chart showing Placed vs Total student distributions across CSE, IT, ECE, EEE, and Mechanical engineering.
- **Actionable Pending Verification Queue**: Instant alerts indicating student profiles awaiting placement cell review.
- **Active Drive Monitor**: Summary table of live corporate drives, CTC offerings, deadlines, and applicant counts.

#### 👥 Student Directory (`/university/students`)
- **Comprehensive Student Roster**: Browse all registered students with contact details, registration numbers, branch, and CGPA.
- **Multi-Parameter Filtering**: Filter students by search query, branch, minimum CGPA threshold, backlog status (`All`, `0 Backlogs`, `>0 Backlogs`), and verification status (`All`, `Verified`, `Pending`).
- **Deep-Dive Navigation**: Direct click-through to individual student verification inspection pages.

#### 🔍 Granular Profile Verification (`/university/students/:id`)
- **Section-Level Audit**: Audit individual sections (**Personal Information**, **Education Records**, **Skills**, **Projects**, **Experience**).
- **One-Click Approval**: Verify individual sections with a placement cell verified stamp.
- **Rejection Modal with Custom Remarks**: Flag fraudulent or incomplete sections with custom explanatory remarks sent back to the student.
- **Certificate Verification**: Review attached certificates, credential IDs, and OCR-parsed issue details.

#### 🏢 Placement Drives & Company Approval (`/university/drives`)
- **Float Campus Placement Drives**: Modal to float new campus recruitment drives defining eligible branches, CGPA criteria, maximum allowed backlogs, CTC, and deadlines.
- **Company Job Approval Queue**: Review requisitions submitted by registered company recruiters; approve to publish as campus drives or reject with comments.
- **Drive Lifecycle Tracking**: Manage drive statuses between `Open`, `Upcoming`, and `Closed`.

#### 📋 Drive Detail & Applicant Management (`/university/drives/:id`)
- **Roster of Drive Applicants**: Review all students who applied to a specific placement drive with their CGPA and branch details.
- **Shortlist / Reject Controls**: Approve candidates to advance to company rounds or reject ineligible candidates.
- **CSV Data Export**: Export candidate lists into formatted CSV files (`Student Name, Registration No, Branch, CGPA, Status`) for external company communication.

#### 📬 Eligibility Mail Filter & Recruiter NLP Parser (`/university/mail-filter`)
- **Inbound Recruiter Inbox**: Centralized dashboard for unstructured emails sent by visiting recruiters and corporate HRs.
- **Criteria Extraction Engine**: Parses recruiter email text to automatically extract minimum CGPA, eligible branches, and backlog constraints.
- **Live Database Eligibility Counter**: Instant calculation of exactly how many students in the university database match the recruiter's criteria.
- **Broadcast Notification Dispatcher**: Single-click button to broadcast targeted notification alerts to all eligible students informing them of the upcoming opportunity.

---

### 3. Corporate Recruiter Portal

The Corporate Recruiter portal allows HR teams to post positions, discover verified candidates without screening noise, and run interview pipelines.

#### 📊 Recruiter Dashboard (`/company/dashboard`)
- **Hiring Funnel Analytics**: Visual Recharts Bar Chart illustrating the funnel stages: `Applied` ➔ `Screened` ➔ `Interview` ➔ `Offer`.
- **Corporate Key Metrics**: Active Job Postings, Total Applicants, Candidates in Interview, and Offers Extended.
- **Recent Applicant Stream**: Feed of candidate submissions with immediate candidate scorecard access.

#### 💼 Job Requisition Management (`/company/jobs`)
- **Post Campus Requisitions**: Create detailed openings with role titles, job descriptions, required skill tags, minimum CGPA, eligible branches, vacancies, CTC (LPA), location, and application deadlines.
- **University Approval Workflow**: New jobs enter `Pending approval` status and convert to active placement drives upon university placement cell sign-off.
- **Requisition Tracking**: View openings, applicant numbers, and listing statuses.

#### 🔎 Candidate Discovery Engine (`/company/candidates`)
- **Verified-Only Talent Pool**: Enforces university verification—only students with verified credentials appear in search results, eliminating fake claims.
- **Skill Match Score Calculation**: Real-time algorithm calculates **% Match** between candidate skillsets and the selected job requisition.
- **Granular Multi-Filters**: Filter by name/reg number, branch, minimum CGPA slider, specific skill tags (React, Python, AWS, Docker, etc.), and certificate verification status.
- **Direct Candidate Evaluation**: One-click transition into individual candidate audit dossiers.

#### 📑 Candidate Dossier & Evaluation (`/company/candidates/:id`)
- **Holistic Candidate Profile**: Access verified GPA, academic credentials, verified skills, and project links.
- **Recruiter Evaluation Notes**: Private notes log for interviewers to record candidate feedback and round-by-round evaluations.
- **Pipeline Quick Actions**: Promote candidate to `Interview Scheduled` or mark as `Rejected`.

#### 📋 Corporate Recruitment Pipeline (`/company/pipeline`)
- **Requisition-Specific Kanban Board**: Filter pipeline view across specific company job postings.
- **5-Stage Pipeline Tracking**: Drag-and-drop or advance candidates through:
  `Shortlisted` ➔ `Interview Scheduled` ➔ `Selected` ➔ `Offer Sent` ➔ `Rejected`.
- **Interactive Interview Scheduler**: Modal to schedule interviews with specific dates, times, video conferencing platforms (Google Meet, Teams, In-Person), and round descriptions.
- **Direct Status Sync**: Updating stages automatically notifies students and updates application statuses.

---

## 💾 Cross-Role Data Synchronization

CAREER-OS operates using a unified **Local Storage State Persistence Architecture** (`DataContext` + `useReducer`):

- **Data Persistence**: All changes (verification actions, drive floats, applications, stage movements, ATS versions, test attempts) persist across page reloads in `localStorage`.
- **Role Switching**: Switch between Student, University Admin, and Company Recruiter at any time without losing applied filters, created drives, or verified badges.
- **Initial Seed Data**: Pre-loaded with realistic mock data reflecting actual engineering disciplines, students (e.g., Aarav Sharma), verified certificates, incoming recruiter emails, and active drives.

---

## 🛠 Tech Stack & Architecture

| Category | Technology | Usage / Purpose |
|----------|-----------|-----------------|
| **Fullstack Framework** | **Next.js 16 (App Router)** | Fullstack React framework with Node.js Route Handlers |
| **Backend Runtime** | **Node.js** | Server-side API execution and business logic |
| **Database** | **PostgreSQL (Supabase)** | Relational database storage with JSONB support and connection pooling |
| **Database Client** | **pg (node-postgres)** | High-performance pooled client with SSL verification |
| **Styling** | **Tailwind CSS v4 + PostCSS** | Modern utility-first CSS styling and dark theme tokens |
| **Data Visualizations** | **Recharts** | Interactive Bar Charts, Line Charts, Radar, and Funnels |
| **Icons** | **lucide-react** | Clean iconography across all portals |
| **State Management** | **React Context + useReducer** | Unified reactive state synchronized with live PostgreSQL backend |
| **Data Export** | **Blob / CSV Utility** | Dynamic client-side CSV spreadsheet generation |

---

## 🔐 Demo Credentials

Use any of the demo accounts below on the `/login` page or click any of the **"Quick Demo Login"** buttons to instantly sign in:

| Role | Email / User ID | Password | Persona & Focus |
|------|-----------------|----------|-----------------|
| **Student** | `aarav.sharma@vitstudent.ac.in` or `u1` | `student123` | Final-year CSE student building resumes, practicing tests, & applying to drives |
| **University Admin** | `placement@vit.ac.in` or `u2` | `admin123` | Placement Cell Director verifying profiles, floating drives & parsing recruiter emails |
| **Company Recruiter** | `hr@infosys-demo.com` or `u3` | `company123` | Corporate Talent Acquisition posting jobs, evaluating candidates & scheduling rounds |

---

## 🏃 Running Locally

### Prerequisites
- Node.js 18.x or later
- npm or yarn
- Supabase PostgreSQL credentials (configured in `.env`)

### Installation & Database Seeding
```bash
# Clone the repository
git clone https://github.com/pranavsoftware/CAREER-OS.git

# Navigate into the project folder
cd career-os

# Install dependencies
npm install

# Run database schema migration and populate initial PostgreSQL records
npm run db:seed

# Start the Next.js fullstack development server
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📦 Production Build

```bash
# Generate optimized fullstack production build
npm run build

# Start production server
npm run start
```

---

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

When deploying to Vercel:
1. Connect the repository.
2. Add your `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE` environment variables in Vercel Project Settings.
3. Deploy! Next.js will automatically deploy the frontend and Node.js serverless API route handlers.

---

*CAREER-OS — Revolutionizing campus placements through verified transparency and intelligent automation.*
