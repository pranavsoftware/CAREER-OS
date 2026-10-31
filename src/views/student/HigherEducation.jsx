import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Globe,
  Award,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react';

export default function HigherEducation() {
  const { user } = useAuth();
  const { state } = useData();
  const currentStudent = state.students.find(s => s.id === user?.studentId) || state.students[0];

  const [programs, setPrograms] = useState([]);
  const [countries, setCountries] = useState(['All']);
  const [exams, setExams] = useState(['All']);
  const [levels, setLevels] = useState(['All']);

  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('career_os_saved_programs');
        return stored ? JSON.parse(stored) : [];
      } catch (_) {}
    }
    return [];
  });

  const [tab, setTab] = useState('all'); // 'all' | 'saved'

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentStudent?.id) params.set('studentId', currentStudent.id);
      if (selectedCountry !== 'All') params.set('country', selectedCountry);
      if (selectedExam !== 'All') params.set('exam', selectedExam);
      if (selectedLevel !== 'All') params.set('level', selectedLevel);

      const res = await fetch(`/api/higher-education?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
        if (data.countries) setCountries(data.countries);
        if (data.exams) setExams(data.exams);
        if (data.levels) setLevels(data.levels);
      }
    } catch (err) {
      console.error('Error fetching higher ed programs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [currentStudent?.id, selectedCountry, selectedExam, selectedLevel]);

  const toggleSave = (id) => {
    setSavedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (typeof window !== 'undefined') {
        localStorage.setItem('career_os_saved_programs', JSON.stringify(next));
      }
      return next;
    });
  };

  const displayedPrograms = programs.filter(p => {
    if (tab === 'saved' && !savedIds.includes(p.id)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.institution?.toLowerCase().includes(q) ||
        p.country?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <Layout role="student">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={24} color="#2563EB" />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Higher Education & Master's Programs</h1>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
                  Rule-based curriculum and eligibility matching customized for your {currentStudent?.branch} background & CGPA ({currentStudent?.cgpa || '8.5'}).
                </p>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div style={{ display: 'flex', background: '#F3F4F6', padding: 4, borderRadius: 8 }}>
            <button
              onClick={() => setTab('all')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: tab === 'all' ? '#fff' : 'transparent',
                fontWeight: tab === 'all' ? 700 : 500,
                color: tab === 'all' ? '#111827' : '#6B7280',
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: tab === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              All Programs ({programs.length})
            </button>
            <button
              onClick={() => setTab('saved')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: tab === 'saved' ? '#fff' : 'transparent',
                fontWeight: tab === 'saved' ? 700 : 500,
                color: tab === 'saved' ? '#111827' : '#6B7280',
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: tab === 'saved' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Bookmark size={13} color="#2563EB" />
              <span>Saved for Later ({savedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search by degree, university, keywords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
            />
          </div>

          <div>
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              {countries.map(c => <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>)}
            </select>
          </div>

          <div>
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              {exams.map(ex => <option key={ex} value={ex}>{ex === 'All' ? 'All Entrance Exams' : ex}</option>)}
            </select>
          </div>

          <div>
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              {levels.map(l => <option key={l} value={l}>{l === 'All' ? 'All Program Levels' : l}</option>)}
            </select>
          </div>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Matching academic programs against your profile...</div>
        ) : displayedPrograms.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <GraduationCap size={40} color="#9CA3AF" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>No programs match your active filters</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Try clearing the country or exam filters to view more recommendations.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {displayedPrograms.map(p => {
              const isSaved = savedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                >
                  <div>
                    {/* Top Row: Country, Level, Save Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>
                          {p.level}
                        </span>
                        <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Globe size={13} /> {p.country}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSave(p.id)}
                        title={isSaved ? 'Remove from saved' : 'Save for later'}
                        style={{
                          background: isSaved ? '#EFF6FF' : '#F9FAFB',
                          border: `1px solid ${isSaved ? '#BFDBFE' : '#E5E7EB'}`,
                          borderRadius: 6,
                          padding: '5px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          color: isSaved ? '#2563EB' : '#6B7280',
                        }}
                      >
                        {isSaved ? <BookmarkCheck size={14} color="#2563EB" /> : <Bookmark size={14} />}
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                    {/* Program Title & Institution */}
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.3 }}>
                      {p.name}
                    </h3>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building size={14} color="#64748B" />
                      <span>{p.institution}</span>
                    </div>

                    {/* Match Score Badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '3px 10px', borderRadius: 6, marginBottom: 12 }}>
                      <Sparkles size={13} color="#16A34A" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>{p.matchScore}% Academic Match</span>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5, margin: '0 0 12px' }}>
                      {p.description}
                    </p>

                    {/* Why Recommended Rule Box */}
                    <div style={{ background: '#F8FAFC', borderLeft: '3px solid #2563EB', padding: '8px 12px', borderRadius: 4, marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>
                        Why Recommended For You
                      </div>
                      <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.4 }}>
                        {p.whyRecommended}
                      </div>
                    </div>

                    {/* Meta tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: '#64748B', marginBottom: 14 }}>
                      <span style={{ background: '#F3F4F6', padding: '3px 8px', borderRadius: 4 }}>
                        <strong>Min CGPA:</strong> {p.minCgpa.toFixed(1)}
                      </span>
                      <span style={{ background: '#F3F4F6', padding: '3px 8px', borderRadius: 4 }}>
                        <strong>Exam:</strong> {p.examRequired}
                      </span>
                      {p.deadlineHint && (
                        <span style={{ background: '#FFFBEB', color: '#B45309', padding: '3px 8px', borderRadius: 4, border: '1px solid #FDE68A' }}>
                          <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                          {p.deadlineHint}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Link */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        background: '#2563EB',
                        color: '#fff',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <span>Explore Program & Apply</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </Layout>
  );
}

