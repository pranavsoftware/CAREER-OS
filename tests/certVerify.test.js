import assert from 'node:assert/strict';
import { matchIssuerDomain, ALLOWED_ISSUERS } from '../src/lib/certVerify/allowlist.js';
import { isForbiddenIp } from '../src/lib/certVerify/safeFetch.js';
import {
  normalizeName,
  stringSimilarity,
  checkNameMatch,
  compareCertificate
} from '../src/lib/certVerify/compare.js';

console.log('--- Running Certificate Verification Test Suite ---\n');

// 1. Allowlist & Domain Matching Tests
console.log('1. Testing Domain Allowlist & SSRF Domain Guard...');

// Valid allowlisted domains
assert.equal(matchIssuerDomain('https://www.credly.com/badges/abc-123')?.domain, 'credly.com');
assert.equal(matchIssuerDomain('https://credly.com/earner/earned/badge/xyz')?.domain, 'credly.com');
assert.equal(matchIssuerDomain('https://coursera.org/verify/PROFESSIONAL_CERT')?.domain, 'coursera.org');
assert.equal(matchIssuerDomain('https://www.coursera.org/account/accomplishments/verify/123')?.domain, 'coursera.org');
assert.equal(matchIssuerDomain('https://nptel.ac.in/noc/Ecertificate/?q=NPTEL24CS01')?.domain, 'nptel.ac.in');
assert.equal(matchIssuerDomain('https://archive.nptel.ac.in/noc/Ecertificate/?q=NPTEL23CS02')?.domain, 'archive.nptel.ac.in');
assert.equal(matchIssuerDomain('https://credential.net/certificate/abc-xyz')?.domain, 'credential.net');
assert.equal(matchIssuerDomain('https://www.udemy.com/certificate/UC-123456/')?.domain, 'udemy.com');

// Malicious / Spoofed domains that must be rejected
assert.equal(matchIssuerDomain('https://credly.com.evil.site/exploit')?.matched, false, 'Subdomain attack must fail');
assert.equal(matchIssuerDomain('https://evilcredly.com/badges/123')?.matched, false, 'Prefix typo attack must fail');
assert.equal(matchIssuerDomain('https://notcoursera.org')?.matched, false, 'Untrusted domain must fail');
assert.equal(matchIssuerDomain('https://sub.archive.nptel.ac.in.attacker.org')?.matched, false, 'Attacker suffix must fail');

// Protocol enforcement (HTTPS required)
assert.equal(matchIssuerDomain('http://credly.com/badges/123')?.matched, false, 'Insecure HTTP must be rejected');
assert.equal(matchIssuerDomain('ftp://credly.com/badges/123')?.matched, false, 'FTP protocol must be rejected');
assert.equal(matchIssuerDomain('javascript:alert(1)')?.matched, false, 'Javascript protocol must be rejected');
assert.equal(matchIssuerDomain('file:///etc/passwd')?.matched, false, 'File URI must be rejected');
assert.equal(matchIssuerDomain('')?.matched, false, 'Empty string must be rejected');
assert.equal(matchIssuerDomain(null)?.matched, false, 'Null must be rejected');

console.log('   All domain allowlist checks passed.');

// 2. SSRF IP Validation Tests
console.log('\n2. Testing SSRF IP Blocking...');

// Loopback and local IPs must be forbidden
assert.equal(isForbiddenIp('127.0.0.1'), true, '127.0.0.1 must be blocked');
assert.equal(isForbiddenIp('127.0.1.5'), true, '127.x.x.x loopback must be blocked');
assert.equal(isForbiddenIp('0.0.0.0'), true, '0.0.0.0 must be blocked');
assert.equal(isForbiddenIp('localhost'), true, 'localhost must be blocked');

// RFC 1918 Private ranges must be forbidden
assert.equal(isForbiddenIp('10.0.0.1'), true, '10.x.x.x private range must be blocked');
assert.equal(isForbiddenIp('10.254.10.5'), true, '10.x.x.x private range must be blocked');
assert.equal(isForbiddenIp('172.16.0.1'), true, '172.16.x.x private range must be blocked');
assert.equal(isForbiddenIp('172.31.255.255'), true, '172.31.x.x private range must be blocked');
assert.equal(isForbiddenIp('192.168.1.1'), true, '192.168.x.x private range must be blocked');
assert.equal(isForbiddenIp('192.168.0.254'), true, '192.168.x.x private range must be blocked');

// Cloud metadata IP (AWS/GCP/Azure)
assert.equal(isForbiddenIp('169.254.169.254'), true, 'Link-local cloud metadata IP must be blocked');
assert.equal(isForbiddenIp('169.254.1.1'), true, 'Link-local IP must be blocked');

// IPv6 Forbidden addresses
assert.equal(isForbiddenIp('::1'), true, 'IPv6 loopback ::1 must be blocked');
assert.equal(isForbiddenIp('::'), true, 'IPv6 unspecified :: must be blocked');
assert.equal(isForbiddenIp('fc00::1'), true, 'IPv6 Unique Local fc00:: must be blocked');
assert.equal(isForbiddenIp('fd12:3456:789a::1'), true, 'IPv6 Unique Local fd00:: must be blocked');
assert.equal(isForbiddenIp('fe80::1'), true, 'IPv6 Link-Local fe80:: must be blocked');
assert.equal(isForbiddenIp('::ffff:127.0.0.1'), true, 'IPv4-mapped IPv6 loopback must be blocked');
assert.equal(isForbiddenIp('::ffff:192.168.1.1'), true, 'IPv4-mapped IPv6 private must be blocked');

// Valid public IPs must be permitted
assert.equal(isForbiddenIp('8.8.8.8'), false, 'Google DNS 8.8.8.8 should be permitted');
assert.equal(isForbiddenIp('1.1.1.1'), false, 'Cloudflare DNS 1.1.1.1 should be permitted');
assert.equal(isForbiddenIp('104.18.2.1'), false, 'Public Cloudflare IP should be permitted');
assert.equal(isForbiddenIp('151.101.1.69'), false, 'Public Fastly IP should be permitted');

console.log('   All SSRF IP checks passed.');

// 3. Name Matching & Normalization Tests
console.log('\n3. Testing Candidate Name Matching & Levenshtein Similarity...');

assert.equal(normalizeName('  Dr. Pranav M. Rayban '), 'pranav m rayban');
assert.equal(normalizeName('John-Paul Smith!'), 'johnpaul smith');

// Name comparison
const stName = 'Pranav Mahesh Rayban';

// Exact match
assert.equal(checkNameMatch(stName, 'Pranav Mahesh Rayban'), true);
assert.equal(checkNameMatch(stName, 'pranav mahesh rayban'), true);

// Initial match
assert.equal(checkNameMatch(stName, 'Pranav M Rayban'), true);
assert.equal(checkNameMatch(stName, 'P M Rayban'), true);
assert.equal(checkNameMatch(stName, 'Pranav Rayban'), true);

// Case & punctuation
assert.equal(checkNameMatch(stName, 'PRANAV M. RAYBAN'), true);

// Distinct mismatch
assert.equal(checkNameMatch(stName, 'Johnathan Doe'), false);
assert.equal(checkNameMatch(stName, 'Rohit Sharma'), false);
assert.equal(checkNameMatch(stName, 'Mahesh Kumar'), false);

console.log('   All candidate name matching checks passed.');

// 4. Certificate Comparison Matrix Tests
console.log('\n4. Testing Full Certificate Comparison Matrix...');

const studentObj = {
  id: 'st_1',
  name: 'Pranav Mahesh Rayban',
  email: 'pranav@example.com',
};

// Case A: Perfect match from Credly
const formA = {
  title: 'AWS Certified Cloud Practitioner',
  issuer: 'Amazon Web Services',
  issueDate: '2026-05-15',
  credentialId: 'AWS-99214',
  verificationUrl: 'https://www.credly.com/badges/aws-cloud-practitioner',
};

const issuerDataA = {
  valid: true,
  holderName: 'Pranav M. Rayban',
  title: 'AWS Certified Cloud Practitioner',
  issuerName: 'Amazon Web Services',
  issueDate: '2026-05-15',
  credentialId: 'AWS-99214',
  revoked: false,
};

const compA = compareCertificate({ student: studentObj, form: formA, issuerData: issuerDataA });
assert.equal(compA.pageValid, true);
assert.equal(compA.nameMatch, true);
assert.equal(compA.titleMatch, true);
assert.equal(compA.dateMatch, true);
assert.equal(compA.credentialIdMatch, true);
assert.equal(compA.reasons.length, 0);

// Case B: Severe Name Mismatch (Should flag)
const issuerDataB = {
  valid: true,
  holderName: 'Alice Wonderland',
  title: 'AWS Certified Cloud Practitioner',
  issuerName: 'Amazon Web Services',
  issueDate: '2026-05-15',
  credentialId: 'AWS-99214',
  revoked: false,
};

const compB = compareCertificate({ student: studentObj, form: formA, issuerData: issuerDataB });
assert.equal(compB.nameMatch, false);
assert.ok(compB.reasons.some(r => r.includes('Name mismatch')));

// Case C: Revoked Certificate
const issuerDataC = {
  valid: true,
  holderName: 'Pranav Mahesh Rayban',
  title: 'AWS Certified Cloud Practitioner',
  revoked: true,
};

const compC = compareCertificate({ student: studentObj, form: formA, issuerData: issuerDataC });
assert.equal(compC.pageValid, false);
assert.ok(compC.reasons.some(r => r.includes('revoked')));

console.log('   All certificate comparison logic passed.');

console.log('\n=============================================');
console.log('ALL CERTIFICATE VERIFICATION UNIT TESTS PASSED!');
console.log('=============================================\n');
