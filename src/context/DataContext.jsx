'use client';

import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { initialInterviews } from '../data/interviews';
import { initialStudents } from '../data/students';
import { initialJobs } from '../data/jobs';
import { initialDrives } from '../data/drives';
import { initialApplications } from '../data/applications';
import { initialCertificates } from '../data/certificates';
import { initialNotifications } from '../data/notifications';
import { initialMails } from '../data/mails';
import { questionBank } from '../data/questionBank';
import { skillTaxonomy } from '../data/skillTaxonomy';

const DataContext = createContext(null);
const STORAGE_KEY = 'career_os_data';

const defaultEmptyState = {
  students: initialStudents,
  drives: initialDrives,
  jobs: initialJobs,
  applications: initialApplications,
  driveApplications: initialApplications,
  certificates: initialCertificates,
  notifications: initialNotifications,
  mails: initialMails,
  sentMails: [],
  materials: [],
  pipeline: {},
  questionBank: questionBank || [],
  skillTaxonomy: skillTaxonomy || {},
  roleOptions: Object.keys(skillTaxonomy || {}),
  resumeVersions: {},
  roadmapProgress: {},
  testAttempts: [],
  interviews: initialInterviews,
  jobShortlists: [],
  universityRecords: [],
  verificationSettings: { personalInfo: true, education: true, skills: true, projects: true, experience: true },
  // Phase 2
  materialEnrollments: [],   // [{ materialId, studentId, enrolled, completed }]
  materialRatings: [],       // [{ materialId, studentId, stars, review, createdAt }]
  rescheduleRequests: [],    // [{ id, interviewId, studentId, status, ... }]
};


function resilientFetch(url, options = {}) {
  // If offline or on mobile connection drop, safely queue mutation to localStorage
  if (typeof window !== 'undefined' && !navigator.onLine && options.method && options.method !== 'GET') {
    try {
      const stored = localStorage.getItem('career_os_pending_mutations');
      const queue = stored ? JSON.parse(stored) : [];
      queue.push({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        url,
        method: options.method,
        headers: options.headers || { 'Content-Type': 'application/json' },
        body: options.body,
        timestamp: Date.now(),
      });
      localStorage.setItem('career_os_pending_mutations', JSON.stringify(queue));
      return Promise.resolve({ ok: true, queued: true });
    } catch (_) {}
  }

  return fetch(url, options).catch((err) => {
    console.warn(`[Network] Request to ${url} failed, queueing offline:`, err);
    if (typeof window !== 'undefined' && options.method && options.method !== 'GET') {
      try {
        const stored = localStorage.getItem('career_os_pending_mutations');
        const queue = stored ? JSON.parse(stored) : [];
        queue.push({
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          url,
          method: options.method,
          headers: options.headers || { 'Content-Type': 'application/json' },
          body: options.body,
          timestamp: Date.now(),
        });
        localStorage.setItem('career_os_pending_mutations', JSON.stringify(queue));
      } catch (_) {}
    }
  });
}

function dataReducer(state, action) {
  switch (action.type) {
    case 'SET_SERVER_DATA': {
      return {
        ...state,
        ...action.payload,
      };
    }

    // ---- STUDENT ----
    case 'UPDATE_STUDENT': {
      const students = state.students.map(s =>
        s.id === action.payload.id ? { ...s, ...action.payload } : s
      );
      // Persist to backend
      resilientFetch(`/api/students/${action.payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error updating student in db:', err));

      return { ...state, students };
    }

    case 'ADD_STUDENT': {
      resilientFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error adding student to db:', err));

      return { ...state, students: [...state.students, action.payload] };
    }

    case 'ADD_STUDENTS': {
      resilientFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: action.payload }),
      }).catch(err => console.error('Error mass adding students to db:', err));

      return { ...state, students: [...state.students, ...action.payload] };
    }

    // ---- DRIVES ----
    case 'ADD_DRIVE': {
      // Persist to backend
      resilientFetch('/api/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error adding drive to db:', err));

      return { ...state, drives: [action.payload, ...state.drives] };
    }

    case 'UPDATE_DRIVE': {
      // Persist to backend
      resilientFetch(`/api/drives/${action.payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error updating drive in db:', err));

      const drives = state.drives.map(d =>
        d.id === action.payload.id ? { ...d, ...action.payload } : d
      );
      return { ...state, drives };
    }

    // ---- JOBS ----
    case 'ADD_JOB': {
      // Persist to backend
      resilientFetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error adding job to db:', err));

      return { ...state, jobs: [...state.jobs, action.payload] };
    }

    case 'UPDATE_JOB': {
      // Persist to backend
      resilientFetch(`/api/jobs/${action.payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error updating job in db:', err));

      const jobs = state.jobs.map(j =>
        j.id === action.payload.id ? { ...j, ...action.payload } : j
      );
      return { ...state, jobs };
    }

    // ---- APPLICATIONS ----
    case 'ADD_APPLICATION': {
      // Persist to backend
      resilientFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error adding application to db:', err));

      return { ...state, applications: [...state.applications, action.payload] };
    }

    case 'UPDATE_APPLICATION': {
      // Persist to backend
      resilientFetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error updating application in db:', err));

      const applications = state.applications.map(a =>
        a.id === action.payload.id ? { ...a, ...action.payload } : a
      );
      return { ...state, applications };
    }

    case 'DELETE_APPLICATION': {
      return { ...state, applications: state.applications.filter(a => a.id !== action.payload) };
    }

    // ---- DRIVE APPLICATIONS ----
    case 'ADD_DRIVE_APPLICATION': {
      // Also register as an application in DB
      resilientFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...action.payload,
          id: action.payload.id,
          studentId: action.payload.studentId,
          driveId: action.payload.driveId,
          company: action.payload.company,
          role: action.payload.role,
          ctc: action.payload.ctc,
          status: action.payload.status || 'Applied',
        }),
      }).catch(err => console.error('Error adding drive application:', err));

      return { ...state, driveApplications: [...state.driveApplications, action.payload] };
    }

    case 'UPDATE_DRIVE_APPLICATION': {
      const driveApplications = state.driveApplications.map(a =>
        a.id === action.payload.id ? { ...a, ...action.payload } : a
      );
      return { ...state, driveApplications };
    }

    // ---- CERTIFICATES ----
    case 'ADD_CERTIFICATE': {
      // Persist to backend
      resilientFetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error adding certificate to db:', err));

      return { ...state, certificates: [...state.certificates, action.payload] };
    }

    case 'DELETE_CERTIFICATE': {
      // Persist to backend
      resilientFetch(`/api/certificates?id=${action.payload}`, {
        method: 'DELETE',
      }).catch(err => console.error('Error deleting certificate from db:', err));

      return { ...state, certificates: state.certificates.filter(c => c.id !== action.payload) };
    }

    // ---- NOTIFICATIONS ----
    case 'ADD_NOTIFICATION': {
      resilientFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error creating notification in db:', err));

      return { ...state, notifications: [action.payload, ...state.notifications] };
    }

    case 'MARK_NOTIFICATION_READ': {
      resilientFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: action.payload, read: true }),
      }).catch(err => console.error('Error marking notification read in db:', err));

      const notifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      return { ...state, notifications };
    }

    case 'MARK_ALL_READ': {
      const notifications = state.notifications.map(n => ({ ...n, read: true }));
      return { ...state, notifications };
    }

    // ---- MAILS ----
    case 'UPDATE_MAIL': {
      resilientFetch('/api/mails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error updating mail in db:', err));

      const mails = state.mails.map(m =>
        m.id === action.payload.id ? { ...m, ...action.payload } : m
      );
      return { ...state, mails };
    }

    case 'ADD_SENT_MAIL': {
      resilientFetch('/api/sent-mails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error recording sent mail in db:', err));

      return {
        ...state,
        sentMails: [action.payload, ...(state.sentMails || [])],
      };
    }

    // ---- MATERIALS (Study Materials & Notes) ----
    case 'ADD_MATERIAL': {
      resilientFetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error adding material in db:', err));

      return { ...state, materials: [action.payload, ...(state.materials || [])] };
    }

    case 'DELETE_MATERIAL': {
      resilientFetch(`/api/materials/${action.payload}`, {
        method: 'DELETE',
      }).catch(err => console.error('Error deleting material from db:', err));

      return {
        ...state,
        materials: (state.materials || []).filter(m => m.id !== action.payload),
      };
    }

    case 'UPDATE_MATERIAL': {
      resilientFetch(`/api/materials/${action.payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error updating material in db:', err));

      return {
        ...state,
        materials: (state.materials || []).map(m =>
          m.id === action.payload.id ? { ...m, ...action.payload } : m
        ),
      };
    }

    // ---- VERIFICATION (university verifies student sections) ----
    case 'VERIFY_STUDENT_SECTION': {
      const { studentId, section, status, remark } = action.payload;
      const targetStudent = state.students.find(s => s.id === studentId);
      const newVerification = { ...(targetStudent?.verificationStatus || {}), [section]: status };
      const statuses = Object.values(newVerification);
      const profileStatus = statuses.every(v => v === 'Verified') ? 'Verified'
        : statuses.some(v => v === 'Verified') ? 'Partial'
        : 'Pending';

      // Persist to DB
      resilientFetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus: newVerification,
          profileStatus,
        }),
      }).catch(err => console.error('Error updating verification status in db:', err));

      const students = state.students.map(s => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          verificationStatus: newVerification,
          profileStatus,
          verificationRemarks: { ...(s.verificationRemarks || {}), [section]: remark },
        };
      });
      return { ...state, students };
    }

    // ---- SHORTLISTS (CDC & Company) ----
    case 'SET_JOB_SHORTLIST': {
      const { jobId, shortlist } = action.payload;
      const otherShortlists = (state.jobShortlists || []).filter(s => s.jobId !== jobId);
      return {
        ...state,
        jobShortlists: [...otherShortlists, ...shortlist],
      };
    }

    case 'UPDATE_SHORTLIST_CANDIDATE': {
      const { jobId, studentId, status, rank } = action.payload;
      const updatedShortlists = (state.jobShortlists || []).map(item => {
        if (item.jobId === jobId && item.studentId === studentId) {
          return {
            ...item,
            status: status !== undefined ? status : item.status,
            rank: rank !== undefined ? rank : item.rank,
          };
        }
        return item;
      });

      resilientFetch(`/api/jobs/${jobId}/shortlist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'university' },
        body: JSON.stringify({ studentId, status, rank }),
      }).catch(err => console.error('Error updating shortlist candidate:', err));

      return {
        ...state,
        jobShortlists: updatedShortlists,
      };
    }

    case 'SEND_SHORTLIST_TO_COMPANY': {
      const { jobId, studentIds } = action.payload;
      const updatedShortlists = (state.jobShortlists || []).map(item => {
        if (item.jobId === jobId && (!studentIds || studentIds.includes(item.studentId))) {
          return {
            ...item,
            status: 'Sent to Company',
            emailedAt: new Date().toISOString(),
          };
        }
        return item;
      });

      // Update candidate_pipelines optimistically
      const jobPipeline = { ...(state.pipeline[jobId] || {}) };
      (studentIds || []).forEach(stId => {
        jobPipeline[stId] = 'Shortlisted';
      });

      resilientFetch(`/api/jobs/${jobId}/shortlist/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'university' },
        body: JSON.stringify({ studentIds }),
      }).catch(err => console.error('Error sending shortlist to company:', err));

      return {
        ...state,
        jobShortlists: updatedShortlists,
        pipeline: {
          ...state.pipeline,
          [jobId]: jobPipeline,
        },
      };
    }

    // ---- UNIVERSITY RECORDS & VERIFICATION ----
    case 'IMPORT_UNIVERSITY_RECORDS': {
      const { records } = action.payload;
      resilientFetch('/api/university/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'university' },
        body: JSON.stringify({ records }),
      }).catch(err => console.error('Error importing university records:', err));

      return {
        ...state,
        universityRecords: [...(state.universityRecords || []), ...records],
      };
    }

    case 'UPDATE_VERIFICATION_SETTINGS': {
      const { section, autoEnabled } = action.payload;
      resilientFetch('/api/university/verification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'university' },
        body: JSON.stringify({ section, autoEnabled }),
      }).catch(err => console.error('Error updating verification settings:', err));

      return {
        ...state,
        verificationSettings: {
          ...(state.verificationSettings || {}),
          [section]: autoEnabled,
        },
      };
    }

    // ---- PIPELINE (company) ----
    case 'UPDATE_PIPELINE': {
      const { jobId, studentId, stage } = action.payload;
      const jobPipeline = { ...(state.pipeline[jobId] || {}), [studentId]: stage };
      const newPipeline = { ...state.pipeline, [jobId]: jobPipeline };

      // Persist to DB
      resilientFetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, studentId, stage }),
      }).catch(err => console.error('Error updating pipeline in db:', err));

      let applications = state.applications;
      if (stage === 'Offer Sent' || stage === 'Offer') {
        applications = state.applications.map(a => {
          if (a.studentId === studentId) {
            const job = state.jobs.find(j => j.id === jobId);
            if (job && a.company === job.company) {
              return {
                ...a,
                status: 'Offer',
                statusHistory: [
                  ...(a.statusHistory || []),
                  { stage: 'Offer', date: new Date().toISOString().split('T')[0] },
                ],
              };
            }
          }
          return a;
        });
      }

      return { ...state, pipeline: newPipeline, applications };
    }

    // ---- RESUME VERSIONS ----
    case 'SAVE_RESUME_VERSION': {
      const { studentId, version } = action.payload;
      resilientFetch('/api/resume-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, ...version }),
      }).catch(err => console.error('Error saving resume version to db:', err));

      const existing = state.resumeVersions[studentId] || [];
      return {
        ...state,
        resumeVersions: {
          ...state.resumeVersions,
          [studentId]: [version, ...existing],
        },
      };
    }

    case 'DELETE_RESUME_VERSION': {
      const { studentId, versionId } = action.payload;
      resilientFetch(`/api/resume-versions?id=${versionId}`, {
        method: 'DELETE',
      }).catch(err => console.error('Error deleting resume version from db:', err));

      const existing = state.resumeVersions[studentId] || [];
      return {
        ...state,
        resumeVersions: {
          ...state.resumeVersions,
          [studentId]: existing.filter(v => v.id !== versionId),
        },
      };
    }

    // ---- ROADMAP PROGRESS ----
    case 'TOGGLE_ROADMAP_STEP': {
      const { studentId, role, stepId } = action.payload;
      const key = `${studentId}_${role}`;
      const current = state.roadmapProgress[key] || {};
      const newStatus = !current[stepId];

      resilientFetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, role, stepId, completed: newStatus }),
      }).catch(err => console.error('Error saving roadmap progress to db:', err));

      return {
        ...state,
        roadmapProgress: {
          ...state.roadmapProgress,
          [key]: { ...current, [stepId]: newStatus },
        },
      };
    }

    // ---- TEST ATTEMPTS ----
    case 'ADD_TEST_ATTEMPT': {
      resilientFetch('/api/test-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error saving test attempt to db:', err));

      return { ...state, testAttempts: [...state.testAttempts, action.payload] };
    }

    // ---- INTERVIEWS (Online Video Calls) ----
    case 'SYNC_INTERVIEWS': {
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      const filtered = incoming.filter(i => !isDemoInterview(i));
      return {
        ...state,
        interviews: filtered,
      };
    }

    case 'SCHEDULE_INTERVIEW': {
      const interview = {
        ...action.payload,
        id: action.payload.id || `int_${Date.now()}`,
        meetingId: action.payload.meetingId || `room-${Date.now().toString(36)}`,
        status: action.payload.status || 'Scheduled',
        createdAt: new Date().toISOString(),
      };

      // Support multi-candidate notifications
      const targetCandidates = Array.isArray(interview.students) && interview.students.length > 0
        ? interview.students
        : (interview.studentId ? [{ id: interview.studentId, name: interview.studentName }] : []);

      const newNotifs = targetCandidates.map((st, idx) => ({
        id: `n_int_${Date.now()}_${idx}`,
        studentId: st.id,
        type: 'Interview Scheduled',
        title: `Online Video Interview: ${interview.company}`,
        message: `Your interview for ${interview.role} (${interview.type}) is scheduled for ${interview.date} at ${interview.time}. Room code: ${interview.meetingId}`,
        read: false,
        createdAt: new Date().toISOString(),
      }));

      // Immediately notify other tabs on this machine
      if (typeof window !== 'undefined') {
        try {
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('career_os_realtime_sync');
            bc.postMessage({ type: 'INTERVIEW_SCHEDULED', interview });
            bc.close();
          }
          localStorage.setItem('career_os_last_interview_sync', JSON.stringify({
            timestamp: Date.now(),
            action: 'SCHEDULE',
            interview,
          }));
        } catch (_) {}
      }

      resilientFetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interview),
      }).catch(err => console.debug('Interview sync to backend:', err));

      return {
        ...state,
        interviews: [interview, ...(state.interviews || [])],
        notifications: [...newNotifs, ...(state.notifications || [])],
      };
    }

    case 'UPDATE_INTERVIEW': {
      const interviews = (state.interviews || []).map(i =>
        i.id === action.payload.id || (action.payload.meetingId && i.meetingId === action.payload.meetingId)
          ? { ...i, ...action.payload }
          : i
      );

      if (typeof window !== 'undefined') {
        try {
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('career_os_realtime_sync');
            bc.postMessage({ type: 'INTERVIEW_UPDATED', interview: action.payload });
            bc.close();
          }
          localStorage.setItem('career_os_last_interview_sync', JSON.stringify({
            timestamp: Date.now(),
            action: 'UPDATE',
            interview: action.payload,
          }));
        } catch (_) {}
      }

      resilientFetch('/api/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.debug('Interview update sync:', err));
      return { ...state, interviews };
    }

    case 'CANCEL_INTERVIEW': {
      const interviews = (state.interviews || []).map(i =>
        i.id === action.payload ? { ...i, status: 'Cancelled' } : i
      );

      if (typeof window !== 'undefined') {
        try {
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('career_os_realtime_sync');
            bc.postMessage({ type: 'INTERVIEW_CANCELLED', id: action.payload });
            bc.close();
          }
          localStorage.setItem('career_os_last_interview_sync', JSON.stringify({
            timestamp: Date.now(),
            action: 'CANCEL',
            id: action.payload,
          }));
        } catch (_) {}
      }

      resilientFetch('/api/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: action.payload, status: 'Cancelled' }),
      }).catch(err => console.debug('Interview cancel sync:', err));
      return { ...state, interviews };
    }

    // ---- PHASE 2: MATERIAL ENROLLMENTS & RATINGS ----
    case 'ENROLL_MATERIAL': {
      const { materialId, studentId } = action.payload;
      const existing = (state.materialEnrollments || []).find(
        e => e.materialId === materialId && e.studentId === studentId
      );
      if (existing) return state; // already enrolled, no-op
      const newEnrollment = { materialId, studentId, enrolled: true, completed: false, enrolledAt: new Date().toISOString() };
      resilientFetch(`/api/materials/${materialId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      }).catch(err => console.error('Error enrolling material:', err));
      return { ...state, materialEnrollments: [...(state.materialEnrollments || []), newEnrollment] };
    }

    case 'COMPLETE_MATERIAL': {
      const { materialId, studentId, completed } = action.payload;
      resilientFetch(`/api/materials/${materialId}/enroll`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, completed }),
      }).catch(err => console.error('Error marking material complete:', err));
      return {
        ...state,
        materialEnrollments: (state.materialEnrollments || []).map(e =>
          e.materialId === materialId && e.studentId === studentId ? { ...e, completed } : e
        ),
      };
    }

    case 'RATE_MATERIAL': {
      const { materialId, studentId, stars, review } = action.payload;
      const newRating = { materialId, studentId, stars, review, createdAt: new Date().toISOString() };
      resilientFetch(`/api/materials/${materialId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, stars, review }),
      }).catch(err => console.error('Error rating material:', err));
      const ratings = (state.materialRatings || []).filter(
        r => !(r.materialId === materialId && r.studentId === studentId)
      );
      return { ...state, materialRatings: [...ratings, newRating] };
    }

    // ---- PHASE 2: RESCHEDULE REQUESTS ----
    case 'ADD_RESCHEDULE_REQUEST': {
      const req = { ...action.payload, status: 'Pending', createdAt: new Date().toISOString() };
      resilientFetch('/api/interviews/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).catch(err => console.error('Error adding reschedule request:', err));
      return { ...state, rescheduleRequests: [...(state.rescheduleRequests || []), req] };
    }

    case 'UPDATE_RESCHEDULE_REQUEST': {
      const { id, ...updates } = action.payload;
      resilientFetch(`/api/interviews/reschedule/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch(err => console.error('Error updating reschedule request:', err));
      return {
        ...state,
        rescheduleRequests: (state.rescheduleRequests || []).map(r =>
          r.id === id ? { ...r, ...updates } : r
        ),
      };
    }

    case 'SYNC_RESCHEDULE_REQUESTS': {
      return { ...state, rescheduleRequests: action.payload || [] };
    }

    // ---- RESET ----
    case 'RESET_DATA': {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      return defaultEmptyState;
    }

    default:
      return state;
  }
}

const DEMO_INTERVIEW_IDS = new Set(['int_101', 'int_102', 'int_103', 'int_104', 'int_105', 'int_106', 'int_108', 'int_109', 'int_110']);
function isDemoInterview(i) {
  if (!i) return true;
  if (DEMO_INTERVIEW_IDS.has(i.id)) return true;
  if (typeof i.meetingId === 'string' && (
    i.meetingId.includes('live-101') ||
    i.meetingId.includes('locked-102') ||
    i.meetingId.includes('locked-104') ||
    i.meetingId.includes('demo-completed') ||
    i.meetingId.includes('demo-scheduled')
  )) return true;
  return false;
}

function getInitialState() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultEmptyState,
          ...parsed,
          students: (parsed.students && parsed.students.length > 0) ? parsed.students : defaultEmptyState.students,
          interviews: (parsed.interviews && Array.isArray(parsed.interviews)) ? parsed.interviews.filter(i => !isDemoInterview(i)) : [],
          jobs: (parsed.jobs && parsed.jobs.length > 0) ? parsed.jobs : defaultEmptyState.jobs,
          drives: (parsed.drives && parsed.drives.length > 0) ? parsed.drives : defaultEmptyState.drives,
        };
      }
    } catch (e) {
      // ignore
    }
  }
  return defaultEmptyState;
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, defaultEmptyState, getInitialState);
  const [loading, setLoading] = useState(false);

  // Fetch all initial data from PostgreSQL Backend in background
  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('/api/initial-data', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;

        dispatch({
          type: 'SET_SERVER_DATA',
          payload: {
            students: (data.students && data.students.length) ? data.students : initialStudents,
            jobs: (data.jobs && data.jobs.length) ? data.jobs : initialJobs,
            drives: (data.drives && data.drives.length) ? data.drives : initialDrives,
            applications: (data.applications && data.applications.length) ? data.applications : initialApplications,
            driveApplications: (data.applications && data.applications.length) ? data.applications : initialApplications,
            certificates: (data.certificates && data.certificates.length) ? data.certificates : initialCertificates,
            notifications: (data.notifications && data.notifications.length) ? data.notifications : initialNotifications,
            mails: (data.mails && data.mails.length) ? data.mails : initialMails,
            sentMails: data.sentMails || [],
            materials: data.materials || [],
            pipeline: data.pipeline || {},
            questionBank: (data.questionBank && data.questionBank.length) ? data.questionBank : (questionBank || []),
            interviews: (data.interviews && Array.isArray(data.interviews)) ? data.interviews.filter(i => !isDemoInterview(i)) : [],
            skillTaxonomy: data.skillTaxonomy || skillTaxonomy,
            roleOptions: data.roleOptions || Object.keys(skillTaxonomy || {}),
            testAttempts: data.testAttempts || [],
            resumeVersions: data.resumeVersions || {},
            roadmapProgress: data.roadmapProgress || {},
            materialEnrollments: data.materialEnrollments || [],
            materialRatings: data.materialRatings || [],
            rescheduleRequests: data.rescheduleRequests || [],
          },
        });
      } catch (err) {
        console.debug('Initial data sync notice:', err.message || err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to local storage for offline responsiveness
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Real-time zero-latency cross-tab sync (BroadcastChannel & storage events)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let bc = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('career_os_realtime_sync');
        bc.onmessage = async (evt) => {
          if (!evt.data) return;
          const { type, interview, id } = evt.data;

          if (type === 'INTERVIEW_SCHEDULED' && interview) {
            // Re-fetch clean list from backend to ensure consistent DB state
            try {
              const res = await fetch('/api/interviews?t=' + Date.now(), { cache: 'no-store' });
              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.interviews)) {
                  dispatch({ type: 'SYNC_INTERVIEWS', payload: data.interviews });
                }
              }
            } catch (_) {}
          } else if (type === 'INTERVIEW_UPDATED' || type === 'INTERVIEW_CANCELLED') {
            try {
              const res = await fetch('/api/interviews?t=' + Date.now(), { cache: 'no-store' });
              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.interviews)) {
                  dispatch({ type: 'SYNC_INTERVIEWS', payload: data.interviews });
                }
              }
            } catch (_) {}
          }
        };
      }
    } catch (_) {}

    const handleStorageEvent = (evt) => {
      if (evt.key === 'career_os_last_interview_sync') {
        fetch('/api/interviews?t=' + Date.now(), { cache: 'no-store' })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data.interviews)) {
              dispatch({ type: 'SYNC_INTERVIEWS', payload: data.interviews });
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (bc) {
        try { bc.close(); } catch (_) {}
      }
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  return (
    <DataContext.Provider value={{ state, dispatch, loading }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
