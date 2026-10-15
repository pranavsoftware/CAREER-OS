import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import Tabs from '../../components/Tabs';
import CodingArena from '../../components/CodingArena';
import { CODING_QUESTIONS } from '../../data/codingQuestions';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getNextDifficulty, computeTestResults } from '../../utils/adaptiveTest';
import { Check, Bot, Sparkles, ArrowRight, Code2, HelpCircle, TrendingUp, BookOpen, Layers, CheckCircle2, Award } from 'lucide-react';

const TOPICS = ['All', 'DSA', 'DBMS', 'OS', 'Networks', 'React', 'Aptitude', 'HR'];

export default function StudentInterviewPrep() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, dispatch } = useData();
  const questionBank = state.questionBank || [];

  const student = state.students.find(s => s.id === user.studentId);
  const myAttempts = state.testAttempts.filter(a => a.studentId === student?.id);

  // Tabs: 'coding' | 'test' | 'bank' | 'tracker'
  const [activeTab, setActiveTab] = useState('coding');

  // Solved coding problems persisted in localStorage
  const [solvedCodingIds, setSolvedCodingIds] = useState([]);
  const [allCodingProblems, setAllCodingProblems] = useState(CODING_QUESTIONS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('career_os_solved_coding');
      if (saved) {
        setSolvedCodingIds(JSON.parse(saved));
      }
      const savedProbs = localStorage.getItem('career_os_generated_problems');
      if (savedProbs) {
        const parsed = JSON.parse(savedProbs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllCodingProblems(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const fresh = parsed.filter(p => !existingIds.has(p.id));
            return [...prev, ...fresh];
          });
        }
      }
    } catch (e) {}
  }, []);

  function handleProblemSolved(problemId) {
    setSolvedCodingIds(prev => {
      if (prev.includes(problemId)) return prev;
      const updated = [...prev, problemId];
      try {
        localStorage.setItem('career_os_solved_coding', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Refresh generated problems list if a new one was added
    try {
      const savedProbs = localStorage.getItem('career_os_generated_problems');
      if (savedProbs) {
        const parsed = JSON.parse(savedProbs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllCodingProblems(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const fresh = parsed.filter(p => !existingIds.has(p.id));
            return [...prev, ...fresh];
          });
        }
      }
    } catch (e) {}
  }

  // Question Bank filter states
  const [bankType, setBankType] = useState('All'); // 'All' | 'coding' | 'mcq'
  const [bankTopic, setBankTopic] = useState('All');
  const [bankDiff, setBankDiff] = useState('All');
  const [expandedQId, setExpandedQId] = useState(null);

  // Mock Test Session state
  const [testTopic, setTestTopic] = useState('All');
  const [testState, setTestState] = useState('idle'); // 'idle' | 'running' | 'results'
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [currentDifficulty, setCurrentDifficulty] = useState('Medium');
  const [testResults, setTestResults] = useState(null);

  // Filtered Question Bank
  const filteredBank = questionBank.filter(q => {
    const matchTopic = bankTopic === 'All' || q.topic === bankTopic;
    const matchDiff = bankDiff === 'All' || q.difficulty === bankDiff;
    return matchTopic && matchDiff;
  });

  const filteredCodingBank = allCodingProblems.filter(q => {
    const matchTopic =
      bankTopic === 'All' ||
      q.topic.toLowerCase().includes(bankTopic.toLowerCase()) ||
      (bankTopic === 'DSA' && (q.topic.includes('Array') || q.topic.includes('String') || q.topic.includes('Stack') || q.topic.includes('Dynamic')));
    const matchDiff = bankDiff === 'All' || q.difficulty === bankDiff;
    return matchTopic && matchDiff;
  });

  const avgScore = myAttempts.length > 0
    ? Math.round(myAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / myAttempts.length)
    : 0;

  const allWeakAreas = Array.from(new Set(myAttempts.flatMap(a => a.weakAreas || [])));

  // Automated Level-Up MCQ Drill Generator
  const [isGeneratingDrill, setIsGeneratingDrill] = useState(false);

  async function handleGenerateWeakAreaDrill(weakTopics = []) {
    setIsGeneratingDrill(true);
    try {
      const res = await fetch('/api/prep/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mcq',
          weakTopics: weakTopics.length > 0 ? weakTopics : allWeakAreas.length > 0 ? allWeakAreas : ['DSA', 'DBMS'],
          targetDifficulty: 'Medium',
          persistToDb: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.questions && data.questions.length > 0) {
        setCurrentQuestions(data.questions);
        setCurrentIndex(0);
        setUserAnswers({});
        setCurrentDifficulty('Medium');
        setTestState('running');
        setTestResults(null);
        setActiveTab('test');
      }
    } catch (err) {
      console.error('Failed to generate drill:', err);
    } finally {
      setIsGeneratingDrill(false);
    }
  }

  // Start adaptive test
  function startTest() {
    // Select pool
    const pool = bankTopic === 'All' ? questionBank : questionBank.filter(q => q.topic === testTopic);
    // Find initial question at Medium
    const initialMedium = pool.filter(q => q.difficulty === 'Medium');
    const firstQ = initialMedium.length > 0
      ? initialMedium[Math.floor(Math.random() * initialMedium.length)]
      : pool[0];

    setCurrentQuestions([firstQ]);
    setCurrentIndex(0);
    setUserAnswers({});
    setCurrentDifficulty('Medium');
    setTestState('running');
    setTestResults(null);
  }

  function handleSelectOption(optIdx) {
    setUserAnswers({ ...userAnswers, [currentIndex]: optIdx });
  }

  function handleNextQuestion() {
    const curQ = currentQuestions[currentIndex];
    const userSelected = userAnswers[currentIndex];
    const isCorrect = userSelected === curQ.correct;

    // Adaptive step: pick next difficulty
    const nextDiff = getNextDifficulty(currentDifficulty, isCorrect);
    setCurrentDifficulty(nextDiff);

    if (currentIndex + 1 >= 10) {
      // Completed test
      finishTest({ ...userAnswers, [currentIndex]: userSelected });
      return;
    }

    // Pick next question matching nextDiff not already asked
    const askedIds = new Set(currentQuestions.map(q => q.id));
    const pool = testTopic === 'All' ? questionBank : questionBank.filter(q => q.topic === testTopic);
    let candidatePool = pool.filter(q => q.difficulty === nextDiff && !askedIds.has(q.id));

    if (candidatePool.length === 0) {
      candidatePool = pool.filter(q => !askedIds.has(q.id));
    }

    if (candidatePool.length === 0) {
      // No more questions available
      finishTest({ ...userAnswers, [currentIndex]: userSelected });
      return;
    }

    const nextQ = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    setCurrentQuestions([...currentQuestions, nextQ]);
    setCurrentIndex(currentIndex + 1);
  }

  function finishTest(finalAnswers) {
    const results = computeTestResults(currentQuestions, finalAnswers);
    setTestResults(results);
    setTestState('results');

    // Save attempt in context
    const attempt = {
      id: `ta_${Date.now()}`,
      studentId: student.id,
      topic: testTopic,
      date: new Date().toISOString().split('T')[0],
      score: results.score,
      total: results.total,
      percentage: results.percentage,
      weakAreas: results.weakAreas,
    };
    dispatch({ type: 'ADD_TEST_ATTEMPT', payload: attempt });
  }

  // Attempt History for chart
  const chartAttempts = myAttempts.map((a, i) => ({
    name: `Test ${i + 1} (${a.topic})`,
    Score: a.percentage,
  }));

  const attemptColumns = [
    { key: 'date', header: 'Date' },
    { key: 'topic', header: 'Topic' },
    {
      key: 'score',
      header: 'Score',
      render: (_, r) => `${r.score} / ${r.total}`,
    },
    {
      key: 'percentage',
      header: 'Accuracy',
      render: v => <Badge variant={v >= 70 ? 'success' : v >= 50 ? 'warning' : 'danger'}>{v}%</Badge>,
    },
    {
      key: 'weakAreas',
      header: 'Identified Weak Areas',
      render: list => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(!list || list.length === 0) ? (
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>None</span>
          ) : (
            list.map(w => <Badge key={w} variant="danger">{w}</Badge>)
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout title="Interview Preparation & Adaptive Mock Test">
      {/* 1-on-1 AI Interview Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #312E81 0%, #4338CA 100%)',
          color: '#fff',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={22} color="#A5B4FC" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Live 1-on-1 AI Technical Interview</span>
              <span style={{ fontSize: 10, fontWeight: 800, background: '#10B981', color: '#fff', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>NEW</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
              Practice voice & text interviews role-by-role with our autonomous AI evaluator. Get instant technical scoring and improvement reports.
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/student/ai-interview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 18px',
            borderRadius: 6,
            border: 'none',
            background: '#fff',
            color: '#312E81',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <span>Launch AI Interview</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Quick Performance & Preparation Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Code2 size={20} color="#4F46E5" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Coding Arena Solved</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
              {solvedCodingIds.length} <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>/ {allCodingProblems.length} Problems</span>
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Avg MCQ Accuracy</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: avgScore >= 70 ? '#059669' : avgScore >= 50 ? '#D97706' : '#DC2626' }}>
              {avgScore}% <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>({myAttempts.length} Tests)</span>
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} color="#D97706" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Question Bank</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
              {questionBank.length + allCodingProblems.length} <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>Items</span>
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: allWeakAreas.length > 0 ? '#FEE2E2' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} color={allWeakAreas.length > 0 ? '#DC2626' : '#6B7280'} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Focus Weak Areas</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: allWeakAreas.length > 0 ? '#DC2626' : '#059669' }}>
              {allWeakAreas.length > 0 ? `${allWeakAreas.length} Identified` : 'Clean Sheet'}
            </div>
          </div>
        </div>
      </div>

      {/* Tab controls */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          tabs={[
            { id: 'coding', label: `Coding Arena (${allCodingProblems.length} Problems)` },
            { id: 'test', label: 'Adaptive Mock Test' },
            { id: 'bank', label: `Question Bank (${questionBank.length + allCodingProblems.length})` },
            { id: 'tracker', label: `Performance & Weak Areas (${myAttempts.length} Tests)` },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* TAB 1: CODING ARENA */}
      {activeTab === 'coding' && (
        <CodingArena
          onProblemSolved={handleProblemSolved}
          solvedIds={solvedCodingIds}
        />
      )}

      {/* TAB 1: MOCK TEST */}
      {activeTab === 'test' && (
        <div>
          {testState === 'idle' && (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 24, maxWidth: 640 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#111827' }}>
                Start Adaptive Practice Session
              </h2>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                Questions adapt to your performance: starts at <strong>Medium</strong> difficulty. Correct answers increase difficulty to <strong>Hard</strong>, while incorrect answers adjust down to <strong>Easy</strong> to target your knowledge baseline.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Choose Subject / Topic:
                </label>
                <select
                  value={testTopic}
                  onChange={e => setTestTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: 13,
                    background: '#fff',
                  }}
                >
                  {TOPICS.map(t => (
                    <option key={t} value={t}>{t === 'All' ? 'All Technical Topics (Mixed)' : t}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>Duration: 10 Questions</span>
                <button
                  onClick={startTest}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563EB',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Start mock test
                </button>
              </div>
            </div>
          )}

          {testState === 'running' && currentQuestions[currentIndex] && (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 24, maxWidth: 720 }}>
              {/* Header: Progress & Difficulty */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    Question {currentIndex + 1} of 10
                  </span>
                  <Badge variant="info">{currentQuestions[currentIndex].topic}</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>Adaptive Level:</span>
                  <Badge variant={currentQuestions[currentIndex].difficulty === 'Hard' ? 'danger' : currentQuestions[currentIndex].difficulty === 'Medium' ? 'warning' : 'success'}>
                    {currentQuestions[currentIndex].difficulty}
                  </Badge>
                </div>
              </div>

              {/* Question Text */}
              <div style={{ fontSize: 15, fontWeight: 500, color: '#111827', marginBottom: 20, lineHeight: 1.5 }}>
                {currentQuestions[currentIndex].question}
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {currentQuestions[currentIndex].options.map((opt, oIdx) => {
                  const isSelected = userAnswers[currentIndex] === oIdx;
                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 6,
                        border: `1px solid ${isSelected ? '#2563EB' : '#E5E7EB'}`,
                        background: isSelected ? '#EFF6FF' : '#fff',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: isSelected ? '#1E40AF' : '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <input
                        type="radio"
                        name={`q_${currentIndex}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(oIdx)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Footer action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setTestState('idle')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#6B7280',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Quit test
                </button>
                <button
                  disabled={userAnswers[currentIndex] === undefined}
                  onClick={handleNextQuestion}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: userAnswers[currentIndex] === undefined ? '#9CA3AF' : '#2563EB',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: userAnswers[currentIndex] === undefined ? 'not-allowed' : 'pointer',
                  }}
                >
                  {currentIndex + 1 >= 10 ? 'Submit test' : 'Next question'}
                </button>
              </div>
            </div>
          )}

          {testState === 'results' && testResults && (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 24, maxWidth: 760 }}>
              <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 16, marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  Test Assessment Report
                </h2>
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  Topic: {testTopic} • Difficulty reached: {testResults.difficultyReached}
                </div>
              </div>

              {/* Score banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Overall Score</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginTop: 4 }}>
                    {testResults.score} / {testResults.total}
                  </div>
                </div>
                <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Accuracy</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: testResults.percentage >= 70 ? '#15803D' : testResults.percentage >= 50 ? '#D97706' : '#DC2626', marginTop: 4 }}>
                    {testResults.percentage}%
                  </div>
                </div>
                <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Adaptive Peak</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#2563EB', marginTop: 4 }}>
                    {testResults.difficultyReached}
                  </div>
                </div>
              </div>

              {/* Per-Topic Accuracy Table */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                  Per-Topic Accuracy Breakdown
                </h3>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4B5563' }}>Topic</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: '#4B5563' }}>Correct / Total</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', color: '#4B5563' }}>Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.topicAccuracy.map(t => (
                        <tr key={t.topic} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 500 }}>{t.topic}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>{t.correct} / {t.total}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <Badge variant={t.accuracy >= 70 ? 'success' : t.accuracy >= 50 ? 'warning' : 'danger'}>
                              {t.accuracy}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Identified Weak Areas */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                  Areas Requiring Immediate Revision (&lt; 60% accuracy)
                </h3>
                {testResults.weakAreas.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#15803D' }}>
                    Great performance! No topics fell below the 60% threshold.
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {testResults.weakAreas.map(w => (
                      <Badge key={w} variant="danger">{w}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Question Review Accordion */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                  Question Review & Explanations
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {currentQuestions.map((q, idx) => {
                    const ans = userAnswers[idx];
                    const isRight = ans === q.correct;
                    return (
                      <div
                        key={q.id}
                        style={{
                          border: '1px solid #E5E7EB',
                          borderRadius: 6,
                          padding: '10px 14px',
                          background: isRight ? '#F0FDF4' : '#FEF2F2',
                          borderLeft: `4px solid ${isRight ? '#16A34A' : '#DC2626'}`,
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                          {idx + 1}. {q.question} ({q.difficulty})
                        </div>
                        <div style={{ color: '#374151', marginBottom: 2 }}>
                          Your answer: <strong>{q.options[ans] || 'Unanswered'}</strong>
                        </div>
                        <div style={{ color: '#15803D', marginBottom: 4 }}>
                          Correct answer: <strong>{q.options[q.correct]}</strong>
                        </div>
                        <div style={{ color: '#6B7280', fontSize: 11, fontStyle: 'italic' }}>
                          Explanation: {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleGenerateWeakAreaDrill(testResults.weakAreas)}
                  disabled={isGeneratingDrill}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isGeneratingDrill ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
                    opacity: isGeneratingDrill ? 0.7 : 1,
                  }}
                >
                  <Zap size={14} color="#FDE047" />
                  <span>{isGeneratingDrill ? 'Generating Level-Up Drills...' : '⚡ Generate Next Level Adaptive Drills'}</span>
                </button>

                <button
                  onClick={() => { setTestState('idle'); startTest(); }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563EB',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Retake mock test
                </button>
                <button
                  onClick={() => { setTestState('idle'); setActiveTab('tracker'); }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#374151',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  View in tracker
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUESTION BANK */}
      {activeTab === 'bank' && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Question Category:</label>
              <select
                value={bankType}
                onChange={e => setBankType(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
              >
                <option value="All">All Formats (Coding + MCQ)</option>
                <option value="coding">Placement Coding Challenges ({CODING_QUESTIONS.length})</option>
                <option value="mcq">MCQ Conceptual ({questionBank.length})</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Topic:</label>
              <select
                value={bankTopic}
                onChange={e => setBankTopic(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
              >
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Difficulty:</label>
              <select
                value={bankDiff}
                onChange={e => setBankDiff(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280' }}>
              Showing {
                (bankType === 'All' ? filteredBank.length + filteredCodingBank.length : bankType === 'coding' ? filteredCodingBank.length : filteredBank.length)
              } question(s)
            </div>
          </div>

          {/* Question List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Coding Problems Sub-section */}
            {(bankType === 'All' || bankType === 'coding') && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Code2 size={16} color="#4F46E5" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                    Placement Coding Challenges ({filteredCodingBank.length})
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredCodingBank.map(cp => {
                    const isSolved = solvedCodingIds.includes(cp.id);
                    return (
                      <div
                        key={cp.id}
                        style={{
                          border: '1px solid #E5E7EB',
                          borderRadius: 8,
                          padding: '14px 16px',
                          background: '#FAFAFA',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '75%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                              {cp.title}
                            </span>
                            <Badge variant={cp.difficulty === 'Hard' ? 'danger' : cp.difficulty === 'Medium' ? 'warning' : 'success'}>
                              {cp.difficulty}
                            </Badge>
                            <Badge variant="info">{cp.topic}</Badge>
                            {isSolved && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981', fontSize: 12, fontWeight: 700 }}>
                                <CheckCircle2 size={14} /> Solved
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.4 }}>
                            {cp.description.slice(0, 160)}...
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: '#6B7280' }}>Companies:</span>
                            {(cp.companies || []).map(c => (
                              <span key={c} style={{ background: '#E5E7EB', color: '#374151', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>
                                {c}
                              </span>
                            ))}
                            <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>
                              Target: {cp.optimalComplexity.time} time, {cp.optimalComplexity.space} space
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveTab('coding')}
                          style={{
                            background: '#4F46E5',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 16px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 1px 3px rgba(79, 70, 229, 0.2)',
                          }}
                        >
                          <Code2 size={14} />
                          <span>Practice in Arena</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MCQ Sub-section */}
            {(bankType === 'All' || bankType === 'mcq') && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: bankType === 'All' ? 14 : 0 }}>
                  <BookOpen size={16} color="#D97706" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                    MCQ Conceptual Questions ({filteredBank.length})
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredBank.map(q => {
                    const isExpanded = expandedQId === q.id;
                    return (
                      <div
                        key={q.id}
                        style={{
                          border: '1px solid #E5E7EB',
                          borderRadius: 6,
                          padding: 12,
                          background: '#fff',
                        }}
                      >
                        <div
                          onClick={() => setExpandedQId(isExpanded ? null : q.id)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{q.question}</span>
                            <Badge variant="info">{q.topic}</Badge>
                            <Badge variant={q.difficulty === 'Hard' ? 'danger' : q.difficulty === 'Medium' ? 'warning' : 'success'}>
                              {q.difficulty}
                            </Badge>
                          </div>
                          <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>{isExpanded ? 'Hide' : 'View Answer'}</span>
                        </div>

                        {isExpanded && (
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F3F4F6', fontSize: 12 }}>
                            <div style={{ marginBottom: 6, fontWeight: 500, color: '#374151' }}>Options:</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                              {q.options.map((opt, i) => (
                                <div
                                  key={i}
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: 4,
                                    background: i === q.correct ? '#DCFCE7' : '#F9FAFB',
                                    border: `1px solid ${i === q.correct ? '#86EFAC' : '#E5E7EB'}`,
                                    color: i === q.correct ? '#166534' : '#4B5563',
                                    fontWeight: i === q.correct ? 600 : 400,
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                    <span>{String.fromCharCode(65 + i)}. {opt}</span>
                                    {i === q.correct && (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#166534', fontWeight: 600 }}>
                                        <Check size={12} strokeWidth={2.5} />
                                        <span>(Correct)</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div style={{ color: '#6B7280', fontStyle: 'italic' }}>
                              Explanation: {q.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: WEAK AREA & PERFORMANCE TRACKER */}
      {activeTab === 'tracker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Coding Problem Mastery & Topic Overview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Code2 size={18} color="#4F46E5" />
                  <span>Placement Coding Readiness</span>
                </h3>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>
                  {solvedCodingIds.length} / {CODING_QUESTIONS.length} Solved
                </span>
              </div>

              <div style={{ width: '100%', height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round((solvedCodingIds.length / Math.max(1, CODING_QUESTIONS.length)) * 100)}%`,
                    background: 'linear-gradient(90deg, #4F46E5 0%, #10B981 100%)',
                    borderRadius: 4,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4B5563' }}>
                <span>Easy: {CODING_QUESTIONS.filter(q => q.difficulty === 'Easy' && solvedCodingIds.includes(q.id)).length} / {CODING_QUESTIONS.filter(q => q.difficulty === 'Easy').length}</span>
                <span>Medium: {CODING_QUESTIONS.filter(q => q.difficulty === 'Medium' && solvedCodingIds.includes(q.id)).length} / {CODING_QUESTIONS.filter(q => q.difficulty === 'Medium').length}</span>
                <span>Hard: {CODING_QUESTIONS.filter(q => q.difficulty === 'Hard' && solvedCodingIds.includes(q.id)).length} / {CODING_QUESTIONS.filter(q => q.difficulty === 'Hard').length}</span>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 18 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} color="#DC2626" />
                <span>Identified Knowledge Gap Remediation</span>
              </h3>

              {allWeakAreas.length === 0 ? (
                <div style={{ fontSize: 13, color: '#059669', lineHeight: 1.5 }}>
                  🎉 No critical weak topics identified yet. Take more adaptive mock tests to detect baseline gaps!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    Topics scoring under 60% accuracy during adaptive evaluation:
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {allWeakAreas.map(w => (
                      <div
                        key={w}
                        style={{
                          background: '#FEE2E2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>{w}</span>
                        <button
                          onClick={() => handleGenerateWeakAreaDrill([w])}
                          disabled={isGeneratingDrill}
                          title="Auto-generates fresh targeted level-up practice questions for this topic"
                          style={{
                            background: '#DC2626',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 4,
                            padding: '2px 8px',
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: isGeneratingDrill ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Zap size={10} color="#FDE047" />
                          <span>Auto-Generate Drill</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recharts Line Chart */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Performance History (% Score Over Time)
            </h2>
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartAttempts} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: '#4B5563' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} />
                  <Line type="monotone" dataKey="Score" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attempts Table */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Attempt Logs
            </h2>
            <DataTable
              columns={attemptColumns}
              rows={myAttempts}
              emptyMessage="No test attempts recorded yet."
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
