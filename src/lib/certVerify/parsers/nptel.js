import * as cheerio from 'cheerio';

/**
 * Parser for NPTEL (SWAYAM) Certificates
 * e.g. https://nptel.ac.in/noc/Ecertificate/?q=... or https://archive.nptel.ac.in/noc/Ecertificate/...
 *
 * @param {string} htmlOrJson - Page content
 * @param {string} url - Verification URL
 * @returns {{ parsed: boolean, valid: boolean, holderName?: string, title?: string, issuerName?: string, issueDate?: string, credentialId?: string, revoked?: boolean }}
 */
export function parse(htmlOrJson, url) {
  if (!htmlOrJson || typeof htmlOrJson !== 'string') {
    return { parsed: false, valid: false };
  }

  const $ = cheerio.load(htmlOrJson);

  // Check invalid/not found message
  const bodyText = $('body').text();
  if (bodyText.includes('Certificate not found') || bodyText.includes('Invalid Roll Number') || $('title').text().includes('404')) {
    return { parsed: true, valid: false, revoked: true };
  }

  let holderName = '';
  let courseTitle = '';
  let rollNo = '';

  // NPTEL verification pages typically render a table with:
  // Candidate Name, Roll Number, Course Name, Final Score
  $('table tr').each((_, row) => {
    const text = $(row).text();
    const cells = $(row).find('td');

    if (cells.length >= 2) {
      const label = $(cells[0]).text().trim().toLowerCase();
      const val = $(cells[1]).text().trim();

      if (label.includes('candidate name') || label.includes('name of the student') || label.includes('name')) {
        if (!holderName) holderName = val;
      } else if (label.includes('course name') || label.includes('course')) {
        if (!courseTitle) courseTitle = val;
      } else if (label.includes('roll') || label.includes('certificate id') || label.includes('noc')) {
        if (!rollNo) rollNo = val;
      }
    }
  });

  // Fallback: look for bold texts or specific spans
  if (!holderName) {
    const nameMatch = bodyText.match(/(?:Name|Candidate Name)\s*:\s*([A-Za-z\s\.\-]+?)(?:\r|\n|Roll|Course|$)/i);
    if (nameMatch) holderName = nameMatch[1].trim();
  }

  if (!courseTitle) {
    const courseMatch = bodyText.match(/(?:Course|Course Name)\s*:\s*([A-Za-z0-9\s\.\-&:,]+?)(?:\r|\n|Score|Roll|$)/i);
    if (courseMatch) courseTitle = courseMatch[1].trim();
  }

  // URL query param fallback for roll/credential ID
  let credentialId = rollNo;
  try {
    const parsed = new URL(url);
    const q = parsed.searchParams.get('q') || parsed.searchParams.get('rollno') || parsed.searchParams.get('id');
    if (!credentialId && q) credentialId = q.trim();
  } catch (_) {}

  if (holderName || courseTitle) {
    return {
      parsed: true,
      valid: true,
      holderName: holderName || undefined,
      title: courseTitle || undefined,
      issuerName: 'NPTEL',
      credentialId: credentialId || undefined,
      revoked: false,
    };
  }

  return { parsed: false, valid: false };
}
