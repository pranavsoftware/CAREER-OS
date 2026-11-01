import crypto from 'crypto';
import { query } from '@/lib/db.js';
import { matchIssuerDomain } from './allowlist.js';
import { safeFetch } from './safeFetch.js';
import { parseIssuerContent } from './parsers/index.js';
import { compareCertificate } from './compare.js';
import { extractQrUrlFromFile } from './qr.js';
import {
  notifyCertificateAutoVerified,
  notifyCertificateSentToReview,
  notifyCertificateFlagged,
  notifyCertificateRevoked,
} from '@/lib/emailEvents.js';

/**
 * Computes SHA-256 hash of a file buffer
 */
export function computeFileHash(buffer) {
  if (!buffer) return null;
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Central verification orchestrator
 *
 * @param {Object} params
 * @param {string} params.certificateId
 * @param {Buffer} [params.fileBuffer]
 * @param {string} [params.mimeType]
 * @param {string} [params.typedUrl]
 * @param {string} [params.actor='system']
 * @returns {Promise<{ ok: boolean, trustLevel: string, reviewStatus: string, score: number, checks: any, reasons: string[] }>}
 */
export async function verifyCertificate({ certificateId, fileBuffer = null, mimeType = '', typedUrl = null, actor = 'system' }) {
  try {
    // 1. Load Certificate and Student
    const certRes = await query(`
      SELECT 
        c.*, 
        s.name AS "studentName", 
        s.email AS "studentEmail", 
        s.reg_no AS "studentRegNo",
        s.skills AS "studentSkills"
      FROM certificates c
      JOIN students s ON s.id = c.student_id
      WHERE c.id = $1
    `, [certificateId]);

    if (certRes.rows.length === 0) {
      return { ok: false, trustLevel: 'Unverified', reviewStatus: 'Pending Review', score: 0, reasons: ['Certificate record not found'] };
    }

    const cert = certRes.rows[0];
    const student = {
      id: cert.student_id,
      name: cert.studentName,
      email: cert.studentEmail,
      regNo: cert.studentRegNo,
      skills: cert.studentSkills || [],
    };

    let reasons = [];
    let fileHash = cert.file_hash;
    let qrUrl = null;

    // 2. Compute File Hash and Duplicate Check
    if (fileBuffer) {
      fileHash = computeFileHash(fileBuffer);

      // Check duplicates: same hash or same (issuer + credential_id) on a DIFFERENT student
      const dupRes = await query(`
        SELECT id, student_id AS "studentId", title, issuer, credential_id AS "credentialId"
        FROM certificates
        WHERE id != $1 AND (
          (file_hash IS NOT NULL AND file_hash = $2) OR
          (credential_id IS NOT NULL AND credential_id = $3 AND LOWER(issuer) = LOWER($4))
        )
      `, [certificateId, fileHash, cert.credential_id || '__none__', cert.issuer || '']);

      const differentStudentDup = dupRes.rows.find(d => d.studentId !== student.id);
      if (differentStudentDup) {
        // Red flag: Document re-used across different students
        const flagReason = `Fraud Alert: Identical certificate credential previously uploaded by another student (${differentStudentDup.studentId})`;
        const checkResults = {
          duplicateOf: differentStudentDup.id,
          duplicateStudentId: differentStudentDup.studentId,
          checkedAt: new Date().toISOString(),
          reasons: [flagReason],
        };

        await query(`
          UPDATE certificates SET
            trust_level = 'Flagged',
            review_status = 'Pending Review',
            verified = false,
            verification_score = 0,
            file_hash = $1,
            check_results = $2,
            last_verified_at = NOW()
          WHERE id = $3
        `, [fileHash, JSON.stringify(checkResults), certificateId]);

        await query(`
          INSERT INTO certificate_audit (id, certificate_id, student_id, action, actor, details)
          VALUES ($1, $2, $3, 'flagged', $4, $5)
        `, [`ca_${Date.now()}`, certificateId, student.id, actor, JSON.stringify(checkResults)]);

        try {
          await notifyCertificateFlagged(student, cert, flagReason);
        } catch (_) {}

        return {
          ok: true,
          trustLevel: 'Flagged',
          reviewStatus: 'Pending Review',
          score: 0,
          checks: checkResults,
          reasons: [flagReason],
        };
      }
    }

    // 3. Extract QR Code if fileBuffer provided
    if (fileBuffer) {
      const qrRes = await extractQrUrlFromFile(fileBuffer, mimeType);
      if (qrRes.found && qrRes.url) {
        qrUrl = qrRes.url;
      }
    }

    // Determine target URL for verification: QR code takes priority, then user-typed link, then database column
    const effectiveUrl = qrUrl || typedUrl || cert.verification_url || null;
    const urlSource = qrUrl ? 'qr' : (typedUrl || cert.verification_url) ? 'typed' : 'none';

    // 4. If no URL available
    if (!effectiveUrl) {
      reasons.push('No QR code or verification link provided on certificate');
      const checkResults = {
        source: 'none',
        url: null,
        checkedAt: new Date().toISOString(),
        reasons,
      };

      await updateCertRecord(certificateId, {
        trustLevel: 'Unverified',
        reviewStatus: 'Pending Review',
        verified: false,
        score: 0,
        fileHash,
        verificationUrl: null,
        checkResults,
      });

      await logAudit(certificateId, student.id, 'sent_to_review', actor, checkResults);
      try {
        await notifyCertificateSentToReview(student, cert, reasons.join('. '));
      } catch (_) {}

      return {
        ok: true,
        trustLevel: 'Unverified',
        reviewStatus: 'Pending Review',
        score: 0,
        checks: checkResults,
        reasons,
      };
    }

    // 5. Check URL against allowlist
    const domainMatch = matchIssuerDomain(effectiveUrl);
    if (!domainMatch.matched) {
      reasons.push(`Domain is not in the trusted issuer allowlist: ${domainMatch.error}`);
      const checkResults = {
        source: urlSource,
        url: effectiveUrl,
        checkedAt: new Date().toISOString(),
        domainNotAllowlisted: true,
        reasons,
      };

      await updateCertRecord(certificateId, {
        trustLevel: 'Unverified',
        reviewStatus: 'Pending Review',
        verified: false,
        score: 0,
        fileHash,
        verificationUrl: effectiveUrl,
        checkResults,
      });

      await logAudit(certificateId, student.id, 'sent_to_review', actor, checkResults);
      try {
        await notifyCertificateSentToReview(student, cert, reasons.join('. '));
      } catch (_) {}

      return {
        ok: true,
        trustLevel: 'Unverified',
        reviewStatus: 'Pending Review',
        score: 0,
        checks: checkResults,
        reasons,
      };
    }

    // 6. SafeFetch the issuer page (SSRF protected)
    let fetchResult;
    try {
      fetchResult = await safeFetch(effectiveUrl);
    } catch (fetchErr) {
      reasons.push(`Could not fetch issuer page: ${fetchErr.message}`);
      const checkResults = {
        source: urlSource,
        url: effectiveUrl,
        fetchFailed: true,
        checkedAt: new Date().toISOString(),
        reasons,
      };

      await updateCertRecord(certificateId, {
        trustLevel: 'Unverified',
        reviewStatus: 'Pending Review',
        verified: false,
        score: 0,
        fileHash,
        verificationUrl: effectiveUrl,
        checkResults,
      });

      await logAudit(certificateId, student.id, 'sent_to_review', actor, checkResults);
      try {
        await notifyCertificateSentToReview(student, cert, reasons.join('. '));
      } catch (_) {}

      return {
        ok: true,
        trustLevel: 'Unverified',
        reviewStatus: 'Pending Review',
        score: 0,
        checks: checkResults,
        reasons,
      };
    }

    // 7. Parse issuer content
    const parsedIssuer = parseIssuerContent(domainMatch.parserKey, fetchResult.data, fetchResult.finalUrl);

    if (!parsedIssuer || !parsedIssuer.parsed) {
      reasons.push('Issuer page layout was not recognized by automated parser');
      const checkResults = {
        source: urlSource,
        url: effectiveUrl,
        parsed: false,
        checkedAt: new Date().toISOString(),
        reasons,
      };

      await updateCertRecord(certificateId, {
        trustLevel: 'Unverified',
        reviewStatus: 'Pending Review',
        verified: false,
        score: 10,
        fileHash,
        verificationUrl: effectiveUrl,
        checkResults,
      });

      await logAudit(certificateId, student.id, 'sent_to_review', actor, checkResults);
      try {
        await notifyCertificateSentToReview(student, cert, reasons.join('. '));
      } catch (_) {}

      return {
        ok: true,
        trustLevel: 'Unverified',
        reviewStatus: 'Pending Review',
        score: 10,
        checks: checkResults,
        reasons,
      };
    }

    // 8. Compare issuer data against student & form values
    const compareRes = compareCertificate({
      student,
      form: {
        title: cert.title,
        issuer: cert.issuer,
        issueDate: cert.issue_date,
        credentialId: cert.credential_id,
      },
      issuerData: parsedIssuer,
      qrUrl,
      typedUrl: typedUrl || cert.verification_url,
    });

    const checks = {
      source: urlSource,
      url: effectiveUrl,
      checkedAt: new Date().toISOString(),
      pageValid: compareRes.pageValid,
      nameMatch: compareRes.nameMatch,
      titleMatch: compareRes.titleMatch,
      dateMatch: compareRes.dateMatch,
      credentialIdMatch: compareRes.credentialIdMatch,
      qrUrlMatchesTypedUrl: compareRes.qrUrlMatchesTypedUrl,
      extractedHolderName: parsedIssuer.holderName || null,
      extractedTitle: parsedIssuer.title || null,
      extractedCredentialId: parsedIssuer.credentialId || null,
      reasons: compareRes.reasons,
    };

    // 9. Decide Trust Level
    let trustLevel = 'Unverified';
    let reviewStatus = 'Pending Review';
    let isVerified = false;
    const finalScore = compareRes.score;

    if (!compareRes.pageValid || !compareRes.nameMatch || !compareRes.credentialIdMatch || !compareRes.qrUrlMatchesTypedUrl) {
      trustLevel = 'Flagged';
      reviewStatus = 'Pending Review';
      isVerified = false;
    } else if (compareRes.pageValid && compareRes.nameMatch && compareRes.titleMatch && compareRes.credentialIdMatch) {
      trustLevel = 'Issuer Verified';
      reviewStatus = 'Not Required';
      isVerified = true;
    } else {
      trustLevel = 'Unverified';
      reviewStatus = 'Pending Review';
      isVerified = false;
    }

    // 10. Update DB
    await updateCertRecord(certificateId, {
      trustLevel,
      reviewStatus,
      verified: isVerified,
      score: finalScore,
      fileHash,
      verificationUrl: effectiveUrl,
      credentialId: parsedIssuer.credentialId || cert.credential_id,
      checkResults: checks,
    });

    // 11. Write Audit Log
    const auditAction = isVerified ? 'auto_verified' : trustLevel === 'Flagged' ? 'flagged' : 'sent_to_review';
    await logAudit(certificateId, student.id, auditAction, actor, checks);

    // 12. If Issuer Verified: sync certificate's skills into student's skills matrix
    if (isVerified) {
      await syncStudentSkillsFromCertificates(student.id);
      try {
        await notifyCertificateAutoVerified(student, cert);
      } catch (_) {}
    } else if (trustLevel === 'Flagged') {
      try {
        await notifyCertificateFlagged(student, cert, compareRes.reasons.join('. '));
      } catch (_) {}
    } else {
      try {
        await notifyCertificateSentToReview(student, cert, compareRes.reasons.join('. '));
      } catch (_) {}
    }

    return {
      ok: true,
      trustLevel,
      reviewStatus,
      score: finalScore,
      checks,
      reasons: compareRes.reasons,
    };
  } catch (err) {
    console.error('Certificate verification error:', err);
    return {
      ok: false,
      trustLevel: 'Unverified',
      reviewStatus: 'Pending Review',
      score: 0,
      reasons: ['Internal verification process encountered an issue'],
    };
  }
}

/**
 * Updates certificate row in database
 */
async function updateCertRecord(id, { trustLevel, reviewStatus, verified, score, fileHash, verificationUrl, credentialId, checkResults }) {
  await query(`
    UPDATE certificates SET
      trust_level = $1,
      review_status = $2,
      verified = $3,
      verification_score = $4,
      file_hash = COALESCE($5, file_hash),
      verification_url = COALESCE($6, verification_url),
      credential_id = COALESCE($7, credential_id),
      check_results = $8,
      last_verified_at = NOW()
    WHERE id = $9
  `, [
    trustLevel,
    reviewStatus,
    verified,
    score,
    fileHash || null,
    verificationUrl || null,
    credentialId || null,
    JSON.stringify(checkResults),
    id,
  ]);
}

/**
 * Logs an audit trail record
 */
async function logAudit(certificateId, studentId, action, actor, details) {
  await query(`
    INSERT INTO certificate_audit (id, certificate_id, student_id, action, actor, details)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    `ca_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    certificateId,
    studentId,
    action,
    actor,
    JSON.stringify(details),
  ]);
}

/**
 * Synchronizes verified certificates' skills into the student's skills JSONB array
 */
export async function syncStudentSkillsFromCertificates(studentId) {
  const certsRes = await query(`
    SELECT skills 
    FROM certificates 
    WHERE student_id = $1 
      AND (trust_level = 'Issuer Verified' OR trust_level = 'Placement Cell Verified')
      AND status = 'Valid'
      AND (expiry_date IS NULL OR expiry_date >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'))
  `, [studentId]);

  const verifiedSkillsSet = new Set();
  for (const row of certsRes.rows) {
    const list = Array.isArray(row.skills) ? row.skills : [];
    list.forEach(s => {
      const name = typeof s === 'string' ? s.trim() : s?.name?.trim();
      if (name) verifiedSkillsSet.add(name);
    });
  }

  // Fetch current student skills
  const studentRes = await query('SELECT skills FROM students WHERE id = $1', [studentId]);
  if (studentRes.rows.length === 0) return;

  const currentSkills = Array.isArray(studentRes.rows[0].skills) ? studentRes.rows[0].skills : [];

  // Update existing skills with verified source, or add verified skills
  const updatedSkills = currentSkills.map(sk => {
    const name = typeof sk === 'string' ? sk : sk.name;
    if (verifiedSkillsSet.has(name)) {
      return typeof sk === 'string' ? { name: sk, level: 3, source: 'certificate' } : { ...sk, source: 'certificate' };
    }
    return sk;
  });

  // Add any new verified skills not present in profile
  for (const vSkill of verifiedSkillsSet) {
    const exists = updatedSkills.some(s => (typeof s === 'string' ? s : s.name).toLowerCase() === vSkill.toLowerCase());
    if (!exists) {
      updatedSkills.push({ name: vSkill, level: 3, source: 'certificate' });
    }
  }

  await query('UPDATE students SET skills = $1::jsonb, updated_at = NOW() WHERE id = $2', [
    JSON.stringify(updatedSkills),
    studentId,
  ]);
}
