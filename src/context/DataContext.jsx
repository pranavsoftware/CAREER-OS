import { createContext, useContext, useReducer, useEffect } from 'react';
import { initialStudents } from '../data/students';
import { initialDrives } from '../data/drives';
import { initialJobs } from '../data/jobs';
import { initialApplications, driveApplications } from '../data/applications';
import { initialCertificates } from '../data/certificates';
import { initialNotifications } from '../data/notifications';
import { initialMails } from '../data/mails';

const DataContext = createContext(null);
const STORAGE_KEY = 'career_os_data';

const initialState = {
  students: initialStudents,
  drives: initialDrives,
  jobs: initialJobs,
  applications: initialApplications,
  driveApplications: driveApplications,
  certificates: initialCertificates,
  notifications: initialNotifications,
  mails: initialMails,
  // Company pipeline: candidateId -> jobId -> stage
  pipeline: {},
  // Resume versions per student
  resumeVersions: {},
  // Skill gap roadmap progress per student
  roadmapProgress: {},
  // Test attempts history
  testAttempts: [
    { id: 'ta1', studentId: 's1', topic: 'DSA', date: '2026-09-01', score: 6, total: 10, percentage: 60, weakAreas: [] },
    { id: 'ta2', studentId: 's1', topic: 'React', date: '2026-09-15', score: 7, total: 10, percentage: 70, weakAreas: [] },
    { id: 'ta3', studentId: 's1', topic: 'DBMS', date: '2026-09-28', score: 5, total: 10, percentage: 50, weakAreas: ['DBMS'] },
  ],
};

function getInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }
  return initialState;
}

function dataReducer(state, action) {
  switch (action.type) {
    // ---- STUDENT ----
    case 'UPDATE_STUDENT': {
      const students = state.students.map(s =>
        s.id === action.payload.id ? { ...s, ...action.payload } : s
      );
      return { ...state, students };
    }

    // ---- DRIVES ----
    case 'ADD_DRIVE': {
      return { ...state, drives: [...state.drives, action.payload] };
    }
    case 'UPDATE_DRIVE': {
      const drives = state.drives.map(d =>
        d.id === action.payload.id ? { ...d, ...action.payload } : d
      );
      return { ...state, drives };
    }

    // ---- JOBS ----
    case 'ADD_JOB': {
      return { ...state, jobs: [...state.jobs, action.payload] };
    }
    case 'UPDATE_JOB': {
      const jobs = state.jobs.map(j =>
        j.id === action.payload.id ? { ...j, ...action.payload } : j
      );
      return { ...state, jobs };
    }

    // ---- APPLICATIONS ----
    case 'ADD_APPLICATION': {
      return { ...state, applications: [...state.applications, action.payload] };
    }
    case 'UPDATE_APPLICATION': {
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
      return { ...state, certificates: [...state.certificates, action.payload] };
    }
    case 'DELETE_CERTIFICATE': {
      return { ...state, certificates: state.certificates.filter(c => c.id !== action.payload) };
    }

    // ---- NOTIFICATIONS ----
    case 'ADD_NOTIFICATION': {
      return { ...state, notifications: [action.payload, ...state.notifications] };
    }
    case 'MARK_NOTIFICATION_READ': {
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
      const mails = state.mails.map(m =>
        m.id === action.payload.id ? { ...m, ...action.payload } : m
      );
      return { ...state, mails };
    }

    // ---- VERIFICATION (university verifies student sections) ----
    case 'VERIFY_STUDENT_SECTION': {
      const { studentId, section, status, remark } = action.payload;
      const students = state.students.map(s => {
        if (s.id !== studentId) return s;
        const newVerification = { ...s.verificationStatus, [section]: status };
        // Recalculate overall profileStatus
        const statuses = Object.values(newVerification);
        const profileStatus = statuses.every(v => v === 'Verified') ? 'Verified'
          : statuses.some(v => v === 'Verified') ? 'Partial'
          : 'Pending';
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

      // Cross-role: if stage is 'Offer Sent', update student application to 'Offer'
      let applications = state.applications;
      if (stage === 'Offer Sent') {
        applications = state.applications.map(a => {
          if (a.studentId === studentId) {
            // Find matching application for this job
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
      return {
        ...state,
        roadmapProgress: {
          ...state.roadmapProgress,
          [key]: { ...current, [stepId]: !current[stepId] },
        },
      };
    }

    // ---- TEST ATTEMPTS ----
    case 'ADD_TEST_ATTEMPT': {
      return { ...state, testAttempts: [...state.testAttempts, action.payload] };
    }

    // ---- RESET ----
    case 'RESET_DATA': {
      localStorage.removeItem(STORAGE_KEY);
      return initialState;
    }

    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, getInitialState());

  // Persist data state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
