import { useState } from 'react';
import Layout from '../../components/Layout';
import Badge, { getBadgeVariant } from '../../components/Badge';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

function VerificationBadge({ status }) {
  const variant = status === 'Verified' ? 'success' : status === 'Rejected' ? 'danger' : 'neutral';
  return <Badge variant={variant}>{status === 'Verified' ? 'Verified by university' : status === 'Rejected' ? 'Rejected by university' : 'Pending verification'}</Badge>;
}

export default function StudentProfile() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const student = state.students.find(s => s.id === user.studentId);
  const [editing, setEditing] = useState(null); // section name being edited
  const [message, setMessage] = useState(null);

  // Local edit state
  const [editData, setEditData] = useState({});
  const [newSkill, setNewSkill] = useState({ name: '', level: 3 });
  const [addingProject, setAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', technologies: '', link: '', year: 2026 });
  const [addingExp, setAddingExp] = useState(false);
  const [newExp, setNewExp] = useState({ company: '', role: '', duration: '', description: '', type: 'Internship' });

  if (!student) return <Layout title="Profile"><p>Student not found.</p></Layout>;

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

  function addSkill() {
    if (!newSkill.name.trim()) return;
    const skills = [...(student.skills || []), { name: newSkill.name.trim(), level: Number(newSkill.level), source: 'manual' }];
    dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, skills } });
    setNewSkill({ name: '', level: 3 });
  }

  function removeSkill(name) {
    const skills = (student.skills || []).filter(s => s.name !== name);
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
      {sectionCard('Skills', 'skills',
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {(student.skills || []).map(skill => (
              <div key={skill.name} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', borderRadius: 20, padding: '4px 10px', fontSize: 13 }}>
                <span>{skill.name}</span>
                <span style={{ color: '#9CA3AF', fontSize: 11 }}>L{skill.level}</span>
                {skill.source === 'certificate' && <span style={{ fontSize: 10, color: '#2563EB' }}>cert</span>}
                <button onClick={() => removeSkill(skill.name)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, lineHeight: 1, padding: 0 }}>&times;</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <FormField label="Add skill" id="newSkill" value={newSkill.name} onChange={v => setNewSkill({ ...newSkill, name: v })} placeholder="e.g. TypeScript" />
            <FormField label="Level (1-5)" id="newSkillLevel" type="number" value={newSkill.level} min={1} max={5} onChange={v => setNewSkill({ ...newSkill, level: v })} />
            <button onClick={addSkill} style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: '#2563EB', color: '#fff', cursor: 'pointer', fontSize: 13, marginBottom: 16, whiteSpace: 'nowrap' }}>Add</button>
          </div>
        </div>,
        <div style={{ fontSize: 13, color: '#6B7280' }}>Edit skills using the view mode controls above.</div>
      )}

      {/* Projects */}
      {sectionCard('Projects', 'projects',
        <div>
          {(student.projects || []).map(p => (
            <div key={p.id} style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{p.title} <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>({p.year})</span></div>
                  <div style={{ fontSize: 13, color: '#6B7280', margin: '4px 0' }}>{p.description}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(p.technologies || []).map(t => <span key={t} style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{t}</span>)}
                  </div>
                  {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2563EB', marginTop: 4, display: 'block' }}>{p.link}</a>}
                </div>
                <button onClick={() => deleteProject(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 13 }}>Delete</button>
              </div>
            </div>
          ))}
          {!addingProject ? (
            <button onClick={() => setAddingProject(true)} style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', color: '#2563EB', cursor: 'pointer', fontSize: 13 }}>
              Add project
            </button>
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
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Links</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="GitHub" id="github" value={student.github || ''} onChange={v => dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, github: v } })} placeholder="https://github.com/username" />
          <FormField label="LinkedIn" id="linkedin" value={student.linkedin || ''} onChange={v => dispatch({ type: 'UPDATE_STUDENT', payload: { id: student.id, linkedin: v } })} placeholder="https://linkedin.com/in/username" />
        </div>
      </div>
    </Layout>
  );
}
