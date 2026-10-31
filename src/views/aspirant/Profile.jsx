import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Save,
  CheckCircle2,
  Award,
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export default function AspirantProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: 'Rahul Verma',
    board: 'CBSE',
    stream: 'PCM',
    twelfthPercentage: 89.4,
    state: 'Delhi NCR',
    phone: '+91 98765 43210',
    entranceExams: [
      { exam: 'JEE Main', percentile: 92.5, score: 185 },
      { exam: 'BITSAT', percentile: 85.0, score: 290 }
    ],
    interests: ['Artificial Intelligence', 'Computer Science', 'Cloud Systems'],
  });

  const [interestInput, setInterestInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/aspirant/profile?userId=user_aspirant');
        if (res.ok) {
          const d = await res.json();
          if (d.profile) {
            const p = d.profile;
            setForm({
              name: p.name || '',
              board: p.board || 'CBSE',
              stream: p.stream || 'PCM',
              twelfthPercentage: p.twelfthPercentage ?? 0,
              state: p.state || '',
              phone: p.phone || '',
              entranceExams: Array.isArray(p.entranceExams) ? p.entranceExams : [],
              interests: Array.isArray(p.interests) ? p.interests : [],
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleAddExam = () => {
    setForm(prev => ({
      ...prev,
      entranceExams: [...prev.entranceExams, { exam: 'State CET', percentile: 90.0, score: 140 }]
    }));
  };

  const handleRemoveExam = (idx) => {
    setForm(prev => ({
      ...prev,
      entranceExams: prev.entranceExams.filter((_, i) => i !== idx)
    }));
  };

  const handleExamChange = (idx, field, val) => {
    setForm(prev => {
      const exams = [...prev.entranceExams];
      exams[idx] = { ...exams[idx], [field]: val };
      return { ...prev, entranceExams: exams };
    });
  };

  const handleAddInterest = (e) => {
    e.preventDefault();
    if (!interestInput.trim()) return;
    if (!form.interests.includes(interestInput.trim())) {
      setForm(prev => ({ ...prev, interests: [...prev.interests, interestInput.trim()] }));
    }
    setInterestInput('');
  };

  const handleRemoveInterest = (item) => {
    setForm(prev => ({ ...prev, interests: prev.interests.filter(x => x !== item) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/aspirant/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: 'user_aspirant' }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to save profile');
      setFeedback({ type: 'success', text: 'Academic profile successfully updated! Cutoff eligibility refreshed.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout role="aspirant">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} color="#2563EB" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>My Academic & Entrance Profile</h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
              Your 12th board percentage, stream, and entrance scores determine live eligibility in the College Explorer.
            </p>
          </div>
        </div>

        {feedback && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 20,
            background: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: feedback.type === 'success' ? '#059669' : '#DC2626',
            border: `1px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          }}>
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSave} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px', paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
            1. Class 12th Board Credentials
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Full Name *</label>
              <input
                type="text"
                required
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>12th Board *</label>
              <select
                value={form.board || 'CBSE'}
                onChange={e => setForm({ ...form, board: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
              >
                <option value="CBSE">CBSE (Central Board)</option>
                <option value="ICSE">ICSE / ISC</option>
                <option value="State Board">State Higher Secondary Board</option>
                <option value="IB">International Baccalaureate (IB)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>12th Stream *</label>
              <select
                value={form.stream || 'PCM'}
                onChange={e => setForm({ ...form, stream: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
              >
                <option value="PCM">PCM (Physics, Chemistry, Maths)</option>
                <option value="PCMB">PCMB (Physics, Chem, Maths, Bio)</option>
                <option value="PCB">PCB (Physics, Chemistry, Biology)</option>
                <option value="Commerce with Maths">Commerce with Maths</option>
                <option value="Arts">Humanities / Arts</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>12th Aggregate Percentage (%) *</label>
              <input
                type="number"
                step="0.01"
                min="40"
                max="100"
                required
                value={form.twelfthPercentage ?? ''}
                onChange={e => setForm({ ...form, twelfthPercentage: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>State of Domicile</label>
              <input
                type="text"
                placeholder="e.g. Karnataka, Delhi NCR, Tamil Nadu"
                value={form.state || ''}
                onChange={e => setForm({ ...form, state: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Mobile Contact Number</label>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 14px', paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              2. Competitive & Entrance Exam Scores
            </h3>
            <button
              type="button"
              onClick={handleAddExam}
              style={{ padding: '6px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              + Add Another Exam
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {form.entranceExams.map((ex, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr auto', gap: 12, alignItems: 'center', background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 3 }}>Exam Name</label>
                  <input
                    type="text"
                    value={ex.exam || ''}
                    onChange={e => handleExamChange(idx, 'exam', e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 3 }}>Percentile (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ex.percentile || ''}
                    onChange={e => handleExamChange(idx, 'percentile', parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 3 }}>Score / Total Marks</label>
                  <input
                    type="number"
                    value={ex.score || ''}
                    onChange={e => handleExamChange(idx, 'score', parseInt(e.target.value, 10) || 0)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExam(idx)}
                    title="Remove exam"
                    style={{ background: '#fff', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 6, padding: '7px', cursor: 'pointer', marginTop: 16 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
            3. Program & Engineering Interests
          </h3>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              type="text"
              placeholder="e.g. Artificial Intelligence, Robotics, Cyber Security"
              value={interestInput}
              onChange={e => setInterestInput(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
            />
            <button
              type="button"
              onClick={handleAddInterest}
              style={{ padding: '8px 16px', background: '#1F2937', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Add Interest
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {form.interests.map(item => (
              <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20, fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(item)}
                  style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', fontSize: 14, padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#2563EB',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={16} />
              <span>{saving ? 'Updating Profile...' : 'Save & Refresh Eligibility Engine'}</span>
            </button>
          </div>

        </form>

      </div>
    </Layout>
  );
}

