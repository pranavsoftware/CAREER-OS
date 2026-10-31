import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { enforceRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const country = searchParams.get('country');
    const exam = searchParams.get('exam');
    const level = searchParams.get('level');

    // Fetch student profile for rule-based matching if studentId provided
    let student = null;
    if (studentId) {
      const sRes = await query('SELECT id, name, branch, CAST(cgpa AS FLOAT) AS cgpa, skills FROM students WHERE id = $1', [studentId]);
      student = sRes.rows[0];
    }

    let sql = 'SELECT * FROM higher_ed_programs WHERE 1=1';
    const params = [];

    if (country && country !== 'All') {
      params.push(country);
      sql += ` AND country = $${params.length}`;
    }
    if (exam && exam !== 'All') {
      params.push(`%${exam}%`);
      sql += ` AND exam_required ILIKE $${params.length}`;
    }
    if (level && level !== 'All') {
      params.push(level);
      sql += ` AND level = $${params.length}`;
    }

    sql += ' ORDER BY min_cgpa DESC, name ASC';

    const res = await query(sql, params);
    const programs = res.rows;

    // Rule-based matching engine
    const matchedPrograms = programs.map(p => {
      const branchTags = Array.isArray(p.branch_tags) ? p.branch_tags : [];
      let matchScore = 70;
      const reasons = [];

      if (student) {
        // Rule 1: Branch match
        const branchMatch = branchTags.includes(student.branch) || branchTags.includes('All');
        if (branchMatch) {
          matchScore += 15;
          reasons.push(`Direct curriculum match for your ${student.branch} branch.`);
        } else {
          matchScore -= 10;
          reasons.push(`Interdisciplinary program admitting candidates from related engineering fields.`);
        }

        // Rule 2: CGPA evaluation
        const minCgpa = Number(p.min_cgpa) || 7.0;
        if (student.cgpa >= minCgpa + 0.5) {
          matchScore += 15;
          reasons.push(`Your CGPA of ${student.cgpa.toFixed(2)} comfortably clears the ${minCgpa.toFixed(2)} threshold (+0.5 buffer).`);
        } else if (student.cgpa >= minCgpa) {
          matchScore += 10;
          reasons.push(`Your CGPA of ${student.cgpa.toFixed(2)} meets the competitive cutoff of ${minCgpa.toFixed(2)}.`);
        } else {
          matchScore -= 15;
          reasons.push(`Minimum recommended CGPA is ${minCgpa.toFixed(2)} (your current CGPA is ${student.cgpa.toFixed(2)}). Consider strong GRE/GATE scores to offset.`);
        }

        // Rule 3: Skill match
        const sSkills = Array.isArray(student.skills)
          ? student.skills.map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase())
          : [];
        const nameAndDesc = (p.name + ' ' + (p.description || '')).toLowerCase();
        const matchedSkills = sSkills.filter(sk => nameAndDesc.includes(sk));
        if (matchedSkills.length > 0) {
          matchScore += 10;
          reasons.push(`Aligns directly with your verified skills in: ${matchedSkills.slice(0, 3).join(', ')}.`);
        }
      } else {
        reasons.push(`Top global program accredited with international industry partnerships.`);
      }

      return {
        id: p.id,
        name: p.name,
        institution: p.institution,
        country: p.country,
        level: p.level,
        branchTags,
        minCgpa: Number(p.min_cgpa),
        examRequired: p.exam_required,
        deadlineHint: p.deadline_hint,
        link: p.link,
        description: p.description,
        matchScore: Math.min(99, Math.max(40, matchScore)),
        whyRecommended: reasons.join(' '),
      };
    });

    // Sort by match score descending
    matchedPrograms.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      programs: matchedPrograms,
      countries: ['All', 'USA', 'Germany', 'UK', 'Singapore', 'India', 'Switzerland', 'France', 'Netherlands', 'Australia', 'Sweden'],
      exams: ['All', 'GRE', 'GATE', 'TOEFL', 'IELTS', 'GMAT'],
      levels: ['All', 'MS', 'MTech', 'MBA', 'PhD'],
    });
  } catch (error) {
    console.error('Higher Education API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

