import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

let tableInitPromise = null;
async function ensureSignalsTable() {
  if (!tableInitPromise) {
    tableInitPromise = (async () => {
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS meeting_signals (
            id VARCHAR(100) PRIMARY KEY,
            meeting_id VARCHAR(100) NOT NULL,
            from_peer VARCHAR(100) NOT NULL,
            to_peer VARCHAR(100),
            signal_type VARCHAR(100) NOT NULL,
            payload JSONB NOT NULL,
            timestamp BIGINT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
      } catch (err) {
        console.warn('ensureSignalsTable non-fatal:', err.message);
        tableInitPromise = null; // allow retry if failed
      }
    })();
  }
  return tableInitPromise;
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Fast network ping/latency health check handler (zero DB overhead)
    if (searchParams.get('ping')) {
      return NextResponse.json({ ok: true, timestamp: Date.now() });
    }

    const meetingId = searchParams.get('meetingId');
    const peerId = searchParams.get('peerId');
    const since = Number(searchParams.get('since') || 0);
    const syncAll = searchParams.get('sync') === 'all';

    if (!meetingId || !peerId) {
      return NextResponse.json({ error: 'Missing meetingId or peerId' }, { status: 400 });
    }

    await ensureSignalsTable();

    // 1. Fetch new WebRTC signaling messages
    const signalPromise = query(`
      SELECT payload FROM meeting_signals
      WHERE meeting_id = $1
        AND (to_peer IS NULL OR to_peer = $2)
        AND from_peer != $2
        AND timestamp > $3
      ORDER BY timestamp ASC
      LIMIT 100;
    `, [meetingId, peerId, since]).catch(err => {
      console.warn('signal query fallback:', err.message);
      return { rows: [] };
    });

    if (!syncAll) {
      const signalRes = await signalPromise;
      const messages = (signalRes.rows || []).map(r => r.payload);

      // Probabilistic opportunistic cleanup (5% of requests) to prevent DB lock contention
      if (Math.random() < 0.05) {
        query(`DELETE FROM meeting_signals WHERE created_at < NOW() - INTERVAL '60 seconds'`).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        messages,
        serverTime: Date.now(),
      });
    }

    // 2. If sync=all, batch query meeting metadata and active question in parallel
    const interviewPromise = query(`
      SELECT join_requests, chat_messages FROM interviews
      WHERE meeting_id = $1 OR id = $1 LIMIT 1;
    `, [meetingId]).catch(err => {
      console.warn('interview query fallback:', err.message);
      return { rows: [] };
    });

    const questionPromise = query(`
      SELECT 
        id, 
        meeting_id AS "meetingId", 
        type, 
        title, 
        topic, 
        difficulty, 
        question, 
        options, 
        correct, 
        explanation, 
        points, 
        code_starter AS "codeStarter", 
        test_cases AS "testCases", 
        is_active AS "isActive"
      FROM interview_questions
      WHERE (meeting_id = $1 OR meeting_id IS NULL) AND is_active = true
      LIMIT 1;
    `, [meetingId]).catch(err => {
      console.warn('question query fallback:', err.message);
      return { rows: [] };
    });

    const [signalRes, interviewRes, questionRes] = await Promise.all([
      signalPromise,
      interviewPromise,
      questionPromise
    ]);

    const messages = (signalRes.rows || []).map(r => r.payload);
    const joinRequests = interviewRes.rows[0]?.join_requests || [];
    const chatMessages = interviewRes.rows[0]?.chat_messages || [];
    const activeQuestion = questionRes.rows[0] || null;

    // Probabilistic opportunistic cleanup (5% of requests)
    if (Math.random() < 0.05) {
      query(`DELETE FROM meeting_signals WHERE created_at < NOW() - INTERVAL '60 seconds'`).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      messages,
      joinRequests: Array.isArray(joinRequests) ? joinRequests : [],
      chatMessages: Array.isArray(chatMessages) ? chatMessages : [],
      activeQuestion,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error in meeting-signal GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { meetingId, from, to } = body;
    const signalType = body.signalType || body.type;

    if (!meetingId || !from || !signalType) {
      return NextResponse.json({ error: 'Missing required signaling fields' }, { status: 400 });
    }

    await ensureSignalsTable();

    const timestamp = Date.now();
    const id = `sig_${timestamp}_${Math.random().toString(36).slice(2, 7)}`;
    const fullMessage = {
      ...body,
      id,
      meetingId,
      from,
      to: to || null,
      type: signalType,
      signalType,
      timestamp,
    };

    await query(`
      INSERT INTO meeting_signals (id, meeting_id, from_peer, to_peer, signal_type, payload, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      id,
      meetingId,
      from,
      to || null,
      signalType,
      JSON.stringify(fullMessage),
      timestamp,
    ]);

    return NextResponse.json({ success: true, messageId: id });
  } catch (error) {
    console.error('Error in meeting-signal POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');
    await ensureSignalsTable();
    if (meetingId) {
      await query('DELETE FROM meeting_signals WHERE meeting_id = $1', [meetingId]);
    } else {
      await query('DELETE FROM meeting_signals');
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
