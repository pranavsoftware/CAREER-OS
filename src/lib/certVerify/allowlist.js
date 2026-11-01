/**
 * Allowlist of supported certificate issuers
 * Key: exact domain hostname
 */
export const ALLOWED_ISSUERS = {
  'credly.com': {
    issuerName: 'Credly',
    parserKey: 'credly',
  },
  'coursera.org': {
    issuerName: 'Coursera',
    parserKey: 'coursera',
  },
  'nptel.ac.in': {
    issuerName: 'NPTEL (SWAYAM)',
    parserKey: 'nptel',
  },
  'archive.nptel.ac.in': {
    issuerName: 'NPTEL Archive',
    parserKey: 'nptel',
  },
  'udemy.com': {
    issuerName: 'Udemy',
    parserKey: 'udemy',
  },
  'credential.net': {
    issuerName: 'Accredible (Credential.net)',
    parserKey: 'accredible',
  },
};

/**
 * Validates and matches an input URL against the allowed issuers.
 * Requires protocol 'https:'.
 * Strict domain matching: hostname === d || hostname.endsWith('.' + d).
 * NEVER uses substring/contains check (protects against credly.com.evil.site or evilcredly.com).
 *
 * @param {string} urlString
 * @returns {{ matched: boolean, issuerName?: string, parserKey?: string, domain?: string, parsedUrl?: URL, error?: string }}
 */
export function matchIssuerDomain(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { matched: false, error: 'Empty or invalid URL' };
  }

  let parsed;
  try {
    parsed = new URL(urlString.trim());
  } catch (_) {
    return { matched: false, error: 'Malformed URL' };
  }

  if (parsed.protocol !== 'https:') {
    return { matched: false, error: 'HTTPS protocol is strictly required' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Sort domains by length descending so more specific subdomains (e.g. archive.nptel.ac.in) match before parents (nptel.ac.in)
  const sortedDomains = Object.keys(ALLOWED_ISSUERS).sort((a, b) => b.length - a.length);

  for (const domain of sortedDomains) {
    const targetDomain = domain.toLowerCase();
    if (hostname === targetDomain || hostname.endsWith('.' + targetDomain)) {
      const config = ALLOWED_ISSUERS[domain];
      return {
        matched: true,
        issuerName: config.issuerName,
        parserKey: config.parserKey,
        domain: targetDomain,
        parsedUrl: parsed,
      };
    }
  }

  return { matched: false, error: `Domain '${hostname}' is not in the trusted issuer allowlist` };
}
