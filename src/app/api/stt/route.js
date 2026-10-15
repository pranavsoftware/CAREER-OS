import { NextResponse } from 'next/server';

/**
 * Career-OS Private Speech-to-Text (STT) Proxy Route
 * Forwards candidate audio to our local, self-hosted Whisper AI service.
 * ZERO third-party calls. No audio is ever sent to Google, OpenAI, or external clouds.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const initialPrompt = formData.get('initial_prompt') || '';

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided in request' }, { status: 400 });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

    // Build outbound FormData for the self-hosted Whisper microservice
    const outboundData = new FormData();
    outboundData.append('file', file, 'candidate_response.webm');
    if (initialPrompt) {
      outboundData.append('initial_prompt', initialPrompt);
    }

    try {
      const response = await fetch(`${aiServiceUrl}/stt`, {
        method: 'POST',
        body: outboundData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Whisper AI service error:', response.status, errorText);
        return NextResponse.json(
          { error: 'Local STT service returned an error', details: errorText },
          { status: 502 }
        );
      }

      const result = await response.json();
      return NextResponse.json({
        transcript: result.transcript,
        language: result.language || 'en',
        duration: result.duration || 0,
        transcribeTimeSeconds: result.transcribe_time_s || 0,
        source: 'self_hosted_whisper',
      });
    } catch (svcError) {
      console.error('Cannot connect to local AI service at', aiServiceUrl, svcError.message);
      return NextResponse.json(
        {
          error: 'Local Whisper AI service is currently unreachable.',
          hint: 'Ensure ai-service is running via `python ai-service/main.py` or Docker.',
          details: svcError.message,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in /api/stt route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
