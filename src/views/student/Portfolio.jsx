import { useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Star, 
  GitFork, 
  ExternalLink, 
  Globe, 
  RefreshCw, 
  Unlink, 
  Plus, 
  Search, 
  Code2, 
  Pin, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  FolderGit2,
  Trash2,
  SlidersHorizontal
} from 'lucide-react';
import GithubIcon from '../../components/GithubIcon';

const LANGUAGE_COLORS = {
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Python: '#3776AB',
  Java: '#B07219',
  'C++': '#F34B7D',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#DEA584',
  HTML: '#E34F26',
  CSS: '#563D7C',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89E051',
  Vue: '#41B883',
};

export default function StudentPortfolio() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const student = (state.students || []).find(s => s.id === user?.studentId) || (state.students || [])[0];
  const myCerts = (state.certificates || []).filter(c => c.studentId === student?.id && c.status === 'Valid');

  const [activeTab, setActiveTab] = useState('hub'); // 'hub' | 'preview'
  const [githubInput, setGithubInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [filterFeaturedOnly, setFilterFeaturedOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Manual project form state
  const [manualProj, setManualProj] = useState({
    title: '',
    description: '',
    technologies: '',
    link: '',
    demoLink: '',
    year: new Date().getFullYear(),
  });

  if (!student) {
    return (
      <Layout title="Project Area & Portfolio">
        <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>
          Student profile not found.
        </div>
      </Layout>
    );
  }

  const projects = student.projects || [];

  // Extract GitHub username if already linked
  const linkedGithub = student.github || '';
  const currentGithubHandle = linkedGithub.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/+$/, '').replace(/^@/, '');

  // Calculate stats
  const totalProjects = projects.length;
  const githubProjects = projects.filter(p => p.isGithub || p.id?.startsWith('gh_'));
  const totalStars = projects.reduce((acc, p) => acc + (Number(p.stars) || 0), 0);
  const totalForks = projects.reduce((acc, p) => acc + (Number(p.forks) || 0), 0);
  const languagesList = Array.from(new Set(
    projects
      .map(p => p.language)
      .filter(l => l && l !== 'General' && l !== 'Code')
  ));

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        !searchQuery || 
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(p.technologies) && p.technologies.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesLang = 
        selectedLanguage === 'ALL' || 
        p.language === selectedLanguage || 
        (Array.isArray(p.technologies) && p.technologies.includes(selectedLanguage));

      const matchesFeatured = !filterFeaturedOnly || p.featured;

      return matchesSearch && matchesLang && matchesFeatured;
    });
  }, [projects, searchQuery, selectedLanguage, filterFeaturedOnly]);

  // Sync GitHub repositories handler
  async function handleSync(usernameToUse = null) {
    const targetUsername = usernameToUse || githubInput || currentGithubHandle;
    if (!targetUsername.trim()) {
      setSyncStatus({ type: 'error', message: 'Please enter a valid GitHub username or profile URL.' });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const res = await fetch('/api/students/github-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          githubUsername: targetUsername,
          action: 'sync',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync GitHub repositories');
      }

      // Update DataContext immediately
      dispatch({
        type: 'UPDATE_STUDENT',
        payload: {
          id: student.id,
          github: data.github,
          projects: data.projects,
        },
      });

      setSyncStatus({
        type: 'success',
        message: data.message || `Successfully synced ${data.syncedCount || 0} repositories!`,
      });
      setGithubInput('');
      setTimeout(() => setSyncStatus(null), 6000);
    } catch (err) {
      console.error('Error syncing with GitHub:', err);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Error connecting to GitHub. Please check your username.',
      });
    } finally {
      setIsSyncing(false);
    }
  }

  // Disconnect GitHub handler
  async function handleDisconnect() {
    if (!window.confirm('Are you sure you want to disconnect GitHub? This will remove GitHub synced repositories from your portfolio.')) {
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('/api/students/github-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          action: 'disconnect',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disconnect');

      dispatch({
        type: 'UPDATE_STUDENT',
        payload: {
          id: student.id,
          github: null,
          projects: data.projects,
        },
      });

      setSyncStatus({ type: 'success', message: 'GitHub account disconnected.' });
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err) {
      setSyncStatus({ type: 'error', message: err.message });
    } finally {
      setIsSyncing(false);
    }
  }

  // Toggle Pin/Featured status
  async function handleTogglePin(projectId) {
    const updated = projects.map(p => p.id === projectId ? { ...p, featured: !p.featured } : p);
    dispatch({
      type: 'UPDATE_STUDENT',
      payload: { id: student.id, projects: updated },
    });

    try {
      await fetch('/api/students/github-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          action: 'togglePin',
          projectToToggle: projectId,
        }),
      });
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  }

  // Delete project handler
  function handleDeleteProject(projectId) {
    const updated = projects.filter(p => p.id !== projectId);
    dispatch({
      type: 'UPDATE_STUDENT',
      payload: { id: student.id, projects: updated },
    });
  }

  // Add manual project handler
  function handleAddManualProject(e) {
    e.preventDefault();
    if (!manualProj.title.trim()) return;

    const techs = manualProj.technologies
      ? manualProj.technologies.split(',').map(t => t.trim()).filter(Boolean)
      : ['Software'];

    const newEntry = {
      id: `p_${Date.now()}`,
      title: manualProj.title.trim(),
      description: manualProj.description.trim() || 'Software engineering project',
      technologies: techs,
      link: manualProj.link.trim() || null,
      demoLink: manualProj.demoLink.trim() || null,
      stars: 0,
      forks: 0,
      language: techs[0] || 'Code',
      year: Number(manualProj.year) || new Date().getFullYear(),
      isGithub: false,
      featured: true,
    };

    const updated = [newEntry, ...projects];
    dispatch({
      type: 'UPDATE_STUDENT',
      payload: { id: student.id, projects: updated },
    });

    setManualProj({
      title: '',
      description: '',
      technologies: '',
      link: '',
      demoLink: '',
      year: new Date().getFullYear(),
    });
    setShowAddModal(false);
  }

  function handleCopy() {
    navigator.clipboard?.writeText(`https://career-os.vit.ac.in/p/${student.regNo.toLowerCase()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Layout title="Projects & Portfolio Area">
      {/* Top Bar with Navigation Tabs and Quick Share */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', background: '#F3F4F6', padding: 4, borderRadius: 8, border: '1px solid #E5E7EB' }}>
          <button
            onClick={() => setActiveTab('hub')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === 'hub' ? '#fff' : 'transparent',
              color: activeTab === 'hub' ? '#1D4ED8' : '#4B5563',
              fontWeight: activeTab === 'hub' ? 600 : 500,
              fontSize: 13,
              boxShadow: activeTab === 'hub' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FolderGit2 size={16} />
            Project Hub & GitHub Sync
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === 'preview' ? '#fff' : 'transparent',
              color: activeTab === 'preview' ? '#1D4ED8' : '#4B5563',
              fontWeight: activeTab === 'preview' ? 600 : 500,
              fontSize: 13,
              boxShadow: activeTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Eye size={16} />
            Live Portfolio Preview
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              background: '#fff',
              color: '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            Add Custom Project
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              border: '1px solid #2563EB',
              background: copied ? '#EFF6FF' : '#2563EB',
              color: copied ? '#2563EB' : '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {copied ? 'Link Copied!' : 'Share Public Link'}
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            background: syncStatus.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${syncStatus.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: syncStatus.type === 'success' ? '#065F46' : '#991B1B',
          }}
        >
          {syncStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{syncStatus.message}</span>
        </div>
      )}

      {/* TAB 1: PROJECT HUB & GITHUB SYNC */}
      {activeTab === 'hub' && (
        <div>
          {/* GitHub Connection Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              borderRadius: 12,
              padding: 24,
              color: '#fff',
              marginBottom: 24,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: '#000',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <GithubIcon size={30} color="#fff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
                      GitHub Integration Engine
                    </h2>
                    {currentGithubHandle ? (
                      <span
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#4ADE80',
                          border: '1px solid rgba(34, 197, 94, 0.4)',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }}></span>
                        Connected
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(234, 179, 8, 0.2)',
                          color: '#FDE047',
                          border: '1px solid rgba(234, 179, 8, 0.4)',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 10px',
                        }}
                      >
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8', maxWidth: 560 }}>
                    Link your GitHub account to showcase your open-source projects, stargazers, commit activity, and programming languages automatically to top placement recruiters.
                  </p>
                </div>
              </div>

              {/* Action area */}
              {currentGithubHandle && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    onClick={() => handleSync()}
                    disabled={isSyncing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid #3B82F6',
                      background: '#2563EB',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: isSyncing ? 'not-allowed' : 'pointer',
                      opacity: isSyncing ? 0.7 : 1,
                    }}
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                    {isSyncing ? 'Syncing Repos...' : 'Re-sync Repositories'}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={isSyncing}
                    title="Disconnect GitHub"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #475569',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#F87171',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <Unlink size={14} />
                    Disconnect
                  </button>
                </div>
              )}
            </div>

            {/* Input or Connected Status Bar */}
            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              {currentGithubHandle ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                  <span style={{ color: '#94A3B8' }}>Active Profile:</span>
                  <a
                    href={linkedGithub.startsWith('http') ? linkedGithub : `https://github.com/${currentGithubHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#60A5FA',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    @{currentGithubHandle}
                    <ExternalLink size={13} />
                  </a>
                  <span style={{ color: '#475569' }}>•</span>
                  <span style={{ color: '#CBD5E1' }}>
                    <strong>{githubProjects.length}</strong> Repositories Synced
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 540 }}>
                  <input
                    type="text"
                    value={githubInput}
                    onChange={e => setGithubInput(e.target.value)}
                    placeholder="Enter GitHub username (e.g. torvalds or https://github.com/...)"
                    onKeyDown={e => e.key === 'Enter' && handleSync()}
                    style={{
                      flex: 1,
                      padding: '9px 14px',
                      borderRadius: 8,
                      border: '1px solid #475569',
                      background: '#0F172A',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => handleSync()}
                    disabled={isSyncing}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#2563EB',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: isSyncing ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isSyncing ? 'Connecting...' : 'Connect GitHub'}
                  </button>
                </div>
              )}

              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                Public Repositories • Stargazers • Primary Languages • Live Demo URL
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Total Projects</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginTop: 4 }}>{totalProjects}</div>
              <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>{githubProjects.length} from GitHub</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Total GitHub Stars</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#D97706', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={20} fill="#D97706" color="#D97706" />
                {totalStars}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Across all repositories</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Repository Forks</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#2563EB', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <GitFork size={20} />
                {totalForks}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Community contribution</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Languages Used</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#4F46E5', marginTop: 4 }}>{languagesList.length}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {languagesList.slice(0, 3).join(', ') || 'No code detected'}
              </div>
            </div>
          </div>

          {/* Filter Bar & Controls */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              padding: '14px 18px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220, position: 'relative' }}>
              <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 10 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search projects by name, technology, or keywords..."
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Language filter dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Tech Stack:</span>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  background: '#fff',
                  fontSize: 13,
                  color: '#374151',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Languages ({projects.length})</option>
                {languagesList.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>

              {/* Pin toggle filter */}
              <button
                onClick={() => setFilterFeaturedOnly(!filterFeaturedOnly)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: filterFeaturedOnly ? '1px solid #D97706' : '1px solid #D1D5DB',
                  background: filterFeaturedOnly ? '#FEF3C7' : '#fff',
                  color: filterFeaturedOnly ? '#92400E' : '#4B5563',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Pin size={13} fill={filterFeaturedOnly ? '#D97706' : 'none'} />
                {filterFeaturedOnly ? 'Showing Pinned Only' : 'Filter Pinned'}
              </button>
            </div>
          </div>

          {/* Project List / Grid */}
          {filteredProjects.length === 0 ? (
            <div
              style={{
                background: '#fff',
                border: '1px dashed #D1D5DB',
                borderRadius: 12,
                padding: 48,
                textAlign: 'center',
                color: '#6B7280',
              }}
            >
              <Code2 size={40} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#111827', fontWeight: 600 }}>
                {projects.length === 0 ? 'No projects linked yet' : 'No projects match your filter'}
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                {projects.length === 0
                  ? 'Connect your GitHub handle above or add custom projects to showcase your practical engineering portfolio to companies.'
                  : 'Try clearing your search query or language filter.'}
              </p>
              {projects.length === 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                  <button
                    onClick={() => handleSync('octocat')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: '1px solid #D1D5DB',
                      background: '#F9FAFB',
                      color: '#374151',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Try with Demo Account (@octocat)
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#2563EB',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Add Manual Project
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {filteredProjects.map(p => {
                const langColor = LANGUAGE_COLORS[p.language] || '#64748B';
                const isPinned = p.featured;

                return (
                  <div
                    key={p.id}
                    style={{
                      background: '#fff',
                      border: isPinned ? '1.5px solid #F59E0B' : '1px solid #E5E7EB',
                      borderRadius: 10,
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      boxShadow: isPinned ? '0 2px 8px rgba(245, 158, 11, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    {/* Header */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          {p.isGithub ? (
                            <GithubIcon size={18} color="#334155" style={{ flexShrink: 0 }} />
                          ) : (
                            <Code2 size={18} color="#2563EB" style={{ flexShrink: 0 }} />
                          )}
                          <a
                            href={p.link || '#'}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#1E293B',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {p.title}
                          </a>
                        </div>

                        {/* Top action buttons: Pin & Delete */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => handleTogglePin(p.id)}
                            title={isPinned ? 'Pinned for Recruiters (Click to unpin)' : 'Pin project to feature for recruiters'}
                            style={{
                              border: 'none',
                              background: isPinned ? '#FEF3C7' : '#F3F4F6',
                              color: isPinned ? '#D97706' : '#9CA3AF',
                              padding: '4px 8px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            <Pin size={12} fill={isPinned ? '#D97706' : 'none'} />
                            {isPinned ? 'Pinned' : 'Pin'}
                          </button>
                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            title="Remove project from portfolio"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#9CA3AF',
                              padding: 4,
                              cursor: 'pointer',
                              borderRadius: 4,
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          margin: '0 0 12px',
                          fontSize: 13,
                          color: '#475569',
                          lineHeight: 1.45,
                          height: 38,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {p.description || 'Public software repository'}
                      </p>

                      {/* Tech stack tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                        {p.language && p.language !== 'General' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#1E293B',
                              background: '#F1F5F9',
                              padding: '2px 8px',
                              borderRadius: 4,
                            }}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: langColor }} />
                            {p.language}
                          </span>
                        )}
                        {(Array.isArray(p.technologies) ? p.technologies : [])
                          .filter(t => t !== p.language)
                          .slice(0, 4)
                          .map((tech, idx) => (
                            <span
                              key={`${tech}-${idx}`}
                              style={{
                                fontSize: 11,
                                background: '#EFF6FF',
                                color: '#2563EB',
                                padding: '2px 8px',
                                borderRadius: 4,
                              }}
                            >
                              {tech}
                            </span>
                          ))}
                      </div>
                    </div>

                    {/* Card Footer: Metrics & Links */}
                    <div
                      style={{
                        borderTop: '1px solid #F1F5F9',
                        paddingTop: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: '#64748B',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {p.isGithub && (
                          <>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Star size={13} fill={p.stars > 0 ? '#F59E0B' : 'none'} color={p.stars > 0 ? '#F59E0B' : '#94A3B8'} />
                              {p.stars || 0}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <GitFork size={13} color="#94A3B8" />
                              {p.forks || 0}
                            </span>
                          </>
                        )}
                        <span style={{ color: '#94A3B8' }}>{p.year}</span>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {p.demoLink && (
                          <a
                            href={p.demoLink}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              color: '#10B981',
                              fontWeight: 600,
                              textDecoration: 'none',
                              fontSize: 12,
                              background: '#ECFDF5',
                              padding: '3px 8px',
                              borderRadius: 4,
                            }}
                          >
                            <Globe size={12} />
                            Demo
                          </a>
                        )}
                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              color: '#2563EB',
                              fontWeight: 600,
                              textDecoration: 'none',
                              fontSize: 12,
                              background: '#EFF6FF',
                              padding: '3px 8px',
                              borderRadius: 4,
                            }}
                          >
                            <GithubIcon size={12} />
                            Code
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE PORTFOLIO PREVIEW */}
      {activeTab === 'preview' && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 32, maxWidth: 860, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#111827' }}>
                  {student.name}
                </h1>
                <div style={{ fontSize: 14, color: '#4B5563', marginBottom: 8 }}>
                  {student.degree || 'B.Tech'} in {student.branch} • VIT Vellore (Batch {student.batch})
                </div>
              </div>
              <Badge variant="success">Verified Candidate</Badge>
            </div>

            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6B7280', flexWrap: 'wrap' }}>
              <span>CGPA: <strong>{student.cgpa}</strong> / 10.0</span>
              {student.github && (
                <a
                  href={student.github.startsWith('http') ? student.github : `https://github.com/${student.github}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                >
                  <GithubIcon size={14} />
                  GitHub Profile
                </a>
              )}
              {student.linkedin && <span>LinkedIn: {student.linkedin}</span>}
            </div>
          </div>

          {/* Technical Expertise */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
              Technical Expertise ({(student.skills || []).length})
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(student.skills || []).map((sk, idx) => {
                const isHigh = sk.level >= 4;
                const isMid = sk.level === 3;
                return (
                  <span
                    key={`${sk.name}-${idx}`}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: isHigh ? '#ECFDF5' : isMid ? '#EFF6FF' : '#F8FAFC',
                      color: isHigh ? '#065F46' : isMid ? '#1E40AF' : '#334155',
                      border: `1px solid ${isHigh ? '#A7F3D0' : isMid ? '#BFDBFE' : '#E2E8F0'}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{sk.name}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: 8,
                        background: isHigh ? '#10B981' : isMid ? '#3B82F6' : '#94A3B8',
                        color: '#fff',
                      }}
                    >
                      {sk.level === 5 ? 'L5 Exp' : sk.level === 4 ? 'L4 Adv' : sk.level === 3 ? 'L3 Mid' : `L${sk.level}`}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Featured & GitHub Projects */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>
                Verified Projects ({projects.length})
              </h2>
              {currentGithubHandle && (
                <span style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <GithubIcon size={13} />
                  Synced via GitHub @{currentGithubHandle}
                </span>
              )}
            </div>

            {projects.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: 6 }}>
                No projects added yet. Switch to Project Hub to link your GitHub repos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {projects.map(p => (
                  <div
                    key={p.id}
                    style={{
                      border: p.featured ? '1.5px solid #F59E0B' : '1px solid #E5E7EB',
                      borderRadius: 6,
                      padding: 16,
                      background: p.featured ? '#FFFDF5' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginRight: 8 }}>
                          {p.title}
                        </span>
                        {p.featured && (
                          <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4 }}>
                            Featured
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{p.year}</span>
                    </div>

                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#4B5563', lineHeight: 1.45 }}>
                      {p.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(Array.isArray(p.technologies) ? p.technologies : []).map((t, idx) => (
                          <span
                            key={`${t}-${idx}`}
                            style={{ fontSize: 11, background: '#EFF6FF', color: '#1E40AF', padding: '1px 7px', borderRadius: 4 }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {p.isGithub && (
                          <span style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Star size={13} fill="#F59E0B" color="#F59E0B" /> {p.stars || 0}
                          </span>
                        )}
                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 12, color: '#2563EB', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}
                          >
                            <ExternalLink size={12} />
                            Source Code
                          </a>
                        )}
                        {p.demoLink && (
                          <a
                            href={p.demoLink}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 12, color: '#10B981', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}
                          >
                            <Globe size={12} />
                            Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications */}
          {myCerts.length > 0 && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                Accredited Certifications
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {myCerts.map(c => (
                  <div key={c.id} style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{c.issuer}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Issued: {c.issueDate}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Custom Project Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: 24,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                Add Custom Project
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ border: 'none', background: 'none', fontSize: 18, color: '#9CA3AF', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddManualProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={manualProj.title}
                  onChange={e => setManualProj({ ...manualProj, title: e.target.value })}
                  placeholder="e.g. Autonomous Drone Navigation System"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={manualProj.description}
                  onChange={e => setManualProj({ ...manualProj, description: e.target.value })}
                  placeholder="Briefly describe what you built, architecture, and impact..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  Technologies (comma separated)
                </label>
                <input
                  type="text"
                  value={manualProj.technologies}
                  onChange={e => setManualProj({ ...manualProj, technologies: e.target.value })}
                  placeholder="e.g. Python, ROS, OpenCV, TensorFlow"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    GitHub / Code URL
                  </label>
                  <input
                    type="url"
                    value={manualProj.link}
                    onChange={e => setManualProj({ ...manualProj, link: e.target.value })}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    Live Demo URL (optional)
                  </label>
                  <input
                    type="url"
                    value={manualProj.demoLink}
                    onChange={e => setManualProj({ ...manualProj, demoLink: e.target.value })}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  Year
                </label>
                <input
                  type="number"
                  value={manualProj.year}
                  onChange={e => setManualProj({ ...manualProj, year: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
