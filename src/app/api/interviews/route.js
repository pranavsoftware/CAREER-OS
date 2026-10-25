import { NextResponse } from 'next/server';
import { initialInterviews } from '@/data/interviews';

// In-memory / session store for local dev
let dynamicInterviews = [...initialInterviews];

export async function GET() {
  return NextResponse.json({ interviews: dynamicInterviews });
}

export async function POST(req) {
  try {
    const data = await req.json();
    const newInterview = {
      ...data,
      id: data.id || `int_${Date.now()}`,
      meetingId: data.meetingId || `room-${Date.now().toString(36)}`,
      createdAt: data.createdAt || new Date().toISOString(),
      status: data.status || 'Scheduled',
    };
    dynamicInterviews = [newInterview, ...dynamicInterviews];
    return NextResponse.json({ success: true, interview: newInterview });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req) {
  try {
    const data = await req.json();
    dynamicInterviews = dynamicInterviews.map(i =>
      i.id === data.id ? { ...i, ...data } : i
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
