import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) {
      return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
    }

    const res = await query(
      `SELECT join_requests FROM interviews WHERE meeting_id = $1 OR id = $1 LIMIT 1`,
      [meetingId]
    );

    const requests = res.rows[0]?.join_requests || [];
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { meetingId, studentId, studentName, studentEmail, studentBranch, studentCgpa, peerId } = body;

    if (!meetingId || !studentName) {
      return NextResponse.json({ error: 'Missing required request fields' }, { status: 400 });
    }

    const res = await query(
      `SELECT join_requests FROM interviews WHERE meeting_id = $1 OR id = $1 LIMIT 1`,
      [meetingId]
    );

    let currentRequests = res.rows[0]?.join_requests || [];
    if (!Array.isArray(currentRequests)) currentRequests = [];

    const existingIdx = currentRequests.findIndex(
      r => (peerId && r.peerId === peerId) || (studentId && r.studentId === studentId)
    );

    const newRequest = {
      id: existingIdx >= 0 ? currentRequests[existingIdx].id : `req_${Date.now()}`,
      peerId: peerId || null,
      studentId: studentId || null,
      studentName,
      studentEmail: studentEmail || '',
      studentBranch: studentBranch || 'CSE',
      studentCgpa: studentCgpa || null,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      currentRequests[existingIdx] = newRequest;
    } else {
      currentRequests.push(newRequest);
    }

    if (res.rows.length === 0) {
      await query(
        `INSERT INTO interviews (id, meeting_id, company, role, type, status, students, join_requests)
         VALUES ($1, $1, $2, $3, $4, 'Scheduled', '[]'::jsonb, $5::jsonb)
         ON CONFLICT (id) DO UPDATE SET join_requests = EXCLUDED.join_requests`,
        [meetingId, 'Company Placement Partner', 'Candidate Interview', 'Live Video Technical Interview', JSON.stringify(currentRequests)]
      );
    } else {
      await query(
        `UPDATE interviews SET join_requests = $2 WHERE meeting_id = $1 OR id = $1`,
        [meetingId, JSON.stringify(currentRequests)]
      );
    }

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error('Error creating join request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { meetingId, peerId, studentId, action } = body; // action: 'admit' | 'deny'

    if (!meetingId || (!peerId && !studentId) || !action) {
      return NextResponse.json({ error: 'Missing meetingId, peerId/studentId or action' }, { status: 400 });
    }

    const res = await query(
      `SELECT join_requests FROM interviews WHERE meeting_id = $1 OR id = $1 LIMIT 1`,
      [meetingId]
    );

    let currentRequests = res.rows[0]?.join_requests || [];
    if (!Array.isArray(currentRequests)) currentRequests = [];

    const targetIdx = currentRequests.findIndex(
      r => (peerId && r.peerId === peerId) || (studentId && r.studentId === studentId)
    );

    if (targetIdx >= 0) {
      currentRequests[targetIdx] = {
        ...currentRequests[targetIdx],
        status: action === 'admit' ? 'admitted' : action === 'deny' ? 'denied' : 'cancelled',
        resolvedAt: new Date().toISOString(),
      };

      await query(
        `UPDATE interviews SET join_requests = $2 WHERE meeting_id = $1 OR id = $1`,
        [meetingId, JSON.stringify(currentRequests)]
      );
    }

    return NextResponse.json({
      success: true,
      action,
      updatedRequest: targetIdx >= 0 ? currentRequests[targetIdx] : null,
    });
  } catch (error) {
    console.error('Error resolving join request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
