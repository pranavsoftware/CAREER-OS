'use client';

import { createContext, useContext, useReducer, useEffect, useState } from 'react';

const DataContext = createContext(null);
const STORAGE_KEY = 'career_os_data';

const defaultEmptyState = {
  students: [],
  drives: [],
  jobs: [],
  applications: [],
  driveApplications: [],
  certificates: [],
  notifications: [],
  mails: [],
  sentMails: [],
  materials: [],
  pipeline: {},
  questionBank: [],
  skillTaxonomy: {},
  roleOptions: [],
  resumeVersions: {},
  roadmapProgress: {},
  testAttempts: [],
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

function getInitialState() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }
  return defaultEmptyState;
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, defaultEmptyState, getInitialState);
  const [loading, setLoading] = useState(true);

  // Fetch all initial data from PostgreSQL Backend
  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        let res;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            res = await fetch('/api/initial-data');
            if (res.ok) break;
          } catch (e) {
            if (attempt === 3) throw e;
            await new Promise((r) => setTimeout(r, attempt * 1000));
          }
        }
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;

        dispatch({
          type: 'SET_SERVER_DATA',
          payload: {
            students: data.students || [],
            jobs: data.jobs || [],
            drives: data.drives || [],
            applications: data.applications || [],
            driveApplications: data.applications || [],
            certificates: data.certificates || [],
            notifications: data.notifications || [],
            mails: data.mails || [],
            sentMails: data.sentMails || [],
            materials: data.materials || [],
            pipeline: data.pipeline || {},
            questionBank: data.questionBank || [],
            skillTaxonomy: data.skillTaxonomy || {},
            roleOptions: data.roleOptions || [],
            testAttempts: data.testAttempts || [],
            resumeVersions: data.resumeVersions || {},
            roadmapProgress: data.roadmapProgress || {},
          },
        });
      } catch (err) {
        console.warn('Initial data load warning:', err.message || err);
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
    if (typeof window !== 'undefined' && !loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loading]);

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
