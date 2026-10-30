/**
 * Intelligent Name Extraction & Greeting Resolution System
 * 
 * Rules:
 * 1. Prioritize explicitly entered signup/preferred display names over any email-derived name.
 * 2. If no name was provided, infer ONLY the first name from the email address.
 * 3. Handle separator formats (e.g. rahul.sharma -> Rahul).
 * 4. Handle concatenated surname/firstname combinations (e.g. mashyadav -> Mash, yadavmash -> Mash).
 * 5. Handle trailing numbers (e.g. priya123 -> Priya).
 * 6. Never display full email addresses or surnames as the greeting.
 */

const COMMON_SURNAMES = new Set([
  'yadav', 'sharma', 'kumar', 'singh', 'patel', 'gupta', 'verma', 'rao',
  'reddy', 'nair', 'joshi', 'mehta', 'das', 'roy', 'mishra', 'ali',
  'khan', 'ahmed', 'chen', 'wang', 'li', 'zhang', 'smith', 'johnson',
  'williams', 'brown', 'jones', 'miller', 'davis', 'garcia', 'rodriguez',
  'wilson', 'taylor', 'anderson', 'thomas', 'jackson', 'white', 'harris'
]);

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Derives a clean first name from an email address when no signup name was provided.
 */
export function inferFirstNameFromEmail(email: string): string {
  if (!email || typeof email !== 'string') return 'Developer';

  const prefix = email.split('@')[0].trim().toLowerCase();
  if (!prefix) return 'Developer';

  // 1. Separators: period, underscore, hyphen, plus
  const separatedParts = prefix.split(/[._\-+]+/);
  if (separatedParts.length > 1) {
    // If first part is a known surname and second part exists, prefer the non-surname part
    const p0 = separatedParts[0].replace(/\d+$/, '');
    const p1 = separatedParts[1].replace(/\d+$/, '');
    if (COMMON_SURNAMES.has(p0) && p1 && p1.length >= 2) {
      return capitalize(p1);
    }
    if (p0 && p0.length >= 2) {
      return capitalize(p0);
    }
  }

  // 2. Strip trailing digits (e.g. priya123 -> priya, rohit2026 -> rohit)
  const lettersOnly = prefix.replace(/\d+$/, '');
  if (!lettersOnly) return 'Developer';

  // 3. Concatenated name parsing (e.g. mashyadav or yadavmash)
  for (const surname of COMMON_SURNAMES) {
    // Check if surname is at the end (e.g. mashyadav)
    if (lettersOnly.endsWith(surname) && lettersOnly.length > surname.length) {
      const candidate = lettersOnly.slice(0, lettersOnly.length - surname.length);
      if (candidate.length >= 2) {
        return capitalize(candidate);
      }
    }
    // Check if surname is at the start (e.g. yadavmash)
    if (lettersOnly.startsWith(surname) && lettersOnly.length > surname.length) {
      const candidate = lettersOnly.slice(surname.length);
      if (candidate.length >= 2) {
        return capitalize(candidate);
      }
    }
  }

  // 4. Default: capitalize the clean letters
  if (lettersOnly.length >= 2) {
    return capitalize(lettersOnly);
  }

  return capitalize(prefix);
}

/**
 * Resolves the display/greeting name for any user according to the specification:
 * - If user explicitly entered a name, USE IT.
 * - If guest user, use their guest handle or "Guest".
 * - If no name provided, infer first name from email.
 */
export function resolveUserGreetingName(
  user?: { name?: string; email?: string; preferredName?: string } | null
): string {
  if (!user) return 'Developer';

  // Check explicit preferredName or name
  const rawName = user.preferredName || user.name;
  const isGuest = !user.email || user.email.includes('@pycode.guest') || user.email.includes('guest_');

  // If user has an explicitly provided signup name (not default placeholder like "Python Explorer")
  if (rawName && rawName.trim() && rawName.trim() !== 'Python Explorer') {
    const trimmed = rawName.trim();
    // Return the preferred display name (first name if multiple words or as entered)
    return trimmed;
  }

  if (isGuest) {
    return 'Guest';
  }

  // If no name was provided, infer from email address
  if (user.email) {
    return inferFirstNameFromEmail(user.email);
  }

  return 'Developer';
}
