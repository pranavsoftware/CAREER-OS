import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Badge, { getBadgeVariant } from '../../components/Badge';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
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

  const student = (state.students || []).find(s => s.id === user?.studentId) || (state.students || [])[0];
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

  if (!student) return <Layout title="Profile"><p>Loading student profile...</p></Layout>;

  function startEdit(section) {
    setEditing(section);
    setEditData({ ...student });
    setMessage(null);
  }

  function saveSection(section) {
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, ...editData } });
    setEditing(null);
    setMessage({ type: 'success', text: `${section} updated successfully.` });
    setTimeout(() => setMessage(null), 3000);
  }

  function addSkill(nameOverride = null, levelOverride = null) {
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
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, skills } });
    setNewSkill({ name: '', level: 3 });
    setSkillSearch('');
    setIsSkillDropdownOpen(false);
  }

  function removeSkill(name, targetIdx) {
    const skills = (student.skills || []).filter((s, idx) =>
      targetIdx !== undefined ? idx !== targetIdx : s.name !== name
    );
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, skills } });
  }

  function addProject() {
    const proj = {
      ...newProject,
      id: `p${Date.now()}`,
      technologies: newProject.technologies.split(',').map(t => t.trim()).filter(Boolean),
      year: Number(newProject.year),
    };
    const projects = [...(student.projects || []), proj];
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, projects } });
    setNewProject({ title: '', description: '', technologies: '', link: '', year: 2026 });
    setAddingProject(false);
  }

  function deleteProject(id) {
    const projects = (student.projects || []).filter(p => p.id !== id);
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, projects } });
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
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Profile completion:</span>
        <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${student.profileCompletion}%`, height: '100%', background: '#2563EB', borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#2563EB' }}>{student.profileCompletion}%</span>
        <Badge variant={getBadgeVariant(student.profileStatus)}>{student.profileStatus}</Badge>
      </div>

      {/* Personal Info */}
      {sectionCard('Personal Info', 'personalInfo',
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          <div><span style={{ color: '#6B7280' }}>Name:</span> <strong>{student.name}</strong></div>
          <div><span style={{ color: '#6B7280' }}>Reg No:</span> <strong>{student.regNo}</strong></div>
          <div><span style={{ color: '#6B7280' }}>Email:</span> <strong>{student.email}</strong></div>
          <div><span style={{ color: '#6B7280' }}>Phone:</span> <strong>{student.phone}</strong></div>
          <div><span style={{ color: '#6B7280' }}>DOB:</span> <strong>{student.dob}</strong></div>
          <div><span style={{ color: '#6B7280' }}>Gender:</span> <strong>{student.gender}</strong></div>
          <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#6B7280' }}>Address:</span> <strong>{student.address}</strong></div>
        </div>,
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Phone" id="phone" value={editData.phone || ''} onChange={v => setEditData({ ...editData, phone: v })} />
          <FormField label="DOB" id="dob" type="date" value={editData.dob || ''} onChange={v => setEditData({ ...editData, dob: v })} />
          <FormField label="Gender" id="gender" type="select" value={editData.gender || ''} options={['Male', 'Female', 'Other']} onChange={v => setEditData({ ...editData, gender: v })} />
          <FormField label="Address" id="address" value={editData.address || ''} onChange={v => setEditData({ ...editData, address: v })} />
        </div>
      )}

      {/* Education */}
      {sectionCard('Education', 'education',
        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 8 }}>
            <strong>10th</strong> — {student.education?.tenth?.school} ({student.education?.tenth?.board}, {student.education?.tenth?.year}) — {student.education?.tenth?.percentage}%
          </div>
          <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 8 }}>
            <strong>12th</strong> — {student.education?.twelfth?.school} ({student.education?.twelfth?.board}, {student.education?.twelfth?.year}) — {student.education?.twelfth?.percentage}%
          </div>
          <div>
            <strong>B.Tech</strong> — {student.education?.btech?.college} — {student.education?.btech?.branch} — CGPA: {student.education?.btech?.cgpa} — Sem {student.education?.btech?.currentSemester} ({student.education?.btech?.startYear}–{student.education?.btech?.endYear})
          </div>
        </div>,
        <div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>CGPA and degree details are sourced from university records.</div>
          <FormField label="Current Semester" id="sem" type="number" value={editData.education?.btech?.currentSemester || ''} min={1} max={8}
            onChange={v => setEditData({ ...editData, education: { ...editData.education, btech: { ...editData.education?.btech, currentSemester: v } } })} />
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
            <Link
              to="/student/portfolio"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                background: '#0F172A',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <GithubIcon size={14} />
              Open Project Hub & Sync
            </Link>
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
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => setAddingProject(true)} style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', color: '#2563EB', cursor: 'pointer', fontSize: 13 }}>
                + Add custom project
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
                <GithubIcon size={14} />
                Connect & Sync from GitHub
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
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{e.role} — {e.company}</div>
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
    </Layout>
  );
}
