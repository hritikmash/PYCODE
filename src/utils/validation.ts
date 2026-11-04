/**
 * Rigorous Email Validation Utility
 * Complies with strict system rule: Display exact error "INVALID EMAIL!"
 */

export const INVALID_EMAIL_ERROR = 'INVALID EMAIL!';

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;

  // No whitespace allowed
  if (/\s/.test(trimmed)) return false;

  // Must have exactly one @
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (!local || !domain) return false;

  // Local part validation (max 64 chars)
  if (local.length > 64) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;

  // Domain part validation
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false;
  if (!domain.includes('.')) return false;

  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;

  // Top level domain must be at least 2 alpha characters
  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-zA-Z]{2,24}$/.test(tld)) return false;

  // Check each domain label
  for (const label of domainParts) {
    if (!label || label.length > 63) return false;
    if (!/^[a-zA-Z0-9-]+$/.test(label)) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
  }

  // RFC-compliant general email regex
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(trimmed);
}
