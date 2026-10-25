import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { initialStudents } from '../../data/students';

const ROADMAP_STEPS = {
  'Frontend Developer': [
    { id: 'fe_1', phase: 'Phase 1: Core Fundamentals', skill: 'TypeScript', topic: 'Static Typing, Interfaces, Generics in React', weeks: '3 weeks' },
    { id: 'fe_2', phase: 'Phase 2: State Management', skill: 'Redux', topic: 'Redux Toolkit, RTK Query, Global State Architecture', weeks: '2 weeks' },
    { id: 'fe_3', phase: 'Phase 3: Bundling & Performance', skill: 'Webpack/Vite', topic: 'Code splitting, tree-shaking, lazy loading, asset optimization', weeks: '2 weeks' },
    { id: 'fe_4', phase: 'Phase 4: Quality & Testing', skill: 'Testing (Jest)', topic: 'Unit testing components, React Testing Library, mock APIs', weeks: '3 weeks' },
  ],
  'Backend Developer': [
    { id: 'be_1', phase: 'Phase 1: System Design', skill: 'System Design', topic: 'Scalability, Load Balancing, Caching strategies, CAP theorem', weeks: '3 weeks' },
    { id: 'be_2', phase: 'Phase 2: Advanced Caching', skill: 'Redis', topic: 'In-memory caching, pub/sub, session store, rate limiting', weeks: '2 weeks' },
    { id: 'be_3', phase: 'Phase 3: Microservices & Containers', skill: 'Docker', topic: 'Multi-stage builds, Docker compose, volume mounts', weeks: '2 weeks' },
    { id: 'be_4', phase: 'Phase 4: NoSQL Databases', skill: 'MongoDB', topic: 'Document modeling, indexing, aggregation pipelines', weeks: '2 weeks' },
  ],
  'Data Analyst': [
    { id: 'da_1', phase: 'Phase 1: Data Manipulation', skill: 'Pandas', topic: 'Grouping, transformations, merge operations, time series', weeks: '2 weeks' },
    { id: 'da_2', phase: 'Phase 2: BI Dashboards', skill: 'Tableau/Power BI', topic: 'Interactive dashboards, calculated fields, data storytelling', weeks: '3 weeks' },
    { id: 'da_3', phase: 'Phase 3: Applied Statistics', skill: 'Statistics', topic: 'Hypothesis testing, A/B tests, distributions, p-values', weeks: '3 weeks' },
    { id: 'da_4', phase: 'Phase 4: Applied ML', skill: 'Machine Learning', topic: 'Supervised classification, regression, Scikit-learn', weeks: '4 weeks' },
  ],
  'Full Stack Developer': [
    { id: 'fs_1', phase: 'Phase 1: End-to-End API Integration', skill: 'REST APIs', topic: 'API design, authentication (JWT), error handling standards', weeks: '2 weeks' },
    { id: 'fs_2', phase: 'Phase 2: Containerization', skill: 'Docker', topic: 'Containerizing frontend & backend, network linking', weeks: '2 weeks' },
    { id: 'fs_3', phase: 'Phase 3: Database & ORM', skill: 'MongoDB', topic: 'Mongoose ODM, schema design, database indexing', weeks: '2 weeks' },
    { id: 'fs_4', phase: 'Phase 4: Automated Testing', skill: 'Testing', topic: 'Integration tests, end-to-end tests with Cypress/Playwright', weeks: '3 weeks' },
  ],
  'Cloud Engineer': [
    { id: 'ce_1', phase: 'Phase 1: Infrastructure as Code', skill: 'Terraform', topic: 'HCL syntax, state management, provisioning cloud instances', weeks: '3 weeks' },
    { id: 'ce_2', phase: 'Phase 2: Orchestration', skill: 'Kubernetes', topic: 'Pods, deployments, services, ingress controllers', weeks: '4 weeks' },
    { id: 'ce_3', phase: 'Phase 3: Automation & CI/CD', skill: 'CI/CD', topic: 'GitHub Actions, automated test pipelines, image registry push', weeks: '2 weeks' },
    { id: 'ce_4', phase: 'Phase 4: Cloud Networking & Security', skill: 'Networking', topic: 'VPCs, subnets, security groups, SSL/TLS certificates', weeks: '2 weeks' },
  ],
};

export default function StudentSkillGap() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const skillTaxonomy = state.skillTaxonomy || {};
  const roleOptions = state.roleOptions?.length ? state.roleOptions : Object.keys(skillTaxonomy);

  const [selectedRole, setSelectedRole] = useState('Frontend Developer');

  const student = (state.students || []).find(s => s.id === user?.studentId) || (state.students || [])[0] || initialStudents[0];

  // Convert student skills to map: name -> level (1-5)
  const studentSkillMap = {};
  (student.skills || []).forEach(sk => {
    let lvl = 3;
    if (typeof sk.level === 'number') lvl = sk.level;
    else if (sk.level === 'Beginner') lvl = 2;
    else if (sk.level === 'Intermediate') lvl = 3;
    else if (sk.level === 'Advanced') lvl = 4;
    else if (sk.level === 'Expert') lvl = 5;
    studentSkillMap[sk.name.toLowerCase()] = lvl;
  });

  const requiredSkills = skillTaxonomy[selectedRole] || {};

  // Build comparison rows
  const comparisonData = Object.entries(requiredSkills).map(([skill, reqLevel]) => {
    const curLevel = studentSkillMap[skill.toLowerCase()] || 0;
    const gap = Math.max(0, reqLevel - curLevel);
    let status = 'Missing';
    if (curLevel >= reqLevel) status = 'Met';
    else if (curLevel > 0) status = 'Partial';

    return {
      skill,
      reqLevel,
      curLevel,
      gap,
      status,
    };
  });

  // Chart data
  const chartData = comparisonData.map(d => ({
    name: d.skill,
    Required: d.reqLevel,
    Current: d.curLevel,
  }));

  // Roadmap progress
  const roadmapKey = `${student.id}_${selectedRole}`;
  const roleSteps = ROADMAP_STEPS[selectedRole] || [];
  const currentProgress = state.roadmapProgress[roadmapKey] || {};
  const completedCount = roleSteps.filter(st => currentProgress[st.id]).length;
  const progressPct = roleSteps.length > 0 ? Math.round((completedCount / roleSteps.length) * 100) : 0;

  function handleToggleStep(stepId) {
    dispatch({
      type: 'TOGGLE_ROADMAP_STEP',
      payload: { studentId: student.id, role: selectedRole, stepId },
    });
  }

  const columns = [
    { key: 'skill', header: 'Skill' },
    { key: 'reqLevel', header: 'Required Level (1-5)', render: v => `${v} / 5` },
    { key: 'curLevel', header: 'Current Level', render: v => `${v} / 5` },
    { key: 'gap', header: 'Gap', render: v => (v > 0 ? `-${v}` : 'None') },
    {
      key: 'status',
      header: 'Status',
      render: v => (
        <Badge variant={v === 'Met' ? 'success' : v === 'Partial' ? 'warning' : 'danger'}>
          {v}
        </Badge>
      ),
    },
  ];

  return (
    <Layout title="Skill Gap & Learning Roadmap">
      {/* Target role selector bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 6,
          padding: '12px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Target Role:</label>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              fontSize: 13,
              background: '#fff',
              fontWeight: 500,
            }}
          >
            {roleOptions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          Benchmarked against VIT industry hiring taxonomy
        </div>
      </div>

      {/* Grid: Table & Recharts Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, alignItems: 'stretch' }}>
        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
            Skill Matrix: {selectedRole}
          </h2>
          <DataTable
            columns={columns}
            rows={comparisonData}
            emptyMessage="No skill requirements defined."
          />
        </div>

        {/* Recharts Bar Chart */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
            Proficiency Comparison (Required vs Current)
          </h2>
          <div style={{ flex: 1, minHeight: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#4B5563' }} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#4B5563' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Required" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Current" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Learning Roadmap */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
              Actionable Learning Roadmap
            </h2>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              Step-by-step phases to bridge technical gaps for {selectedRole}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2563EB' }}>
              {progressPct}% Completed ({completedCount}/{roleSteps.length})
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: '#2563EB',
              transition: 'width 0.2s ease',
            }}
          />
        </div>

        {/* Roadmap Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roleSteps.map(step => {
            const isDone = !!currentProgress[step.id];
            return (
              <div
                key={step.id}
                onClick={() => handleToggleStep(step.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 6,
                  border: '1px solid #E5E7EB',
                  background: isDone ? '#F9FAFB' : '#fff',
                  cursor: 'pointer',
                  borderLeft: isDone ? '4px solid #16A34A' : '4px solid #D1D5DB',
                }}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => {}} // controlled via container click
                  style={{ marginTop: 3, cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: isDone ? '#4B5563' : '#111827', textDecoration: isDone ? 'line-through' : 'none' }}>
                      {step.phase} ({step.skill})
                    </span>
                    <span style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: 4 }}>
                      {step.weeks}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: isDone ? '#9CA3AF' : '#4B5563' }}>
                    {step.topic}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
