import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { enforceRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // RBAC: company or university
  const rbacError = enforceRole(request, ['company', 'university', 'admin']);
  if (rbacError) return rbacError;

  try {
    const { searchParams } = new URL(request.url);
    const targetRole = searchParams.get('role') || 'Software Engineer';

    // 1. Fetch universities
    const univRes = await query(`
      SELECT id, name, city, logo FROM universities ORDER BY name ASC
    `);
    const universities = univRes.rows;

    // 2. Fetch skill taxonomy for the target role
    const taxRes = await query(`
      SELECT role_name, skills FROM skill_taxonomy
    `);
    const taxonomyMap = {};
    for (const r of taxRes.rows) {
      taxonomyMap[r.role_name] = r.skills || [];
    }
    const roleSkills = taxonomyMap[targetRole] || taxonomyMap['Software Engineer'] || ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'];

    // 3. Fetch students with certificates, attempts, and placements
    const studentsRes = await query(`
      SELECT 
        s.id, s.name, s.university_id AS "universityId", s.profile_status AS "profileStatus",
        s.placement_status AS "placementStatus", s.skills, s.cgpa
      FROM students s
    `);
    const students = studentsRes.rows;

    const certsRes = await query(`
      SELECT student_id, verified, status FROM certificates WHERE verified = true OR status = 'Verified'
    `);
    const certsByStudent = {};
    for (const c of certsRes.rows) {
      certsByStudent[c.student_id] = (certsByStudent[c.student_id] || 0) + 1;
    }

    const attemptsRes = await query(`
      SELECT student_id, percentage FROM test_attempts WHERE percentage IS NOT NULL
    `);
    const scoresByStudent = {};
    for (const a of attemptsRes.rows) {
      if (!scoresByStudent[a.student_id]) scoresByStudent[a.student_id] = [];
      scoresByStudent[a.student_id].push(Number(a.percentage));
    }

    // 4. Compute ranking score per university
    const rankedUniversities = universities.map(u => {
      const uStudents = students.filter(s => s.universityId === u.id || (!s.universityId && u.id === 'univ_apex'));
      const totalCount = uStudents.length || 1; // avoid / 0
      const verifiedStudents = uStudents.filter(s => s.profileStatus === 'Verified');
      const verifiedCount = verifiedStudents.length;

      // Minimum sample size guard: hide or flag universities with fewer than 20 verified students
      const insufficientSample = verifiedCount < 20;

      // Metric 1: Average verified skill level against role benchmarks (40%)
      let totalSkillOverlap = 0;
      for (const st of verifiedStudents) {
        const sSkills = Array.isArray(st.skills)
          ? st.skills.map(sk => (typeof sk === 'string' ? sk : sk.name || '').toLowerCase())
          : [];
        const matchCount = roleSkills.filter(rk => sSkills.some(sk => sk.includes(rk.toLowerCase()))).length;
        const overlapRatio = roleSkills.length > 0 ? (matchCount / roleSkills.length) : 0.7;
        totalSkillOverlap += overlapRatio;
      }
      const skillScore = verifiedCount > 0 ? (totalSkillOverlap / verifiedCount) : 0.55;

      // Metric 2: Share of verified profiles (20%)
      const verifiedShare = verifiedCount / totalCount;

      // Metric 3: Verified certificate density per student (20%)
      let totalCerts = 0;
      for (const st of verifiedStudents) {
        totalCerts += (certsByStudent[st.id] || 0);
      }
      const certDensity = verifiedCount > 0 ? Math.min(1.0, (totalCerts / verifiedCount) / 2.0) : 0.4;

      // Metric 4: Average AI interview score (10%)
      let totalAiScore = 0;
      let aiStudentCount = 0;
      for (const st of verifiedStudents) {
        const studentScores = scoresByStudent[st.id];
        if (studentScores && studentScores.length > 0) {
          const avg = studentScores.reduce((a, b) => a + b, 0) / studentScores.length;
          totalAiScore += avg;
          aiStudentCount++;
        }
      }
      const aiScoreNorm = aiStudentCount > 0 ? (totalAiScore / aiStudentCount) / 100 : 0.72;

      // Metric 5: Placement rate (10%)
      const placedCount = uStudents.filter(s => s.placementStatus === 'Placed' || s.placementStatus === 'Offer').length;
      const placementRate = placedCount / totalCount;

      // Overall composite score (0-100)
      const rawScore = (
        0.40 * skillScore +
        0.20 * verifiedShare +
        0.20 * certDensity +
        0.10 * aiScoreNorm +
        0.10 * placementRate
      ) * 100;

      const finalScore = Number(rawScore.toFixed(1));

      return {
        id: u.id,
        name: u.name,
        city: u.city || 'Bangalore',
        logo: u.logo || '🏛️',
        score: finalScore,
        sampleSize: verifiedCount,
        totalStudents: totalCount,
        insufficientSample,
        metrics: {
          skillAlignment: Math.round(skillScore * 100),
          profileVerification: Math.round(verifiedShare * 100),
          certDensity: Math.round(certDensity * 100),
          aiInterviewScore: Math.round(aiScoreNorm * 100),
          placementRate: Math.round(placementRate * 100),
        },
        strengths: [
          skillScore > 0.65 ? 'High Skill Benchmark Alignment' : 'Solid Foundational Training',
          verifiedShare > 0.6 ? 'High Institutional Verification Rate' : 'Developing Verified Pool',
          placementRate > 0.4 ? 'Top Industry Placement Track Record' : 'Active Placement Pipeline',
        ],
      };
    });

    // Sort by score descending
    rankedUniversities.sort((a, b) => b.score - a.score);

    // Assign rank
    rankedUniversities.forEach((u, i) => {
      u.rank = i + 1;
    });

    return NextResponse.json({
      role: targetRole,
      availableRoles: Object.keys(taxonomyMap),
      targetSkills: roleSkills,
      universities: rankedUniversities,
    });
  } catch (error) {
    console.error('University Ranking API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

