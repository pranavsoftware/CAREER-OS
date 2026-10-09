/**
 * Deterministic ATS score calculator.
 * Compares job description keywords against resume content.
 */

const DEFAULT_KEYWORDS = {
  'Frontend Developer': ['react', 'javascript', 'html', 'css', 'typescript', 'redux', 'webpack', 'responsive', 'git', 'jest'],
  'Software Engineer': ['python', 'java', 'javascript', 'sql', 'data structures', 'algorithms', 'git', 'rest api', 'problem solving'],
  'Data Analyst': ['python', 'sql', 'pandas', 'numpy', 'tableau', 'excel', 'statistics', 'data visualization'],
};

const ACTION_VERBS = ['developed', 'built', 'designed', 'implemented', 'created', 'optimized', 'improved', 'led', 'managed', 'deployed', 'integrated', 'reduced', 'increased', 'analyzed', 'automated'];

/**
 * Extract keywords from a job description string.
 */
function extractKeywords(text) {
  const words = text.toLowerCase().match(/\b[a-z][a-z0-9.+#]{1,}/g) || [];
  // Filter out common stop words
  const stopWords = new Set(['and', 'the', 'for', 'with', 'our', 'you', 'are', 'will', 'have', 'that', 'this', 'from', 'not', 'your', 'can', 'all', 'also', 'any', 'both', 'but', 'its', 'may', 'more', 'such', 'then', 'they', 'was', 'what', 'when', 'who', 'work', 'able', 'been', 'etc']);
  return [...new Set(words.filter(w => w.length > 2 && !stopWords.has(w)))];
}

/**
 * Build resume text content from student profile data.
 */
function buildResumeText(student) {
  const parts = [];
  if (student.skills) {
    parts.push(student.skills.map(s => s.name).join(' ').toLowerCase());
  }
  if (student.projects) {
    student.projects.forEach(p => {
      parts.push(p.title.toLowerCase());
      parts.push(p.description.toLowerCase());
      parts.push((p.technologies || []).join(' ').toLowerCase());
    });
  }
  if (student.experience) {
    student.experience.forEach(e => {
      parts.push(e.role.toLowerCase());
      parts.push(e.description.toLowerCase());
    });
  }
  parts.push(student.branch?.toLowerCase() || '');
  return parts.join(' ');
}

/**
 * Compute ATS score deterministically from job description and student profile.
 * Returns score object with breakdown.
 */
export function computeAtsScore(jobDescription, student, includeSections = {}) {
  const jdText = jobDescription && jobDescription.trim().length > 20
    ? jobDescription
    : DEFAULT_KEYWORDS['Software Engineer'].join(' ');

  const jdKeywords = extractKeywords(jdText);
  const resumeText = buildResumeText(student);

  // Keyword match
  const matched = jdKeywords.filter(kw => resumeText.includes(kw));
  const missing = jdKeywords.filter(kw => !resumeText.includes(kw)).slice(0, 10);
  const keywordScore = jdKeywords.length > 0 ? Math.round((matched.length / jdKeywords.length) * 100) : 60;

  // Formatting score (deterministic based on profile completeness)
  const formattingScore = Math.min(100, 60 + (student.profileCompletion || 70) * 0.4);

  // Section completeness
  const sectionMap = {
    skills: student.skills?.length > 0,
    projects: (includeSections.projects !== false) && student.projects?.length > 0,
    experience: (includeSections.experience !== false) && student.experience?.length > 0,
    education: !!student.education,
    certificates: (includeSections.certificates !== false) && true,
  };
  const sectionsPresent = Object.values(sectionMap).filter(Boolean).length;
  const sectionScore = Math.round((sectionsPresent / Object.keys(sectionMap).length) * 100);

  // Action verbs
  const verbsFound = ACTION_VERBS.filter(v => resumeText.includes(v));
  const actionVerbScore = Math.min(100, verbsFound.length * 15);

  // Length score (penalize too short or too long; ideal 400-800 words)
  const wordCount = resumeText.split(/\s+/).length;
  const lengthScore = wordCount < 100 ? 40 : wordCount < 300 ? 60 : wordCount < 600 ? 90 : wordCount < 1000 ? 100 : 75;

  const overall = Math.round(
    keywordScore * 0.4 +
    formattingScore * 0.15 +
    sectionScore * 0.2 +
    actionVerbScore * 0.15 +
    lengthScore * 0.1
  );

  return {
    overall: Math.min(100, overall),
    breakdown: [
      { category: 'Keyword Match', score: Math.min(100, keywordScore), max: 100, feedback: keywordScore >= 70 ? 'Good keyword alignment with job description.' : 'Add more job-specific keywords to your resume.' },
      { category: 'Formatting', score: Math.round(Math.min(100, formattingScore)), max: 100, feedback: 'Resume structure is clean and parseable by ATS.' },
      { category: 'Section Completeness', score: sectionScore, max: 100, feedback: sectionScore < 80 ? 'Add missing sections (experience, projects) to improve completeness.' : 'All key sections are present.' },
      { category: 'Action Verbs', score: Math.min(100, actionVerbScore), max: 100, feedback: verbsFound.length >= 4 ? `Strong use of action verbs: ${verbsFound.slice(0,4).join(', ')}` : 'Use more action verbs like "developed", "implemented", "optimized".' },
      { category: 'Length', score: lengthScore, max: 100, feedback: `Estimated word count: ${wordCount}. ${wordCount < 300 ? 'Consider adding more detail.' : 'Good length.'}` },
    ],
    matchedKeywords: matched.slice(0, 15),
    missingKeywords: missing.slice(0, 10),
  };
}
