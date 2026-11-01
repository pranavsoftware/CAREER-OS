import * as cheerio from 'cheerio';

/**
 * Parser for Credly badges (e.g., https://www.credly.com/badges/...)
 * Structured Data: Looks for JSON-LD and Open Badges / Open Graph metadata before DOM scraping.
 *
 * @param {string} htmlOrJson - Page content
 * @param {string} url - Credly URL
 * @returns {{ parsed: boolean, valid: boolean, holderName?: string, title?: string, issuerName?: string, issueDate?: string, expiryDate?: string, credentialId?: string, revoked?: boolean, raw?: any }}
 */
export function parse(htmlOrJson, url) {
  if (!htmlOrJson || typeof htmlOrJson !== 'string') {
    return { parsed: false, valid: false };
  }

  // 1. JSON response (if Credly API was called directly)
  if (htmlOrJson.trim().startsWith('{')) {
    try {
      const data = JSON.parse(htmlOrJson);
      if (data.data || data.badge_template) {
        const item = data.data || data;
        return {
          parsed: true,
          valid: !item.revoked && !item.expired,
          holderName: item.recipient_name || item.recipient?.name || item.issued_to_name,
          title: item.badge_template?.name || item.title,
          issuerName: item.badge_template?.issuer?.entities?.[0]?.entity?.name || 'Credly',
          issueDate: item.issued_at ? item.issued_at.split('T')[0] : undefined,
          expiryDate: item.expires_at ? item.expires_at.split('T')[0] : undefined,
          credentialId: item.id || extractCredlyIdFromUrl(url),
          revoked: Boolean(item.revoked),
        };
      }
    } catch (_) {}
  }

  // 2. HTML parsing with Cheerio
  const $ = cheerio.load(htmlOrJson);

  // Check for 404 or missing badge
  const pageTitle = $('title').text() || '';
  if (pageTitle.includes('404') || pageTitle.includes('Page Not Found') || pageTitle.includes('Badge Not Found')) {
    return { parsed: true, valid: false, revoked: true };
  }

  // Check structured JSON-LD script tags
  let jsonLdData = null;
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const parsed = JSON.parse($(elem).html());
      if (parsed['@type'] === 'EducationalOccupationalCredential' || parsed.recipient || parsed.name) {
        jsonLdData = parsed;
      }
    } catch (_) {}
  });

  if (jsonLdData) {
    const holder = jsonLdData.recipient?.name || jsonLdData.recipient || jsonLdData.name;
    const title = jsonLdData.credentialCategory || jsonLdData.name;
    const issuer = jsonLdData.recognizedBy?.name || jsonLdData.author?.name || 'Credly';
    const issueDate = jsonLdData.dateCreated || jsonLdData.startDate;

    return {
      parsed: true,
      valid: true,
      holderName: typeof holder === 'string' ? holder : undefined,
      title: typeof title === 'string' ? title : undefined,
      issuerName: typeof issuer === 'string' ? issuer : 'Credly',
      issueDate: issueDate ? String(issueDate).split('T')[0] : undefined,
      expiryDate: jsonLdData.endDate ? String(jsonLdData.endDate).split('T')[0] : undefined,
      credentialId: extractCredlyIdFromUrl(url),
      revoked: false,
    };
  }

  // 3. Fallback to Open Graph & Meta tags
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDesc = $('meta[property="og:description"]').attr('content') || '';
  const holderMeta = $('meta[name="badge-recipient"]').attr('content') || 
                     $('[data-recipient]').attr('data-recipient') ||
                     $('.recipient-name').text().trim() ||
                     $('h2:contains("Issued to")').next().text().trim() ||
                     $('.cr-badge-banner__recipient').text().trim();

  const titleMeta = $('meta[name="badge-name"]').attr('content') || 
                    $('.badge-header-title').text().trim() ||
                    $('h1').first().text().trim() || 
                    ogTitle;

  const issuerMeta = $('meta[name="badge-issuer"]').attr('content') || 
                     $('.issuer-name').text().trim() || 
                     'Credly';

  // Issue date extraction from text like "Issued on: May 12, 2025"
  let issueDate = null;
  const bodyText = $('body').text();
  const dateMatch = bodyText.match(/Issued\s*(?:on|to)?[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
  if (dateMatch) {
    issueDate = normalizeDateString(dateMatch[1]);
  }

  if (holderMeta || titleMeta) {
    return {
      parsed: true,
      valid: true,
      holderName: holderMeta || undefined,
      title: titleMeta || undefined,
      issuerName: issuerMeta,
      issueDate: issueDate || undefined,
      credentialId: extractCredlyIdFromUrl(url),
      revoked: false,
    };
  }

  return { parsed: false, valid: false };
}

function extractCredlyIdFromUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    const parts = parsed.pathname.split('/').filter(Boolean);
    // e.g. /badges/:id
    const badgeIdx = parts.indexOf('badges');
    if (badgeIdx >= 0 && parts[badgeIdx + 1]) {
      return parts[badgeIdx + 1];
    }
    return parts[parts.length - 1] || '';
  } catch (_) {
    return '';
  }
}

function normalizeDateString(str) {
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (_) {}
  return str;
}

