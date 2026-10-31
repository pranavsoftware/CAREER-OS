import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { useData } from '../../context/DataContext';
import {
  Sparkles,
  Video,
  FileText,
  Presentation,
  BookOpen,
  Link2,
  ExternalLink,
  Download,
  Play,
  ListVideo,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Lock,
  Layers,
  Trophy,
  Star,
  Users,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Placement Prep',
  'DSA & Algorithms',
  'System Design',
  'Interview Notes',
  'Core Engineering',
  'Web Development',
  'Aptitude & Reasoning',
];

const FORMATS = [
  { value: 'All', label: 'All Formats', icon: Sparkles },
  { value: 'video', label: 'Videos & Playlists', icon: Video },
  { value: 'pdf', label: 'PDF Documents', icon: FileText },
  { value: 'ppt', label: 'PPT Slides', icon: Presentation },
  { value: 'note', label: 'Lecture Notes', icon: BookOpen },
  { value: 'link', label: 'Reference Links', icon: Link2 },
];

const BRANCH_OPTIONS = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'Mechanical'];

export default function StudentMaterials() {
  const { state, dispatch } = useData();
  const materials = state.materials || [];
  const currentStudent = state.students[0];
  const materialEnrollments = state.materialEnrollments || [];
  const materialRatings = state.materialRatings || [];

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [readingMaterial, setReadingMaterial] = useState(null);
  const [activePlaylistItemIndex, setActivePlaylistItemIndex] = useState(0);

  // Tab state: 'materials' | 'top'
  const [activeTab, setActiveTab] = useState('materials');

  // Per-card rating UI state: { [materialId]: { pendingStars, reviewText, open } }
  const [ratingUI, setRatingUI] = useState({});

  // Top Courses state
  const [topCat, setTopCat] = useState('');
  const [topBranch, setTopBranch] = useState('');
  const [topCourses, setTopCourses] = useState([]);
  const [topLoading, setTopLoading] = useState(false);
  const [topError, setTopError] = useState(null);

  // Fetch top courses
  useEffect(() => {
    if (activeTab !== 'top') return;
    setTopLoading(true);
    setTopError(null);
    const params = new URLSearchParams();
    if (topCat) params.set('category', topCat);
    if (topBranch) params.set('branch', topBranch);
    fetch(`/api/materials/top?${params.toString()}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setTopCourses(Array.isArray(data) ? data : (data.courses || data.data || []));
        setTopLoading(false);
      })
      .catch(err => {
        setTopError(err.message || 'Failed to load top courses.');
        setTopLoading(false);
      });
  }, [activeTab, topCat, topBranch]);

  // Helpers
  function getEnrollment(materialId) {
    return materialEnrollments.find(
      e => e.materialId === materialId && e.studentId === currentStudent?.id
    );
  }

  function getRating(materialId) {
    return materialRatings.find(
      r => r.materialId === materialId && r.studentId === currentStudent?.id
    );
  }

  function getAvgRating(materialId) {
    const ratings = materialRatings.filter(r => r.materialId === materialId);
    if (!ratings.length) return null;
    const avg = ratings.reduce((s, r) => s + (r.stars || 0), 0) / ratings.length;
    return { avg: avg.toFixed(1), count: ratings.length };
  }

  function handleEnroll(materialId) {
    if (!currentStudent) return;
    dispatch({ type: 'ENROLL_MATERIAL', payload: { materialId, studentId: currentStudent.id } });
  }

  function handleComplete(materialId) {
    if (!currentStudent) return;
    dispatch({ type: 'COMPLETE_MATERIAL', payload: { materialId, studentId: currentStudent.id, completed: true } });
  }

  function handleRatingStarClick(materialId, stars) {
    setRatingUI(prev => ({
      ...prev,
      [materialId]: {
        ...(prev[materialId] || {}),
        pendingStars: stars,
        open: true,
        reviewText: (prev[materialId]?.reviewText) || '',
      },
    }));
  }

  function handleSubmitRating(materialId) {
    const ui = ratingUI[materialId];
    if (!ui || !ui.pendingStars) return;
    dispatch({
      type: 'RATE_MATERIAL',
      payload: {
        materialId,
        studentId: currentStudent?.id,
        stars: ui.pendingStars,
        review: (ui.reviewText || '').slice(0, 300),
      },
    });
    setRatingUI(prev => ({ ...prev, [materialId]: { ...prev[materialId], open: false } }));
  }

  // Dynamic Content & Tag Detection (Accurate tags based on real content uploaded)
  function getMaterialBadge(m) {
    if (!m) return null;

    const playlist = Array.isArray(m.playlist) ? m.playlist : [];

    // If has playlist items, check what's actually inside the playlist!
    if (playlist.length > 0) {
      const videoCount = playlist.filter(p =>
        p.type === 'video' || (p.fileUrl && (p.fileUrl.includes('.mp4') || p.fileUrl.startsWith('data:video')))
      ).length;

      const pdfCount = playlist.filter(p =>
        p.type === 'pdf' || (p.fileUrl && (p.fileUrl.includes('.pdf') || p.fileUrl.startsWith('data:application/pdf')))
      ).length;

      if (videoCount > 0 && pdfCount > 0) {
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8' }}>
            <Video size={13} color="#2563EB" />
            <span>Video &amp; Notes Playlist ({playlist.length})</span>
          </span>
        );
      }
      if (videoCount > 0) {
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#FEE2E2', color: '#B91C1C' }}>
            <Video size={13} color="#DC2626" />
            <span>Video Playlist ({videoCount} Videos)</span>
          </span>
        );
      }
      if (pdfCount > 0) {
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#FEF3C7', color: '#B45309' }}>
            <FileText size={13} color="#D97706" />
            <span>PDF Module ({pdfCount} Documents)</span>
          </span>
        );
      }
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#EDE9FE', color: '#6D28D9' }}>
          <ListVideo size={13} color="#7C3AED" />
          <span>Course Playlist ({playlist.length} Items)</span>
        </span>
      );
    }

    // Single item detection based on fileUrl extension or materialType
    const url = (m.fileUrl || m.referenceLink || '').toLowerCase();
    const isVideo = m.materialType === 'video' || url.includes('.mp4') || url.startsWith('data:video');
    const isPdf = m.materialType === 'pdf' || url.includes('.pdf') || url.startsWith('data:application/pdf');

    if (isVideo) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#FEE2E2', color: '#B91C1C' }}>
          <Video size={13} color="#DC2626" />
          <span>Video Lecture (.mp4)</span>
        </span>
      );
    }
    if (isPdf) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#FEF3C7', color: '#B45309' }}>
          <FileText size={13} color="#D97706" />
          <span>PDF Document (.pdf)</span>
        </span>
      );
    }
    if (m.materialType === 'ppt') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#FFEDD5', color: '#C2410C' }}>
          <Presentation size={13} color="#EA580C" />
          <span>PPT Slides</span>
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#DCFCE7', color: '#15803D' }}>
        <BookOpen size={13} color="#16A34A" />
        <span>Class Notes</span>
      </span>
    );
  }

  // Item badge for individual playlist elements
  function getItemBadge(item) {
    if (!item) return null;
    const isVideo = item.type === 'video' || (item.fileUrl && (item.fileUrl.includes('.mp4') || item.fileUrl.startsWith('data:video')));
    const isPdf = item.type === 'pdf' || (item.fileUrl && (item.fileUrl.includes('.pdf') || item.fileUrl.startsWith('data:application/pdf')));

    if (isVideo) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: '#FEE2E2', color: '#B91C1C' }}>
          <Video size={12} />
          <span>Video (.mp4)</span>
        </span>
      );
    }
    if (isPdf) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: '#FEF3C7', color: '#B45309' }}>
          <FileText size={12} />
          <span>PDF Document</span>
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: '#DCFCE7', color: '#15803D' }}>
        <BookOpen size={12} />
        <span>Lecture Note</span>
      </span>
    );
  }

  // Filter ONLY materials that are given/assigned to the student's branch
  const filtered = materials.filter(m => {
    // Only show valid given materials
    const hasContent = Boolean(m.fileUrl || m.referenceLink || m.notesContent || (m.playlist && m.playlist.length > 0));
    if (!hasContent) return false;

    // Strict branch assignment filter
    const studentBranch = currentStudent?.branch || 'CSE';
    const matchBranch = !m.targetBranch || m.targetBranch === 'All' || m.targetBranch === studentBranch;
    if (!matchBranch) return false;

    // Search and Category Filters
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.notesContent || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.playlist || []).some(p => p.title.toLowerCase().includes(search.toLowerCase()));

    const matchCat = selectedCat === 'All' || m.category === selectedCat;

    // Smart format filter
    let matchFormat = true;
    if (selectedFormat !== 'All') {
      const playlist = Array.isArray(m.playlist) ? m.playlist : [];
      if (selectedFormat === 'video') {
        matchFormat = m.materialType === 'video' || playlist.some(p => p.type === 'video' || (p.fileUrl && p.fileUrl.includes('.mp4')));
      } else if (selectedFormat === 'pdf') {
        matchFormat = m.materialType === 'pdf' || playlist.some(p => p.type === 'pdf' || (p.fileUrl && p.fileUrl.includes('.pdf')));
      } else {
        matchFormat = m.materialType === selectedFormat;
      }
    }

    return matchSearch && matchCat && matchFormat;
  });

  function handleOpenMaterial(mat, itemIndex = 0) {
    setReadingMaterial(mat);
    setActivePlaylistItemIndex(itemIndex);
  }

  // Active playlist items
  const activePlaylist = readingMaterial?.playlist && readingMaterial.playlist.length > 0
    ? readingMaterial.playlist
    : readingMaterial
    ? [{
        id: 'main',
        title: readingMaterial.title,
        type: readingMaterial.materialType,
        fileUrl: readingMaterial.fileUrl || readingMaterial.referenceLink,
        notesContent: readingMaterial.notesContent,
      }]
    : [];

  const currentItem = activePlaylist[activePlaylistItemIndex] || activePlaylist[0];

  // Video Streaming Source
  const currentVideoSrc = readingMaterial?.id && !readingMaterial.id.startsWith('temp_')
    ? `/api/materials/${readingMaterial.id}/media?itemIndex=${activePlaylistItemIndex}`
    : currentItem?.fileUrl;

  return (
    <Layout title="Learning Materials & Placement Notes">
      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
          color: '#fff',
          borderRadius: 8,
          padding: '22px 26px',
          marginBottom: 20,
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>
              Assigned Learning Materials &amp; Video Playlists
            </h1>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.9, maxWidth: 650, lineHeight: 1.5 }}>
              Access university-assigned video lectures, syllabus modules, proper PDF notes, and faculty-recommended problem sets assigned to your department.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            Branch: {currentStudent?.branch || 'CSE'}
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('materials')}
          style={{
            padding: '9px 22px',
            border: 'none',
            background: activeTab === 'materials' ? '#2563EB' : '#fff',
            color: activeTab === 'materials' ? '#fff' : '#374151',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <BookOpen size={14} />
          My Materials
        </button>
        <button
          onClick={() => setActiveTab('top')}
          style={{
            padding: '9px 22px',
            border: 'none',
            borderLeft: '1px solid #E5E7EB',
            background: activeTab === 'top' ? '#2563EB' : '#fff',
            color: activeTab === 'top' ? '#fff' : '#374151',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Trophy size={14} />
          Top Courses
        </button>
      </div>

      {/* ============ TAB: MY MATERIALS ============ */}
      {activeTab === 'materials' && (
        <>
          {/* Filter and Search Controls */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            {/* Search Input */}
            <div style={{ marginBottom: 14 }}>
              <input
                type="text"
                placeholder="Search assigned materials by title, playlist topic, or keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 14px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 14 }}
              />
            </div>

            {/* Categories Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {CATEGORIES.map(cat => {
                const isSelected = selectedCat === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 20,
                      border: `1px solid ${isSelected ? '#2563EB' : '#E5E7EB'}`,
                      background: isSelected ? '#EFF6FF' : '#fff',
                      color: isSelected ? '#2563EB' : '#4B5563',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Format Selectors */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FORMATS.map(fmt => {
                const Icon = fmt.icon;
                const isSelected = selectedFormat === fmt.value;
                return (
                  <button
                    key={fmt.value}
                    onClick={() => setSelectedFormat(fmt.value)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: `1px solid ${isSelected ? '#2563EB' : '#E5E7EB'}`,
                      background: isSelected ? '#2563EB' : '#fff',
                      color: isSelected ? '#fff' : '#374151',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon size={13} />
                    <span>{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Materials Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
            {filtered.map(m => {
              const playlistCount = Array.isArray(m.playlist) ? m.playlist.length : 0;
              const enrollment = getEnrollment(m.id);
              const isEnrolled = Boolean(enrollment?.enrolled);
              const isCompleted = Boolean(enrollment?.completed);
              const myRating = getRating(m.id);
              const avgInfo = getAvgRating(m.id);
              const ui = ratingUI[m.id] || {};
              const displayStars = ui.pendingStars || myRating?.stars || 0;

              return (
                <div
                  key={m.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {getMaterialBadge(m)}
                      </div>
                      <Badge variant="info">{m.category}</Badge>
                    </div>

                    <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>
                      {m.title}
                    </h3>

                    {m.description && (
                      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#4B5563', lineHeight: 1.45 }}>
                        {m.description}
                      </p>
                    )}

                    {/* Playlist breakdown preview */}
                    {playlistCount > 0 && (
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '8px 10px', marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Playlist Contents:</span>
                          <span style={{ color: '#6366F1' }}>{playlistCount} Items</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {m.playlist.slice(0, 3).map((item, idx) => (
                            <div
                              key={item.id || idx}
                              onClick={() => handleOpenMaterial(m, idx)}
                              style={{
                                fontSize: 12,
                                color: '#2563EB',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                cursor: 'pointer',
                                textDecoration: 'none',
                              }}
                            >
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>#{idx + 1}</span>
                              {item.type === 'video' ? <Video size={12} color="#DC2626" /> : <FileText size={12} color="#D97706" />}
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                            </div>
                          ))}
                          {playlistCount > 3 && (
                            <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 600 }}>
                              +{playlistCount - 3} more items in playlist...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {m.notesContent && !playlistCount && (
                      <div
                        style={{
                          background: '#F9FAFB',
                          border: '1px solid #F3F4F6',
                          borderRadius: 6,
                          padding: '8px 10px',
                          fontSize: 12,
                          color: '#374151',
                          maxHeight: 65,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'pre-line',
                          marginBottom: 12,
                          fontFamily: 'monospace',
                        }}
                      >
                        {m.notesContent}
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Open / Watch button row */}
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>By {m.uploadedBy}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenMaterial(m, 0)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: 'none',
                            background: '#2563EB',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 1px 3px rgba(37,99,235,0.2)',
                          }}
                        >
                          {playlistCount > 0 ? (
                            <>
                              <Play size={13} />
                              <span>Open Playlist ({playlistCount})</span>
                            </>
                          ) : m.materialType === 'video' ? (
                            <>
                              <Play size={13} />
                              <span>Watch Video</span>
                            </>
                          ) : m.materialType === 'pdf' ? (
                            <>
                              <FileText size={13} />
                              <span>View PDF Document</span>
                            </>
                          ) : (
                            <>
                              <BookOpen size={13} />
                              <span>Open Study Notes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ── Enrol / Progress section ── */}
                    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 10, marginTop: 10 }}>
                      {!isEnrolled ? (
                        <button
                          onClick={() => handleEnroll(m.id)}
                          style={{
                            padding: '5px 14px',
                            borderRadius: 6,
                            border: 'none',
                            background: '#10B981',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Enrol in Course
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 10px',
                              borderRadius: 20,
                              background: '#DCFCE7',
                              color: '#15803D',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircle2 size={12} /> ✓ Enrolled
                          </span>
                          {!isCompleted ? (
                            <button
                              onClick={() => handleComplete(m.id)}
                              style={{
                                padding: '3px 12px',
                                borderRadius: 20,
                                border: '1px solid #6366F1',
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Mark Complete
                            </button>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 10px',
                                borderRadius: 20,
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              <CheckCircle2 size={12} /> ✓ Completed
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Star Rating widget (only if enrolled) ── */}
                    {isEnrolled && (
                      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 10, marginTop: 10 }}>
                        {/* Avg rating read-only */}
                        {avgInfo && (
                          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                            ⭐ {avgInfo.avg} / {avgInfo.count} rating{avgInfo.count !== 1 ? 's' : ''}
                          </div>
                        )}

                        {/* Clickable stars */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 4 }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <span
                              key={s}
                              onClick={() => handleRatingStarClick(m.id, s)}
                              style={{
                                fontSize: 20,
                                cursor: 'pointer',
                                color: s <= displayStars ? '#F59E0B' : '#D1D5DB',
                                lineHeight: 1,
                                userSelect: 'none',
                              }}
                            >
                              ★
                            </span>
                          ))}
                          <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>
                            {myRating ? 'Your rating' : 'Rate this'}
                          </span>
                        </div>

                        {/* Inline review textarea */}
                        {ui.open && (
                          <div style={{ marginTop: 6 }}>
                            <textarea
                              maxLength={300}
                              rows={2}
                              placeholder="Write a short review (optional, max 300 chars)..."
                              value={ui.reviewText || ''}
                              onChange={e =>
                                setRatingUI(prev => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], reviewText: e.target.value },
                                }))
                              }
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: '1px solid #D1D5DB',
                                fontSize: 12,
                                resize: 'none',
                                marginBottom: 6,
                              }}
                            />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => handleSubmitRating(m.id)}
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: '#F59E0B',
                                  color: '#fff',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Submit Rating
                              </button>
                              <button
                                onClick={() =>
                                  setRatingUI(prev => ({ ...prev, [m.id]: { ...prev[m.id], open: false } }))
                                }
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  border: '1px solid #D1D5DB',
                                  background: '#fff',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  padding: 40,
                  textAlign: 'center',
                  color: '#6B7280',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <BookOpen size={36} color="#9CA3AF" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>No materials currently assigned to your branch</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                  Your university training and placement cell will publish specific video lectures and study sheets here.
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ TAB: TOP COURSES ============ */}
      {activeTab === 'top' && (
        <div>
          {/* Filters row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={topCat}
              onChange={e => setTopCat(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={topBranch}
              onChange={e => setTopBranch(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              {BRANCH_OPTIONS.map(b => (
                <option key={b} value={b === 'All' ? '' : b}>{b}</option>
              ))}
            </select>
          </div>

          {topLoading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#6B7280', fontSize: 14 }}>
              Loading top courses...
            </div>
          )}

          {topError && !topLoading && (
            <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#B91C1C', fontSize: 13 }}>
              Error: {topError}
            </div>
          )}

          {!topLoading && !topError && topCourses.length === 0 && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: 40,
                textAlign: 'center',
                color: '#6B7280',
              }}
            >
              <Trophy size={36} color="#D1D5DB" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>No courses ranked yet.</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                Enrol in courses and leave ratings to build the leaderboard.
              </div>
            </div>
          )}

          {!topLoading && !topError && topCourses.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topCourses.map((course, idx) => {
                const rank = idx + 1;
                const isFirst = rank === 1;
                const avgStars = typeof course.avgStars === 'number' ? course.avgStars.toFixed(1) : (course.avgRating || course.avg_stars || '—');
                const enrollCount = course.enrollCount ?? course.enroll_count ?? course.totalEnrolled ?? '—';
                const completionRate = course.completionRate ?? course.completion_rate ?? null;
                const score = course.score ?? null;

                return (
                  <div
                    key={course.id || course.materialId || idx}
                    style={{
                      background: isFirst ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' : '#fff',
                      border: `1px solid ${isFirst ? '#FCD34D' : '#E5E7EB'}`,
                      borderRadius: 8,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      boxShadow: isFirst ? '0 2px 8px rgba(245,158,11,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* Rank badge */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isFirst ? '#F59E0B' : rank === 2 ? '#9CA3AF' : rank === 3 ? '#B45309' : '#E5E7EB',
                        color: rank <= 3 ? '#fff' : '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {isFirst ? '🏆' : rank}
                    </div>

                    {/* Course info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {course.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>
                        {course.category && <span style={{ marginRight: 10 }}>{course.category}</span>}
                        {course.targetBranch && course.targetBranch !== 'All' && <span>Branch: {course.targetBranch}</span>}
                      </div>

                      {/* Score bar */}
                      {score !== null && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginBottom: 2 }}>
                            <span>Score</span>
                            <span style={{ fontWeight: 600 }}>{typeof score === 'number' ? score.toFixed(1) : score}</span>
                          </div>
                          <div style={{ height: 5, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, (parseFloat(score) / 10) * 100)}%`,
                                height: '100%',
                                background: isFirst ? '#F59E0B' : '#2563EB',
                                borderRadius: 4,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 18, flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>
                          <Star size={13} fill="#F59E0B" color="#F59E0B" />
                          {avgStars}
                        </div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>Avg Stars</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 14, fontWeight: 700, color: '#2563EB' }}>
                          <Users size={13} color="#2563EB" />
                          {enrollCount}
                        </div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>Enrolled</div>
                      </div>
                      {completionRate !== null && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                            <CheckCircle2 size={13} color="#10B981" />
                            {typeof completionRate === 'number' ? `${Math.round(completionRate * 100)}%` : completionRate}
                          </div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>Completion</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Interactive Material & Playlist Theater Modal */}
      {readingMaterial && (
        <Modal
          isOpen={Boolean(readingMaterial)}
          title={`Learning Portal: ${readingMaterial.title}`}
          width={1100}
          onClose={() => setReadingMaterial(null)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {getMaterialBadge(readingMaterial)}
              <Badge variant="info">{readingMaterial.category}</Badge>
              <span style={{ fontSize: 13, color: '#4B5563' }}>Provided by <strong>{readingMaterial.uploadedBy}</strong></span>
            </div>
            <span style={{ fontSize: 12, color: '#6B7280', background: '#F3F4F6', padding: '3px 10px', borderRadius: 12 }}>
              Target: {readingMaterial.targetBranch || 'All Branches'}
            </span>
          </div>

          {readingMaterial.description && (
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#374151', background: '#F8FAFC', padding: '10px 14px', borderRadius: 6, borderLeft: '3px solid #2563EB', lineHeight: 1.5 }}>
              {readingMaterial.description}
            </p>
          )}

          {/* Interactive Multi-item Playlist Navigation */}
          {activePlaylist.length > 1 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18, border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', minHeight: 460 }}>
              {/* Left Playlist Drawer */}
              <div style={{ background: '#F8FAFC', borderRight: '1px solid #E2E8F0', padding: 14, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ListVideo size={15} color="#4F46E5" />
                    <span>Module Playlist</span>
                  </span>
                  <span style={{ background: '#EEF2FF', color: '#4F46E5', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                    {activePlaylist.length} Items
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 480, paddingRight: 4 }}>
                  {activePlaylist.map((item, idx) => {
                    const isActive = idx === activePlaylistItemIndex;
                    return (
                      <button
                        key={item.id || idx}
                        type="button"
                        onClick={() => setActivePlaylistItemIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: isActive ? '1.5px solid #4F46E5' : '1px solid #E2E8F0',
                          background: isActive ? '#EEF2FF' : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive ? '0 1px 3px rgba(79,70,229,0.1)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: isActive ? '#4F46E5' : '#F1F5F9',
                            color: isActive ? '#fff' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? '#1E1B4B' : '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 11, color: isActive ? '#4F46E5' : '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {item.type === 'video' ? <Video size={11} color="#DC2626" /> : <FileText size={11} color="#D97706" />}
                            <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{item.type}</span>
                            {isActive && <span style={{ fontWeight: 700, color: '#4F46E5' }}>• Active</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Content Theater */}
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', marginBottom: 2 }}>
                        Part {activePlaylistItemIndex + 1} of {activePlaylist.length}
                      </div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A' }}>
                        {currentItem.title}
                      </h3>
                    </div>
                    {getItemBadge(currentItem)}
                  </div>

                  {/* HTML5 Native Range-Streaming Video Player */}
                  {(currentItem.type === 'video' || (currentItem.fileUrl && (currentItem.fileUrl.includes('.mp4') || currentItem.fileUrl.startsWith('data:video')))) && (
                    <div style={{ background: '#0F172A', borderRadius: 8, padding: 8, marginBottom: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      <video
                        key={currentVideoSrc}
                        controls
                        playsInline
                        preload="metadata"
                        src={currentVideoSrc}
                        style={{ width: '100%', height: 380, maxHeight: 420, borderRadius: 6, background: '#000', objectFit: 'contain' }}
                      >
                        Your browser does not support HTML5 video playback.
                      </video>
                    </div>
                  )}

                  {/* PDF Document Embedded Viewer */}
                  {(currentItem.type === 'pdf' || (currentItem.fileUrl && (currentItem.fileUrl.includes('.pdf') || currentItem.fileUrl.startsWith('data:application/pdf')))) && (
                    <div style={{ marginBottom: 14 }}>
                      <iframe
                        src={currentItem.fileUrl}
                        style={{ width: '100%', height: 420, border: '1px solid #CBD5E1', borderRadius: 8 }}
                        title={currentItem.title}
                      />
                    </div>
                  )}

                  {/* Notes Content */}
                  {currentItem.notesContent && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: 14, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto', marginBottom: 12 }}>
                      {currentItem.notesContent}
                    </div>
                  )}

                  {currentItem.fileUrl && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      <a
                        href={currentVideoSrc || currentItem.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13,
                          color: '#2563EB',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={14} />
                        <span>Open Resource in New Tab</span>
                      </a>

                      {(currentItem.type === 'pdf' || currentItem.fileUrl.includes('.pdf') || currentItem.fileUrl.startsWith('data:application/pdf')) && (
                        <a
                          href={currentItem.fileUrl}
                          download={`${currentItem.title || 'notes'}.pdf`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <Download size={13} />
                          <span>Download PDF</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Playlist Stepper Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 14, marginTop: 14 }}>
                  <button
                    type="button"
                    disabled={activePlaylistItemIndex === 0}
                    onClick={() => setActivePlaylistItemIndex(prev => Math.max(0, prev - 1))}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 6,
                      border: '1px solid #D1D5DB',
                      background: activePlaylistItemIndex === 0 ? '#F3F4F6' : '#fff',
                      color: activePlaylistItemIndex === 0 ? '#9CA3AF' : '#374151',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: activePlaylistItemIndex === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ChevronLeft size={15} />
                    <span>Previous Item</span>
                  </button>

                  <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                    Item {activePlaylistItemIndex + 1} of {activePlaylist.length}
                  </span>

                  <button
                    type="button"
                    disabled={activePlaylistItemIndex === activePlaylist.length - 1}
                    onClick={() => setActivePlaylistItemIndex(prev => Math.min(activePlaylist.length - 1, prev + 1))}
                    style={{
                      padding: '7px 18px',
                      borderRadius: 6,
                      border: 'none',
                      background: activePlaylistItemIndex === activePlaylist.length - 1 ? '#F3F4F6' : '#2563EB',
                      color: activePlaylistItemIndex === activePlaylist.length - 1 ? '#9CA3AF' : '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: activePlaylistItemIndex === activePlaylist.length - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: activePlaylistItemIndex === activePlaylist.length - 1 ? 'none' : '0 1px 3px rgba(37,99,235,0.25)',
                    }}
                  >
                    <span>Next Item</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Single item viewer */}
              {(currentItem?.type === 'video' || (currentItem?.fileUrl && (currentItem.fileUrl.includes('.mp4') || currentItem.fileUrl.startsWith('data:video')))) && (
                <div style={{ background: '#0F172A', borderRadius: 8, padding: 8, marginBottom: 14 }}>
                  <video
                    key={currentVideoSrc}
                    controls
                    playsInline
                    preload="metadata"
                    src={currentVideoSrc}
                    style={{ width: '100%', height: 380, maxHeight: 420, borderRadius: 6, background: '#000', objectFit: 'contain' }}
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                </div>
              )}

              {(currentItem?.type === 'pdf' || (currentItem?.fileUrl && (currentItem.fileUrl.includes('.pdf') || currentItem.fileUrl.startsWith('data:application/pdf')))) && (
                <div style={{ marginBottom: 14 }}>
                  <iframe
                    src={currentItem.fileUrl}
                    style={{ width: '100%', height: 420, border: '1px solid #CBD5E1', borderRadius: 8 }}
                    title={currentItem.title}
                  />
                </div>
              )}

              <div
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  padding: 16,
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: '#1F2937',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {currentItem?.notesContent || readingMaterial.notesContent || 'No written notes provided for this item.'}
              </div>

              {currentItem?.fileUrl && (
                <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <a
                    href={currentVideoSrc || currentItem.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#2563EB',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>Open Resource in New Tab</span>
                  </a>

                  {(currentItem.type === 'pdf' || currentItem.fileUrl.includes('.pdf') || currentItem.fileUrl.startsWith('data:application/pdf')) && (
                    <a
                      href={currentItem.fileUrl}
                      download={`${currentItem.title || 'document'}.pdf`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <Download size={13} />
                      <span>Download PDF</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => setReadingMaterial(null)}
              style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
