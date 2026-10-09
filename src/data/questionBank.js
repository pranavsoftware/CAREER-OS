// 40+ mock MCQ questions for interview prep
export const questionBank = [
  // DSA - Easy
  { id: 'q1', topic: 'DSA', difficulty: 'Easy', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correct: 1, explanation: 'Binary search halves the search space each time, giving O(log n) complexity.' },
  { id: 'q2', topic: 'DSA', difficulty: 'Easy', question: 'Which data structure uses LIFO (Last In First Out)?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], correct: 1, explanation: 'A Stack follows LIFO where the last element pushed is the first to be popped.' },
  { id: 'q3', topic: 'DSA', difficulty: 'Easy', question: 'What is the space complexity of a recursive fibonacci function?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(2^n)'], correct: 2, explanation: 'Due to call stack depth reaching n levels, space complexity is O(n).' },

  // DSA - Medium
  { id: 'q4', topic: 'DSA', difficulty: 'Medium', question: 'Which algorithm is used in Dijkstra\'s shortest path?', options: ['BFS', 'DFS', 'Greedy with priority queue', 'Dynamic programming'], correct: 2, explanation: 'Dijkstra uses a greedy approach with a min-heap (priority queue) to select the next shortest node.' },
  { id: 'q5', topic: 'DSA', difficulty: 'Medium', question: 'What is the worst case time complexity of QuickSort?', options: ['O(n log n)', 'O(n)', 'O(n^2)', 'O(log n)'], correct: 2, explanation: 'QuickSort\'s worst case is O(n^2) when the pivot is always the smallest or largest element.' },
  { id: 'q6', topic: 'DSA', difficulty: 'Medium', question: 'Which traversal of a BST gives sorted order?', options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'], correct: 1, explanation: 'In-order traversal (left-root-right) of a BST visits nodes in ascending sorted order.' },

  // DSA - Hard
  { id: 'q7', topic: 'DSA', difficulty: 'Hard', question: 'What is the time complexity of Floyd-Warshall algorithm?', options: ['O(n^2)', 'O(n^2 log n)', 'O(n^3)', 'O(V + E)'], correct: 2, explanation: 'Floyd-Warshall uses three nested loops over n vertices, resulting in O(n^3).' },
  { id: 'q8', topic: 'DSA', difficulty: 'Hard', question: 'In dynamic programming, which technique avoids recomputation by storing sub-problem results?', options: ['Recursion', 'Memoization', 'Backtracking', 'Greedy'], correct: 1, explanation: 'Memoization stores computed results of sub-problems to avoid redundant calculations.' },

  // DBMS - Easy
  { id: 'q9', topic: 'DBMS', difficulty: 'Easy', question: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Structured Question Language', 'Sequential Query Language'], correct: 0, explanation: 'SQL stands for Structured Query Language, used to manage relational databases.' },
  { id: 'q10', topic: 'DBMS', difficulty: 'Easy', question: 'Which SQL command is used to retrieve data from a table?', options: ['INSERT', 'UPDATE', 'SELECT', 'DELETE'], correct: 2, explanation: 'SELECT is used to retrieve or query data from one or more tables.' },

  // DBMS - Medium
  { id: 'q11', topic: 'DBMS', difficulty: 'Medium', question: 'What is a foreign key?', options: ['A key that uniquely identifies each row', 'A key in one table that references a primary key in another', 'A key used for indexing', 'A composite key'], correct: 1, explanation: 'A foreign key establishes a link between two tables by referencing the primary key of another table.' },
  { id: 'q12', topic: 'DBMS', difficulty: 'Medium', question: 'What is the purpose of normalization in DBMS?', options: ['To increase data redundancy', 'To reduce data redundancy and improve integrity', 'To improve query speed', 'To encrypt data'], correct: 1, explanation: 'Normalization organizes tables to reduce data redundancy and dependency.' },
  { id: 'q13', topic: 'DBMS', difficulty: 'Medium', question: 'ACID properties in DBMS stand for?', options: ['Atomicity, Consistency, Isolation, Durability', 'Accuracy, Completeness, Integrity, Durability', 'Atomicity, Concurrency, Isolation, Data', 'None of the above'], correct: 0, explanation: 'ACID ensures database transactions are processed reliably.' },

  // DBMS - Hard
  { id: 'q14', topic: 'DBMS', difficulty: 'Hard', question: 'In which normal form is a relation if it has no multi-valued dependencies?', options: ['1NF', '2NF', '3NF', '4NF'], correct: 3, explanation: '4NF eliminates non-trivial multi-valued dependencies between attributes.' },

  // OS - Easy
  { id: 'q15', topic: 'OS', difficulty: 'Easy', question: 'What is a process in operating systems?', options: ['A program on disk', 'A program in execution', 'A file in memory', 'A hardware device'], correct: 1, explanation: 'A process is a program that has been loaded into memory and is being executed.' },
  { id: 'q16', topic: 'OS', difficulty: 'Easy', question: 'What does CPU scheduling determine?', options: ['Which process gets CPU time', 'Memory allocation', 'I/O scheduling', 'File permissions'], correct: 0, explanation: 'CPU scheduling decides which process from the ready queue gets to execute on the CPU.' },

  // OS - Medium
  { id: 'q17', topic: 'OS', difficulty: 'Medium', question: 'What is a deadlock?', options: ['A program crash', 'A situation where processes wait forever for resources held by each other', 'Memory overflow', 'Infinite loop'], correct: 1, explanation: 'Deadlock occurs when two or more processes each hold resources needed by the other, causing indefinite waiting.' },
  { id: 'q18', topic: 'OS', difficulty: 'Medium', question: 'Which scheduling algorithm may cause starvation?', options: ['Round Robin', 'FCFS', 'Priority Scheduling', 'SJF non-preemptive'], correct: 2, explanation: 'Priority scheduling can cause starvation where low-priority processes never get CPU time.' },
  { id: 'q19', topic: 'OS', difficulty: 'Medium', question: 'What is virtual memory?', options: ['RAM', 'A technique to use disk space as extended RAM', 'Cache memory', 'GPU memory'], correct: 1, explanation: 'Virtual memory uses the hard disk as an extension of RAM, allowing larger programs to run.' },

  // OS - Hard
  { id: 'q20', topic: 'OS', difficulty: 'Hard', question: 'Belady\'s anomaly occurs in which page replacement algorithm?', options: ['LRU', 'Optimal', 'FIFO', 'LFU'], correct: 2, explanation: 'FIFO can exhibit Belady\'s anomaly where increasing frames can increase page faults.' },

  // Networks - Easy
  { id: 'q21', topic: 'Networks', difficulty: 'Easy', question: 'What layer does HTTP operate at in the OSI model?', options: ['Physical', 'Transport', 'Network', 'Application'], correct: 3, explanation: 'HTTP is an application layer protocol in the OSI model.' },
  { id: 'q22', topic: 'Networks', difficulty: 'Easy', question: 'What does DNS stand for?', options: ['Domain Name System', 'Dynamic Network Service', 'Data Network Structure', 'Domain Network Server'], correct: 0, explanation: 'DNS translates human-readable domain names to IP addresses.' },

  // Networks - Medium
  { id: 'q23', topic: 'Networks', difficulty: 'Medium', question: 'What is the purpose of the three-way handshake in TCP?', options: ['Encrypt data', 'Establish a reliable connection', 'Route packets', 'Compress data'], correct: 1, explanation: 'TCP three-way handshake (SYN, SYN-ACK, ACK) establishes a reliable connection between client and server.' },
  { id: 'q24', topic: 'Networks', difficulty: 'Medium', question: 'What is the difference between TCP and UDP?', options: ['TCP is faster, UDP is reliable', 'TCP is reliable and connection-oriented; UDP is faster but unreliable', 'No difference', 'UDP uses more bandwidth'], correct: 1, explanation: 'TCP guarantees delivery with error checking; UDP is faster but does not guarantee delivery.' },

  // Networks - Hard
  { id: 'q25', topic: 'Networks', difficulty: 'Hard', question: 'What is the subnet mask for a /26 network?', options: ['255.255.255.0', '255.255.255.128', '255.255.255.192', '255.255.255.224'], correct: 2, explanation: '/26 means 26 bits for network, leaving 6 host bits. 11111111.11111111.11111111.11000000 = 255.255.255.192.' },

  // React - Easy
  { id: 'q26', topic: 'React', difficulty: 'Easy', question: 'What is JSX in React?', options: ['A templating engine', 'A syntax extension that allows HTML in JavaScript', 'A CSS framework', 'A state management library'], correct: 1, explanation: 'JSX (JavaScript XML) allows writing HTML-like syntax directly in JavaScript files.' },
  { id: 'q27', topic: 'React', difficulty: 'Easy', question: 'What hook is used to manage state in functional components?', options: ['useEffect', 'useContext', 'useState', 'useReducer'], correct: 2, explanation: 'useState hook declares a state variable and a function to update it in functional components.' },

  // React - Medium
  { id: 'q28', topic: 'React', difficulty: 'Medium', question: 'When does useEffect run with an empty dependency array?', options: ['On every render', 'Only on the first render (mount)', 'Only when props change', 'Never'], correct: 1, explanation: 'useEffect with [] runs only once after the initial render, equivalent to componentDidMount.' },
  { id: 'q29', topic: 'React', difficulty: 'Medium', question: 'What is the virtual DOM in React?', options: ['The real browser DOM', 'A lightweight copy of the real DOM for efficient updates', 'A database', 'A server-side rendering technique'], correct: 1, explanation: 'React\'s virtual DOM is an in-memory representation of the real DOM, enabling efficient diffing and updates.' },
  { id: 'q30', topic: 'React', difficulty: 'Medium', question: 'What is the purpose of React.memo?', options: ['To store data in memory', 'To memoize components and prevent unnecessary re-renders', 'To create class components', 'To handle async operations'], correct: 1, explanation: 'React.memo wraps a component and prevents re-renders if props have not changed.' },

  // React - Hard
  { id: 'q31', topic: 'React', difficulty: 'Hard', question: 'What is the difference between useCallback and useMemo?', options: ['No difference', 'useCallback memoizes a function; useMemo memoizes a value', 'useCallback memoizes a value; useMemo memoizes a function', 'Both memoize functions'], correct: 1, explanation: 'useCallback returns a memoized callback function. useMemo returns the memoized result of calling a function.' },

  // Aptitude - Easy
  { id: 'q32', topic: 'Aptitude', difficulty: 'Easy', question: 'If a train travels 120 km in 2 hours, what is its speed?', options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'], correct: 1, explanation: 'Speed = Distance / Time = 120 / 2 = 60 km/h.' },
  { id: 'q33', topic: 'Aptitude', difficulty: 'Easy', question: 'What is 15% of 200?', options: ['20', '25', '30', '35'], correct: 2, explanation: '15% of 200 = (15/100) × 200 = 30.' },

  // Aptitude - Medium
  { id: 'q34', topic: 'Aptitude', difficulty: 'Medium', question: 'A pipe fills a tank in 6 hours, another empties it in 8 hours. If both are open, how long to fill the tank?', options: ['20 hours', '24 hours', '18 hours', '16 hours'], correct: 1, explanation: 'Net fill rate = 1/6 - 1/8 = 1/24 per hour. So tank fills in 24 hours.' },
  { id: 'q35', topic: 'Aptitude', difficulty: 'Medium', question: 'Two numbers are in ratio 3:5. If their sum is 80, find the larger number.', options: ['30', '40', '50', '60'], correct: 2, explanation: 'Larger number = (5/8) × 80 = 50.' },

  // Aptitude - Hard
  { id: 'q36', topic: 'Aptitude', difficulty: 'Hard', question: 'A merchant marks goods 20% above cost price. He gives 10% discount. What is his profit %?', options: ['8%', '10%', '12%', '6%'], correct: 0, explanation: 'CP=100, MP=120, SP=120×0.9=108. Profit=8%.' },

  // HR - Easy
  { id: 'q37', topic: 'HR', difficulty: 'Easy', question: 'Which answer best describes "teamwork"?', options: ['Working alone efficiently', 'Collaborating with others to achieve common goals', 'Managing a team', 'Competing with colleagues'], correct: 1, explanation: 'Teamwork involves cooperation and collaboration among team members to achieve shared objectives.' },
  { id: 'q38', topic: 'HR', difficulty: 'Easy', question: 'What is the best response when asked "Where do you see yourself in 5 years?"', options: ['I want your job', 'In a senior role with more responsibilities, contributing significantly to the company', 'I have no plans', 'Outside this company'], correct: 1, explanation: 'Show ambition aligned with company growth while demonstrating commitment.' },

  // HR - Medium
  { id: 'q39', topic: 'HR', difficulty: 'Medium', question: 'How should you handle a situation where you disagree with your manager?', options: ['Ignore it', 'Express disagreement respectfully with supporting data and seek resolution', 'Complain to other colleagues', 'Immediately escalate to HR'], correct: 1, explanation: 'Professional disagreements should be handled calmly with facts and constructive dialogue.' },
  { id: 'q40', topic: 'HR', difficulty: 'Medium', question: 'What does the STAR method stand for in interviews?', options: ['Skills, Tasks, Actions, Results', 'Situation, Task, Action, Result', 'Strategy, Timing, Assessment, Review', 'None of the above'], correct: 1, explanation: 'STAR (Situation, Task, Action, Result) is a structured method to answer behavioral interview questions.' },

  // HR - Hard
  { id: 'q41', topic: 'HR', difficulty: 'Hard', question: 'You discover a coworker is falsifying expense reports. What is the most ethical course of action?', options: ['Ignore it to avoid conflict', 'Confront the coworker directly and threaten them', 'Report it through proper channels (manager or ethics hotline)', 'Share it with the team'], correct: 2, explanation: 'Reporting through proper channels protects the company and upholds ethical standards.' },
  { id: 'q42', topic: 'HR', difficulty: 'Hard', question: 'How do you handle multiple high-priority tasks with the same deadline?', options: ['Do them in random order', 'Assess complexity and impact, communicate with stakeholders, prioritize accordingly', 'Ask your manager to handle it', 'Pick the easiest one first'], correct: 1, explanation: 'Effective prioritization involves evaluating urgency, impact and stakeholder communication.' },
];

export const topics = ['DSA', 'DBMS', 'OS', 'Networks', 'React', 'Aptitude', 'HR'];
export const difficulties = ['Easy', 'Medium', 'Hard'];
