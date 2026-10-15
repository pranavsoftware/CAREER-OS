import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');

    let sql = 'SELECT id, topic, difficulty, question, options, correct, explanation FROM question_bank';
    const params = [];
    if (topic && topic !== 'All') {
      params.push(topic);
      sql += ' WHERE topic = $1';
    }
    sql += ' ORDER BY id ASC';

    const questionsRes = await query(sql, params);

    const taxRes = await query('SELECT role_name AS "roleName", skills FROM skill_taxonomy ORDER BY role_name ASC');
    const skillTaxonomy = {};
    for (const row of taxRes.rows) {
      skillTaxonomy[row.roleName] = row.skills;
    }

    return NextResponse.json({
      questionBank: questionsRes.rows,
      skillTaxonomy,
      roleOptions: Object.keys(skillTaxonomy)
    });
  } catch (error) {
    console.error('Prep GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
