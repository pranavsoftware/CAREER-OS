import * as cheerio from 'cheerio';

/**
 * Parser for Coursera verification pages (e.g. https://www.coursera.org/account/accomplishments/verify/...)
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

  // Check 404 or invalid credential
  const pageTitle = $('title').text() || '';
  if (pageTitle.includes('404') || pageTitle.includes('Page Not Found') || $('div:contains("We couldn\'t find that page")').length > 0) {
    return { parsed: true, valid: false, revoked: true };
  }

  // 1. JSON-LD structured metadata
  let jsonLd = null;
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const parsed = JSON.parse($(elem).html());
      if (parsed['@type'] === 'EducationalOccupationalCredential' || parsed.hasCredential) {
        jsonLd = parsed;
      }
    } catch (_) {}
  });

  if (jsonLd) {
    return {
      parsed: true,
      valid: true,
      holderName: jsonLd.recipient?.name || jsonLd.name,
      title: jsonLd.credentialCategory || jsonLd.about?.name,
      issuerName: 'Coursera',
      issueDate: jsonLd.dateCreated ? String(jsonLd.dateCreated).split('T')[0] : undefined,
      credentialId: extractCourseraId(url),
      revoked: false,
    };
  }

  // 2. Open Graph & Meta tags
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDesc = $('meta[property="og:description"]').attr('content') || '';

  // Coursera typical text: "Coursera Course Certificates verify that [Name] successfully completed..."
  let holderName = '';
  let courseTitle = '';

  // Extract from headline / DOM elements
  const accomplishmentHeading = $('h3[data-e2e="course-name"]').text().trim() ||
                                 $('h2.course-name').text().trim() ||
                                 $('h3.c-certificate-title').text().trim();

  const recipientElement = $('p.c-certificate-recipient strong').text().trim() ||
                           $('[data-e2e="recipient-name"]').text().trim() ||
                           $('.recipient-name').text().trim();

  if (recipientElement) {
    holderName = recipientElement;
  } else if (ogDesc) {
    // E.g. "Completed by Pranav Rayban on Coursera"
    const nameMatch = ogDesc.match(/(?:Completed by|awarded to|verify that)\s+([A-Za-z\s\.\-]+?)(?:\s+has|\s+successfully|\s+on Coursera|\.)/i);
    if (nameMatch) holderName = nameMatch[1].trim();
  }

  if (accomplishmentHeading) {
    courseTitle = accomplishmentHeading;
  } else if (ogTitle) {
    // E.g. "Coursera | Verification: Deep Learning Specialization"
    courseTitle = ogTitle.replace(/^Coursera\s*\|\s*(?:Verification:\s*)?/i, '').trim();
  }

  // Issue date
  let issueDate = undefined;
  const dateText = $('.c-certificate-date').text().trim() || $('p:contains("completed on")').text().trim();
  if (dateText) {
    const dMatch = dateText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
    if (dMatch) {
      issueDate = normalizeDateString(dMatch[1]);
    }
  }

  if (holderName || courseTitle) {
    return {
      parsed: true,
      valid: true,
      holderName: holderName || undefined,
      title: courseTitle || undefined,
      issuerName: 'Coursera',
      issueDate,
      credentialId: extractCourseraId(url),
      revoked: false,
    };
  }

  return { parsed: false, valid: false };
}

function extractCourseraId(urlString) {
  try {
    const parsed = new URL(urlString);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const verifyIdx = parts.indexOf('verify');
    if (verifyIdx >= 0 && parts[verifyIdx + 1]) {
      return parts[verifyIdx + 1];
    }
    return parts[parts.length - 1] || '';
  } catch (_) {
    return '';
  }
}

function normalizeDateString(str) {
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch (_) {}
  return str;
}
