/**
 * Reusable input format validators for public-facing API endpoints.
 * These are intentionally simple and fast — not exhaustive RFC parsers.
 */

/**
 * RFC-5322-lite email check.
 * Accepts: user@domain.tld, user+tag@sub.domain.co.in
 * Rejects: "x", "a@", "@b.com", plain strings with no @
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Indian mobile number check.
 * Accepts: 10-digit number starting with 6-9, with optional +91 or 91 prefix.
 * Rejects: "asdf", "12345", "+1-555-0174", anything non-numeric.
 */
export function isValidPhone(phone: string): boolean {
  return /^(\+91|91)?[6-9]\d{9}$/.test(phone.trim().replace(/\s/g, ""));
}

/**
 * Name validation.
 * - Must be non-empty after trim
 * - Max 100 characters
 * - Must contain at least one letter (rejects "12345", "!@#$%")
 */
export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100) return false;
  return /[a-zA-Z\u0080-\uFFFF]/.test(trimmed); // at least one letter (incl. Unicode for Indian names)
}
