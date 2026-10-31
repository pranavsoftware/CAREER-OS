/**
 * Pure deterministic ranking engine for JD-based student shortlisting.
 *
 * Scoring Formula (Max 100):
 * - Required-skill overlap: 40%
 * - Certificate relevance:  20%
 * - Verified projects:      20%
 * - CGPA contribution:      20%
 *
 * Ties broken by:
 * 1. Higher CGPA
 * 2. Earlier application / student id
 */

export function calculateShortlistScore(student, job, studentCerts = [], studentApp = null) {
  const reqSkills = Array.isArray(job.required_skills)
    ? job.required_skills
    : Array.isArray(job.requiredSkills)
    ? job.requiredSkills
    : [];

  const studentSkills = Array.isArray(student.skills) ? student.skills : [];
  const studentSkillNames = studentSkills.map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase());

  // 1. Required-skill overlap (40%)
  let skillOverlapScore = 0;
  let matchedSkillCount = 0;
  if (reqSkills.length > 0) {
    reqSkills.forEach(req => {
      const target = (typeof req === 'string' ? req : req.name || '').toLowerCase();
      if (studentSkillNames.some(s => s.includes(target) || target.includes(s))) {
        matchedSkillCount += 1;
      }
    });
    const overlapRatio = matchedSkillCount / reqSkills.length;
    skillOverlapScore = Number((overlapRatio * 40).toFixed(2));
  } else {
    // If no required skills specified on job, award proportional to total student skill volume (up to 40)
    skillOverlapScore = Math.min(40, Number((studentSkills.length * 5).toFixed(2)));
  }

  // 2. Certificate relevance (20%)
  // Counts valid, verified certificates covering required skills
  const validCerts = (studentCerts || []).filter(c => 
    c.studentId === student.id || c.student_id === student.id
  ).filter(c => c.verified !== false && c.status === 'Valid');

  let certSkillsCovered = 0;
  if (reqSkills.length > 0) {
    const certSkillSet = new Set();
    validCerts.forEach(c => {
      const skills = Array.isArray(c.skills) ? c.skills : [];
      skills.forEach(s => certSkillSet.add(s.toLowerCase()));
      if (c.title) certSkillSet.add(c.title.toLowerCase());
    });

    reqSkills.forEach(req => {
      const target = (typeof req === 'string' ? req : req.name || '').toLowerCase();
      for (const cs of certSkillSet) {
        if (cs.includes(target) || target.includes(cs)) {
          certSkillsCovered += 1;
          break;
        }
      }
    });
    const certRatio = Math.min(1, certSkillsCovered / Math.max(1, reqSkills.length));
    var certRelevanceScore = Number((certRatio * 20).toFixed(2));
  } else {
    certRelevanceScore = Math.min(20, validCerts.length * 10);
  }

  // 3. Verified projects (20%)
  const projects = Array.isArray(student.projects) ? student.projects : [];
  let projectPoints = 0;
  projects.forEach(p => {
    // Verified projects (GitHub backed, featured, or valid repo links)
    const isVerified = p.isGithub || p.link?.includes('github.com') || p.featured;
    const techOverlap = (p.technologies || []).some(t => 
      reqSkills.some(req => {
        const target = (typeof req === 'string' ? req : req.name || '').toLowerCase();
        return t.toLowerCase().includes(target);
      })
    );
    if (isVerified && techOverlap) {
      projectPoints += 10;
    } else if (isVerified || techOverlap) {
      projectPoints += 6;
    } else {
      projectPoints += 3;
    }
  });
  const verifiedProjectsScore = Math.min(20, Number(projectPoints.toFixed(2)));

  // 4. CGPA (20%)
  const cgpa = Number(student.cgpa) || 0;
  const cgpaScore = Number(((cgpa / 10.0) * 20).toFixed(2));

  // Total Match Score
  const matchScore = Number((skillOverlapScore + certRelevanceScore + verifiedProjectsScore + cgpaScore).toFixed(2));

  return {
    matchScore: Math.min(100, matchScore),
    breakdown: {
      skillOverlap: skillOverlapScore,
      certRelevance: certRelevanceScore,
      verifiedProjects: verifiedProjectsScore,
      cgpaScore: cgpaScore,
      matchedSkills: matchedSkillCount,
      totalReqSkills: reqSkills.length,
      certCount: validCerts.length,
      projectCount: projects.length,
    },
  };
}

export function rankEligibleCandidates(students, job, certificates = [], applications = []) {
  const minCgpa = Number(job.min_cgpa || job.minCgpa || 0);
  const branches = job.branches || job.eligibleBranches || [];
  const maxBacklogs = Number(job.max_backlogs ?? job.maxBacklogs ?? 0);

  // 1. Strict Eligibility Filter:
  // - Profile status MUST be 'Verified'
  // - CGPA >= job.min_cgpa
  // - Branch in job.branches (if specified)
  // - Backlogs <= job.max_backlogs
  const eligible = students.filter(s => {
    const isProfileVerified = (s.profileStatus || s.profile_status) === 'Verified';
    if (!isProfileVerified) return false;

    const sCgpa = Number(s.cgpa) || 0;
    if (sCgpa < minCgpa) return false;

    const sBacklogs = Number(s.backlogs) || 0;
    if (sBacklogs > maxBacklogs) return false;

    if (branches.length > 0 && !branches.includes(s.branch)) return false;

    return true;
  });

  // 2. Score calculation
  const scored = eligible.map(student => {
    const studentApp = applications.find(a => 
      (a.studentId === student.id || a.student_id === student.id) &&
      (a.jobId === job.id || a.job_id === job.id)
    );
    const scoreResult = calculateShortlistScore(student, job, certificates, studentApp);

    return {
      student,
      studentId: student.id,
      matchScore: scoreResult.matchScore,
      breakdown: scoreResult.breakdown,
      cgpa: Number(student.cgpa) || 0,
      appliedAt: studentApp?.appliedDate || studentApp?.created_at || '9999-99-99',
    };
  });

  // 3. Sequenced Deterministic Tie Breaking:
  // - Higher matchScore
  // - Higher CGPA
  // - Earlier application date / student ID
  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    if (b.cgpa !== a.cgpa) {
      return b.cgpa - a.cgpa;
    }
    if (a.appliedAt !== b.appliedAt) {
      return a.appliedAt.localeCompare(b.appliedAt);
    }
    return a.studentId.localeCompare(b.studentId);
  });

  // Assign 1-indexed ranks
  return scored.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

