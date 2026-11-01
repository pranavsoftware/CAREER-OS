import * as credly from './credly.js';
import * as coursera from './coursera.js';
import * as nptel from './nptel.js';

export const PARSERS = {
  credly,
  coursera,
  nptel,
};

/**
 * Dispatches HTML or JSON payload to the corresponding issuer parser.
 *
 * @param {string} parserKey - e.g. 'credly' | 'coursera' | 'nptel'
 * @param {string} content - HTML or JSON string
 * @param {string} url - Verification URL
 * @returns {{ parsed: boolean, valid: boolean, holderName?: string, title?: string, issuerName?: string, issueDate?: string, expiryDate?: string, credentialId?: string, revoked?: boolean }}
 */
export function parseIssuerContent(parserKey, content, url) {
  const parser = PARSERS[parserKey];
  if (!parser || typeof parser.parse !== 'function') {
    return { parsed: false, valid: false, error: `No parser implemented for key '${parserKey}'` };
  }

  try {
    return parser.parse(content, url);
  } catch (err) {
    return { parsed: false, valid: false, error: err.message || 'Parser execution failed' };
  }
}

