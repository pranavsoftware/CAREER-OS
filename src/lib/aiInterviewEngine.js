// Comprehensive AI Interview Engine & Evaluation Model

export const INTERVIEW_ROLES = [
  {
    id: 'frontend',
    title: 'Frontend / React Developer',
    icon: 'Layout',
    category: 'Engineering',
    level: 'Entry - Mid Level',
    description: 'Focuses on React.js, component architecture, state management, CSS performance, and modern web APIs.',
    coreSkills: ['React.js', 'JavaScript (ES6+)', 'Redux / Zustand', 'HTML/CSS Layouts', 'Web Performance'],
    questions: [
      {
        id: 'fe_q1',
        stage: 'Core Fundamentals',
        type: 'verbal',
        question: 'Can you explain how the Virtual DOM works in React, and how the reconciliation algorithm decides when and what to re-render in the actual DOM?',
        context: 'Spoken round: speak directly to the AI interviewer. AI monitors eye gaze, head position, and tab compliance.',
        requiredKeywords: ['virtual dom', 'reconciliation', 'diffing', 'fiber', 'render', 'keys', 'props', 'state'],
        modelAnswer: 'The Virtual DOM is a lightweight JavaScript object representation of the real DOM. When state or props change, React creates a new Virtual DOM tree and runs a diffing algorithm (Reconciliation / Fiber) comparing it with the previous snapshot. It computes the minimum set of mutations needed (batched updates) and applies them to the real browser DOM. Keys help React identify which items have changed, moved, or deleted in lists without re-rendering the entire list.',
        guidanceTip: 'Speak naturally: cover diffing heuristics, the role of keys, and why batching improves browser performance.'
      },
      {
        id: 'fe_q2',
        stage: 'Technical Deep Dive',
        type: 'verbal',
        question: 'When should you use `useCallback` and `useMemo` hooks, and what are the performance overheads or antipatterns if overused?',
        context: 'Spoken round: articulate memory tradeoffs and referential equality verbally.',
        requiredKeywords: ['usecallback', 'usememo', 'memoization', 'referential equality', 're-render', 'overhead', 'dependency array', 'performance'],
        modelAnswer: '`useMemo` caches the calculated result of an expensive computation, while `useCallback` caches a function reference between renders. They are critical when passing callback functions or complex objects to memoized child components (`React.memo`) to preserve referential equality and avoid unnecessary child re-renders. Overusing them is an antipattern because creating the dependency array, closures, and internal comparison logic adds memory and execution overhead that can be more expensive than cheap re-renders.',
        guidanceTip: 'Mention referential integrity for child components wrapped in React.memo and explain the garbage collection / cache cost.'
      },
      {
        id: 'fe_q3',
        stage: 'Live Technical Coding Challenge',
        type: 'coding',
        language: 'javascript',
        question: 'Coding Challenge: Implement a debounce utility function in JavaScript that prevents rapid-fire API calls on an autocomplete search input.',
        context: 'Live Code Editor: Type your solution below. Clipboard copy-pasting is strictly blocked and camera tracks for secondary device/phone cheating.',
        codeSnippet: `/**
 * Implement a debounce function that delays invoking func
 * until after wait milliseconds have elapsed since the last call.
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to delay
 * @returns {Function}
 */
function debounce(func, wait = 300) {
  let timerId;

  return function(...args) {
    // Write your debounce implementation here:
    
  };
}
`,
        requiredKeywords: ['cleartimeout', 'settimeout', 'timerid', 'args', 'apply', 'return'],
        modelAnswer: 'function debounce(func, wait = 300) {\n  let timerId;\n  return function(...args) {\n    clearTimeout(timerId);\n    timerId = setTimeout(() => {\n      func.apply(this, args);\n    }, wait);\n  };\n}',
        guidanceTip: 'Cancel existing timerId with clearTimeout, and set a new timer using setTimeout.'
      },
      {
        id: 'fe_q4',
        stage: 'Troubleshooting & Web Vitals',
        type: 'verbal',
        question: 'Your web application has a poor Largest Contentful Paint (LCP) and high Cumulative Layout Shift (CLS). What steps and tools would you take to diagnose and resolve these issues?',
        context: 'Spoken round: explain performance profiling tools and remedies.',
        requiredKeywords: ['lcp', 'cls', 'lighthouse', 'devtools', 'dimensions', 'preload', 'font-display', 'aspect-ratio', 'lazy loading'],
        modelAnswer: 'For LCP, I would inspect Chrome DevTools Performance panel and Lighthouse to locate the LCP element (e.g., hero image or banner text). I would optimize it by preloading critical images (`fetchpriority="high"`), using modern formats (WebP/AVIF), compressing assets, and eliminating render-blocking CSS/JS. For CLS, I ensure all images, videos, and ad banners have explicit `width`, `height`, or `aspect-ratio` CSS defined, and reserve layout containers so content does not jump when dynamically loaded. I would also use `font-display: optional` or `swap` with size-adjust to prevent FOIT/FOUT shift.',
        guidanceTip: 'Specify both diagnosis tools (DevTools, Lighthouse) and exact code remedies (fetchpriority, aspect-ratio reservation).'
      },
      {
        id: 'fe_q5',
        stage: 'Behavioral & Engineering Mindset',
        type: 'verbal',
        question: 'Tell me about a time you encountered a stubborn frontend bug or disagreement with a backend engineer regarding API payload formats. How did you resolve it?',
        context: 'Spoken round: articulate your teamwork and problem-solving using the STAR method.',
        requiredKeywords: ['situation', 'task', 'action', 'result', 'backend', 'contract', 'api', 'collaboration', 'solution'],
        modelAnswer: 'In our placement portal project, the backend API returned nested array payloads that required heavy client-side parsing and caused sluggish table rendering. I organized a brief sync with the backend lead, demonstrated the frontend profiling metrics showing DOM blocking, and proposed an OpenAPI / TypeScript contract interface. We agreed to normalize the payload on the server with server-side pagination, which cut page render time by 40% and established a clean API schema standard for future endpoints.',
        guidanceTip: 'Structure your response using STAR: Situation, Task, Action, and measurable Result.'
      }
    ]
  },
  {
    id: 'backend',
    title: 'Backend & Database Engineer',
    icon: 'Database',
    category: 'Engineering',
    level: 'Entry - Mid Level',
    description: 'Covers Node.js/Express, relational database indexing, ACID transactions, caching layers (Redis), and microservice APIs.',
    coreSkills: ['Node.js', 'PostgreSQL / MySQL', 'Redis', 'REST & GraphQL', 'System Design'],
    questions: [
      {
        id: 'be_q1',
        stage: 'Core Fundamentals',
        type: 'verbal',
        question: 'How does the Node.js event loop handle asynchronous I/O despite JavaScript being single-threaded? What is the role of libuv and the worker thread pool?',
        context: 'Spoken round: speak directly with the AI interviewer.',
        requiredKeywords: ['event loop', 'single threaded', 'libuv', 'thread pool', 'call stack', 'microtask', 'macrotask', 'non-blocking'],
        modelAnswer: 'JavaScript executes on a single main thread with one call stack. When an asynchronous operation occurs (like file I/O, DNS lookup, or crypto operations), Node.js offloads the heavy work to the C++ underlying `libuv` library and its internal thread pool (default 4 threads). Network I/O is handled via operating system non-blocking primitives (epoll/kqueue). Once an operation finishes, its callback is placed in the task queue (microtask queue for Promises/process.nextTick, macrotask queue for timers/I/O). The event loop continuously checks if the call stack is empty and executes queued callbacks.',
        guidanceTip: 'Clarify the distinction between the single JS thread and libuv thread pool / OS async primitives.'
      },
      {
        id: 'be_q2',
        stage: 'Database Architecture',
        type: 'verbal',
        question: 'Explain how B-tree indexing in PostgreSQL or MySQL accelerates SELECT queries. When might an index degrade performance instead of improving it?',
        context: 'Spoken round: explain index traversal and write amplification orally.',
        requiredKeywords: ['b-tree', 'index', 'select', 'insert', 'update', 'overhead', 'cardinality', 'write amplification', 'disk i/o'],
        modelAnswer: 'A B-tree index maintains a self-balancing tree structure of key-pointer pairs sorted by the indexed column. Instead of performing a sequential table scan with O(N) disk reads, the database traverses the B-tree in O(log N) operations to directly pinpoint matching table row blocks. However, every INSERT, UPDATE, and DELETE operation must also synchronously update the B-tree index, creating write amplification and extra disk I/O. Indexes also consume RAM/disk storage and are inefficient on low-cardinality columns (like boolean flags) where a table scan is preferred by the query planner.',
        guidanceTip: 'Highlight the logarithmic search benefit versus write amplification and storage tradeoffs.'
      },
      {
        id: 'be_q3',
        stage: 'Live Technical Coding Challenge',
        type: 'coding',
        language: 'javascript',
        question: 'Coding Challenge: Write an in-memory Rate Limiter function in Node.js that restricts a client IP to a maximum number of requests within a sliding time window.',
        context: 'Live Code Editor: Type your solution. Copy-paste is disabled and camera monitors for external phone/device cheating.',
        codeSnippet: `/**
 * In-memory sliding window rate limiter
 * 
 * @param {string} ip - Client IP identifier
 * @param {number} maxRequests - Max requests allowed in window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} true if allowed, false if rate limited
 */
const requestLogs = new Map();

function isAllowed(ip, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  // Write rate limiting logic here:
  
}
`,
        requiredKeywords: ['filter', 'timestamp', 'now', 'length', 'push', 'map', 'windowms'],
        modelAnswer: 'function isAllowed(ip, maxRequests = 5, windowMs = 60000) {\n  const now = Date.now();\n  const timestamps = (requestLogs.get(ip) || []).filter(t => now - t < windowMs);\n  if (timestamps.length >= maxRequests) {\n    return false;\n  }\n  timestamps.push(now);\n  requestLogs.set(ip, timestamps);\n  return true;\n}',
        guidanceTip: 'Filter timestamps by windowMs, compare length to maxRequests, and update requestLogs.'
      },
      {
        id: 'be_q4',
        stage: 'Security & API Design',
        type: 'verbal',
        question: 'Walk me through how you would secure a RESTful API against common attacks: SQL Injection, Broken Object Level Authorization (BOLA), and Rate Limit abuse.',
        context: 'Spoken round: articulate OWASP Top 10 countermeasures.',
        requiredKeywords: ['parameterized', 'sql injection', 'bola', 'authorization', 'jwt', 'rate limit', 'token bucket', 'role based'],
        modelAnswer: 'For SQL Injection, I enforce parameterized queries and prepared statements using modern ORMs or database drivers, never concatenating user input into raw SQL strings. For BOLA (IDOR), authentication alone is not enough; every endpoint verifies that the authenticated user (`req.user.id`) possesses explicit ownership or role permission to access the requested resource ID. For rate limiting, I implement IP and token-based rate limiters using Redis with sliding window or token-bucket algorithms (e.g. max 100 requests per minute) to prevent brute-force attacks and Denial of Service.',
        guidanceTip: 'Distinguish between Authentication and Authorization (BOLA) and mention parameterized queries.'
      },
      {
        id: 'be_q5',
        stage: 'Behavioral & Project Delivery',
        type: 'verbal',
        question: 'Describe a situation where a production service or database experienced high latency or a crash. How did you troubleshoot it under pressure, and what post-mortem action did you take?',
        context: 'Spoken round: deliver your STAR response directly to the HR interviewer.',
        requiredKeywords: ['situation', 'task', 'action', 'result', 'logs', 'latency', 'root cause', 'post-mortem', 'monitoring'],
        modelAnswer: 'During a university mock placement drive, our API response time spiked from 120ms to over 6 seconds due to connection pool exhaustion on PostgreSQL. In the heat of the moment, I inspected the active connection logs via `pg_stat_activity` and discovered a long-running unindexed query locking candidate records. I terminated the hung queries, increased the pool limit, and hot-deployed an index on `student_id`. As a permanent post-mortem action, I set up Prometheus latency alerts, configured query timeouts of 3 seconds, and added connection pooling via PgBouncer.',
        guidanceTip: 'Use STAR: identify the bottleneck, explain how you isolated root cause, and mention preventive measures.'
      }
    ]
  },
  {
    id: 'fullstack',
    title: 'Full Stack Developer',
    icon: 'Layers',
    category: 'Engineering',
    level: 'Entry - Mid Level',
    description: 'Encompasses client and server design, database modeling, authentication, state synchronization, and CI/CD pipelines.',
    coreSkills: ['React', 'Node.js', 'PostgreSQL', 'REST / GraphQL', 'Docker & CI/CD'],
    questions: [
      {
        id: 'fs_q1',
        stage: 'Core Architecture',
        type: 'verbal',
        question: 'How do you design an authentication and authorization workflow for a web application using JWT and Refresh Tokens? Where do you store them securely on the client?',
        context: 'Spoken round: speak directly with the AI interviewer about token security.',
        requiredKeywords: ['jwt', 'access token', 'refresh token', 'httponly', 'cookie', 'xss', 'csrf', 'expiration', 'rotation'],
        modelAnswer: 'I use short-lived Access Tokens (e.g. 15 minutes) and long-lived Refresh Tokens (e.g. 7 days). On the client, the Refresh Token is stored inside an `HttpOnly`, `Secure`, `SameSite=Strict` cookie, which prevents JavaScript access and protects against XSS attacks. The Access Token can be stored in browser memory. When the access token expires, a silent POST request to `/api/auth/refresh` uses the cookie to issue a new access token with Refresh Token Rotation to detect token theft.',
        guidanceTip: 'Emphasize HttpOnly Secure cookies to prevent XSS and explain token rotation.'
      },
      {
        id: 'fs_q2',
        stage: 'Data Modeling & Sync',
        type: 'verbal',
        question: 'Suppose you are building a real-time collaborative document or live test portal where multiple users update state simultaneously. How do you maintain data consistency between client and server?',
        context: 'Spoken round: articulate real-time synchronization, optimistic updates, and conflict resolution.',
        requiredKeywords: ['websocket', 'optimistic update', 'conflict resolution', 'versioning', 'timestamp', 'rollback', 'eventual consistency'],
        modelAnswer: 'I use WebSockets (or SSE) for low-latency bidirectional communication. On the client, I apply Optimistic UI updates so user interactions feel instantaneous. Each update carries a version number or monotonic timestamp. If the server detects a version conflict or validation failure, it broadcasts a rollback event to the client with the reconciled authoritative state. For document collaboration, algorithms like Operational Transformation (OT) or CRDTs ensure convergent eventual consistency across all distributed clients.',
        guidanceTip: 'Cover Optimistic UI updates, server authority, and how rollback/conflict resolution is handled.'
      },
      {
        id: 'fs_q3',
        stage: 'Live Technical Coding Challenge',
        type: 'coding',
        language: 'javascript',
        question: 'Coding Challenge: Write an Express.js JWT authentication middleware function authenticateToken(req, res, next) that extracts the Bearer token from the Authorization header and verifies it.',
        context: 'Live Code Editor: Type your solution below. Clipboard pasting is strictly blocked and camera tracks for secondary device/phone cheating.',
        codeSnippet: `/**
 * Express JWT Authentication Middleware
 * Validates Authorization: Bearer <token>
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next handler
 */
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'career_os_secret_2026';

function authenticateToken(req, res, next) {
  // Extract auth header and verify token:
  
}
`,
        requiredKeywords: ['headers', 'authorization', 'bearer', 'split', 'jwt.verify', 'user', 'next', 'status', '401', '403'],
        modelAnswer: 'function authenticateToken(req, res, next) {\n  const authHeader = req.headers[\'authorization\'];\n  const token = authHeader && authHeader.split(\' \')[1];\n  if (!token) return res.status(401).json({ error: \'Access token required\' });\n  jwt.verify(token, JWT_SECRET, (err, user) => {\n    if (err) return res.status(403).json({ error: \'Invalid or expired token\' });\n    req.user = user;\n    next();\n  });\n}',
        guidanceTip: 'Check req.headers[\'authorization\'], split Bearer token, return 401 if missing, verify with jwt.verify, and call next().'
      },
      {
        id: 'fs_q4',
        stage: 'DevOps & Deployment',
        type: 'verbal',
        question: 'Walk through your CI/CD pipeline from a Git pull request to production deployment on cloud infrastructure (e.g., Docker, AWS/Vercel). What automated checks occur?',
        context: 'Spoken round: describe CI/CD stages and quality gates orally.',
        requiredKeywords: ['ci/cd', 'github actions', 'lint', 'unit test', 'docker', 'build', 'staging', 'production', 'rollback'],
        modelAnswer: 'On every Pull Request, GitHub Actions triggers an automated CI pipeline: 1. Code linting and formatting (oxlint/eslint/prettier). 2. Type checking (`tsc --noEmit`). 3. Running automated unit and integration tests. 4. Building the production bundle. Once merged to main, the CD pipeline builds a multi-stage Docker image, tags it with the commit SHA, pushes to an image registry, and deploys to staging for smoke testing before promoting to production with health checks and automated rollback if error rates spike.',
        guidanceTip: 'Detail the stages: Lint -> Test -> Build Docker -> Staging -> Health Check -> Production.'
      },
      {
        id: 'fs_q5',
        stage: 'Behavioral & Leadership',
        type: 'verbal',
        question: 'Tell me about a complex full-stack feature you built from scratch. What technical trade-off did you make to meet a deadline, and what would you improve with more time?',
        context: 'Spoken round: STAR narrative assessing engineering ownership and trade-off analysis.',
        requiredKeywords: ['situation', 'task', 'action', 'result', 'trade-off', 'technical debt', 'feature', 'priority'],
        modelAnswer: 'In our placement analytics dashboard, we needed to deliver real-time applicant parsing within two weeks. To meet the deadline, I opted for client-side CSV parsing and simple polling instead of standing up a complex WebSocket microservice. This allowed us to launch on time for 500+ candidates without infrastructure risk. However, it placed higher memory load on the client browser for files over 10MB. As planned technical debt reduction, I later migrated file parsing to a background worker queue with Webhook callbacks.',
        guidanceTip: 'Use STAR: be transparent about the intentional tradeoff and how you planned to resolve technical debt.'
      }
    ]
  },
  {
    id: 'data_analyst',
    title: 'Data Analyst & BI Specialist',
    icon: 'BarChart3',
    category: 'Analytics',
    level: 'Entry - Mid Level',
    description: 'Specializes in SQL window functions, exploratory data analysis, KPI visualization, business storytelling, and data cleansing.',
    coreSkills: ['SQL (Postgres/BigQuery)', 'Python (Pandas)', 'Power BI / Tableau', 'Statistics', 'Data Storytelling'],
    questions: [
      {
        id: 'da_q1',
        stage: 'Live Technical SQL Challenge',
        type: 'coding',
        language: 'sql',
        question: 'Coding Challenge: Write a SQL query using DENSE_RANK() to retrieve the top 3 highest student placement packages per department from the placements table.',
        context: 'Live Code Editor: Type your SQL query. Copy-paste is disabled and camera observes for mobile phone cheating.',
        codeSnippet: `-- Retrieve the top 3 highest placement packages per department
-- Table schema: placements (student_id, student_name, department, salary_lpa)

WITH RankedPlacements AS (
  SELECT 
    student_id,
    student_name,
    department,
    salary_lpa,
    -- Apply DENSE_RANK() window function here:
    
  FROM placements
)
SELECT 
  department,
  student_name,
  salary_lpa,
  dept_rank
FROM RankedPlacements
-- Filter to retain top 3 ranks per department:
;
`,
        requiredKeywords: ['dense_rank()', 'over', 'partition by', 'department', 'order by', 'salary_lpa desc', 'dept_rank <= 3'],
        modelAnswer: 'WITH RankedPlacements AS (\n  SELECT \n    student_id,\n    student_name,\n    department,\n    salary_lpa,\n    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary_lpa DESC) AS dept_rank\n  FROM placements\n)\nSELECT department, student_name, salary_lpa, dept_rank\nFROM RankedPlacements\nWHERE dept_rank <= 3\nORDER BY department, dept_rank;',
        guidanceTip: 'Use DENSE_RANK() OVER (PARTITION BY department ORDER BY salary_lpa DESC) and filter WHERE dept_rank <= 3 in the outer query.'
      },
      {
        id: 'da_q2',
        stage: 'Data Cleaning & Wrangling',
        type: 'verbal',
        question: 'How do you handle missing values, duplicate records, and outliers in a messy dataset before presenting analytics to company leadership?',
        context: 'Spoken round: speak directly with the AI interviewer about data hygiene and statistical validity.',
        requiredKeywords: ['missing', 'imputation', 'outliers', 'iqr', 'median', 'duplicates', 'data quality', 'bias'],
        modelAnswer: 'First, I identify why data is missing (MCAR, MAR, or MNAR). For categorical features, I investigate data entry pipelines or assign an "Unknown" bucket. For numerical values, I assess distribution skewness: using median imputation for skewed data and mean for normal distributions, or dropping records if missingness represents unrecoverable corruption. For duplicates, I verify primary composite keys. For outliers, I use IQR (interquartile range) or Z-scores, consulting domain experts to determine whether an outlier is a data logging error or a genuine high-value transaction.',
        guidanceTip: 'Mention assessing whether data is skewed (mean vs median) and using IQR or Z-score for outlier analysis.'
      },
      {
        id: 'da_q3',
        stage: 'Metrics & Business Sense',
        type: 'verbal',
        question: 'If a company reports a 20% increase in monthly active users (MAU) but revenue drops by 8%, how would you investigate and pinpoint the root cause?',
        context: 'Spoken round: articulate cohort decomposition and metric equations orally.',
        requiredKeywords: ['cohort', 'segmentation', 'arpu', 'churn', 'conversion', 'funnel', 'root cause', 'monetization'],
        modelAnswer: 'This discrepancy indicates that user expansion is not translating to monetization. I would segment the data across multiple dimensions: 1. User Cohorts & Geography: Did a low-paying or free tier marketing campaign surge users with low Average Revenue Per User (ARPU)? 2. Funnel Conversion: Are new users hitting the paywall or dropping off before checkout? 3. Churn of High-Value Accounts: Did enterprise or power users churn while free users surged? 4. Product or Pricing Changes: Did discounting or currency shifts depress top-line revenue? Decomposing revenue into `Active Users × Conversion Rate × ARPU` isolates the exact leaking component.',
        guidanceTip: 'Decompose the metric equation: Revenue = Active Users * Conversion * ARPU, and segment by cohorts.'
      },
      {
        id: 'da_q4',
        stage: 'Dashboard & Communication',
        type: 'verbal',
        question: 'What principles do you follow when designing an executive dashboard in Power BI or Tableau to ensure leaders make decisions without cognitive overload?',
        context: 'Spoken round: explain visual hierarchy and color semantics.',
        requiredKeywords: ['executive', 'kpi', 'visual hierarchy', 'actionable', 'cognitive overload', 'drill-down', 'color palette'],
        modelAnswer: 'I follow the "5-second rule" and visual hierarchy: 1. Place the 3-4 primary high-level KPIs (Total Revenue, Growth Rate, Conversion) boldly at the top left where executive eyes land first. 2. Use muted, intentional color palettes (reserving high-contrast red/green strictly for alert thresholds or target achievements). 3. Provide secondary trend charts with context (period-over-period comparisons rather than raw numbers). 4. Enable interactive drill-downs and filters for users who need granular operational diagnostics without cluttering the main executive summary.',
        guidanceTip: 'Highlight the 5-second rule, intentional color semantics, and top-level KPI hierarchy.'
      },
      {
        id: 'da_q5',
        stage: 'Behavioral & Stakeholder Management',
        type: 'verbal',
        question: 'Tell me about a time when your data analysis contradicted a senior manager’s intuition. How did you present your findings and manage the pushback?',
        context: 'Spoken round: deliver your STAR response directly to the HR interviewer.',
        requiredKeywords: ['situation', 'task', 'action', 'result', 'data', 'stakeholder', 'pushback', 'objective', 'trust'],
        modelAnswer: 'In our department placement forecasting, leadership believed opening applications to all branches equally would increase total offers. My cohort analysis showed it actually led to recruiter fatigue and dropped interview attendance by 25%. Instead of being confrontational, I invited the manager to walk through the raw conversion funnel together, framed the data around our shared objective (maximizing total placements), and suggested an A/B pilot in two branches. The pilot verified the hypothesis and leadership adopted our eligibility filter, boosting final offers by 18%.',
        guidanceTip: 'Use STAR: frame findings around shared business goals, maintain empathy, and offer an A/B test solution.'
      }
    ]
  },
  {
    id: 'ai_ml',
    title: 'Machine Learning & AI Engineer',
    icon: 'BrainCircuit',
    category: 'AI / Data Science',
    level: 'Entry - Mid Level',
    description: 'Encompasses model selection, training pipelines, evaluation metrics, transformers, LLM prompt engineering/RAG, and MLOps.',
    coreSkills: ['Python', 'PyTorch / TensorFlow', 'Scikit-learn', 'LLMs & RAG', 'MLOps & Inference'],
    questions: [
      {
        id: 'ml_q1',
        stage: 'Live Technical Python Challenge',
        type: 'coding',
        language: 'python',
        question: 'Coding Challenge: Write a Python function compute_classification_metrics(y_true, y_pred) that calculates Precision, Recall, and F1-Score from scratch without importing scikit-learn.',
        context: 'Live Code Editor: Type your solution. Copy-paste is disabled and camera monitors for external phone/device cheating.',
        codeSnippet: `def compute_classification_metrics(y_true, y_pred):
    """
    Computes precision, recall, and f1_score from binary 0/1 lists.
    
    :param y_true: List of ground-truth binary labels (e.g. [1, 0, 1, 1])
    :param y_pred: List of predicted binary labels (e.g. [1, 0, 0, 1])
    :return: dict with keys 'precision', 'recall', 'f1_score'
    """
    tp, fp, fn = 0, 0, 0
    
    # Calculate TP, FP, FN counts:
    for true, pred in zip(y_true, y_pred):
        if true == 1 and pred == 1:
            tp += 1
        elif true == 0 and pred == 1:
            fp += 1
        elif true == 1 and pred == 0:
            fn += 1
            
    # Calculate metrics with zero-division safeguards:
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1_score = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    
    return {
        'precision': round(precision, 4),
        'recall': round(recall, 4),
        'f1_score': round(f1_score, 4)
    }
`,
        requiredKeywords: ['tp', 'fp', 'fn', 'zip', 'precision', 'recall', 'f1_score'],
        modelAnswer: 'def compute_classification_metrics(y_true, y_pred):\n    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)\n    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)\n    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)\n    prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0\n    rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0\n    f1 = 2 * (prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0\n    return {\'precision\': prec, \'recall\': rec, \'f1_score\': f1}',
        guidanceTip: 'Count True Positives, False Positives, False Negatives and apply precision=TP/(TP+FP), recall=TP/(TP+FN), F1=2*(P*R)/(P+R).'
      },
      {
        id: 'ml_q2',
        stage: 'LLM & Generative AI',
        type: 'verbal',
        question: 'Explain the architecture and workflow of Retrieval-Augmented Generation (RAG). How does chunking strategy and vector similarity search impact answer hallucination?',
        context: 'Spoken round: speak directly with the AI interviewer about RAG architectures.',
        requiredKeywords: ['rag', 'retrieval', 'embeddings', 'vector database', 'chunking', 'cosine similarity', 'hallucination', 'context window'],
        modelAnswer: 'RAG augments an LLM with external domain knowledge to prevent hallucinations. The workflow: 1. Ingestion: Documents are segmented into chunks with overlap, converted into dense numerical vectors via an embedding model, and indexed in a vector database. 2. Retrieval: When a user query arrives, it is embedded, and top-K semantically similar chunks are retrieved using cosine similarity or HNSW indexing. 3. Generation: Retrieved chunks are injected into the prompt as verified grounding context. Chunking size is critical: chunks too small lose contextual meaning, while chunks too large dilute relevance and overflow context windows, causing hallucinations.',
        guidanceTip: 'Walk through: Ingestion -> Embedding -> Vector Search -> Context Injection -> LLM Generation.'
      },
      {
        id: 'ml_q3',
        stage: 'Deep Learning & Transformers',
        type: 'verbal',
        question: 'What is the role of the Self-Attention mechanism in Transformer models compared to traditional RNNs/LSTMs? Why does self-attention scale better?',
        context: 'Spoken round: explain parallel execution and Query-Key-Value interactions.',
        requiredKeywords: ['self-attention', 'transformer', 'rnn', 'lstm', 'parallel', 'query', 'key', 'value', 'vanishing gradient'],
        modelAnswer: 'Traditional RNNs and LSTMs process sequences sequentially step-by-step, creating an O(N) dependency chain that prevents hardware parallelization on GPUs and suffers from vanishing gradients over long horizons. Self-Attention computes relationships between all pairs of tokens in parallel using Query, Key, and Value matrix multiplications (`Softmax(QK^T / sqrt(d_k)) * V`). This captures long-range dependencies in O(1) sequential operations, allowing modern LLMs to scale training efficiently across massive GPU clusters.',
        guidanceTip: 'Highlight sequential vs parallel processing on GPUs and Query-Key-Value matrix formulation.'
      },
      {
        id: 'ml_q4',
        stage: 'MLOps & Deployment',
        type: 'verbal',
        question: 'How do you monitor a machine learning model deployed in production for Data Drift and Concept Drift, and what automated actions should be triggered?',
        context: 'Spoken round: distinguish data drift vs concept drift and remediation.',
        requiredKeywords: ['data drift', 'concept drift', 'distribution', 'ks test', 'retraining', 'ground truth', 'monitoring', 'baseline'],
        modelAnswer: 'Data Drift occurs when the input feature distribution changes ($P(X)$ shifts) compared to training data (detected via statistical tests like Kolmogorov-Smirnov, Population Stability Index, or Wasserstein distance). Concept Drift occurs when the statistical relationship between inputs and ground-truth targets changes ($P(Y|X)$ shifts). In production, I monitor feature distributions against a baseline training distribution using tools like Evidently or Prometheus. When drift exceeds a threshold, the system triggers alerts, logs anomalous inputs, and initiates automated shadow model validation or pipeline retraining with recent data.',
        guidanceTip: 'Distinguish clearly between Data Drift (P(X)) and Concept Drift (P(Y|X)).'
      },
      {
        id: 'ml_q5',
        stage: 'Behavioral & Ethical AI',
        type: 'verbal',
        question: 'Tell me about a project where your machine learning model exhibited unintended bias or poor edge-case performance. How did you diagnose and remediate it?',
        context: 'Spoken round: deliver your STAR response directly to the HR interviewer.',
        requiredKeywords: ['situation', 'task', 'action', 'result', 'bias', 'fairness', 'dataset', 'mitigation', 'evaluation'],
        modelAnswer: 'In our student placement predictor, we discovered the model assigned lower interview probability to candidates from non-metro colleges despite identical test scores and CGPA, due to historical sampling bias in previous years\' placement records. I audited the training distribution, identified the feature correlation, and applied demographic parity constraints. I augmented underrepresented groups using balanced synthetic sampling and removed proxy geographical features, achieving fairness parity across all colleges while retaining 91% overall precision.',
        guidanceTip: 'Use STAR: acknowledge the bias candidly, explain how you audited data, and show the concrete mitigation.'
      }
    ]
  }
];

// Evaluation logic simulating a senior staff technical interviewer
export function evaluateAnswer({ roleId, questionId, studentAnswer }) {
  const role = INTERVIEW_ROLES.find(r => r.id === roleId) || INTERVIEW_ROLES[0];
  const question = role.questions.find(q => q.id === questionId) || role.questions[0];

  const answer = (studentAnswer || '').trim();
  const lowerAnswer = answer.toLowerCase();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  // ChatGPT & External LLM Signature Detection Heuristics
  const gptPhrases = [
    'certainly',
    'in summary',
    'in conclusion',
    'it is important to note',
    'it is crucial to note',
    'delve into',
    'furthermore,',
    'moreover,',
    'plays a pivotal role',
    'here is an explanation',
    'let\'s break down',
    'by understanding these principles',
    'in essence,'
  ];
  const detectedGptPhrases = gptPhrases.filter(p => lowerAnswer.includes(p));
  const hasNumberedListPattern = /(?:^|\n)\s*(?:\d+\.|\*|-)\s+\*\*[A-Z]/.test(answer) || (answer.match(/\b(firstly|secondly|thirdly)\b/gi) || []).length >= 2;
  const isSuspectedAiGenerated = (detectedGptPhrases.length >= 2) || (detectedGptPhrases.length >= 1 && hasNumberedListPattern);

  // 1. CODING CHALLENGE EVALUATION PATH
  if (question.type === 'coding') {
    if (wordCount < 4 || answer.length < 20) {
      return {
        score: 25,
        technicalAccuracy: 25,
        communicationClarity: 30,
        completeness: 20,
        isPassing: false,
        isCodingRound: true,
        feedback: 'Incomplete code submission. Please implement the requested function logic and handle key parameters.',
        strengths: ['Code editor opened.'],
        improvements: [
          'Complete function body and declare required variables.',
          'Ensure timers or condition checks are properly structured.',
          'Verify edge cases (e.g. invalid inputs or multiple calls).'
        ],
        matchedKeywords: [],
        missingKeywords: question.requiredKeywords.slice(0, 3),
        modelAnswer: question.modelAnswer
      };
    }

    const matchedKeywords = question.requiredKeywords.filter(kw => lowerAnswer.includes(kw));
    const missingKeywords = question.requiredKeywords.filter(kw => !lowerAnswer.includes(kw));
    const matchRatio = matchedKeywords.length / question.requiredKeywords.length;

    let technicalAccuracy = Math.round(50 + matchRatio * 45);
    if (lowerAnswer.includes('return')) technicalAccuracy = Math.min(100, technicalAccuracy + 5);

    const communicationClarity = 85; // Code readability
    const completeness = Math.round(technicalAccuracy * 0.7 + communicationClarity * 0.3);
    const overallScore = Math.round(technicalAccuracy * 0.6 + completeness * 0.4);

    const strengths = [];
    if (matchedKeywords.length >= 3) {
      strengths.push(`Utilized required mechanisms: ${matchedKeywords.slice(0, 3).join(', ')}.`);
    }
    strengths.push('Clean manual code composition without illegal clipboard pasting.');

    const improvements = [];
    if (missingKeywords.length > 0) {
      improvements.push(`Enhance code structure with: ${missingKeywords.slice(0, 2).join(', ')}.`);
    }
    improvements.push('Consider edge cases like rapid re-invocations and memory cleanup.');

    let feedback = '';
    if (overallScore >= 80) {
      feedback = 'Outstanding implementation! Your code is logically sound, well-structured, and fulfills the performance requirements of the challenge.';
    } else if (overallScore >= 65) {
      feedback = 'Good attempt. The core logic is present, though refining edge-case handling and function scoping will make it production-ready.';
    } else {
      feedback = 'Partial solution. Make sure to complete the function body and return the expected handler or result.';
    }

    return {
      score: overallScore,
      technicalAccuracy,
      communicationClarity,
      completeness,
      isPassing: overallScore >= 60,
      isCodingRound: true,
      feedback,
      strengths,
      improvements,
      matchedKeywords,
      missingKeywords,
      modelAnswer: question.modelAnswer
    };
  }

  // 2. SPOKEN / VERBAL CONVERSATION EVALUATION PATH
  if (wordCount < 10) {
    return {
      score: 30,
      technicalAccuracy: 30,
      communicationClarity: 35,
      completeness: 25,
      isPassing: false,
      feedback: 'Your verbal response was very brief. In technical interviews, provide concrete explanations, mention core architectural components, and illustrate with examples.',
      strengths: ['Addressed the topic directly.'],
      improvements: [
        'Elaborate verbally with deeper technical detail and specific terminology.',
        'Walk through internal mechanisms or system steps.',
        'Use the STAR structure (Situation, Task, Action, Result) where applicable.'
      ],
      matchedKeywords: [],
      missingKeywords: question.requiredKeywords.slice(0, 4)
    };
  }

  // Check required keyword matches
  const matchedKeywords = question.requiredKeywords.filter(kw => lowerAnswer.includes(kw));
  const missingKeywords = question.requiredKeywords.filter(kw => !lowerAnswer.includes(kw));
  const matchRatio = matchedKeywords.length / question.requiredKeywords.length;

  // Technical Accuracy Score (0 - 100)
  let technicalAccuracy = Math.round(45 + (matchRatio * 50));
  if (wordCount > 40 && matchRatio > 0.4) technicalAccuracy = Math.min(100, technicalAccuracy + 5);
  if (wordCount > 80 && matchRatio > 0.6) technicalAccuracy = Math.min(100, technicalAccuracy + 5);

  // Communication & Clarity Score (0 - 100)
  let communicationClarity = 65;
  if (wordCount >= 30 && wordCount <= 220) communicationClarity += 15;
  if (lowerAnswer.includes('for example') || lowerAnswer.includes('such as') || lowerAnswer.includes('because')) communicationClarity += 10;
  if (lowerAnswer.includes('first') || lowerAnswer.includes('second') || lowerAnswer.includes('finally')) communicationClarity += 10;
  if (isSuspectedAiGenerated) communicationClarity = Math.max(50, communicationClarity - 12);
  communicationClarity = Math.min(98, communicationClarity);

  // Completeness Score
  let completeness = Math.round((technicalAccuracy * 0.6) + (communicationClarity * 0.4));

  // Overall Score
  const overallScore = Math.round((technicalAccuracy * 0.5) + (communicationClarity * 0.3) + (completeness * 0.2));

  // Dynamic Strengths Generation
  const strengths = [];
  if (matchedKeywords.length >= 3) {
    strengths.push(`Good command of core terminology: ${matchedKeywords.slice(0, 3).join(', ')}.`);
  }
  if (wordCount >= 45) {
    strengths.push('Sufficient technical explanation and structured argumentation.');
  }
  if (lowerAnswer.includes('tradeoff') || lowerAnswer.includes('cost') || lowerAnswer.includes('performance') || lowerAnswer.includes('scale')) {
    strengths.push('Demonstrated strong engineering awareness of tradeoffs and system constraints.');
  }
  if (strengths.length === 0) {
    strengths.push('Attempted the core concept and stayed on topic.');
  }

  // Dynamic Improvements Generation
  const improvements = [];
  if (missingKeywords.length > 0) {
    improvements.push(`Deepen your response by discussing: ${missingKeywords.slice(0, 3).join(', ')}.`);
  }
  if (wordCount < 40) {
    improvements.push('Expand your explanation with real-world scenarios or concrete implementation details.');
  }
  if (!lowerAnswer.includes('example') && !lowerAnswer.includes('instance')) {
    improvements.push('Incorporate practical examples or project experiences to ground theoretical concepts.');
  }
  if (isSuspectedAiGenerated) {
    improvements.push('Notice: Phrasing exhibited formulaic LLM (ChatGPT) cadence. Articulate solutions in your authentic personal engineering voice.');
  }

  // Synthesize Agent Feedback
  let feedback = '';
  if (overallScore >= 85) {
    feedback = `Exceptional explanation! You demonstrated authoritative grasp of ${question.stage.toLowerCase()} concepts and articulated key mechanisms accurately.`;
  } else if (overallScore >= 70) {
    feedback = `Solid answer! You covered the primary concepts well, though adding more detail on ${missingKeywords.slice(0, 2).join(' and ') || 'edge cases'} will elevate your response to top-tier placement standards.`;
  } else {
    feedback = `Reasonable foundation, but the answer lacks technical depth. Be sure to explain how the underlying mechanisms interact rather than offering high-level definitions.`;
  }

  if (isSuspectedAiGenerated) {
    feedback += ' (Note: Evaluator detected formulaic phrasing characteristic of external AI assistance.)';
  }

  return {
    score: overallScore,
    technicalAccuracy,
    communicationClarity,
    completeness,
    isPassing: overallScore >= 60,
    isSuspectedAiGenerated,
    feedback,
    strengths,
    improvements,
    matchedKeywords,
    missingKeywords,
    modelAnswer: question.modelAnswer
  };
}

// Compute Final Interview Report
export function computeFinalReport({ roleId, transcript, durationMinutes = 12 }) {
  const role = INTERVIEW_ROLES.find(r => r.id === roleId) || INTERVIEW_ROLES[0];
  
  if (!transcript || transcript.length === 0) {
    return {
      overallScore: 0,
      technicalScore: 0,
      communicationScore: 0,
      problemSolvingScore: 0,
      cultureFitScore: 0,
      readinessLevel: 'Incomplete',
      strengths: [],
      improvements: ['Complete all interview questions to receive comprehensive assessment.'],
      recommendedTopics: role.coreSkills,
      summary: 'Interview was closed before answers were submitted.'
    };
  }

  const scores = transcript.map(t => t.evaluation?.score || 50);
  const avgOverall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const techScores = transcript.map(t => t.evaluation?.technicalAccuracy || 50);
  const avgTech = Math.round(techScores.reduce((a, b) => a + b, 0) / techScores.length);

  const commScores = transcript.map(t => t.evaluation?.communicationClarity || 50);
  const avgComm = Math.round(commScores.reduce((a, b) => a + b, 0) / commScores.length);

  const problemSolvingScore = Math.round(avgTech * 0.9 + avgComm * 0.1);
  const cultureFitScore = Math.min(100, Math.round(avgComm * 0.95 + 5));

  let readinessLevel = 'Needs Preparation';
  if (avgOverall >= 85) readinessLevel = 'Tier 1 Placement Ready';
  else if (avgOverall >= 75) readinessLevel = 'Ready for Technical Rounds';
  else if (avgOverall >= 60) readinessLevel = 'Foundational / Developing';

  // Aggregate all strengths & improvements
  const allStrengths = Array.from(new Set(transcript.flatMap(t => t.evaluation?.strengths || []))).slice(0, 4);
  const allImprovements = Array.from(new Set(transcript.flatMap(t => t.evaluation?.improvements || []))).slice(0, 4);

  const summary = `Candidate completed the 1-on-1 AI Interview for ${role.title} with an overall score of ${avgOverall}/100 (${readinessLevel}). Technical competence averaged ${avgTech}%, with communication rating at ${avgComm}%.`;

  return {
    overallScore: avgOverall,
    technicalScore: avgTech,
    communicationScore: avgComm,
    problemSolvingScore,
    cultureFitScore,
    readinessLevel,
    strengths: allStrengths,
    improvements: allImprovements,
    recommendedTopics: role.coreSkills,
    summary,
    durationMinutes
  };
}
