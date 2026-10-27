import { NextResponse } from 'next/server';

// In-memory WebRTC signaling message bus for live human video meetings
// Structure: meetingId -> Array of { id, from, to, type, payload, timestamp }
const signalQueues = new Map();

function cleanOldMessages(meetingId) {
  const queue = signalQueues.get(meetingId);
  if (!queue) return;
  const now = Date.now();
  // Keep signals younger than 60 seconds
  const filtered = queue.filter(m => (now - m.timestamp) < 60000);
  if (filtered.length === 0) {
    signalQueues.delete(meetingId);
  } else {
    signalQueues.set(meetingId, filtered);
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Fast network ping/latency health check handler
    if (searchParams.get('ping')) {
      return NextResponse.json({ ok: true, timestamp: Date.now() });
    }

    const meetingId = searchParams.get('meetingId');
    const peerId = searchParams.get('peerId');
    const since = Number(searchParams.get('since') || 0);

    if (!meetingId || !peerId) {
      return NextResponse.json({ error: 'Missing meetingId or peerId' }, { status: 400 });
    }

    cleanOldMessages(meetingId);
    const queue = signalQueues.get(meetingId) || [];

    // Return messages either sent directly to this peerId or broadcast messages (to == null)
    // and exclude messages originating from this peerId
    const newMessages = queue.filter(m => {
      const isForMe = !m.to || m.to === peerId;
      const isNotFromMe = m.from !== peerId;
      const isNew = m.timestamp > since;
      return isForMe && isNotFromMe && isNew;
    });

    return NextResponse.json({
      success: true,
      messages: newMessages,
      serverTime: Date.now(),
    });
  } catch (error) {
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

    cleanOldMessages(meetingId);

    if (!signalQueues.has(meetingId)) {
      signalQueues.set(meetingId, []);
    }

    const message = {
      ...body,
      id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      meetingId,
      from,
      to: to || null,
      type: signalType,
      signalType,
      timestamp: Date.now(),
    };

    signalQueues.get(meetingId).push(message);

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');
    if (meetingId) {
      signalQueues.delete(meetingId);
    } else {
      signalQueues.clear();
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
