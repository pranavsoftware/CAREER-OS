/**
 * Eligibility checker: determines if a student meets drive criteria.
 */

/**
 * Check if a student is eligible for a drive.
 * Returns { eligible: boolean, reason: string }
 */
export function checkEligibility(student, drive) {
  if (!drive.eligibleBranches?.includes(student.branch)) {
    return { eligible: false, reason: `Branch ${student.branch} not eligible (requires ${drive.eligibleBranches.join(', ')})` };
  }
  if (student.cgpa < drive.minCgpa) {
    return { eligible: false, reason: `CGPA ${student.cgpa} below minimum ${drive.minCgpa}` };
  }
  if (student.backlogs > drive.maxBacklogs) {
    return { eligible: false, reason: `${student.backlogs} active backlogs exceeds max ${drive.maxBacklogs}` };
  }
  return { eligible: true, reason: 'Eligible' };
}

/**
 * Get all students eligible for a drive from a list.
 */
export function getEligibleStudents(students, drive) {
  return students.filter(s => checkEligibility(s, drive).eligible);
}

/**
 * Compute skill match % between a student and a job.
 */
export function computeSkillMatch(student, job) {
  if (!job.requiredSkills || job.requiredSkills.length === 0) return 0;
  const studentSkillNames = (student.skills || []).map(s => s.name.toLowerCase());
  const matched = job.requiredSkills.filter(skill =>
    studentSkillNames.some(s => s.includes(skill.toLowerCase()) || skill.toLowerCase().includes(s))
  );
  return Math.round((matched.length / job.requiredSkills.length) * 100);
}
