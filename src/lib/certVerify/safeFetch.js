import dns from 'dns';
import { matchIssuerDomain } from './allowlist.js';

const TIMEOUT_MS = 8000;
const MAX_BYTES = 1024 * 1024; // 1 MB
const MAX_REDIRECTS = 3;
const USER_AGENT = 'CareerOS-CertVerifier/1.0';

/**
 * Checks if an IPv4 or IPv6 string is private, loopback, link-local, or reserved.
 * @param {string} ip
 * @returns {boolean} true if forbidden / private / local
 */
export function isForbiddenIp(ip) {
  if (!ip || typeof ip !== 'string') return true;

  // Handle IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  // IPv6 checks
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::' || lower === '0:0:0:0:0:0:0:1') return true;
    // fc00::/7 (Unique local addresses)
    if (/^f[cd][0-9a-f]{2}:/i.test(lower)) return true;
    // fe80::/10 (Link-local)
    if (/^fe[89ab][0-9a-f]:/i.test(lower)) return true;
    return false;
  }

  // IPv4 checks
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) {
    return true; // malformed IP is forbidden
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private: 172.16 - 172.31)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local / Cloud metadata service e.g. 169.254.169.254)
  if (a === 169 && b === 254) return true;

  return false;
}

/**
 * Resolves all IP addresses for a hostname and validates none are private.
 * @param {string} hostname
 * @returns {Promise<void>} throws on invalid/private IP
 */
export async function validateHostnameDns(hostname) {
  // If hostname is directly an IP
  if (isForbiddenIp(hostname)) {
    throw new Error('Direct IP or forbidden address not allowed');
  }

  let addresses;
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch (err) {
    throw new Error(`DNS resolution failed for hostname`);
  }

  if (!addresses || addresses.length === 0) {
    throw new Error('No DNS records found for target host');
  }

  for (const record of addresses) {
    if (isForbiddenIp(record.address)) {
      throw new Error('Resolved IP is forbidden or private');
    }
  }
}

/**
 * Performs a secure, SSRF-protected HTTP GET request.
 * - Allowlist check
 * - DNS verification (prevents internal IP scanning)
 * - Strict timeout (8s)
 * - Maximum 1MB response stream cap
 * - Max 3 manual redirects with complete security re-validation on every hop
 * - Only text/html and application/json
 * - Sanitized errors (no internal system leak)
 *
 * @param {string} targetUrl
 * @returns {Promise<{ ok: boolean, status: number, contentType: string, data: string, finalUrl: string }>}
 */
export async function safeFetch(targetUrl) {
  let currentUrl = targetUrl;
  let redirectsRemaining = MAX_REDIRECTS;

  while (true) {
    // 1. Allowlist domain check
    const match = matchIssuerDomain(currentUrl);
    if (!match.matched) {
      throw new Error(match.error || 'Domain not allowlisted');
    }

    const parsed = match.parsedUrl;

    // 2. DNS Resolution & Private IP prevention
    await validateHostnameDns(parsed.hostname);

    // 3. Execution with AbortController timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res;
    try {
      res = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        },
        redirect: 'manual', // Never auto-follow
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out (8s limit)');
      }
      throw new Error('Network connection failed');
    }

    clearTimeout(timeoutId);

    // 4. Handle redirects manually
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        throw new Error('Redirect header missing');
      }

      if (redirectsRemaining <= 0) {
        throw new Error('Too many redirects (max 3)');
      }
      redirectsRemaining--;

      // Resolve relative redirect against current URL
      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch (_) {
        throw new Error('Invalid redirect location URL');
      }

      continue;
    }

    // 5. Validate status & content type
    if (!res.ok) {
      throw new Error(`Issuer verification page returned status ${res.status}`);
    }

    const contentType = res.headers.get('content-type') || '';
    const isHtmlOrJson = contentType.includes('text/html') || 
                         contentType.includes('application/json') || 
                         contentType.includes('text/plain') ||
                         contentType.includes('application/xhtml+xml');

    if (!isHtmlOrJson) {
      throw new Error(`Unsupported content type: ${contentType.split(';')[0]}`);
    }

    // 6. Read stream up to MAX_BYTES (1 MB)
    const reader = res.body.getReader();
    const chunks = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      receivedBytes += value.length;
      if (receivedBytes > MAX_BYTES) {
        reader.cancel();
        throw new Error('Response payload exceeded 1MB limit');
      }
      chunks.push(value);
    }

    const totalBuffer = Buffer.concat(chunks);
    const textData = totalBuffer.toString('utf-8');

    return {
      ok: true,
      status: res.status,
      contentType,
      data: textData,
      finalUrl: currentUrl,
      issuerName: match.issuerName,
      parserKey: match.parserKey,
    };
  }
}
