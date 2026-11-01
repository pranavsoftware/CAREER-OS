/**
 * Normalizes person names by removing titles, lowercase, removing special punctuation,
 * and collapsing spaces.
 */
export function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|dr|prof|sir)\.?\b/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates string similarity using Levenshtein distance (0.0 to 1.0 scale).
 */
export function stringSimilarity(str1, str2) {
  const s1 = (str1 || '').trim().toLowerCase();
  const s2 = (str2 || '').trim().toLowerCase();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null)
  );

  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return (maxLen - distance) / maxLen;
}

/**
 * Checks if names match accounting for initials, order inversion, and typos.
 * e.g. "Pranav Mahesh Rayban" matches "Pranav M. Rayban", "Pranav Rayban", or "Rayban Pranav"
 */
export function checkNameMatch(profileName, issuerHolderName) {
  const normProfile = normalizeName(profileName);
  const normIssuer = normalizeName(issuerHolderName);

  if (!normProfile || !normIssuer) return false;

  // Direct exact match
  if (normProfile === normIssuer) return true;

  // Levenshtein similarity >= 0.85
  const sim = stringSimilarity(normProfile, normIssuer);
  if (sim >= 0.85) return true;

  // Word token containment (e.g. "Pranav Rayban" contained within "Pranav Mahesh Rayban")
  const pTokens = normProfile.split(' ').filter(Boolean);
  const iTokens = normIssuer.split(' ').filter(Boolean);

  // If all issuer words are in profile name (or vice versa with min 2 tokens)
  const commonTokens = pTokens.filter(t => iTokens.includes(t));
  if (commonTokens.length >= 2 && (commonTokens.length === pTokens.length || commonTokens.length === iTokens.length)) {
    return true;
  }

  // Check initial matches: e.g. "p m rayban" vs "pranav mahesh rayban"
  const isInitialMatch = pTokens.every((pt, idx) => {
    const it = iTokens[idx];
    if (!it) return false;
    return pt === it || pt[0] === it || it[0] === pt;
  });
  if (isInitialMatch && (pTokens.length >= 2 && iTokens.length >= 2)) return true;

  return false;
}

/**
 * Compares certificate data extracted from issuer against student and form details.
 *
 * @param {Object} params
 * @param {Object} params.student - Verified student profile (name, etc.)
 * @param {Object} params.form - User-entered form values (title, issuer, credentialId, etc.)
 * @param {Object} params.issuerData - Data returned by parser
 * @param {string} [params.qrUrl] - Decoded QR URL if any
 * @param {string} [params.typedUrl] - User-typed URL if any
 * @returns {Object} checks result object with boolean flags & scores
 */
export function compareCertificate({ student, form, issuerData, qrUrl, typedUrl }) {
  const reasons = [];

  // 1. Page validity (Issuer confirms it exists and is neither revoked nor expired)
  const pageValid = Boolean(issuerData && issuerData.valid && !issuerData.revoked);
  if (!pageValid) {
    reasons.push(issuerData?.revoked ? 'Certificate is revoked by the issuing authority' : 'Issuer verification page not valid or not found');
  }

  // 2. Name match (CRITICAL: strongest red flag)
  const studentName = student?.name || '';
  const issuerHolder = issuerData?.holderName || '';
  const nameMatch = issuerHolder ? checkNameMatch(studentName, issuerHolder) : false;
  if (!nameMatch) {
    reasons.push(`Name mismatch: Certificate issued to "${issuerHolder || 'Unknown'}", but student profile name is "${studentName}"`);
  }

  // 3. Title match (fuzzy match against form title)
  let titleMatch = true;
  if (form?.title && issuerData?.title) {
    const sim = stringSimilarity(form.title, issuerData.title);
    const formWords = form.title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const issuerLower = issuerData.title.toLowerCase();
    const wordOverlap = formWords.filter(w => issuerLower.includes(w)).length / Math.max(formWords.length, 1);

    titleMatch = sim >= 0.6 || wordOverlap >= 0.5;
    if (!titleMatch) {
      reasons.push(`Title variance: Claimed "${form.title}", but issuer records indicate "${issuerData.title}"`);
    }
  }

  // 4. Date match (same day or same month)
  let dateMatch = true;
  if (form?.issueDate && issuerData?.issueDate) {
    const formMonth = form.issueDate.slice(0, 7);
    const issuerMonth = issuerData.issueDate.slice(0, 7);
    dateMatch = formMonth === issuerMonth || form.issueDate === issuerData.issueDate;
    if (!dateMatch) {
      reasons.push(`Issue date variance: Entered ${form.issueDate}, but issuer records show ${issuerData.issueDate}`);
    }
  }

  // 5. Credential ID match
  let credentialIdMatch = true;
  if (form?.credentialId && issuerData?.credentialId) {
    const normFormId = form.credentialId.trim().toLowerCase();
    const normIssuerId = issuerData.credentialId.trim().toLowerCase();
    credentialIdMatch = normFormId === normIssuerId || normIssuerId.includes(normFormId) || normFormId.includes(normIssuerId);
    if (!credentialIdMatch) {
      reasons.push(`Credential ID mismatch: Entered "${form.credentialId}", but issuer assigned "${issuerData.credentialId}"`);
    }
  }

  // 6. QR URL vs Typed URL resolution match
  let qrUrlMatchesTypedUrl = true;
  if (qrUrl && typedUrl) {
    try {
      const q = new URL(qrUrl);
      const t = new URL(typedUrl);
      qrUrlMatchesTypedUrl = q.hostname.toLowerCase() === t.hostname.toLowerCase() && q.pathname.replace(/\/+$/, '') === t.pathname.replace(/\/+$/, '');
      if (!qrUrlMatchesTypedUrl) {
        reasons.push(`Security Flag: Embedded QR code link (${qrUrl}) does not match entered link (${typedUrl})`);
      }
    } catch (_) {
      qrUrlMatchesTypedUrl = false;
    }
  }

  // Compute calculated verification score (0 - 100)
  let score = 0;
  if (pageValid) score += 40;
  if (nameMatch) score += 35;
  if (titleMatch) score += 15;
  if (dateMatch) score += 5;
  if (credentialIdMatch) score += 5;

  return {
    pageValid,
    nameMatch,
    titleMatch,
    dateMatch,
    credentialIdMatch,
    qrUrlMatchesTypedUrl,
    score,
    reasons,
    issuerData,
  };
}
