import { useState } from 'react';
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
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { questionBank } from '../../data/questionBank';
import { getNextDifficulty, computeTestResults } from '../../utils/adaptiveTest';

const TOPICS = ['All', 'DSA', 'DBMS', 'OS', 'Networks', 'React', 'Aptitude', 'HR'];

export default function StudentInterviewPrep() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const student = state.students.find(s => s.id === user.studentId);
  const myAttempts = state.testAttempts.filter(a => a.studentId === student?.id);

  // Tabs: 'test' | 'bank' | 'tracker'
  const [activeTab, setActiveTab] = useState('test');

  // Question Bank filter states
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
      {/* Tab controls */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          tabs={[
            { id: 'test', label: 'Adaptive Mock Test' },
            { id: 'bank', label: `Question Bank (${questionBank.length})` },
            { id: 'tracker', label: `Weak Area Tracker (${myAttempts.length} Attempts)` },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

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

              <div style={{ display: 'flex', gap: 10 }}>
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

      {/* TAB 2: QUESTION BANK */}
      {activeTab === 'bank' && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Topic:</label>
              <select
                value={bankTopic}
                onChange={e => setBankTopic(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              >
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Difficulty:</label>
              <select
                value={bankDiff}
                onChange={e => setBankDiff(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280' }}>
              Showing {filteredBank.length} question(s)
            </div>
          </div>

          {/* Question List */}
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
                    <span style={{ fontSize: 12, color: '#2563EB' }}>{isExpanded ? 'Hide' : 'View Answer'}</span>
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
                            {String.fromCharCode(65 + i)}. {opt} {i === q.correct && '✓ (Correct)'}
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

      {/* TAB 3: WEAK AREA TRACKER */}
      {activeTab === 'tracker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
