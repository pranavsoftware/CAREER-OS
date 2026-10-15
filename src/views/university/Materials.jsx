import { useState, useRef } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import {
  Video,
  FileText,
  Presentation,
  Link2,
  BookOpen,
  Upload,
  Download,
  ExternalLink,
  Info,
  Trash2,
  CheckCircle2,
  Play,
  AlertCircle,
  Edit3,
  Plus,
  ChevronRight,
  ChevronLeft,
  ListVideo,
  X
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
  'General',
];

const TYPES = [
  { value: 'video', label: 'Video Lecture / Recording (.mp4)' },
  { value: 'pdf', label: 'PDF Document / Notes (.pdf)' },
  { value: 'ppt', label: 'PPT Slides / Presentation' },
  { value: 'link', label: 'External Reference Link' },
  { value: 'note', label: 'Direct Classroom Note / Guide' },
];

const BRANCH_OPTIONS = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'Mechanical'];

export default function UniversityMaterials() {
  const { state, dispatch } = useData();
  const materials = state.materials || [];

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [readingMaterial, setReadingMaterial] = useState(null);
  const [activePlaylistItemIndex, setActivePlaylistItemIndex] = useState(0);
  const [inlineMsg, setInlineMsg] = useState(null);

  // Upload Progress States
  const [uploadProgress, setUploadProgress] = useState(null); // number 0-100 or null
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('');
  const mainFileInputRef = useRef(null);

  // Form State for Add / Edit
  const [form, setForm] = useState({
    title: '',
    category: 'Placement Prep',
    materialType: 'pdf',
    description: '',
    fileUrl: '',
    notesContent: '',
    targetBranch: 'All',
    uploadedBy: 'University Placement & Training Cell',
    playlist: [],
  });

  // Playlist Item Sub-form State
  const [showPlaylistItemForm, setShowPlaylistItemForm] = useState(false);
  const playlistFileInputRef = useRef(null);
  const [playlistUploadProgress, setPlaylistUploadProgress] = useState(null);
  const [playlistUploadFileName, setPlaylistUploadFileName] = useState('');
  const [playlistItemForm, setPlaylistItemForm] = useState({
    title: '',
    type: 'video',
    fileUrl: '',
    notesContent: '',
  });

  // Simulated Upload Percentage Bar Function
  function simulateUpload(file, onProgress, onComplete) {
    const totalBytes = file.size;
    const formattedSize = totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(totalBytes / 1024)} KB`;

    let current = 0;
    onProgress(5, formattedSize);

    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 18) + 12;
      if (current >= 95) {
        clearInterval(interval);
        onProgress(95, formattedSize);
      } else {
        onProgress(current, formattedSize);
      }
    }, 120);

    const reader = new FileReader();
    reader.onload = () => {
      clearInterval(interval);
      onProgress(100, formattedSize);
      setTimeout(() => {
        onComplete(reader.result, file.name);
      }, 350);
    };
    reader.onerror = () => {
      clearInterval(interval);
      onProgress(null, '');
      alert('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  }

  function handleMainFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    simulateUpload(
      file,
      (progress, sizeStr) => {
        setUploadProgress(progress);
        setUploadFileSize(sizeStr);
      },
      (dataUrl, name) => {
        setForm(prev => ({
          ...prev,
          fileUrl: dataUrl,
          title: prev.title || name.replace(/\.[^/.]+$/, ""),
          materialType: isMp4 ? 'video' : isPdf ? 'pdf' : prev.materialType,
        }));
      }
    );
  }

  function handlePlaylistFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPlaylistUploadFileName(file.name);
    const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    simulateUpload(
      file,
      (progress, sizeStr) => {
        setPlaylistUploadProgress(progress);
      },
      (dataUrl, name) => {
        setPlaylistItemForm(prev => ({
          ...prev,
          fileUrl: dataUrl,
          title: prev.title || name.replace(/\.[^/.]+$/, ""),
          type: isMp4 ? 'video' : isPdf ? 'pdf' : prev.type,
        }));
      }
    );
  }

  function handleAddPlaylistItem() {
    if (!playlistItemForm.title.trim()) {
      alert('Please enter a title for the playlist item.');
      return;
    }
    const newItem = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: playlistItemForm.title.trim(),
      type: playlistItemForm.type,
      fileUrl: playlistItemForm.fileUrl.trim() || null,
      notesContent: playlistItemForm.notesContent.trim() || null,
    };

    setForm(prev => ({
      ...prev,
      playlist: [...(prev.playlist || []), newItem],
    }));

    setPlaylistItemForm({
      title: '',
      type: 'video',
      fileUrl: '',
      notesContent: '',
    });
    setPlaylistUploadProgress(null);
    setPlaylistUploadFileName('');
    setShowPlaylistItemForm(false);
  }

  function handleRemovePlaylistItem(indexToRemove) {
    setForm(prev => ({
      ...prev,
      playlist: prev.playlist.filter((_, idx) => idx !== indexToRemove),
    }));
  }

  function openCreateModal() {
    setForm({
      title: '',
      category: 'Placement Prep',
      materialType: 'pdf',
      description: '',
      fileUrl: '',
      notesContent: '',
      targetBranch: 'All',
      uploadedBy: 'University Placement & Training Cell',
      playlist: [],
    });
    setUploadProgress(null);
    setUploadFileName('');
    setShowPlaylistItemForm(false);
    setShowAddModal(true);
  }

  function openEditModal(mat) {
    setEditingMaterial(mat);
    setForm({
      title: mat.title || '',
      category: mat.category || 'Placement Prep',
      materialType: mat.materialType || 'pdf',
      description: mat.description || '',
      fileUrl: mat.fileUrl || mat.referenceLink || '',
      notesContent: mat.notesContent || '',
      targetBranch: mat.targetBranch || 'All',
      uploadedBy: mat.uploadedBy || 'University Placement & Training Cell',
      playlist: Array.isArray(mat.playlist) ? [...mat.playlist] : [],
    });
    setUploadProgress(null);
    setUploadFileName('');
    setShowPlaylistItemForm(false);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const link = form.fileUrl.trim() || null;

    if (editingMaterial) {
      const updated = {
        ...editingMaterial,
        title: form.title.trim(),
        category: form.category,
        materialType: form.materialType,
        description: form.description.trim(),
        fileUrl: link,
        referenceLink: link,
        notesContent: form.notesContent.trim() || null,
        targetBranch: form.targetBranch,
        uploadedBy: form.uploadedBy.trim() || 'University Placement Cell',
        playlist: form.playlist || [],
      };

      dispatch({ type: 'UPDATE_MATERIAL', payload: updated });
      setEditingMaterial(null);
      setInlineMsg({
        type: 'success',
        text: `Material "${updated.title}" successfully updated with ${updated.playlist?.length || 0} playlist item(s).`,
      });
    } else {
      const newMat = {
        id: `mat_${Date.now()}`,
        title: form.title.trim(),
        category: form.category,
        materialType: form.materialType,
        description: form.description.trim(),
        fileUrl: link,
        referenceLink: link,
        notesContent: form.notesContent.trim() || null,
        targetBranch: form.targetBranch,
        uploadedBy: form.uploadedBy.trim() || 'University Placement Cell',
        createdAt: new Date().toISOString(),
        playlist: form.playlist || [],
      };

      dispatch({ type: 'ADD_MATERIAL', payload: newMat });
      setShowAddModal(false);
      setInlineMsg({
        type: 'success',
        text: `Learning material "${newMat.title}" published with ${newMat.playlist?.length || 0} playlist item(s).`,
      });
    }
  }

  function handleDelete(id, title) {
    if (window.confirm(`Delete material "${title}"?`)) {
      dispatch({ type: 'DELETE_MATERIAL', payload: id });
      setInlineMsg({
        type: 'success',
        text: `Material "${title}" was removed.`,
      });
    }
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
            <span>Video & Notes Playlist ({playlist.length})</span>
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

  const filteredMaterials = materials.filter(m => {
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.notesContent || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.playlist || []).some(p => p.title.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCat === 'All' || m.category === selectedCat;
    const matchType = selectedType === 'All' || m.materialType === selectedType;
    return matchSearch && matchCat && matchType;
  });

  // Calculate items for active reading material
  const readingPlaylist = readingMaterial?.playlist && readingMaterial.playlist.length > 0
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

  const currentReadingItem = readingPlaylist[activePlaylistItemIndex] || readingPlaylist[0];

  return (
    <Layout title="Learning Materials & Online Class Library">
      {inlineMsg && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 16,
            borderRadius: 6,
            background: inlineMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${inlineMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            color: inlineMsg.type === 'success' ? '#15803D' : '#B91C1C',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{inlineMsg.text}</span>
        </div>
      )}

      {/* Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
            Course Modules, Lecture Recordings & Notes Repository
          </h2>
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            Create comprehensive learning modules with multi-item playlists (videos, PDFs, notes) and direct database persistence.
          </div>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            padding: '8px 18px',
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
            boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
          }}
        >
          <Plus size={15} />
          <span>Upload New Section / Playlist</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14, marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: 12, alignItems: 'center' }}>
        <div>
          <input
            type="text"
            placeholder="Search learning materials by topic, keywords or playlist items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
          />
        </div>
        <div>
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
          >
            <option value="All">All Formats</option>
            {TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
        {filteredMaterials.map(m => {
          const playlistCount = Array.isArray(m.playlist) ? m.playlist.length : 0;
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
                transition: 'border-color 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {getMaterialBadge(m)}
                  </div>
                  <Badge variant="gray">{m.targetBranch === 'All' ? 'All Branches' : m.targetBranch}</Badge>
                </div>

                <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>
                  {m.title}
                </h3>

                <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 8 }}>
                  Category: <strong style={{ color: '#2563EB' }}>{m.category}</strong>
                </div>

                {m.description && (
                  <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.4, marginBottom: 12 }}>
                    {m.description}
                  </div>
                )}

                {/* Playlist Preview Pills if multi-item */}
                {playlistCount > 0 && (
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 10px', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 6 }}>
                      Playlist Contents ({playlistCount} items):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {m.playlist.slice(0, 3).map((item, idx) => (
                        <div key={item.id || idx} style={{ fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>#{idx + 1}</span>
                          {item.type === 'video' ? <Video size={12} color="#DC2626" /> : <FileText size={12} color="#D97706" />}
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                        </div>
                      ))}
                      {playlistCount > 3 && (
                        <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 500 }}>
                          +{playlistCount - 3} more item(s)...
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
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>By {m.uploadedBy}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        setReadingMaterial(m);
                        setActivePlaylistItemIndex(0);
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 4,
                        border: '1px solid #2563EB',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Play size={12} />
                      <span>{playlistCount > 0 ? 'View Playlist' : 'Read / Open'}</span>
                    </button>

                    <button
                      onClick={() => openEditModal(m)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 4,
                        border: '1px solid #D1D5DB',
                        background: '#fff',
                        color: '#374151',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDelete(m.id, m.title)}
                      style={{
                        padding: '5px 8px',
                        borderRadius: 4,
                        border: '1px solid #FCA5A5',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMaterials.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              padding: 40,
              textAlign: 'center',
              color: '#6B7280',
            }}
          >
            <BookOpen size={36} color="#9CA3AF" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>No materials match your filter</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
              Click "Upload New Section / Playlist" to publish learning modules for students.
            </div>
          </div>
        )}
      </div>

      {/* Modal for ADD & EDIT Material */}
      {(showAddModal || editingMaterial) && (
        <Modal
          isOpen={showAddModal || Boolean(editingMaterial)}
          title={editingMaterial ? `Edit Section / Playlist: ${editingMaterial.title}` : 'Publish New Learning Material / Playlist'}
          width={840}
          onClose={() => {
            setShowAddModal(false);
            setEditingMaterial(null);
          }}
        >
          <form onSubmit={handleSave}>
            <FormField label="Section / Module Title *" required>
              <input
                type="text"
                placeholder="e.g. Campus Placement Masterclass: DSA, Web Dev & System Design"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Category *">
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Target Department / Branch *">
                <select
                  value={form.targetBranch}
                  onChange={e => setForm({ ...form, targetBranch: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
                >
                  {BRANCH_OPTIONS.map(b => (
                    <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Description & Learning Objectives">
              <textarea
                rows={2}
                placeholder="Provide a quick overview of what students will learn from this module or recording..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              />
            </FormField>

            {/* Primary / Overview Resource File Upload with Percentage Bar */}
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>
                Primary Module File (.mp4 Video or .pdf Document)
              </label>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <input
                  type="file"
                  ref={mainFileInputRef}
                  accept="video/mp4,application/pdf"
                  onChange={handleMainFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => mainFileInputRef.current?.click()}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#374151',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Upload size={14} />
                  <span>Choose MP4 Video or PDF Document</span>
                </button>

                <span style={{ fontSize: 12, color: '#6B7280' }}>
                  {form.fileUrl ? 'File loaded in database' : 'or enter URL below'}
                </span>
              </div>

              {/* Upload Percentage Bar */}
              {uploadProgress !== null && (
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: '10px 12px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, color: '#111827' }}>
                      {uploadFileName.endsWith('.mp4') ? <Video size={14} color="#DC2626" /> : <FileText size={14} color="#D97706" />}
                      <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadFileName}</span>
                      <span style={{ color: '#6B7280', fontSize: 11 }}>({uploadFileSize})</span>
                    </div>
                    <div style={{ fontWeight: 700, color: uploadProgress === 100 ? '#15803D' : '#2563EB', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {uploadProgress === 100 ? <CheckCircle2 size={13} /> : null}
                      <span>{uploadProgress}% {uploadProgress === 100 ? 'Uploaded' : 'Uploading...'}</span>
                    </div>
                  </div>
                  {/* Progress Track */}
                  <div style={{ width: '100%', height: 7, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        background: uploadProgress === 100 ? '#16A34A' : '#2563EB',
                        transition: 'width 0.2s ease-in-out',
                      }}
                    />
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Or paste direct URL (e.g. https://... or data:...)"
                value={form.fileUrl}
                onChange={e => setForm({ ...form, fileUrl: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12 }}
              />
            </div>

            {/* Playlist Section (Multiple Videos, PDFs, Notes in ONE section) */}
            <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ListVideo size={16} color="#6366F1" />
                    <span>Multi-Item Playlist / Content Modules</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    Add multiple videos, lecture PDFs or practice sheets into this single section just like a playlist.
                  </div>
                </div>
                {!showPlaylistItemForm && (
                  <button
                    type="button"
                    onClick={() => setShowPlaylistItemForm(true)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 4,
                      border: '1px solid #6366F1',
                      background: '#EEF2FF',
                      color: '#4F46E5',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Plus size={13} />
                    <span>Add Item to Playlist</span>
                  </button>
                )}
              </div>

              {/* Existing Playlist Items List */}
              {form.playlist && form.playlist.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {form.playlist.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#fff',
                        border: '1px solid #E2E8F0',
                        borderRadius: 6,
                        padding: '8px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>#{idx + 1}</span>
                        {item.type === 'video' ? (
                          <Video size={15} color="#DC2626" />
                        ) : item.type === 'pdf' ? (
                          <FileText size={15} color="#D97706" />
                        ) : (
                          <BookOpen size={15} color="#15803D" />
                        )}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{item.title}</div>
                          <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
                            {item.type} {item.fileUrl?.startsWith('data:') ? '• (Stored in Database)' : item.fileUrl ? '• (Linked)' : ''}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePlaylistItem(idx)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          border: '1px solid #FECACA',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <Trash2 size={11} />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                  No playlist items added yet. Click "+ Add Item to Playlist" to attach multiple videos or PDFs.
                </div>
              )}

              {/* Add Playlist Item Sub-Form */}
              {showPlaylistItemForm && (
                <div style={{ background: '#fff', border: '1px dashed #6366F1', borderRadius: 6, padding: 12, marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>Add New Playlist Item</span>
                    <button
                      type="button"
                      onClick={() => setShowPlaylistItemForm(false)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Item Title (e.g. Part 1: Video Lecture on DP)"
                      value={playlistItemForm.title}
                      onChange={e => setPlaylistItemForm({ ...playlistItemForm, title: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12 }}
                    />
                    <select
                      value={playlistItemForm.type}
                      onChange={e => setPlaylistItemForm({ ...playlistItemForm, type: e.target.value })}
                      style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12, background: '#fff' }}
                    >
                      <option value="video">Video (.mp4)</option>
                      <option value="pdf">PDF Document (.pdf)</option>
                      <option value="link">External Link</option>
                      <option value="note">Notes Text</option>
                    </select>
                  </div>

                  {/* Playlist File Upload with Percentage Bar */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input
                      type="file"
                      ref={playlistFileInputRef}
                      accept="video/mp4,application/pdf"
                      onChange={handlePlaylistFileUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => playlistFileInputRef.current?.click()}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 4,
                        border: '1px solid #CBD5E1',
                        background: '#F1F5F9',
                        color: '#334155',
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Upload size={12} />
                      <span>Upload Item File (.mp4 / .pdf)</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Or paste URL..."
                      value={playlistItemForm.fileUrl}
                      onChange={e => setPlaylistItemForm({ ...playlistItemForm, fileUrl: e.target.value })}
                      style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 11 }}
                    />
                  </div>

                  {playlistUploadProgress !== null && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, padding: '6px 8px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{playlistUploadFileName}</span>
                        <span style={{ fontWeight: 700, color: playlistUploadProgress === 100 ? '#15803D' : '#4F46E5' }}>
                          {playlistUploadProgress}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 5, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${playlistUploadProgress}%`,
                            height: '100%',
                            background: playlistUploadProgress === 100 ? '#16A34A' : '#4F46E5',
                            transition: 'width 0.2s',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={2}
                    placeholder="Optional notes or instructions for this playlist item..."
                    value={playlistItemForm.notesContent}
                    onChange={e => setPlaylistItemForm({ ...playlistItemForm, notesContent: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 11, marginBottom: 8 }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setShowPlaylistItemForm(false)}
                      style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #CBD5E1', background: '#fff', fontSize: 11, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPlaylistItem}
                      style={{ padding: '4px 12px', borderRadius: 4, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Add to Playlist
                    </button>
                  </div>
                </div>
              )}
            </div>

            <FormField label="Classroom Notes, Lecture Summary & Key Takeaways">
              <textarea
                rows={4}
                placeholder="Write or paste comprehensive study notes, formula cheatsheets, practice problems..."
                value={form.notesContent}
                onChange={e => setForm({ ...form, notesContent: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, lineHeight: 1.5 }}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMaterial(null);
                }}
                style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {editingMaterial ? 'Save Changes' : 'Publish Material & Playlist'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Full Note / Playlist Theater Viewer Dialog */}
      {readingMaterial && (
        <Modal
          isOpen={Boolean(readingMaterial)}
          title={`Learning Portal: ${readingMaterial.title}`}
          width={1100}
          onClose={() => setReadingMaterial(null)}
        >
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {getMaterialBadge(readingMaterial)}
              <Badge variant="info">{readingMaterial.category}</Badge>
              <span style={{ fontSize: 13, color: '#4B5563' }}>Target: <strong>{readingMaterial.targetBranch}</strong></span>
            </div>
            <span style={{ fontSize: 12, color: '#6B7280', background: '#F3F4F6', padding: '3px 10px', borderRadius: 12 }}>
              Uploaded by {readingMaterial.uploadedBy}
            </span>
          </div>

          {readingMaterial.description && (
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#374151', background: '#F8FAFC', padding: '10px 14px', borderRadius: 6, borderLeft: '3px solid #2563EB', lineHeight: 1.5 }}>
              {readingMaterial.description}
            </p>
          )}

          {/* If Playlist exists: Interactive Player with Navigation Drawer */}
          {readingPlaylist.length > 1 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18, border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', minHeight: 460 }}>
              {/* Playlist Nav Drawer */}
              <div style={{ background: '#F8FAFC', borderRight: '1px solid #E2E8F0', padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ListVideo size={14} color="#6366F1" />
                  <span>Module Items ({readingPlaylist.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {readingPlaylist.map((item, idx) => {
                    const isActive = idx === activePlaylistItemIndex;
                    return (
                      <button
                        key={item.id || idx}
                        type="button"
                        onClick={() => setActivePlaylistItemIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: isActive ? '1px solid #6366F1' : '1px solid transparent',
                          background: isActive ? '#EEF2FF' : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#4F46E5' : '#94A3B8' }}>#{idx + 1}</span>
                        {item.type === 'video' ? <Video size={14} color="#DC2626" /> : <FileText size={14} color="#D97706" />}
                        <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 500, color: isActive ? '#1E1B4B' : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Item Theater Viewer */}
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                      Part {activePlaylistItemIndex + 1}: {currentReadingItem.title}
                    </div>
                    {getItemBadge(currentReadingItem)}
                  </div>

                  {/* HTML5 Video Player */}
                  {(currentReadingItem.type === 'video' || (currentReadingItem.fileUrl && (currentReadingItem.fileUrl.includes('.mp4') || currentReadingItem.fileUrl.startsWith('data:video')))) && (
                    <div style={{ background: '#0F172A', borderRadius: 8, padding: 8, marginBottom: 12 }}>
                      <video
                        key={readingMaterial?.id ? `/api/materials/${readingMaterial.id}/media?itemIndex=${activePlaylistItemIndex}` : currentReadingItem.fileUrl}
                        controls
                        playsInline
                        preload="metadata"
                        src={readingMaterial?.id ? `/api/materials/${readingMaterial.id}/media?itemIndex=${activePlaylistItemIndex}` : currentReadingItem.fileUrl}
                        style={{ width: '100%', maxHeight: 380, borderRadius: 6, background: '#000', objectFit: 'contain' }}
                      >
                        Your browser does not support HTML5 video playback.
                      </video>
                    </div>
                  )}

                  {/* PDF Viewer */}
                  {(currentReadingItem.type === 'pdf' || (currentReadingItem.fileUrl && (currentReadingItem.fileUrl.includes('.pdf') || currentReadingItem.fileUrl.startsWith('data:application/pdf')))) && (
                    <div style={{ marginBottom: 12 }}>
                      <iframe
                        src={currentReadingItem.fileUrl}
                        style={{ width: '100%', height: 350, border: '1px solid #E2E8F0', borderRadius: 6 }}
                        title={currentReadingItem.title}
                      />
                    </div>
                  )}

                  {/* Notes content */}
                  {currentReadingItem.notesContent && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: 12, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto' }}>
                      {currentReadingItem.notesContent}
                    </div>
                  )}

                  {currentReadingItem.fileUrl && (
                    <div style={{ marginTop: 10 }}>
                      <a
                        href={currentReadingItem.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`${currentReadingItem.title}.pdf`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: '#2563EB',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>Open Resource in New Tab</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Playlist Stepper controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 12, marginTop: 16 }}>
                  <button
                    type="button"
                    disabled={activePlaylistItemIndex === 0}
                    onClick={() => setActivePlaylistItemIndex(prev => Math.max(0, prev - 1))}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 4,
                      border: '1px solid #D1D5DB',
                      background: activePlaylistItemIndex === 0 ? '#F3F4F6' : '#fff',
                      color: activePlaylistItemIndex === 0 ? '#9CA3AF' : '#374151',
                      fontSize: 12,
                      cursor: activePlaylistItemIndex === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ChevronLeft size={13} />
                    <span>Previous Item</span>
                  </button>

                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    {activePlaylistItemIndex + 1} of {readingPlaylist.length}
                  </span>

                  <button
                    type="button"
                    disabled={activePlaylistItemIndex === readingPlaylist.length - 1}
                    onClick={() => setActivePlaylistItemIndex(prev => Math.min(readingPlaylist.length - 1, prev + 1))}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 4,
                      border: '1px solid #2563EB',
                      background: activePlaylistItemIndex === readingPlaylist.length - 1 ? '#F3F4F6' : '#2563EB',
                      color: activePlaylistItemIndex === readingPlaylist.length - 1 ? '#9CA3AF' : '#fff',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: activePlaylistItemIndex === readingPlaylist.length - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>Next Item</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Single Item Viewer */}
              {(currentReadingItem?.type === 'video' || (currentReadingItem?.fileUrl && (currentReadingItem.fileUrl.includes('.mp4') || currentReadingItem.fileUrl.startsWith('data:video')))) && (
                <div style={{ background: '#0F172A', borderRadius: 8, padding: 8, marginBottom: 14 }}>
                  <video
                    key={readingMaterial?.id ? `/api/materials/${readingMaterial.id}/media?itemIndex=0` : currentReadingItem.fileUrl}
                    controls
                    playsInline
                    preload="metadata"
                    src={readingMaterial?.id ? `/api/materials/${readingMaterial.id}/media?itemIndex=0` : currentReadingItem.fileUrl}
                    style={{ width: '100%', maxHeight: 380, borderRadius: 6, background: '#000', objectFit: 'contain' }}
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                </div>
              )}

              {(currentReadingItem?.type === 'pdf' || (currentReadingItem?.fileUrl && (currentReadingItem.fileUrl.includes('.pdf') || currentReadingItem.fileUrl.startsWith('data:application/pdf')))) && (
                <div style={{ marginBottom: 14 }}>
                  <iframe
                    src={currentReadingItem.fileUrl}
                    style={{ width: '100%', height: 380, border: '1px solid #E2E8F0', borderRadius: 6 }}
                    title={currentReadingItem.title}
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
                  lineHeight: 1.7,
                  color: '#1F2937',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {currentReadingItem?.notesContent || readingMaterial.notesContent || 'No written notes provided for this item.'}
              </div>

              {currentReadingItem?.fileUrl && (
                <div style={{ marginTop: 14 }}>
                  <a
                    href={currentReadingItem.fileUrl}
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
                    <span>Open Associated Resource</span>
                  </a>
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
