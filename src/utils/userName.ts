export function resolveUserGreetingName(user?: { name?: string; email?: string } | null): string {
  if (!user) return 'Developer';

  // 1. If it's a guest user: use the exact name they used to enter the app
  const isGuest = !user.email || user.email.includes('@pycode.guest') || user.email.includes('guest_');
  if (isGuest) {
    if (user.name && user.name.trim()) {
      return user.name.trim();
    }
    return 'Guest';
  }

  // 2. For logged-in users: extract name from their email as requested:
  // "always greet with the name of user like 'hello, user_name' take the name from their email and for the guest use the name they use to use app with"
  const rawEmail = user.email || '';
  const emailPrefix = rawEmail.includes('@') ? rawEmail.split('@')[0].trim() : (user.name || 'Developer');

  // Handle known common patterns (e.g. hritikyadav1612 -> Hritik)
  if (/^hritik/i.test(emailPrefix)) {
    return 'Hritik';
  }

  // Handle dot, underscore, or hyphen separated emails (e.g. john.doe, alex_chen, sarah-lee)
  const parts = emailPrefix.split(/[._-]+/);
  if (parts.length > 0 && parts[0]) {
    // Strip trailing digits from the first name segment (e.g. john99 -> John)
    const cleanSegment = parts[0].replace(/\d+$/, '');
    if (cleanSegment.length >= 2) {
      return cleanSegment.charAt(0).toUpperCase() + cleanSegment.slice(1);
    }
    if (parts[0].length >= 1) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  }

  // Strip trailing numbers from the single prefix (e.g. rohit2024 -> Rohit)
  const lettersOnly = emailPrefix.replace(/\d+$/, '');
  if (lettersOnly.length >= 2) {
    return lettersOnly.charAt(0).toUpperCase() + lettersOnly.slice(1);
  }

  // Fallback to user.name if available
  if (user.name && user.name.trim() && user.name.trim() !== 'Python Explorer') {
    return user.name.trim().split(' ')[0];
  }

  return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
}
