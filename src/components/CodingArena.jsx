import { useState, useRef, useEffect } from 'react';
import {
  Code2,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Clock,
  Layers,
  Building2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Search,
  Filter,
  Check,
  Zap,
  BookOpen,
} from 'lucide-react';
import { CODING_QUESTIONS } from '../data/codingQuestions';
import Badge from './Badge';

export default function CodingArena({ onProblemSolved, solvedIds = [] }) {
  // Problems catalog list (base questions + auto-generated challenges)
  const [problemsList, setProblemsList] = useState(CODING_QUESTIONS);
  const [selectedProblem, setSelectedProblem] = useState(CODING_QUESTIONS[0]);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [activeLeftTab, setActiveLeftTab] = useState('description'); // 'description' | 'hints' | 'complexity'
  const [activeConsoleTab, setActiveConsoleTab] = useState('cases'); // 'cases' | 'result'
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showProblemList, setShowProblemList] = useState(false);

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [revealedHints, setRevealedHints] = useState({});
  const [fontSize, setFontSize] = useState(13);

  // Automated Level-Up Engine states
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState({
    isOpen: false,
    question: null,
    studentTier: null,
    rationale: '',
  });

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Load any previously generated questions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('career_os_generated_problems');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProblemsList(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const fresh = parsed.filter(p => !existingIds.has(p.id));
            return [...prev, ...fresh];
          });
        }
      }
    } catch (e) {}
  }, []);

  // Synchronize starter template when problem or language changes
  useEffect(() => {
    if (selectedProblem && selectedProblem.starterTemplates) {
      const template = selectedProblem.starterTemplates[language] || '';
      setCode(template);
      setExecutionResult(null);
      setActiveConsoleTab('cases');
      setSelectedCaseIdx(0);
    }
  }, [selectedProblem, language]);

  // Sync line numbers scroll with textarea scroll
  function handleScroll(e) {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  }

  // Handle Tab key indentation inside code editor
  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const indent = '    '; // 4 spaces
      const newCode = code.substring(0, start) + indent + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + indent.length;
      }, 0);
    }
  }

  function handleResetCode() {
    if (confirm('Reset editor to original starter template?')) {
      const template = selectedProblem?.starterTemplates?.[language] || '';
      setCode(template);
      setExecutionResult(null);
    }
  }

  // Get function name for submission
  function getFunctionName() {
    if (!selectedProblem) return '';
    if (language === 'python') {
      const match = selectedProblem.starterTemplates.python.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
      return match ? match[1] : '';
    } else if (language === 'javascript') {
      const match = selectedProblem.starterTemplates.javascript.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
      return match ? match[1] : '';
    }
    return '';
  }

  // Run sample (non-hidden) test cases
  async function handleRunCode() {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);
    setActiveConsoleTab('result');

    const sampleCases = (selectedProblem.testCases || []).filter(tc => !tc.isHidden);

    try {
      const res = await fetch('/api/prep/execute-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          testCases: sampleCases,
          functionName: getFunctionName(),
        }),
      });
      const data = await res.json();
      setExecutionResult({
        ...data,
        isSubmission: false,
      });
    } catch (err) {
      setExecutionResult({
        success: false,
        allPassed: false,
        error: err.message || 'Execution failed',
        results: [],
        isSubmission: false,
      });
    } finally {
      setIsRunning(false);
    }
  }

  // Submit against ALL test cases (including hidden)
  async function handleSubmit() {
    if (isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setActiveConsoleTab('result');

    const allCases = selectedProblem.testCases || [];

    try {
      const res = await fetch('/api/prep/execute-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          testCases: allCases,
          functionName: getFunctionName(),
        }),
      });
      const data = await res.json();
      setExecutionResult({
        ...data,
        isSubmission: true,
      });

      if (data.allPassed) {
        if (onProblemSolved) {
          onProblemSolved(selectedProblem.id);
        }
        // Automatically generate next level-up challenge!
        handleAutoGenerateNext(selectedProblem.id);
      }
    } catch (err) {
      setExecutionResult({
        success: false,
        allPassed: false,
        error: err.message || 'Submission failed',
        results: [],
        isSubmission: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Automated Problem-Solving Level-Up Generator
  async function handleAutoGenerateNext(completedProblemId) {
    if (isGeneratingNext) return;
    setIsGeneratingNext(true);

    try {
      const res = await fetch('/api/prep/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'coding',
          completedProblemId: completedProblemId || selectedProblem.id,
          solvedIds,
        }),
      });
      const data = await res.json();
      if (data.success && data.question) {
        // Append newly generated question to problem catalog
        setProblemsList(prev => {
          if (prev.some(p => p.id === data.question.id || p.title === data.question.title)) {
            return prev;
          }
          const updated = [...prev, data.question];
          try {
            localStorage.setItem(
              'career_os_generated_problems',
              JSON.stringify(updated.filter(p => p.isAutoGenerated))
            );
          } catch (e) {}
          return updated;
        });

        // Trigger Level-Up Modal
        setLevelUpModal({
          isOpen: true,
          question: data.question,
          studentTier: data.studentTier,
          rationale: data.levelUpRationale || data.question.levelUpRationale,
        });
      }
    } catch (err) {
      console.error('Failed to auto-generate next challenge:', err);
    } finally {
      setIsGeneratingNext(false);
    }
  }

  // Filtering problems
  const topicsList = ['All', ...new Set(problemsList.map(q => q.topic))];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const filteredProblems = problemsList.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.companies || []).some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTopic = selectedTopic === 'All' || p.topic === selectedTopic;
    const matchesDiff = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
    return matchesSearch && matchesTopic && matchesDiff;
  });

  const lines = code.split('\n');
  const sampleTestCases = (selectedProblem?.testCases || []).filter(tc => !tc.isHidden);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top Problem Selector Bar */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setShowProblemList(!showProblemList)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <BookOpen size={16} />
            <span>Problem Catalog ({problemsList.length})</span>
            {showProblemList ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
              {selectedProblem.title}
            </span>
            <Badge
              variant={
                selectedProblem.difficulty === 'Easy'
                  ? 'success'
                  : selectedProblem.difficulty === 'Medium'
                  ? 'warning'
                  : 'danger'
              }
            >
              {selectedProblem.difficulty}
            </Badge>
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              • {selectedProblem.topic}
            </span>
            {selectedProblem.isAutoGenerated && (
              <span style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                ⚡ Auto-Generated
              </span>
            )}
            {solvedIds.includes(selectedProblem.id) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981', fontSize: 12, fontWeight: 700 }}>
                <CheckCircle2 size={14} />
                <span>Solved</span>
              </span>
            )}
          </div>
        </div>

        {/* Right side: Level Up button & Company tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => handleAutoGenerateNext(selectedProblem.id)}
            disabled={isGeneratingNext}
            title="Automatically generates next higher-order algorithmic challenge based on your mastery"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: isGeneratingNext ? 'wait' : 'pointer',
              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
              opacity: isGeneratingNext ? 0.7 : 1,
            }}
          >
            <Zap size={14} color="#FDE047" />
            <span>{isGeneratingNext ? 'Generating...' : '⚡ Level Up Problem'}</span>
          </button>

          {/* Company tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Building2 size={12} /> Asked in:
            </span>
            {(selectedProblem.companies || []).slice(0, 3).map(c => (
              <span
                key={c}
                style={{
                  background: '#F3F4F6',
                  color: '#374151',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsible Problem Catalog Drawer / Filter */}
      {showProblemList && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}
        >
          {/* Filters row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                type="text"
                placeholder="Search problem, topic, or company..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Topic:</span>
              <select
                value={selectedTopic}
                onChange={e => setSelectedTopic(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12 }}
              >
                {topicsList.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12 }}
              >
                {difficulties.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Problem Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 10,
              maxHeight: 280,
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {filteredProblems.map(p => {
              const isCurrent = p.id === selectedProblem.id;
              const isSolved = solvedIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProblem(p);
                    setShowProblemList(false);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: isCurrent ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                    background: isCurrent ? '#EEF2FF' : '#F9FAFB',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      {p.title}
                    </span>
                    {isSolved && <CheckCircle2 size={15} color="#10B981" />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Badge
                      variant={
                        p.difficulty === 'Easy'
                          ? 'success'
                          : p.difficulty === 'Medium'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {p.difficulty}
                    </Badge>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{p.topic}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>
                      Acc: {p.acceptanceRate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Coding Workspace: 2-Column Split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 45%) minmax(360px, 55%)',
          gap: 14,
          alignItems: 'stretch',
        }}
      >
        {/* LEFT COLUMN: Problem Specification & Analysis */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            maxHeight: 720,
          }}
        >
          {/* Left Column Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #E5E7EB',
              background: '#F9FAFB',
              padding: '4px 8px 0 8px',
              gap: 4,
            }}
          >
            <button
              onClick={() => setActiveLeftTab('description')}
              style={{
                padding: '8px 14px',
                border: 'none',
                background: activeLeftTab === 'description' ? '#FFFFFF' : 'transparent',
                borderTop: activeLeftTab === 'description' ? '2px solid #4F46E5' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                fontSize: 12,
                fontWeight: 600,
                color: activeLeftTab === 'description' ? '#111827' : '#6B7280',
                cursor: 'pointer',
              }}
            >
              Problem Statement
            </button>
            <button
              onClick={() => setActiveLeftTab('hints')}
              style={{
                padding: '8px 14px',
                border: 'none',
                background: activeLeftTab === 'hints' ? '#FFFFFF' : 'transparent',
                borderTop: activeLeftTab === 'hints' ? '2px solid #4F46E5' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                fontSize: 12,
                fontWeight: 600,
                color: activeLeftTab === 'hints' ? '#111827' : '#6B7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Lightbulb size={13} />
              <span>Hints ({(selectedProblem.hints || []).length})</span>
            </button>
            <button
              onClick={() => setActiveLeftTab('complexity')}
              style={{
                padding: '8px 14px',
                border: 'none',
                background: activeLeftTab === 'complexity' ? '#FFFFFF' : 'transparent',
                borderTop: activeLeftTab === 'complexity' ? '2px solid #4F46E5' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                fontSize: 12,
                fontWeight: 600,
                color: activeLeftTab === 'complexity' ? '#111827' : '#6B7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Zap size={13} />
              <span>Optimal Complexity</span>
            </button>
          </div>

          {/* Left Column Scrollable Body */}
          <div style={{ padding: 18, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeLeftTab === 'description' && (
              <>
                {/* Description */}
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {selectedProblem.description}
                </div>

                {/* Examples */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', textTransform: 'uppercase' }}>
                    Examples:
                  </span>
                  {(selectedProblem.examples || []).map((ex, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: 6,
                        padding: 12,
                        fontSize: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#4B5563' }}>Input: </strong>
                        <span style={{ color: '#111827' }}>{ex.input}</span>
                      </div>
                      <div>
                        <strong style={{ color: '#4B5563' }}>Output: </strong>
                        <span style={{ color: '#059669', fontWeight: 600 }}>{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div style={{ color: '#6B7280', fontFamily: 'inherit', fontSize: 11, marginTop: 2 }}>
                          <strong>Explanation: </strong> {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                {selectedProblem.constraints && selectedProblem.constraints.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', textTransform: 'uppercase' }}>
                      Constraints:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#4B5563', lineHeight: 1.6 }}>
                      {selectedProblem.constraints.map((c, i) => (
                        <li key={i} style={{ fontFamily: 'monospace' }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {activeLeftTab === 'hints' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  Progressive interview hints. Only reveal when you are stuck:
                </div>
                {(selectedProblem.hints || []).map((hint, idx) => {
                  const isRevealed = revealedHints[`${selectedProblem.id}_${idx}`];
                  return (
                    <div
                      key={idx}
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: isRevealed ? '#FEF3C7' : '#F9FAFB',
                      }}
                    >
                      <button
                        onClick={() =>
                          setRevealedHints(prev => ({
                            ...prev,
                            [`${selectedProblem.id}_${idx}`]: !prev[`${selectedProblem.id}_${idx}`],
                          }))
                        }
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#92400E',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Lightbulb size={14} />
                          <span>Hint {idx + 1}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#B45309' }}>
                          {isRevealed ? 'Hide' : 'Reveal'}
                        </span>
                      </button>
                      {isRevealed && (
                        <div style={{ padding: '10px 14px', fontSize: 12, color: '#78350F', lineHeight: 1.5, borderTop: '1px solid #FDE68A' }}>
                          {hint}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeLeftTab === 'complexity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
                  In campus & technical interviews, interviewers evaluate not only whether your code passes tests, but also whether it meets optimal Big-O algorithmic efficiency.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, padding: 12 }}>
                    <div style={{ fontSize: 11, color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>Target Time Complexity</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#065F46', marginTop: 4, fontFamily: 'monospace' }}>
                      {selectedProblem?.optimalComplexity?.time || 'O(n)'}
                    </div>
                  </div>
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: 12 }}>
                    <div style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 600, textTransform: 'uppercase' }}>Target Space Complexity</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', marginTop: 4, fontFamily: 'monospace' }}>
                      {selectedProblem?.optimalComplexity?.space || 'O(1)'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Code Studio & Test Runner */}
        <div
          style={{
            background: '#0F172A',
            border: '1px solid #334155',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            maxHeight: 720,
          }}
        >
          {/* Code Studio Header */}
          <div
            style={{
              background: '#090D16',
              borderBottom: '1px solid #1E293B',
              padding: '8px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {/* Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code2 size={16} color="#38BDF8" />
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{
                  background: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #475569',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="python">Python 3 (Live Execution)</option>
                <option value="javascript">JavaScript / Node.js (Live Execution)</option>
                <option value="cpp">C++ (GCC 6.3 Template)</option>
                <option value="java">Java (Solution Template)</option>
              </select>
            </div>

            {/* Actions: Font Size, Reset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#1E293B', borderRadius: 4, padding: '2px 4px' }}>
                <button
                  onClick={() => setFontSize(prev => Math.max(11, prev - 1))}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 11, cursor: 'pointer', padding: '1px 5px' }}
                >
                  A-
                </button>
                <span style={{ fontSize: 10, color: '#64748B' }}>|</span>
                <button
                  onClick={() => setFontSize(prev => Math.min(18, prev + 1))}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 11, cursor: 'pointer', padding: '1px 5px' }}
                >
                  A+
                </button>
              </div>

              <button
                onClick={handleResetCode}
                title="Reset starter template"
                style={{
                  background: 'transparent',
                  border: '1px solid #334155',
                  color: '#94A3B8',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Editor Body with Line Numbers */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              background: '#0F172A',
              minHeight: 260,
              maxHeight: 340,
              overflow: 'hidden',
            }}
          >
            {/* Line numbers gutter */}
            <div
              ref={lineNumbersRef}
              style={{
                width: 44,
                background: '#0B1120',
                color: '#475569',
                padding: '12px 6px',
                textAlign: 'right',
                userSelect: 'none',
                fontFamily: 'Consolas, "Fira Code", monospace',
                fontSize,
                lineHeight: '20px',
                overflow: 'hidden',
                borderRight: '1px solid #1E293B',
              }}
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              style={{
                flex: 1,
                background: 'transparent',
                color: '#F1F5F9',
                border: 'none',
                padding: '12px 14px',
                fontFamily: 'Consolas, "Fira Code", monospace',
                fontSize,
                lineHeight: '20px',
                resize: 'none',
                outline: 'none',
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                overflowX: 'auto',
                tabSize: 4,
              }}
            />
          </div>

          {/* Editor Controls Bar (Run & Submit) */}
          <div
            style={{
              background: '#090D16',
              borderTop: '1px solid #1E293B',
              borderBottom: '1px solid #1E293B',
              padding: '8px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {/* Console switcher */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setActiveConsoleTab('cases')}
                style={{
                  background: activeConsoleTab === 'cases' ? '#1E293B' : 'transparent',
                  color: activeConsoleTab === 'cases' ? '#38BDF8' : '#94A3B8',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sample Cases
              </button>
              <button
                onClick={() => setActiveConsoleTab('result')}
                style={{
                  background: activeConsoleTab === 'result' ? '#1E293B' : 'transparent',
                  color: activeConsoleTab === 'result' ? '#38BDF8' : '#94A3B8',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Execution Result
                {executionResult && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 9,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: executionResult.allPassed ? '#059669' : '#DC2626',
                      color: '#FFF',
                    }}
                  >
                    {executionResult.allPassed ? 'PASS' : 'FAIL'}
                  </span>
                )}
              </button>
            </div>

            {/* Run & Submit buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                style={{
                  background: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: isRunning ? 'wait' : 'pointer',
                  opacity: isRunning ? 0.7 : 1,
                }}
              >
                <Play size={13} color="#10B981" />
                <span>{isRunning ? 'Running...' : 'Run Code'}</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                <Send size={13} />
                <span>{isSubmitting ? 'Verifying...' : 'Submit Solution'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Console Panel (Sample Cases or Execution Results) */}
          <div
            style={{
              background: '#0B1120',
              padding: 12,
              maxHeight: 220,
              overflowY: 'auto',
              fontFamily: 'Consolas, monospace',
              fontSize: 12,
            }}
          >
            {activeConsoleTab === 'cases' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Case selector pills */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {sampleTestCases.map((tc, idx) => (
                    <button
                      key={tc.id}
                      onClick={() => setSelectedCaseIdx(idx)}
                      style={{
                        background: selectedCaseIdx === idx ? '#334155' : '#1E293B',
                        color: selectedCaseIdx === idx ? '#F8FAFC' : '#94A3B8',
                        border: '1px solid #475569',
                        borderRadius: 4,
                        padding: '3px 10px',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Selected case details */}
                {sampleTestCases[selectedCaseIdx] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#E2E8F0' }}>
                    <div>
                      <span style={{ color: '#64748B' }}>Input: </span>
                      <span style={{ color: '#F1F5F9' }}>{sampleTestCases[selectedCaseIdx].inputDisplay}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Expected Output: </span>
                      <span style={{ color: '#38BDF8' }}>
                        {JSON.stringify(sampleTestCases[selectedCaseIdx].expectedOutput)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeConsoleTab === 'result' && (
              <div>
                {!executionResult ? (
                  <div style={{ color: '#64748B', textAlign: 'center', padding: '16px 0' }}>
                    Click <strong>"Run Code"</strong> to test sample cases or <strong>"Submit Solution"</strong> to verify all test cases.
                  </div>
                ) : executionResult.error && !executionResult.results?.length ? (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: 6, padding: 10, color: '#F87171' }}>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <AlertTriangle size={15} />
                      <span>Compilation / Runtime Error</span>
                    </div>
                    <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap' }}>{executionResult.error}</pre>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Verdict Banner */}
                    <div
                      style={{
                        background: executionResult.allPassed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        border: `1px solid ${executionResult.allPassed ? '#10B981' : '#EF4444'}`,
                        borderRadius: 6,
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {executionResult.allPassed ? (
                          <CheckCircle2 size={18} color="#10B981" />
                        ) : (
                          <XCircle size={18} color="#EF4444" />
                        )}
                        <span style={{ fontWeight: 700, fontSize: 13, color: executionResult.allPassed ? '#34D399' : '#F87171' }}>
                          {executionResult.allPassed
                            ? executionResult.isSubmission
                              ? 'Accepted! All Test Cases Passed 🎉'
                              : 'All Sample Cases Passed!'
                            : 'Wrong Answer / Test Cases Failed'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#94A3B8' }}>
                        <span>
                          Passed: <strong style={{ color: '#F8FAFC' }}>{executionResult.passedTests}</strong> / {executionResult.totalTests}
                        </span>
                        <span>•</span>
                        <span>
                          Time: <strong style={{ color: '#F8FAFC' }}>{executionResult.executionTimeMs}ms</strong>
                        </span>
                      </div>
                    </div>

                    {/* Results per test case */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(executionResult.results || []).map((r, i) => (
                        <div
                          key={r.id || i}
                          style={{
                            background: '#1E293B',
                            borderRadius: 6,
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            borderLeft: `3px solid ${r.passed ? '#10B981' : '#EF4444'}`,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#F1F5F9', fontSize: 11 }}>
                              {r.isHidden ? `Hidden Test ${i + 1}` : `Test Case ${i + 1}`}
                            </span>
                            <span style={{ fontSize: 10, color: r.passed ? '#34D399' : '#F87171', fontWeight: 700 }}>
                              {r.passed ? 'PASSED' : 'FAILED'} ({r.timeMs}ms)
                            </span>
                          </div>

                          {!r.isHidden ? (
                            <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 2, color: '#94A3B8' }}>
                              <div>Input: <span style={{ color: '#CBD5E1' }}>{r.inputDisplay}</span></div>
                              <div>Expected: <span style={{ color: '#38BDF8' }}>{JSON.stringify(r.expected)}</span></div>
                              <div>Actual: <span style={{ color: r.passed ? '#34D399' : '#F87171' }}>{JSON.stringify(r.actual)}</span></div>
                              {r.error && <div style={{ color: '#F87171' }}>Error: {r.error}</div>}
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic' }}>
                              [Hidden Placement Test Case]
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Automated Problem-Solving Level-Up Modal */}
      {levelUpModal.isOpen && levelUpModal.question && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              width: '100%',
              maxWidth: 580,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #312E81 0%, #4338CA 50%, #6366F1 100%)',
                color: '#FFFFFF',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={24} color="#FDE047" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A5B4FC' }}>
                    Algorithmic Mastery Calibrated
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    Level Up Challenge Ready! 🚀
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                {levelUpModal.studentTier?.badge || 'Level Up'}
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>
                You successfully solved and mastered <strong>{selectedProblem.title}</strong>! The automated question engine has analyzed your solution cadence and calibrated your next level-up challenge:
              </div>

              {/* Generated Challenge Card */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                      {levelUpModal.question.title}
                    </span>
                    <Badge
                      variant={
                        levelUpModal.question.difficulty === 'Easy'
                          ? 'success'
                          : levelUpModal.question.difficulty === 'Medium'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {levelUpModal.question.difficulty}
                    </Badge>
                  </div>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                    {levelUpModal.question.topic}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
                  {levelUpModal.question.description.slice(0, 150)}...
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Target Companies:</span>
                  {(levelUpModal.question.companies || []).map(c => (
                    <span
                      key={c}
                      style={{
                        background: '#E2E8F0',
                        color: '#1E293B',
                        borderRadius: 4,
                        padding: '1px 6px',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Level-Up Rationale Box */}
              <div
                style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <Zap size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: '#1E40AF', lineHeight: 1.5 }}>
                  <strong style={{ display: 'block', marginBottom: 2 }}>Why this problem was generated:</strong>
                  {levelUpModal.rationale}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                padding: '14px 24px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <button
                onClick={() => setLevelUpModal(prev => ({ ...prev, isOpen: false }))}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Keep in Catalog
              </button>

              <button
                onClick={() => {
                  setSelectedProblem(levelUpModal.question);
                  setLevelUpModal(prev => ({ ...prev, isOpen: false }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                }}
              >
                <span>Accept Challenge & Code Now</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
