import { query } from '@/lib/db';

export async function GET(request, context) {
  try {
    const { params } = context;
    const { id } = await params;
    const url = new URL(request.url);
    const itemIndexStr = url.searchParams.get('itemIndex');
    const itemIndex = itemIndexStr !== null ? parseInt(itemIndexStr, 10) : null;

    const res = await query('SELECT file_url, reference_link, playlist FROM materials WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      return new Response('Material not found', { status: 404 });
    }

    const row = res.rows[0];
    let fileUrl = null;

    if (itemIndex !== null && Array.isArray(row.playlist) && row.playlist[itemIndex]) {
      fileUrl = row.playlist[itemIndex].fileUrl;
    } else {
      fileUrl = row.file_url || row.reference_link;
    }

    if (!fileUrl) {
      return new Response('Media content not found for this item', { status: 404 });
    }

    // If it's an external web URL, redirect to it
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return Response.redirect(fileUrl, 302);
    }

    // If it's a base64 data URL
    if (fileUrl.startsWith('data:')) {
      const commaIndex = fileUrl.indexOf(',');
      if (commaIndex === -1) {
        return new Response('Invalid media data encoding', { status: 400 });
      }

      const header = fileUrl.substring(0, commaIndex);
      const mimeType = header.replace(/^data:/, '').replace(/;base64$/, '') || 'video/mp4';
      const base64Data = fileUrl.substring(commaIndex + 1);
      const buffer = Buffer.from(base64Data, 'base64');
      const totalSize = buffer.length;

      // Handle HTTP Range Requests for HTML5 Video seeking
      const range = request.headers.get('range');
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

        if (start >= totalSize || end >= totalSize || start > end) {
          return new Response(null, {
            status: 416,
            headers: {
              'Content-Range': `bytes */${totalSize}`,
            },
          });
        }

        const chunk = buffer.subarray(start, end + 1);
        return new Response(chunk, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunk.length),
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      // Full file response
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': String(totalSize),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return new Response('Unsupported media URL scheme', { status: 400 });
  } catch (error) {
    console.error('Error streaming material media:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
