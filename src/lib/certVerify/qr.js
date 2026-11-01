import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

/**
 * Extracts QR code URL from an image buffer (PNG, JPG/JPEG) or PDF.
 * Never throws — always returns { found: boolean, url?: string, error?: string }
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - 'image/png' | 'image/jpeg' | 'application/pdf'
 * @returns {Promise<{ found: boolean, url?: string, error?: string }>}
 */
export async function extractQrUrlFromFile(buffer, mimeType = '') {
  if (!buffer || buffer.length === 0) {
    return { found: false, error: 'Empty buffer' };
  }

  const detectedMime = (mimeType || '').toLowerCase();

  try {
    // 1. PNG Image
    if (detectedMime.includes('png') || isPngMagicBytes(buffer)) {
      const png = PNG.sync.read(buffer);
      const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
      if (code && code.data && isValidUrl(code.data)) {
        return { found: true, url: code.data.trim() };
      }
      return { found: false };
    }

    // 2. JPEG/JPG Image
    if (detectedMime.includes('jpeg') || detectedMime.includes('jpg') || isJpegMagicBytes(buffer)) {
      const rawJpg = jpeg.decode(buffer, { useTArray: true });
      const code = jsQR(new Uint8ClampedArray(rawJpg.data), rawJpg.width, rawJpg.height);
      if (code && code.data && isValidUrl(code.data)) {
        return { found: true, url: code.data.trim() };
      }
      return { found: false };
    }

    // 3. PDF Document
    if (detectedMime.includes('pdf') || isPdfMagicBytes(buffer)) {
      // For PDFs on serverless environments where canvas isn't bundled,
      // extract text/URLs directly from raw PDF streams or annotations first
      const pdfText = buffer.toString('latin1');
      const urlMatches = pdfText.match(/https?:\/\/[a-zA-Z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;=%]+/g);
      if (urlMatches && urlMatches.length > 0) {
        // Find URLs matching known issuers (Credly, Coursera, NPTEL, Accredible, etc.)
        for (const u of urlMatches) {
          const cleaned = u.replace(/[\)\]>,"'].*$/, '').trim();
          if (cleaned.includes('credly.com') || cleaned.includes('coursera.org') || cleaned.includes('nptel.ac.in') || cleaned.includes('credential.net') || cleaned.includes('udemy.com')) {
            return { found: true, url: cleaned };
          }
        }
      }

      // Try pdfjs-dist if available for rasterized QR scanning
      try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => null);
        if (pdfjsLib && pdfjsLib.getDocument) {
          const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer), disableFontFace: true });
          const doc = await loadingTask.promise;
          const numPages = Math.min(doc.numPages, 2);

          for (let i = 1; i <= numPages; i++) {
            const page = await doc.getPage(i);
            const ops = await page.getOperatorList();
            // Search text annotations
            const annotations = await page.getAnnotations();
            for (const annot of annotations) {
              if (annot.url && isValidUrl(annot.url)) {
                return { found: true, url: annot.url };
              }
            }
          }
        }
      } catch (_) {
        // Fallback gracefully without throwing
      }

      return { found: false };
    }

    return { found: false, error: 'Unsupported file format for QR extraction' };
  } catch (err) {
    return { found: false, error: err.message || 'QR extraction failed' };
  }
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function isPngMagicBytes(b) {
  return b.length > 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
}

function isJpegMagicBytes(b) {
  return b.length > 2 && b[0] === 0xff && b[1] === 0xd8;
}

function isPdfMagicBytes(b) {
  return b.length > 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;
}
