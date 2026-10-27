import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) {
      return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
    }

    const res = await query(
      `SELECT chat_messages FROM interviews WHERE meeting_id = $1 OR id = $1 LIMIT 1`,
      [meetingId]
    );

    const messages = res.rows[0]?.chat_messages || [];
    return NextResponse.json({ success: true, messages: Array.isArray(messages) ? messages : [] });
  } catch (error) {
    console.error('Error fetching interview messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { meetingId, message } = body;

    if (!meetingId || !message || !message.text) {
      return NextResponse.json({ error: 'Missing required message fields' }, { status: 400 });
    }

    const res = await query(
      `SELECT chat_messages FROM interviews WHERE meeting_id = $1 OR id = $1 LIMIT 1`,
      [meetingId]
    );

    let messages = res.rows[0]?.chat_messages || [];
    if (!Array.isArray(messages)) messages = [];

    // Avoid duplicate insertions
    if (!messages.some(m => m.id === message.id)) {
      messages.push(message);

      await query(
        `UPDATE interviews SET chat_messages = $1 WHERE meeting_id = $2 OR id = $2`,
        [JSON.stringify(messages), meetingId]
      );
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error saving interview message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
