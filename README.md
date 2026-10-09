# CAREER-OS

A modern **campus placement platform** built as a frontend-only React prototype.

## 🚀 Live Demo
> Deployed on Vercel

## 🎯 Features

### For Students
- **Dashboard** — placement stats, upcoming drives, eligibility check
- **Profile** — section-wise university-verified credentials
- **Resume Builder** — ATS scoring, keyword analysis, PDF export
- **Applications** — drag-and-drop Kanban board tracking
- **Certificates** — OCR simulation, duplicate detection, expiry alerts
- **Skill Gap** — visual bar chart vs job requirements + roadmap
- **Interview Prep** — 40+ MCQ adaptive test, weak area tracker

### For University Admins
- **Dashboard** — branch-wise placement chart (Recharts)
- **Students** — directory with filters, section verify/reject
- **Drives** — float drives, approve company job postings
- **Mail Filter** — parse recruiter criteria, broadcast notifications

### For Company Recruiters
- **Dashboard** — hiring funnel chart
- **Jobs** — post requisitions awaiting university approval
- **Candidates** — verified-only filter, match score
- **Pipeline** — Kanban board, schedule interviews, offer flow

## 🛠 Tech Stack
- **React 18 + Vite** (JavaScript)
- **Tailwind CSS v4**
- **react-router-dom v6**
- **recharts** — charts
- **lucide-react** — icons
- **Context + useReducer** — state persisted to localStorage

## 🔐 Demo Credentials

| Role | Email / ID | Password |
|------|-----------|----------|
| Student | `aarav.sharma@vitstudent.ac.in` or `u1` | `student123` |
| University Admin | `placement@vit.ac.in` or `u2` | `admin123` |
| Company Admin | `hr@infosys-demo.com` or `u3` | `company123` |

## 🏃 Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 📦 Build

```bash
npm run build
```

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

This is a pure frontend SPA. Set the **Framework Preset** to `Vite` in Vercel and deploy directly.

---

Built with ❤️ as a campus placement platform demo.
