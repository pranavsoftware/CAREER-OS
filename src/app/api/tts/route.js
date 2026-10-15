import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Load static manifest from public/audio/manifest.json
function getManifest() {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'audio', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
  } catch (err) {
    console.warn('Could not read audio manifest.json:', err.message);
  }
  return null;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const text = url.searchParams.get('text');

    const manifest = getManifest();

    // 1. Check if audio is already pre-generated in manifest
    if (id && manifest?.prompts?.[id]) {
      const promptData = manifest.prompts[id];
      return NextResponse.json({
        source: 'static_manifest',
        audioUrl: promptData.path,
        duration: promptData.duration,
        voice: manifest.voice,
        sampleRate: manifest.sample_rate,
      });
    }

    // 2. Dynamic generation request -> forward to self-hosted ai-service
    if (text) {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
      try {
        const resp = await fetch(`${aiServiceUrl}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: 'indian_male' }),
        });

        if (resp.ok) {
          const audioBuffer = await resp.arrayBuffer();
          return new Response(audioBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/wav',
              'Cache-Control': 'public, max-age=86400',
              'X-TTS-Source': 'ai-service-dynamic',
            },
          });
        }
      } catch (svcErr) {
        console.warn('Local ai-service unavailable for dynamic TTS:', svcErr.message);
      }
    }

    return NextResponse.json(
      { error: 'Prompt not found or dynamic TTS unavailable', id },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in /api/tts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, text } = body;
    const manifest = getManifest();

    if (id && manifest?.prompts?.[id]) {
      const promptData = manifest.prompts[id];
      return NextResponse.json({
        source: 'static_manifest',
        audioUrl: promptData.path,
        duration: promptData.duration,
        voice: manifest.voice,
        sampleRate: manifest.sample_rate,
      });
    }

    if (text) {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
      const resp = await fetch(`${aiServiceUrl}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'indian_male' }),
      });

      if (resp.ok) {
        const audioBuffer = await resp.arrayBuffer();
        return new Response(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=86400',
            'X-TTS-Source': 'ai-service-dynamic',
          },
        });
      }
    }

    return NextResponse.json(
      { error: 'Prompt not found or dynamic TTS service offline' },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
