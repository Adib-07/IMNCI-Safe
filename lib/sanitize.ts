/**
 * Input sanitization utilities for clinical notes.
 * Prevents XSS injection while preserving legitimate medical text.
 */

const MAX_INPUT_LENGTH = 5000;
const MAX_LINE_LENGTH = 500;

/**
 * Strip HTML tags and script content from user input.
 * Preserves plain text, numbers, and common medical abbreviations.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  let sanitized = input;

  // Remove HTML tags (including event handlers and script content)
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Decode common HTML entities to prevent double-encoding attacks
  sanitized = sanitized
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");

  // Re-strip any tags that were revealed after entity decoding
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Trim individual lines to prevent oversized single-line payloads
  const lines = sanitized.split("\n");
  const trimmedLines = lines.map((line) =>
    line.length > MAX_LINE_LENGTH ? line.substring(0, MAX_LINE_LENGTH) : line
  );
  sanitized = trimmedLines.join("\n");

  // Enforce overall length limit
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
  }

  return sanitized;
}

/**
 * Validate that input contains plausible clinical content.
 * Returns null if valid, or an error message if invalid.
 */
export function validateClinicalInput(input: string): string | null {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return "Please enter clinical notes before processing.";
  }

  if (trimmed.length < 10) {
    return "Input is too short. Please provide more clinical detail.";
  }

  // Check for script injection patterns
  const dangerousPatterns = [
    /<script[\s>]/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    /expression\s*\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return "Input contains potentially unsafe content. Please remove any HTML or script tags.";
    }
  }

  return null;
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
