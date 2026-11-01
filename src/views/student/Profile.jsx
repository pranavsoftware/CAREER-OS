import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Badge, { getBadgeVariant } from '../../components/Badge';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { initialStudents } from '../../data/students';
import { Star, ExternalLink, RefreshCw, FolderGit2, Search, Plus, Check, ChevronDown, Sparkles, X } from 'lucide-react';
import GithubIcon from '../../components/GithubIcon';

const SKILL_CATALOG = [
  // Frontend
  { name: 'React', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'JavaScript', category: 'Frontend' },
  { name: 'HTML5/CSS3', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'Redux / Zustand', category: 'Frontend' },
  { name: 'Responsive Design', category: 'Frontend' },

  // Backend
  { name: 'Node.js', category: 'Backend' },
  { name: 'Python', category: 'Backend' },
  { name: 'Java', category: 'Backend' },
  { name: 'C++', category: 'Backend' },
  { name: 'Go (Golang)', category: 'Backend' },
  { name: 'Rust', category: 'Backend' },
  { name: 'Express.js', category: 'Backend' },
  { name: 'Django / FastAPI', category: 'Backend' },
  { name: 'Spring Boot', category: 'Backend' },
  { name: 'RESTful APIs', category: 'Backend' },
  { name: 'GraphQL', category: 'Backend' },
  { name: 'Microservices', category: 'Backend' },

  // Databases
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'MySQL', category: 'Database' },
  { name: 'Redis', category: 'Database' },
  { name: 'Prisma / Drizzle', category: 'Database' },
  { name: 'Supabase / Firebase', category: 'Database' },

  // Cloud & DevOps
  { name: 'Docker', category: 'DevOps & Cloud' },
  { name: 'Kubernetes', category: 'DevOps & Cloud' },
  { name: 'AWS (Amazon Web Services)', category: 'DevOps & Cloud' },
  { name: 'Google Cloud (GCP)', category: 'DevOps & Cloud' },
  { name: 'CI/CD Pipelines', category: 'DevOps & Cloud' },
  { name: 'Linux / Shell Scripting', category: 'DevOps & Cloud' },
  { name: 'Git & GitHub', category: 'DevOps & Cloud' },
  { name: 'Terraform', category: 'DevOps & Cloud' },

  // AI & Data
  { name: 'Machine Learning', category: 'AI & Data' },
  { name: 'Deep Learning', category: 'AI & Data' },
  { name: 'TensorFlow / PyTorch', category: 'AI & Data' },
  { name: 'Pandas & NumPy', category: 'AI & Data' },
  { name: 'Generative AI & LLMs', category: 'AI & Data' },
  { name: 'Data Analytics', category: 'AI & Data' },

  // Core Computer Science
  { name: 'Data Structures & Algorithms', category: 'Core CS' },
  { name: 'System Design', category: 'Core CS' },
  { name: 'Operating Systems', category: 'Core CS' },
  { name: 'Computer Networks', category: 'Core CS' },
  { name: 'Database Management (DBMS)', category: 'Core CS' },
  { name: 'Object-Oriented Programming (OOP)', category: 'Core CS' },
];

const SKILL_LEVELS = [
  { level: 1, label: 'L1 - Beginner (Foundational concepts)' },
  { level: 2, label: 'L2 - Elementary (Basic project experience)' },
  { level: 3, label: 'L3 - Intermediate (Working proficiency)' },
  { level: 4, label: 'L4 - Advanced (Production expertise)' },
  { level: 5, label: 'L5 - Expert (System mastery & architecture)' },
];

function VerificationBadge({ status }) {
  const variant = status === 'Verified' ? 'success' : status === 'Rejected' ? 'danger' : 'neutral';
  return <Badge variant={variant}>{status === 'Verified' ? 'Verified by university' : status === 'Rejected' ? 'Rejected by university' : 'Pending verification'}</Badge>;
}

export default function StudentProfile() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const student = (state.students || []).find(s => s.id === user?.studentId) || (state.students || [])[0] || initialStudents[0];
  const [editing, setEditing] = useState(null); // section name being edited
  const [message, setMessage] = useState(null);

  // Local edit state
  const [editData, setEditData] = useState({});
  const [newSkill, setNewSkill] = useState({ name: '', level: 3 });
  const [skillSearch, setSkillSearch] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [filterSkillsQuery, setFilterSkillsQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [addingProject, setAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', technologies: '', link: '', year: 2026 });
  const [addingExp, setAddingExp] = useState(false);
  const [newExp, setNewExp] = useState({ company: '', role: '', duration: '', description: '', type: 'Internship' });

  // Quick GitHub Connect State in Profile
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [quickGithubUsername, setQuickGithubUsername] = useState('');
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [githubSyncError, setGithubSyncError] = useState(null);

  // Email Notification Preferences State
  const [emailPrefs, setEmailPrefs] = useState({
    drives: true,
    reminders: true,
    circulars: true,
    marketing: true,
  });
  const [prefSaved, setPrefSaved] = useState(false);

  useEffect(() => {
    if (student?.email) {
      fetch(`/api/email/preferences?email=${encodeURIComponent(student.email)}`)
        .then(r => r.json())
        .then(d => {
          if (d.emailPreferences) setEmailPrefs(d.emailPreferences);
        })
        .catch(() => {});
    }
  }, [student?.email]);

  async function handlePrefToggle(key, val) {
    const next = { ...emailPrefs, [key]: val };
    setEmailPrefs(next);
    if (!student?.email) return;
    try {
      await fetch('/api/email/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: student.email, preferences: next }),
      });
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 2500);
    } catch (_) {}
  }

  function computeCompletion(st) {
    let score = 25;
    if (st.phone && (st.address || st.gender || st.dob)) score += 25;
    if (Array.isArray(st.skills) && st.skills.length >= 1) score += (st.skills.length >= 2 ? 25 : 15);
    if (Array.isArray(st.projects) && st.projects.length >= 1) score += 25;
    return Math.min(100, score);
  }

  async function persistStudentUpdate(updatedPayload) {
    if (!student?.id) return;
    try {
      await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      });
    } catch (err) {
      console.error('Failed to persist student profile to database:', err);
    }
  }

  function startEdit(section) {
    setEditing(section);
    setEditData({ ...student });
    setMessage(null);
  }

  async function saveSection(section) {
    const updated = { ...student, ...editData };
    const profileCompletion = computeCompletion(updated);
    const payload = { ...editData, profileCompletion };
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, ...payload } });
    setEditing(null);
    setMessage({ type: 'success', text: `${section} updated successfully. Profile completion: ${profileCompletion}%.` });
    setTimeout(() => setMessage(null), 3500);
    await persistStudentUpdate(payload);
  }

  async function addSkill(nameOverride = null, levelOverride = null) {
    const targetName = (nameOverride || newSkill.name || skillSearch).trim();
    if (!targetName) return;
    const targetLevel = levelOverride !== null ? Number(levelOverride) : Number(newSkill.level || 3);

    const existingIndex = (student.skills || []).findIndex(
      s => s.name.toLowerCase() === targetName.toLowerCase()
    );
    let skills;
    if (existingIndex >= 0) {
      skills = (student.skills || []).map((s, idx) =>
        idx === existingIndex
          ? { ...s, level: targetLevel }
          : s
      );
    } else {
      skills = [...(student.skills || []), { name: targetName, level: targetLevel, source: 'manual' }];
    }
    const profileCompletion = computeCompletion({ ...student, skills });
    const payload = { skills, profileCompletion };
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, ...payload } });
    setNewSkill({ name: '', level: 3 });
    setSkillSearch('');
    setIsSkillDropdownOpen(false);
    await persistStudentUpdate(payload);
  }

  async function removeSkill(name, targetIdx) {
    const skills = (student.skills || []).filter((s, idx) =>
      targetIdx !== undefined ? idx !== targetIdx : s.name !== name
    );
    const profileCompletion = computeCompletion({ ...student, skills });
    const payload = { skills, profileCompletion };
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, ...payload } });
    await persistStudentUpdate(payload);
  }

  async function addProject() {
    const proj = {
      ...newProject,
      id: `p${Date.now()}`,
      technologies: newProject.technologies.split(',').map(t => t.trim()).filter(Boolean),
      year: Number(newProject.year),
    };
    const projects = [...(student.projects || []), proj];
    const profileCompletion = computeCompletion({ ...student, projects });
    const payload = { projects, profileCompletion };
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, ...payload } });
    setNewProject({ title: '', description: '', technologies: '', link: '', year: 2026 });
    setAddingProject(false);
    await persistStudentUpdate(payload);
  }

  async function handleCompleteAndUnlock() {
    const payload = {
      profileCompletion: 100,
      profileStatus: student.profileStatus === 'Verified' ? 'Verified' : 'Pending',
    };
    dispatch({
      type: 'UPDATE_STUDENT',
      payload: {
        id: student.id,
        ...payload,
      },
    });
    setMessage({
      type: 'success',
      text: 'Profile submitted and fully activated. All placement features and drives are now unlocked.',
    });
    setTimeout(() => setMessage(null), 5000);
    await persistStudentUpdate(payload);
  }

  async function deleteProject(id) {
    const projects = (student.projects || []).filter(p => p.id !== id);
    const profileCompletion = computeCompletion({ ...student, projects });
    const payload = { projects, profileCompletion };
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, ...payload } });
    await persistStudentUpdate(payload);
  }

  async function handleQuickGithubSync(e) {
    if (e) e.preventDefault();
    const handle = (quickGithubUsername || student.github || '').trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/+$/, '').replace(/^@/, '');
    if (!handle) {
      setGithubSyncError('Please enter a GitHub username or profile link.');
      return;
    }

    setIsSyncingGithub(true);
    setGithubSyncError(null);

    try {
      const res = await fetch('/api/students/github-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          githubUsername: handle,
          action: 'sync',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync repositories');
      }

      dispatch({
        type: 'UPDATE_STUDENT',
        payload: {
          id: student.id,
          github: data.github,
          projects: data.projects,
          ...(data.profileCompletion ? { profileCompletion: data.profileCompletion } : {}),
        },
      });

      setShowGithubModal(false);
      setQuickGithubUsername('');
      setMessage({
        type: 'success',
        text: `Connected to GitHub! Successfully imported ${data.syncedCount || 0} repositories to your profile.`,
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setGithubSyncError(err.message || 'Error syncing with GitHub. Please check username.');
    } finally {
      setIsSyncingGithub(false);
    }
  }

  function addExperience() {
    const exp = { ...newExp, id: `e${Date.now()}` };
    const experience = [...(student.experience || []), exp];
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, experience } });
    setNewExp({ company: '', role: '', duration: '', description: '', type: 'Internship' });
    setAddingExp(false);
  }

  function deleteExperience(id) {
    const experience = (student.experience || []).filter(e => e.id !== id);
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, experience } });
  }

  const sectionCard = (title, section, content, editContent) => (
    <div key={section} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>{title}</h2>
          <VerificationBadge status={student.verificationStatus?.[section] || 'Pending'} />
        </div>
        {editing !== section ? (
          <button onClick={() => startEdit(section)} style={{ padding: '4px 12px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 13 }}>
            Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => saveSection(title)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563EB', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Save</button>
            <button onClick={() => setEditing(null)} style={{ padding: '4px 12px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </div>
        )}
      </div>
      {editing === section ? editContent : content}
    </div>
  );

  return (
    <Layout title="Profile">
      {/* Single source note */}
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#1D4ED8' }}>
        This profile is the single source for your resume, portfolio and recruiter search.
      </div>

      {/* Message bar */}
      {message && (
        <div style={{ background: message.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FECACA'}`, borderRadius: 6, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: message.type === 'success' ? '#15803D' : '#B91C1C' }}>
          {message.text}
        </div>
      )}

      {/* Profile completion */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>Profile Completion:</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#2563EB' }}>{student.profileCompletion || 25}%</span>
            <Badge variant={getBadgeVariant(student.profileStatus)}>{student.profileStatus}</Badge>
          </div>
          {(student.profileCompletion || 0) < 100 && (
            <button
              onClick={handleCompleteAndUnlock}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: '#16A34A',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ✓ Submit &amp; Unlock All Features
            </button>
          )}
        </div>
        <div style={{ width: '100%', height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${student.profileCompletion || 25}%`, height: '100%', background: '#2563EB', borderRadius: 4, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Personal Info */}
      {sectionCard('Personal Info', 'personalInfo',
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          <div><span style={{ color: '#6B7280' }}>Name:</span> <strong>{student.name}</strong></div>
          <div><span style={{ color: '#6B7280' }}>Reg No:</span> <strong>{student.regNo}</strong></div>
          <div><span style={{ color: '#6B7280' }}>Email:</span> <strong>{student.email}</strong></div>
          <div><span style={{ color: '#6B7280' }}>Phone:</span> <strong>{student.phone || <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontWeight: 400 }}>Not added - click Edit</span>}</strong></div>
          <div><span style={{ color: '#6B7280' }}>DOB:</span> <strong>{student.dob || <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontWeight: 400 }}>Not added - click Edit</span>}</strong></div>
          <div><span style={{ color: '#6B7280' }}>Gender:</span> <strong>{student.gender || <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontWeight: 400 }}>Not added - click Edit</span>}</strong></div>
          <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#6B7280' }}>Address:</span> <strong>{student.address || <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontWeight: 400 }}>Not added - click Edit</span>}</strong></div>
        </div>,
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Phone" id="phone" value={editData.phone || ''} placeholder="e.g. +919876543210" onChange={v => setEditData({ ...editData, phone: v })} />
          <FormField label="Date of Birth" id="dob" type="date" value={editData.dob || ''} onChange={v => setEditData({ ...editData, dob: v })} />
          <FormField label="Gender" id="gender" type="select" value={editData.gender || ''} options={['Male', 'Female', 'Other']} onChange={v => setEditData({ ...editData, gender: v })} />
          <FormField label="Address" id="address" value={editData.address || ''} placeholder="e.g. 12 MG Road, Bangalore" onChange={v => setEditData({ ...editData, address: v })} />
        </div>
      )}

      {/* Education */}
      {sectionCard('Education', 'education',
        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(() => {
            const tenth = student.education?.tenth;
            const hasTenth = Boolean(tenth?.school?.trim() || tenth?.board?.trim() || tenth?.percentage);
            return hasTenth ? (
              <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 8 }}>
                <strong>10th:</strong> {[
                  tenth.school?.trim(),
                  (tenth.board?.trim() || tenth.year) ? `(${[tenth.board?.trim(), tenth.year].filter(Boolean).join(', ')})` : null,
                  tenth.percentage ? `${tenth.percentage}%` : null
                ].filter(Boolean).join(' · ')}
              </div>
            ) : (
              <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 8, color: '#9CA3AF', fontStyle: 'italic' }}>
                <strong style={{ color: '#374151', fontStyle: 'normal' }}>10th:</strong> Not filled yet. Click Edit to add details.
              </div>
            );
          })()}

          {(() => {
            const twelfth = student.education?.twelfth;
            const hasTwelfth = Boolean(twelfth?.school?.trim() || twelfth?.board?.trim() || twelfth?.percentage);
            return hasTwelfth ? (
              <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 8 }}>
                <strong>12th:</strong> {[
                  twelfth.school?.trim(),
                  (twelfth.board?.trim() || twelfth.year) ? `(${[twelfth.board?.trim(), twelfth.year].filter(Boolean).join(', ')})` : null,
                  twelfth.percentage ? `${twelfth.percentage}%` : null
                ].filter(Boolean).join(' · ')}
              </div>
            ) : (
              <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 8, color: '#9CA3AF', fontStyle: 'italic' }}>
                <strong style={{ color: '#374151', fontStyle: 'normal' }}>12th:</strong> Not filled yet. Click Edit to add details.
              </div>
            );
          })()}

          {(() => {
            const btech = student.education?.btech;
            const hasBtech = Boolean(btech?.college?.trim() || btech?.branch?.trim() || btech?.cgpa || student.branch);
            const college = btech?.college?.trim() || 'University Campus';
            const branch = btech?.branch?.trim() || student.branch || 'Engineering';
            const cgpa = btech?.cgpa || student.cgpa;
            const sem = btech?.currentSemester ? `Semester ${btech.currentSemester}` : null;
            const years = (btech?.startYear && btech?.endYear) ? `(${btech.startYear} - ${btech.endYear})` : (student.batch ? `(Batch ${student.batch})` : null);

            return hasBtech ? (
              <div>
                <strong>B.Tech:</strong> {[
                  college,
                  branch,
                  cgpa ? `CGPA: ${cgpa}` : null,
                  sem,
                  years
                ].filter(Boolean).join(' · ')}
              </div>
            ) : (
              <div style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                <strong style={{ color: '#374151', fontStyle: 'normal' }}>B.Tech:</strong> Not filled yet. Click Edit to add details.
              </div>
            );
          })()}
        </div>,
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* 10th */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, padding: '6px 10px', background: '#F8FAFC', borderRadius: 6, borderLeft: '3px solid #2563EB' }}>10th Standard</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormField label="School Name" id="tenth-school" value={editData.education?.tenth?.school || ''}
                placeholder="e.g. Delhi Public School"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, tenth: { ...editData.education?.tenth, school: v } } })} />
              <FormField label="Board" id="tenth-board" type="select" value={editData.education?.tenth?.board || ''}
                options={['CBSE', 'ICSE', 'State Board', 'IB', 'NIOS', 'Other']}
                onChange={v => setEditData({ ...editData, education: { ...editData.education, tenth: { ...editData.education?.tenth, board: v } } })} />
              <FormField label="Year of Passing" id="tenth-year" type="number" value={editData.education?.tenth?.year || ''}
                placeholder="e.g. 2020"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, tenth: { ...editData.education?.tenth, year: v } } })} />
              <FormField label="Percentage / CGPA" id="tenth-pct" value={editData.education?.tenth?.percentage || ''}
                placeholder="e.g. 92.4"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, tenth: { ...editData.education?.tenth, percentage: v } } })} />
            </div>
          </div>

          {/* 12th */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, padding: '6px 10px', background: '#F8FAFC', borderRadius: 6, borderLeft: '3px solid #2563EB' }}>12th Standard / Intermediate</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormField label="School / College Name" id="twelfth-school" value={editData.education?.twelfth?.school || ''}
                placeholder="e.g. Kendriya Vidyalaya"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, twelfth: { ...editData.education?.twelfth, school: v } } })} />
              <FormField label="Board" id="twelfth-board" type="select" value={editData.education?.twelfth?.board || ''}
                options={['CBSE', 'ICSE', 'State Board', 'IB', 'NIOS', 'Other']}
                onChange={v => setEditData({ ...editData, education: { ...editData.education, twelfth: { ...editData.education?.twelfth, board: v } } })} />
              <FormField label="Year of Passing" id="twelfth-year" type="number" value={editData.education?.twelfth?.year || ''}
                placeholder="e.g. 2022"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, twelfth: { ...editData.education?.twelfth, year: v } } })} />
              <FormField label="Percentage / CGPA" id="twelfth-pct" value={editData.education?.twelfth?.percentage || ''}
                placeholder="e.g. 88.6"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, twelfth: { ...editData.education?.twelfth, percentage: v } } })} />
            </div>
          </div>

          {/* B.Tech */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, padding: '6px 10px', background: '#F8FAFC', borderRadius: 6, borderLeft: '3px solid #2563EB' }}>B.Tech / Undergraduate Degree</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>CGPA, branch and batch details are auto-filled from university records. You can update your current semester.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormField label="College / University" id="btech-college" value={editData.education?.btech?.college || ''}
                placeholder="e.g. VIT University"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, btech: { ...editData.education?.btech, college: v } } })} />
              <FormField label="Branch / Specialization" id="btech-branch" value={editData.education?.btech?.branch || ''}
                placeholder="e.g. Computer Science & Engineering"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, btech: { ...editData.education?.btech, branch: v } } })} />
              <FormField label="Start Year" id="btech-start" type="number" value={editData.education?.btech?.startYear || ''}
                placeholder="e.g. 2022"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, btech: { ...editData.education?.btech, startYear: v } } })} />
              <FormField label="End Year (Expected)" id="btech-end" type="number" value={editData.education?.btech?.endYear || ''}
                placeholder="e.g. 2026"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, btech: { ...editData.education?.btech, endYear: v } } })} />
              <FormField label="Current Semester" id="btech-sem" type="number" value={editData.education?.btech?.currentSemester || ''} min={1} max={8}
                placeholder="e.g. 5"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, btech: { ...editData.education?.btech, currentSemester: v } } })} />
              <FormField label="CGPA (if known)" id="btech-cgpa" value={editData.education?.btech?.cgpa || ''}
                placeholder="e.g. 8.4"
                onChange={v => setEditData({ ...editData, education: { ...editData.education, btech: { ...editData.education?.btech, cgpa: v } } })} />
            </div>
          </div>
        </div>
      )}

      {/* Skills */}
      {(() => {
        const filteredCatalog = SKILL_CATALOG.filter(item => {
          const matchesSearch = !skillSearch.trim() || 
            item.name.toLowerCase().includes(skillSearch.trim().toLowerCase()) ||
            item.category.toLowerCase().includes(skillSearch.trim().toLowerCase());
          const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
          return matchesSearch && matchesCategory;
        });

        const visibleSkills = (student.skills || []).filter(skill => {
          if (!filterSkillsQuery.trim()) return true;
          return skill.name.toLowerCase().includes(filterSkillsQuery.trim().toLowerCase());
        });

        return sectionCard('Skills', 'skills',
          <div>
            {/* Header info & Filter existing skills */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 13, color: '#6B7280' }}>
                Technical competencies verified for recruiter search, skill gap audits, and automated ATS matching.
              </div>
              {(student.skills || []).length > 3 && (
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', minWidth: 200 }}>
                  <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 8 }} />
                  <input
                    type="text"
                    value={filterSkillsQuery}
                    onChange={e => setFilterSkillsQuery(e.target.value)}
                    placeholder="Filter added skills..."
                    style={{
                      padding: '4px 8px 4px 28px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid #D1D5DB',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                  {filterSkillsQuery && (
                    <button
                      onClick={() => setFilterSkillsQuery('')}
                      style={{ border: 'none', background: 'transparent', position: 'absolute', right: 6, cursor: 'pointer', color: '#9CA3AF', padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Current Added Skills Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {visibleSkills.length === 0 ? (
                <span style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>
                  {filterSkillsQuery ? `No skills match "${filterSkillsQuery}"` : 'No skills added yet. Select from the dropdown below.'}
                </span>
              ) : (
                visibleSkills.map((skill, idx) => {
                  const isHighLevel = skill.level >= 4;
                  const isMidLevel = skill.level === 3;
                  return (
                    <div
                      key={`${skill.name}-${idx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: isHighLevel ? '#ECFDF5' : isMidLevel ? '#EFF6FF' : '#F8FAFC',
                        border: `1px solid ${isHighLevel ? '#A7F3D0' : isMidLevel ? '#BFDBFE' : '#E2E8F0'}`,
                        borderRadius: 20,
                        padding: '4px 10px',
                        fontSize: 13,
                        color: isHighLevel ? '#065F46' : isMidLevel ? '#1E40AF' : '#334155',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{skill.name}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: 10,
                          background: isHighLevel ? '#10B981' : isMidLevel ? '#3B82F6' : '#94A3B8',
                          color: '#fff',
                        }}
                      >
                        {skill.level === 5 ? 'L5 Exp' : skill.level === 4 ? 'L4 Adv' : skill.level === 3 ? 'L3 Mid' : `L${skill.level}`}
                      </span>
                      {skill.source === 'certificate' && (
                        <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 600, background: 'rgba(37, 99, 235, 0.1)', padding: '1px 5px', borderRadius: 4 }}>cert</span>
                      )}
                      <button
                        onClick={() => removeSkill(skill.name, idx)}
                        title="Remove skill"
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: '#9CA3AF',
                          fontSize: 14,
                          lineHeight: 1,
                          padding: 0,
                          marginLeft: 2,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Search Bar & Select Options Combobox */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#2563EB" />
                Search & Select Skills
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 2.2fr) minmax(180px, 1.3fr) auto', gap: 10, alignItems: 'flex-start' }}>
                {/* Searchable Input with Dropdown Options */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={e => {
                        setSkillSearch(e.target.value);
                        setNewSkill({ ...newSkill, name: e.target.value });
                        setIsSkillDropdownOpen(true);
                      }}
                      onFocus={() => setIsSkillDropdownOpen(true)}
                      placeholder="Search or select a skill (e.g. React, Python, Docker)..."
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: 6,
                        border: isSkillDropdownOpen ? '1px solid #2563EB' : '1px solid #CBD5E1',
                        background: '#fff',
                        fontSize: 13,
                        outline: 'none',
                        color: '#1E293B',
                      }}
                    />
                    {skillSearch && (
                      <button
                        onClick={() => {
                          setSkillSearch('');
                          setNewSkill({ ...newSkill, name: '' });
                        }}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'transparent',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Select Options */}
                  {isSkillDropdownOpen && (
                    <>
                      {/* Click-away backdrop overlay */}
                      <div
                        onClick={() => setIsSkillDropdownOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          maxHeight: 240,
                          overflowY: 'auto',
                          background: '#fff',
                          border: '1px solid #CBD5E1',
                          borderRadius: 8,
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                          zIndex: 100,
                        }}
                      >
                        {/* Category filter tabs */}
                        <div style={{ padding: '6px 8px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 4, overflowX: 'auto', background: '#F8FAFC' }}>
                          {['ALL', 'Frontend', 'Backend', 'Database', 'DevOps & Cloud', 'AI & Data', 'Core CS'].map(cat => (
                            <button
                              key={cat}
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedCategory(cat);
                              }}
                              style={{
                                border: 'none',
                                background: selectedCategory === cat ? '#EFF6FF' : 'transparent',
                                color: selectedCategory === cat ? '#2563EB' : '#64748B',
                                fontWeight: selectedCategory === cat ? 600 : 500,
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 4,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Custom skill option if not in catalog */}
                        {skillSearch.trim() && !SKILL_CATALOG.some(s => s.name.toLowerCase() === skillSearch.trim().toLowerCase()) && (
                          <div
                            onClick={() => {
                              setNewSkill({ ...newSkill, name: skillSearch.trim() });
                              setIsSkillDropdownOpen(false);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: 13,
                              color: '#2563EB',
                              background: '#F0FDF4',
                              borderBottom: '1px solid #DCFCE7',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontWeight: 500,
                            }}
                          >
                            <Plus size={14} />
                            <span>Add custom skill <strong>"{skillSearch.trim()}"</strong></span>
                          </div>
                        )}

                        {/* Filtered skill select options */}
                        {filteredCatalog.length === 0 ? (
                          <div style={{ padding: '14px', fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
                            No preset skills found matching "{skillSearch}". Click above to add as custom skill.
                          </div>
                        ) : (
                          filteredCatalog.map(item => {
                            const alreadyHas = (student.skills || []).some(s => s.name.toLowerCase() === item.name.toLowerCase());
                            return (
                              <div
                                key={item.name}
                                onClick={() => {
                                  setSkillSearch(item.name);
                                  setNewSkill({ ...newSkill, name: item.name });
                                  setIsSkillDropdownOpen(false);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  fontSize: 13,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  background: (newSkill.name.toLowerCase() === item.name.toLowerCase() || skillSearch.toLowerCase() === item.name.toLowerCase()) ? '#EFF6FF' : '#fff',
                                  borderBottom: '1px solid #F8FAFC',
                                  color: '#1E293B',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                onMouseLeave={e => e.currentTarget.style.background = (newSkill.name.toLowerCase() === item.name.toLowerCase() || skillSearch.toLowerCase() === item.name.toLowerCase()) ? '#EFF6FF' : '#fff'}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                                  <span style={{ fontSize: 10, color: '#64748B', background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>
                                    {item.category}
                                  </span>
                                </div>
                                {alreadyHas && (
                                  <span style={{ fontSize: 11, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
                                    <Check size={12} /> Added
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Level Selection Dropdown */}
                <div>
                  <select
                    value={newSkill.level}
                    onChange={e => setNewSkill({ ...newSkill, level: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      background: '#fff',
                      fontSize: 13,
                      color: '#1E293B',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {SKILL_LEVELS.map(lvl => (
                      <option key={lvl.level} value={lvl.level}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add Button */}
                <div>
                  <button
                    onClick={() => addSkill()}
                    disabled={!skillSearch.trim() && !newSkill.name.trim()}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 6,
                      border: 'none',
                      background: (!skillSearch.trim() && !newSkill.name.trim()) ? '#94A3B8' : '#2563EB',
                      color: '#fff',
                      cursor: (!skillSearch.trim() && !newSkill.name.trim()) ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Plus size={15} />
                    Add Skill
                  </button>
                </div>
              </div>

              {/* Popular Quick-Add Suggestion Chips */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Popular In-Demand:</span>
                {['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Docker', 'AWS', 'PostgreSQL', 'Data Structures & Algorithms']
                  .filter(name => !(student.skills || []).some(s => s.name.toLowerCase() === name.toLowerCase()))
                  .slice(0, 7)
                  .map(chip => (
                    <button
                      key={chip}
                      onClick={() => {
                        setSkillSearch(chip);
                        setNewSkill({ ...newSkill, name: chip });
                      }}
                      style={{
                        border: '1px solid #CBD5E1',
                        background: '#fff',
                        color: '#334155',
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        transition: 'all 0.1s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#334155'; }}
                    >
                      <Plus size={11} /> {chip}
                    </button>
                  ))}
              </div>
            </div>
          </div>,
          <div style={{ fontSize: 13, color: '#6B7280' }}>Edit skills using the view mode controls above.</div>
        );
      })()}

      {/* Projects */}
      {sectionCard('Projects', 'projects',
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              Connect your GitHub account to showcase verified repositories, stars, and code directly on your profile.
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setGithubSyncError(null);
                  setQuickGithubUsername(student.github ? student.github.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/+$/, '') : '');
                  setShowGithubModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#0F172A',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <GithubIcon size={14} />
                {student.github ? 'Sync Repositories' : 'Connect GitHub'}
              </button>
              <Link
                to="/student/portfolio"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  background: '#fff',
                  color: '#334155',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Open Project Hub &rarr;
              </Link>
            </div>
          </div>

          {(student.projects || []).map(p => (
            <div key={p.id} style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14, color: '#111827' }}>
                    {p.isGithub ? <GithubIcon size={14} color="#334155" /> : <FolderGit2 size={14} color="#2563EB" />}
                    <span>{p.title}</span>
                    <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>({p.year})</span>
                    {p.stars > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#D97706', background: '#FEF3C7', padding: '1px 6px', borderRadius: 4 }}>
                        <Star size={11} fill="#D97706" /> {p.stars}
                      </span>
                    )}
                    {p.featured && (
                      <span style={{ fontSize: 11, color: '#1E40AF', background: '#DBEAFE', padding: '1px 6px', borderRadius: 4 }}>
                        Featured
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', margin: '4px 0' }}>{p.description}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {(Array.isArray(p.technologies) ? p.technologies : typeof p.technologies === 'string' ? p.technologies.split(',').map(s => s.trim()).filter(Boolean) : []).map((t, idx) => (
                      <span key={`${t}-${idx}`} style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{t}</span>
                    ))}
                  </div>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2563EB', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      <ExternalLink size={12} />
                      {p.link}
                    </a>
                  )}
                </div>
                <button onClick={() => deleteProject(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 13 }}>Delete</button>
              </div>
            </div>
          ))}
          {!addingProject ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setAddingProject(true)} style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', color: '#2563EB', cursor: 'pointer', fontSize: 13 }}>
                + Add custom project
              </button>
              <button
                type="button"
                onClick={() => {
                  setGithubSyncError(null);
                  setQuickGithubUsername(student.github ? student.github.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/+$/, '') : '');
                  setShowGithubModal(true);
                }}
                style={{
                  padding: '6px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 6,
                  background: '#0F172A',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <GithubIcon size={14} />
                {student.github ? 'Sync Repositories' : 'Connect & Sync from GitHub'}
              </button>
              <Link
                to="/student/portfolio"
                style={{
                  padding: '6px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 6,
                  background: '#F8FAFC',
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Open Project Hub &rarr;
              </Link>
            </div>
          ) : (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
              <FormField label="Title" id="ptitle" value={newProject.title} onChange={v => setNewProject({ ...newProject, title: v })} />
              <FormField label="Description" id="pdesc" type="textarea" rows={2} value={newProject.description} onChange={v => setNewProject({ ...newProject, description: v })} />
              <FormField label="Technologies (comma separated)" id="ptech" value={newProject.technologies} onChange={v => setNewProject({ ...newProject, technologies: v })} />
              <FormField label="GitHub/Link" id="plink" value={newProject.link} onChange={v => setNewProject({ ...newProject, link: v })} />
              <FormField label="Year" id="pyear" type="number" value={newProject.year} onChange={v => setNewProject({ ...newProject, year: v })} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addProject} style={{ padding: '6px 14px', border: 'none', borderRadius: 6, background: '#2563EB', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Save</button>
                <button onClick={() => setAddingProject(false)} style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>,
        <div style={{ fontSize: 13, color: '#6B7280' }}>Manage projects from the view mode above.</div>
      )}

      {/* Experience */}
      {sectionCard('Experience / Internships', 'experience',
        <div>
          {(student.experience || []).map(e => (
            <div key={e.id} style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{e.role} - {e.company}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', margin: '2px 0' }}>{e.duration} | {e.type}</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{e.description}</div>
                </div>
                <button onClick={() => deleteExperience(e.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 13 }}>Delete</button>
              </div>
            </div>
          ))}
          {!addingExp ? (
            <button onClick={() => setAddingExp(true)} style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', color: '#2563EB', cursor: 'pointer', fontSize: 13 }}>
              Add experience
            </button>
          ) : (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
              <FormField label="Company" id="ecomp" value={newExp.company} onChange={v => setNewExp({ ...newExp, company: v })} />
              <FormField label="Role" id="erole" value={newExp.role} onChange={v => setNewExp({ ...newExp, role: v })} />
              <FormField label="Duration" id="edur" value={newExp.duration} placeholder="e.g. May 2025 - Jul 2025" onChange={v => setNewExp({ ...newExp, duration: v })} />
              <FormField label="Type" id="etype" type="select" value={newExp.type} options={['Internship', 'Full-time', 'Part-time', 'Research']} onChange={v => setNewExp({ ...newExp, type: v })} />
              <FormField label="Description" id="edesc" type="textarea" rows={2} value={newExp.description} onChange={v => setNewExp({ ...newExp, description: v })} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addExperience} style={{ padding: '6px 14px', border: 'none', borderRadius: 6, background: '#2563EB', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Save</button>
                <button onClick={() => setAddingExp(false)} style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>,
        <div style={{ fontSize: 13, color: '#6B7280' }}>Manage experience from the view mode above.</div>
      )}

      {/* Links */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Links & Social Profiles</h2>
          {student.github && (
            <Link
              to="/student/portfolio"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: '#2563EB',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <GithubIcon size={13} />
              Manage & Sync Repositories &rarr;
            </Link>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="GitHub" id="github" value={student.github || ''} onChange={v => dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, github: v } })} placeholder="https://github.com/username" />
          <FormField label="LinkedIn" id="linkedin" value={student.linkedin || ''} onChange={v => dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, linkedin: v } })} placeholder="https://linkedin.com/in/username" />
        </div>
      </div>

      {/* Email & Notification Preferences */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Email &amp; Notification Preferences</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>
              Control notifications delivered to <strong style={{ color: '#2563EB' }}>{student.email}</strong>. Critical account alerts and urgent interview changes are always delivered.
            </p>
          </div>
          {prefSaved && (
            <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✓ Saved</span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { key: 'drives', label: 'Campus Drives & Shortlists', desc: 'New drive announcements, application status, and CDC endorsements' },
            { key: 'reminders', label: 'Interview Reminders', desc: '24h and 1h reminders with calendar .ics invites and room links' },
            { key: 'circulars', label: 'Placement Notices & Materials', desc: 'Official placement directorate circulars and study materials' },
            { key: 'marketing', label: 'Referrals & Placement Tips', desc: 'Peer referral earnings, wallet credits, and placement trends' },
          ].map(item => (
            <div key={item.key} style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 14, background: '#F9FAFB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.label}</span>
                <input
                  type="checkbox"
                  checked={emailPrefs[item.key] !== false}
                  onChange={e => handlePrefToggle(item.key, e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#2563EB', cursor: 'pointer' }}
                />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub Quick Connect Modal */}
      {showGithubModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            maxWidth: 480,
            width: '100%',
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GithubIcon size={20} color="#0F172A" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                  Connect GitHub Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGithubModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>
              Enter your GitHub username or profile link. We will fetch and import your public repositories, languages, and star counts directly into your profile projects.
            </p>

            {githubSyncError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 13,
                marginBottom: 16,
              }}>
                {githubSyncError}
              </div>
            )}

            <form onSubmit={handleQuickGithubSync}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  GitHub Username or URL
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={quickGithubUsername}
                    onChange={e => setQuickGithubUsername(e.target.value)}
                    placeholder="e.g. torvalds or https://github.com/torvalds"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowGithubModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#374151',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSyncingGithub}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: isSyncingGithub ? '#94A3B8' : '#0F172A',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSyncingGithub ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isSyncingGithub ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <GithubIcon size={14} />
                      Sync Repositories
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
