import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user_aspirant';
    const location = searchParams.get('location');
    const stream = searchParams.get('stream');
    const maxFee = searchParams.get('maxFee');

    // 1. Fetch aspirant profile
    const pRes = await query(`
      SELECT 
        user_id AS "userId", name, board, stream, 
        CAST(twelfth_percentage AS FLOAT) AS "twelfthPercentage",
        COALESCE(entrance_exams, '[]'::jsonb) AS "entranceExams"
      FROM aspirant_profiles
      WHERE user_id = $1
    `, [userId]);
    const profile = pRes.rows[0];

    // 2. Fetch colleges
    let sql = `
      SELECT 
        c.id, c.university_id AS "universityId", c.name, c.location,
        COALESCE(c.courses, '[]'::jsonb) AS courses,
        CAST(c.fees AS FLOAT) AS fees,
        COALESCE(c.cutoff, '{}'::jsonb) AS cutoff,
        c.seats, c.accreditation, CAST(c.rating AS FLOAT) AS rating,
        COALESCE(c.campus_facilities, '[]'::jsonb) AS "campusFacilities",
        u.name AS "universityName", u.logo AS "universityLogo"
      FROM colleges c
      LEFT JOIN universities u ON u.id = c.university_id
      WHERE 1=1
    `;
    const params = [];

    if (location && location !== 'All') {
      params.push(`%${location}%`);
      sql += ` AND c.location ILIKE $${params.length}`;
    }

    if (maxFee && maxFee !== 'All') {
      params.push(Number(maxFee));
      sql += ` AND c.fees <= $${params.length}`;
    }

    sql += ' ORDER BY c.rating DESC, c.fees ASC';

    const res = await query(sql, params);
    const colleges = res.rows;

    // 3. Eligibility Engine (Deterministic rules)
    const evaluatedColleges = colleges.map(col => {
      const cutoff = col.cutoff || {};
      const minTwelfth = Number(cutoff.minTwelfthPercent) || 60.0;
      const minJee = Number(cutoff.minJeePercentile) || 0.0;
      const allowedStreams = Array.isArray(cutoff.streams) ? cutoff.streams : ['PCM', 'PCMB'];

      let eligible = true;
      const reasons = [];

      if (profile) {
        // Rule 1: Stream check
        if (allowedStreams.length > 0 && !allowedStreams.includes(profile.stream)) {
          eligible = false;
          reasons.push(`Requires ${allowedStreams.join(' or ')} stream (your profile is ${profile.stream}).`);
        } else {
          reasons.push(`Stream ${profile.stream} matches eligibility.`);
        }

        // Rule 2: 12th Board marks check
        if (profile.twelfthPercentage < minTwelfth) {
          eligible = false;
          reasons.push(`12th marks ${profile.twelfthPercentage}% below minimum required ${minTwelfth}%.`);
        } else {
          reasons.push(`12th marks (${profile.twelfthPercentage}%) meets required ${minTwelfth}% cutoff.`);
        }

        // Rule 3: Entrance exam check
        const jeeExam = Array.isArray(profile.entranceExams)
          ? profile.entranceExams.find(e => (e.exam || '').toLowerCase().includes('jee'))
          : null;
        const studentPercentile = Number(jeeExam?.percentile || 0);

        if (minJee > 0) {
          if (studentPercentile < minJee) {
            eligible = false;
            reasons.push(`JEE percentile ${studentPercentile || 0} below cutoff ${minJee}.`);
          } else {
            reasons.push(`JEE percentile (${studentPercentile}) clears the ${minJee} percentile cutoff.`);
          }
        }
      }

      return {
        ...col,
        eligible,
        reasons,
      };
    });

    return NextResponse.json({
      colleges: evaluatedColleges,
      studentProfile: profile || null,
    });
  } catch (error) {
    console.error('Aspirant colleges GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

